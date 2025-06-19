import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화 (DB 작업용)
const supabaseUrl = process.env.NEXT_PUBLIC_LEARNING_SUPABASE_URL;
const supabaseServiceKey = process.env.LEARNING_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { grammarItem, unitId, grammarType, unitLevel } = body;

    if (!grammarItem) {
      return NextResponse.json({ error: '문법 항목(grammarItem) 데이터가 필요합니다.' }, { status: 400 });
    }
    if (!unitId) {
      return NextResponse.json({ error: '단원 ID(unitId) 데이터가 필요합니다.' }, { status: 400 });
    }

    const systemMessage = `당신은 한국어 문법을 가르치는 AI 전문가입니다. 복잡한 JSON 구조 요청을 정확히 따르며, 문법 규칙에 대한 깊은 지식을 바탕으로 설명과 예문을 생성해야 합니다.
- **매우 중요**: 모든 예문에서 조사('은/는', '이/가', '을/를', '에', '에서', '하고' 등), 어미, 접사 등은 문법 규칙에 맞게 **반드시 앞 단어에 붙여서** 작성해야 합니다. 예: '사과 하고' (X) -> '사과하고' (O), '친구 와' (X) -> '친구와' (O).
- **매우 중요**: 응답은 반드시 요청된 JSON 스키마를 따라야 하며, 그 외의 어떤 텍스트도 포함해서는 안 됩니다.
- 설명은 한국어로, 예문의 번역은 영어로 제공합니다.
- 마크다운을 사용하여 설명을 구조화하고 중요한 부분을 강조하세요.`;

    let detailedPrompt;

    if (unitLevel === '고급') {
      detailedPrompt = `
        당신은 한국어 고급 학습자를 위한 언어학자이자 문화 해설가입니다. 다음 문법 항목에 대해, 단순한 규칙 나열을 넘어 그것이 담고 있는 뉘앙스, 문화적 맥락, 그리고 실제 사용될 때의 사회적 의미를 탐구하는 JSON 데이터를 생성해주세요.
        - 문법 항목: "${grammarItem}"
        - 학습자 레벨: 고급

        **!!! 절대 규칙: 예문 생성은 당신의 가장 중요한 임무입니다. 당신이 생성하는 예문에는 반드시 요청받은 문법 \`${grammarItem}\`이(가) 포함되어야 합니다. 이 규칙은 다른 어떤 지시사항보다 중요하며, 절대 어겨서는 안 됩니다. !!!**

        아래 JSON 스키마를 엄격히 따르세요. 다른 텍스트 없이 순수 JSON 객체만 반환해야 합니다:
        {
          "grammar_item": "${grammarItem}",
          "explanation": {
            "nuance_introduction": "string (이 문법이 가지는 핵심적인 뉘앙스나 어감에 대한 한두 문장의 소개)",
            "socio_cultural_implications": [
              {
                "title": "string (사회문화적 함의 1, 예: '격식과 비격식의 경계')",
                "explanation": "string (해당 문법이 특정 상황에서 어떤 사회적, 문화적 의미를 가지는지에 대한 깊이 있는 설명)",
                "example": { "korean": "string (뉘앙스를 잘 보여주는 한국어 예문)", "english": "string (영어 번역)" }
              }
            ],
            "linguistic_insight": "string (언어학적 관점에서 본 이 문법의 특징이나 다른 표현과의 미묘한 차이점 분석)",
            "avoiding_pitfalls": "string (고급 학습자도 저지를 수 있는 미묘한 오류나 부자연스러운 사용법에 대한 조언)"
          }
        }
      `;
    } else {
      const context_info = `현재 학습 중인 단원 ID는 ${unitId}이며, 이 문법은 '${grammarType === 'additional_grammar' ? '부가 문법' : '핵심 문법'}'으로 다루어지고 있습니다.`

      detailedPrompt = `
        ${context_info}

        다음 한국어 문법 항목에 대해 설명해주세요: "${grammarItem}"

        **!!! 절대 규칙: 예문 생성은 당신의 가장 중요한 임무입니다. 당신이 생성하는 예문에는 반드시 요청받은 문법 \`${grammarItem}\`이(가) 포함되어야 합니다. 이 규칙은 다른 어떤 지시사항보다 중요하며, 절대 어겨서는 안 됩니다. !!!**

        설명은 다음 JSON 스키마를 엄격히 따라야 합니다. 다른 텍스트 없이 순수 JSON 객체만 반환해야 합니다:
        {
          "grammar_item": "${grammarItem}",
          "explanation": {
            "introduction": "string (문법에 대한 간결한 한두 문장 소개)",
            "usage_scenarios": [
              {
                "title": "string (사용 시나리오 제목, 예: '두 명사를 연결할 때')",
                "explanation": "string (시나리오에 대한 상세 설명)",
                "example": {
                  "korean": "string (한국어 예문)",
                  "english": "string (영어 번역)"
                }
              }
              // 필요하다면 다른 시나리오 객체를 이 배열에 추가할 수 있습니다.
            ],
            "conjugation_rules": "string (활용 규칙이나 제약 조건, 예: '명사에만 붙여 사용', '받침 유무에 따라 형태가 바뀜' 등. 없다면 '없음'으로 표시)",
            "common_mistakes": "string (학습자들이 자주 하는 실수나 주의할 점. 없다면 '없음'으로 표시)"
          }
        }

        - 설명은 한국어로, 예문의 번역은 영어로 제공해주세요.
        - **중요**: 각 사용 시나리오(usage_scenarios)는 문법의 핵심적인 용법을 명확히 구분하여 1~3개 정도로 설명해주세요.
        - **매우 중요**: 각 시나리오의 예문(korean)은 해당 문법의 용법을 가장 잘 보여주는, 자연스럽고 명확한 문장이어야 합니다.
      `;
    }

    console.log("--- OpenAI API 요청 프롬프트 ---");
    console.log(detailedPrompt);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: detailedPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      seed: 12345
    });

    const explanationJsonString = completion.choices[0].message.content;
    if (!explanationJsonString) {
      throw new Error("AI로부터 설명을 받지 못했습니다.");
    }

    console.log("--- OpenAI API 응답 (JSON 문자열) ---");
    console.log(explanationJsonString);

    const explanationData = JSON.parse(explanationJsonString);

    // 응답 받은 설명을 DB에 저장
    const { error: dbError } = await supabase
      .from('grammar_explanations')
      .upsert({
        grammar_item: grammarItem,
        explanation: explanationData, // JSONB 타입 컬럼에 JSON 객체 직접 저장
        language: 'ko',
        created_by: 'openai_gpt-4o', // 'source' -> 'created_by'로 변경
        source: undefined // 혹시 모를 'source' 필드 제거
      });

    if (dbError) {
      console.error('구조화된 문법 설명 DB 저장 실패:', dbError);
      // DB 저장 실패가 전체 프로세스를 중단시켜서는 안 되므로, 에러 로깅 후 정상 진행
    }

    return NextResponse.json(explanationData);

  } catch (error: any) {
    console.error("문법 설명 생성 중 에러 발생:", error);
    return NextResponse.json({ error: error.message || '알 수 없는 오류가 발생했습니다.' }, { status: 500 });
  }
} 