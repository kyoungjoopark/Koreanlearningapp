import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { wordData, activityType, promptOverride, targetSentences, grammarContext, unitTitle, unitVocabulary, unitRelatedKeywords, unitLevel } = body;

    if (!wordData) {
      return NextResponse.json({ error: '단어 데이터(wordData)가 필요합니다.' }, { status: 400 });
    }
    if (activityType === 'fill_in_the_blank' && !targetSentences) {
      return NextResponse.json({ error: '빈칸 채우기 유형에는 대상 문장(targetSentences) 데이터가 필요합니다.' }, { status: 400 });
    }

    let detailedPrompt = "";

    if (promptOverride) {
      detailedPrompt = promptOverride;
    } else if (activityType === 'sentence_creation') {
      if (wordData.meanings && wordData.meanings.length > 0) {
        const meaningInfoString = wordData.meanings.map((m: any, index: number) => `의미 ${index + 1} (${m.partOfSpeech}, ${m.level}): ${m.koreanDefinition} (예: ${m.exampleSentence})`).join('\\n');
        const partOfSpeechExamples = wordData.meanings.map((m: any) => m.partOfSpeech || '단어');
        
        let generatedExamplesSchema = "";
        if (wordData.meanings.length === 1) {
            generatedExamplesSchema = `
  "generated_examples": [
    {
      "meaning_id_used": "의미 1",
      "korean_sentence": "string",
      "english_translation": "string",
      "difficulty_level": "string (A1 or A2)",
      "part_of_speech_used": "string (e.g., '${partOfSpeechExamples[0]}')"
    },
    {
      "meaning_id_used": "의미 1",
      "korean_sentence": "string",
      "english_translation": "string",
      "difficulty_level": "string (A1 or A2)",
      "part_of_speech_used": "string (e.g., '${partOfSpeechExamples[0]}')"
    }
  ]`;
        } else {
            generatedExamplesSchema = wordData.meanings.map((m:any, index:number) => `
  "generated_examples_meaning_${index + 1}": [
    {
      "meaning_id_used": "의미 ${index + 1}",
      "korean_sentence": "string",
      "english_translation": "string",
      "difficulty_level": "string (A1 or A2)",
      "part_of_speech_used": "string (e.g., '${partOfSpeechExamples[index]}')"
    },
    {
      "meaning_id_used": "의미 ${index + 1}",
      "korean_sentence": "string",
      "english_translation": "string",
      "difficulty_level": "string (A1 or A2)",
      "part_of_speech_used": "string (e.g., '${partOfSpeechExamples[index]}')"
    }
  ]`).join(",");
        }

        detailedPrompt = `
한국어 단어 '${wordData.word}'의 다음 의미들을 사용하여, 교과서 체 문체, 초급 레벨(A1~A2)에 맞는 새로운 예문과 영어 번역을 의미별로 **정확히 2개씩** 만들어주세요.

의미 정보:
${meaningInfoString}

추가 지침:
- 단어의 일반적인 의미와 규모(예: '나라'는 '도시'나 '동네'보다 일반적으로 큰 지리적/정치적 단위임)를 고려하여, 상식적이고 자연스러운 예문을 만들어주세요. 비유적이거나 매우 특수한 상황의 예문은 지양해주세요.
- 금지어: ${wordData.forbiddenWords ? wordData.forbiddenWords.join(', ') : '없음'}
- 각 예문의 난이도(A1 또는 A2)를 명확히 표기해주세요.
- 각 예문에서 '${wordData.word}'가 어떤 의미(예: '의미 1', '의미 2')로 사용되었는지 명시해주세요.

결과는 반드시 다음 JSON 스키마를 따라야 합니다:
{
  "activityType": "sentence_creation",
  "word": "${wordData.word}",${generatedExamplesSchema}
  // 의미가 더 있다면 generated_examples_meaning_N 형식으로 추가됩니다.
}
출력 시에는 오직 JSON 스키마만, 설명 없이 내보내주세요.`;
      } else {
        let levelSpecificInstruction = "";
        let basePrompt = ``;

        if (unitLevel && (unitLevel.includes('초급1') || unitLevel.toUpperCase().includes('A1'))) {
          levelSpecificInstruction = `
- **매우 중요! A1 레벨 특별 지침 (반드시 지켜주세요!):** '${wordData.word}' 단어를 사용하여 A1 레벨(초급 1단계) 예문을 만들 때는, **'주어 + 서술어' 또는 '주어 + 목적어 + 서술어' 형태의 매우 단순하고 자연스러운 문장**으로 만들어야 합니다.
  - **다양한 상황/인물 및 적절한 높임법 사용 (매우 중요!):** 다양한 일상생활의 상황, 인물(예: 다양한 가족 구성원, 친구, 여러 직업의 사람들), 장소 등을 활용하여 각 예문이 서로 다른 내용을 담도록 해주세요. **이때, 각 인물과 상황에 맞는 적절한 높임 표현을 사용해야 합니다. 예를 들어, '친구'를 주어로 사용할 경우 '친구께서'와 같은 어색한 높임은 절대 사용하지 말고, '친구가' 또는 '친구는'과 같이 자연스러운 표현을 사용하세요. 높임 표현을 보여줘야 한다면 '할머니', '선생님'과 같이 높임이 자연스러운 대상을 주어로 설정하고, 그에 맞는 서술어를 사용해주세요.**
  - **자연스러운 문장 생성 (매우 중요!):** 생성된 한국어 예문은 실제 한국인이 사용하는 것처럼 자연스러워야 합니다. 단어의 의미와 사용 맥락을 고려하여 어색하거나 기계 번역투의 문장은 만들지 마세요.
    - **나쁜 예시 (어색한 문장):** (단어가 '이름', 관련 키워드가 '미국 사람'일 경우) "제 이름은 미국 사람이에요." (X)
    - **좋은 예시 (자연스러운 문장):** (단어가 '이름', 관련 키워드가 '미국 사람'일 경우) "제 이름은 마이클이에요. 저는 미국 사람이에요." (O) 또는 (단어가 '나라') "미국은 큰 나라예요." (O)
  - **예시 (단순하고 다양한 상황):** (단어가 '먹다') '아이가 밥을 먹어요.', '수박을 먹어요.', '할아버지가 약을 먹어요.' (단어가 '가다') '학교에 가요.', '친구가 공원에 가요.', '가족이 여행을 가요.' (단어가 '보다') '영화를 봐요.', '아기가 하늘을 봐요.'
  - **길이:** 문장 길이는 3~6단어 사이로 해주세요.
  - **문법:** 최소한의 기본적인 문법적 정확성을 지켜주세요. 의미 전달에 필수적인 조사는 포함해주세요. (예: '고양이 가다' (X) -> '고양이가 가요.' (O))
  - **어휘:** 매우 기본적이고 쉬운 어휘만 사용해주세요. 제공된 '단원 전체 어휘' 및 '단원 주요 관련 키워드'를 적극적으로 활용해주세요.
  - **꾸미는 말:** 필수적이지 않은 꾸미는 말(형용사, 부사 등)은 최소화해주세요. 하지만 문장을 자연스럽게 만들기 위해 필요하다면 간단한 것은 사용해도 좋습니다.
  - **복잡한 구조 금지:** 복잡한 절이나 이중 서술어 등은 사용하지 마세요.
`;
          basePrompt = `
주어진 단어 '${wordData.word}'를 사용하여 예문을 생성합니다.
**가장 중요한 목표는, 현재 학습 중인 단원의 맥락에 맞는 예문을 만드는 것입니다.**
아래 '단원 정보'에 제공된 **주요 문법과 제목**을 반드시 참고하고, 이를 예문에 자연스럽게 반영하여, 교과서 체 문체의 초급 레벨(A1) 예문 3개와 영어 번역을 만들어주세요.

${levelSpecificInstruction}
`;
        } else {
          levelSpecificInstruction = `
- **단순화 요청**: 특히 A1 레벨(초급 1단계)에 해당하는 예문은 매우 짧고 기본적인 어휘와 문장 구조를 사용하고, 복잡한 절이나 수식어 사용을 최소화해주세요.
`;
          basePrompt = `
주어진 단어 '${wordData.word}'를 사용하여 예문을 생성합니다.
**가장 중요한 목표는, 현재 학습 중인 단원의 맥락에 맞는 예문을 만드는 것입니다.**
아래 '단원 정보'에 제공된 **주요 문법과 제목**을 반드시 참고하고, 이를 예문에 자연스럽게 반영하여, 교과서 체 문체의 초급 레벨(A1~A2) 예문 3개와 영어 번역을 만들어주세요.

추가 지침:
`;
        }

        detailedPrompt = `
${basePrompt}- **단원 정보 (매우 중요!):**
    - 단원 제목: ${unitTitle || '제공되지 않음'}
    - 단원 주요 문법: ${grammarContext || '제공되지 않음'}
    - 단원 전체 어휘: ${unitVocabulary || '제공되지 않음'}
    - 단원 주요 관련 키워드: ${Array.isArray(unitRelatedKeywords) && unitRelatedKeywords.length > 0 ? unitRelatedKeywords.join(', ') : '제공되지 않음'}
- **예문 생성 지침:**
    - 다양한 일상생활의 상황, 인물(예: 다양한 가족 구성원, 친구, 여러 직업의 사람들 등), 장소 등을 활용하여 각 예문이 서로 다른 내용을 담도록 해주세요.
    - **각 인물과 상황에 맞는 적절한 높임 표현을 사용해야 합니다. 예를 들어, '친구'를 주어로 사용할 경우 '친구께서'와 같은 어색한 높임은 절대 사용하지 말고, '친구가' 또는 '친구는'과 같이 자연스러운 표현을 사용하세요. 높임 표현의 예시가 필요하다면 '할머니', '선생님'과 같이 높임이 자연스러운 대상을 주어로 설정하고, 그에 맞는 서술어를 사용해주세요.**
- 예문은 현재 학습 중인 단원의 내용과 관련성이 높아야 합니다. 다음 정보를 참고하고, **적극적으로 활용**하여 예문을 만들어 주세요:
- **매우 중요: 논리적 오류 방지**:
    - 단어의 의미적, 논리적 관계를 반드시 고려해야 합니다. 한 단어가 다른 단어의 종류에 포함되는 경우, 이 둘을 비교하는 어색한 문장을 만들지 마세요.
    - **나쁜 예시 (논리적 오류):** (단어가 '고궁' 또는 '건축물'일 때) "고궁의 디자인은 한국 전통 건축물과 다릅니다." (X) -> '고궁'은 '전통 건축물'의 한 종류이므로 이런 비교는 어색합니다.
    - **좋은 예시 (논리적/자연스러움):** "경복궁은 아름다운 전통 건축물입니다." (O) 또는 "이 현대 건축물은 디자인이 독특합니다." (O)
- 단어의 일반적인 의미와 규모(예: '나라'는 '도시'나 '동네'보다 일반적으로 큰 지리적/정치적 단위임)를 고려하여, 상식적이고 자연스러운 예문을 만들어주세요. 비유적이거나 매우 특수한 상황의 예문은 지양해주세요.${!unitLevel?.includes('초급1') && !unitLevel?.toUpperCase().includes('A1') ? levelSpecificInstruction : ''}- 금지어: ${wordData.forbiddenWords ? wordData.forbiddenWords.join(', ') : '없음'}
- 각 예문의 난이도(A1 또는 A2)를 명확히 표기해주세요.

결과는 반드시 다음 JSON 스키마를 따라야 합니다 (generated_examples 배열에 3개의 예문 객체를 포함):
{
  "activityType": "sentence_creation",
  "word": "${wordData.word}",
  "generated_examples": [
    { "korean_sentence": "string", "english_translation": "string", "difficulty_level": "string (A1 or A2)" },
    { "korean_sentence": "string", "english_translation": "string", "difficulty_level": "string (A1 or A2)" },
    { "korean_sentence": "string", "english_translation": "string", "difficulty_level": "string (A1 or A2)" }
  ]
}
출력 시에는 오직 JSON 스키마만, 설명 없이 내보내주세요.`;
      }
    } else if (activityType === 'fill_in_the_blank') {
      // targetSentences를 문자열로 변환하여 프롬프트에 포함
      const targetSentencesString = targetSentences.map((sentence: any) => 
        `- 의미 ID: ${sentence.meaning_id}, 한국어: "${sentence.korean_sentence}", 영어 번역: "${sentence.english_translation}"`
      ).join('\\n');

      detailedPrompt = `
당신은 한국어 학습 자료 생성 전문가입니다. 다음 지침에 따라 빈칸 채우기 퀴즈를 생성해주세요.

입력 데이터:
1. 단어 정보 (wordData):
   - 단어: ${wordData.word}
   - 의미:
${wordData.meanings.map((m: any, index: number) => `     - ID: 의미 ${index + 1}, 품사: ${m.partOfSpeech}, 레벨: ${m.level}, 정의: ${m.koreanDefinition}, 예시: ${m.exampleSentence || '제공되지 않음'}`).join('\\n')}
2. 대상 문장 목록 (targetSentences):
${targetSentencesString}

요청 사항:
- 위에 제공된 '대상 문장 목록 (targetSentences)'의 각 문장에 대해 빈칸 채우기 퀴즈를 만드세요.
- 각 퀴즈는 '${wordData.word}' 단어가 들어갈 자리를 빈칸으로 만듭니다.
- 각 퀴즈는 초급 레벨(A1~A2)에 적합해야 합니다.
- 각 퀴즈에는 정확한 답 1개와 그럴듯한 오답 2개 (총 3개 선택지)를 한국어 단어로 제공해야 합니다.
- 각 퀴즈의 난이도 (A1 또는 A2)와 어떤 의미 ID의 단어가 사용되었는지 명시해주세요.
- 빈칸에 들어갈 단어의 예상 품사를 명시해주세요.

출력 형식:
결과는 반드시 다음 JSON 스키마를 따라야 하며, 다른 텍스트 설명 없이 순수 JSON 객체만 반환해야 합니다.

출력 JSON 스키마:
{
  "activityType": "fill_in_the_blank",
  "word": "${wordData.word}",
  "quizzes": [
    {
      "meaning_id_used": "string (예: 의미 1)",
      "difficulty_level": "string (A1 또는 A2)",
      "question": "string (예: 다음 빈칸에 들어갈 알맞은 단어를 고르세요: ...가 ____.)",
      "options": [
        {"option": "string (한국어 단어)", "isCorrect": true},
        {"option": "string (한국어 단어)", "isCorrect": false},
        {"option": "string (한국어 단어)", "isCorrect": false}
      ],
      "part_of_speech_expected": "string (예: 형용사)"
    }
    // targetSentences의 각 문장에 대해 하나의 quiz 객체가 생성됩니다.
  ]
}

출력 예시 (JSON):
{
  "activityType": "fill_in_the_blank",
  "word": "달다",
  "quizzes": [
    {
      "meaning_id_used": "의미 1",
      "difficulty_level": "A1",
      "question": "다음 빈칸에 들어갈 알맞은 단어를 고르세요: 우유가 ____.",
      "options": [
        {"option": "달아요", "isCorrect": true},
        {"option": "간다", "isCorrect": false},
        {"option": "자요", "isCorrect": false}
      ],
      "part_of_speech_expected": "형용사"
    },
    {
      "meaning_id_used": "의미 2",
      "difficulty_level": "A1",
      "question": "다음 빈칸에 들어갈 알맞은 단어를 고르세요: 그림을 벽에 ____.",
      "options": [
        {"option": "달았어요", "isCorrect": true},
        {"option": "먹었어요", "isCorrect": false},
        {"option": "읽었어요", "isCorrect": false}
      ],
      "part_of_speech_expected": "동사"
    }
  ]
}
출력 시에는 오직 JSON 스키마만, 설명 없이 내보내주세요.`;
    } else {
      return NextResponse.json({ error: `지원되지 않는 활동 유형입니다: ${activityType}` }, { status: 400 });
    }

    console.log("--- OpenAI API 요청 프롬프트 ---");
    console.log(detailedPrompt);

    let aktuellenTemperature = 0.85;
    if (unitLevel && (unitLevel.includes('초급1') || unitLevel.toUpperCase().includes('A1'))) {
      aktuellenTemperature = 0.7; // A1 레벨일 경우 temperature를 0.6에서 0.7로 약간 더 올림
      console.log(`A1 Level detected. Setting temperature to: ${aktuellenTemperature}`);
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125", // 안정적인 최신 모델 버전 명시
      messages: [
        { role: "system", content: "You are a helpful assistant specialized in creating Korean language learning materials. Please strictly follow the output format requested and provide only JSON." },
        { role: "user", content: detailedPrompt }
      ],
      response_format: { type: "json_object" }, // JSON 모드 활성화 (지원 모델 확인 필요)
      temperature: aktuellenTemperature, // 조건부 temperature 적용
      seed: Math.floor(Date.now() / 1000) // 현재 시간을 초 단위로 변환하여 seed 값으로 사용
    });

    console.log("--- OpenAI API 응답 받음 ---");
    console.log(JSON.stringify(completion, null, 2));

    const content = completion.choices[0].message.content;

    if (!content) {
      return NextResponse.json({ error: 'AI로부터 비어있는 응답을 받았습니다.' }, { status: 500 });
    }

    try {
      const parsedContent = JSON.parse(content);
      return NextResponse.json(parsedContent);
    } catch (e) {
      console.error("OpenAI 응답이 유효한 JSON이 아닙니다:", content);
      return NextResponse.json({ error: 'AI 응답을 파싱하는 데 실패했습니다.', rawResponse: content }, { status: 500 });
    }

  } catch (error: any) {
    console.error("---!!! OpenAI API 호출 중 심각한 오류 발생 !!!---");
    console.error("- 에러 타입:", typeof error);
    console.error("- 에러 이름:", error.name);
    console.error("- 에러 메시지:", error.message);
    if (error.response) {
      console.error("- OpenAI 응답 데이터:", error.response.data);
      console.error("- OpenAI 응답 상태 코드:", error.response.status);
    }
    console.error("- 전체 에러 객체:", error);
    console.error("-------------------------------------------------");
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 