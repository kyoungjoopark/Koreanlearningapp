import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화 (DB 작업용)
const supabaseUrl = process.env.NEXT_PUBLIC_LEARNING_SUPABASE_URL;
const supabaseServiceKey = process.env.LEARNING_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

// 환경변수 확인

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // unitLevel과 isMainExpression을 프론트에서 받지 않고, unitId로 백엔드에서 직접 조회하여 판단
    const { grammarItem, unitId } = body;

    if (!grammarItem) {
      return NextResponse.json({ error: '문법 항목(grammarItem) 데이터가 필요합니다.' }, { status: 400 });
    }
    if (!unitId) {
      return NextResponse.json({ error: '단원 ID(unitId) 데이터가 필요합니다.' }, { status: 400 });
    }

    // --- 백엔드에서 직접 단원 정보 조회 ---
    const { data: unitData, error: unitError } = await supabase
        .from('koreantraining')
        .select('*')
        .eq('id', unitId)
        .single();

    if (unitError || !unitData) {
        console.error('단원 정보 조회 실패:', unitError);
        return NextResponse.json({ error: '설명 생성을 위한 단원 정보를 찾을 수 없습니다.' }, { status: 404 });
    }
    
    // --- 조회한 데이터로 고급 레벨 및 주요 표현 여부 판단 ---
    const isAdvancedLevel = unitData.단계 && unitData.단계.startsWith('고급');
    // 초급1,2 중급1,2만 영어 번역 대상
    const needsEnglishTranslation = unitData.단계 && (
      unitData.단계 === '초급1' || unitData.단계 === '초급2' || 
      unitData.단계 === '중급1' || unitData.단계 === '중급2'
    );
    const isMainExpression = unitData.제목 === grammarItem;

    const systemMessage = `당신은 한국어 문법을 가르치는 AI 전문가입니다. 복잡한 JSON 구조 요청을 정확히 따르며, 문법 규칙에 대한 깊은 지식을 바탕으로 설명과 예문을 생성해야 합니다.
- **매우 중요**: 모든 예문에서 조사('은/는', '이/가', '을/를', '에', '에서', '하고' 등), 어미, 접사 등은 문법 규칙에 맞게 **반드시 앞 단어에 붙여서** 작성해야 합니다. 예: '사과 하고' (X) -> '사과하고' (O), '친구 와' (X) -> '친구와' (O).
- **매우 중요**: 응답은 반드시 요청된 JSON 스키마를 따라야 하며, 그 외의 어떤 텍스트도 포함해서는 안 됩니다.
- 설명은 한국어로, 예문의 번역은 영어로 제공합니다.
- 마크다운을 사용하여 설명을 구조화하고 중요한 부분을 강조하세요.`;

    let detailedPrompt;

    // 고급 레벨 분기 처리
    if (isAdvancedLevel && isMainExpression) {
      console.log(`고급 레벨 단원(ID: ${unitId})에 대한 '단원 해설' 생성 요청 (level: ${unitData.단계})`);
      
      // 고급 레벨용 프롬프트
      detailedPrompt = `
        당신은 고급 한국어 학습자를 위한 통합 수업 교안을 설계하는 AI 커리큘럼 설계 전문가입니다. 주어진 주요 표현과 단원의 학습 활동(듣기, 말하기, 읽기, 쓰기) 내용을 유기적으로 연결하여, 학습자의 비판적 사고를 자극하고 깊이 있는 토론을 유도하는 완벽한 수업 교안을 생성해야 합니다.

        **['context_purpose' 필드 작성 특별 지침]**
        이 필드는 수업의 시작을 알리는 가장 중요한 도입부입니다. 따라서 절대로 주요 표현을 그대로 반복하거나 "이 문장은 ~라는 의미입니다"와 같이 건조하게 설명해서는 안 됩니다.
        - **핵심 임무**: 학습자에게 '이 단원의 주제에 대해 어떻게 생각하는지' 직접 질문을 던져야 합니다.
        - **실행 방식**: "여러분은 [단원 주제]에 대해 어떻게 생각하나요?" 와 같은 형식으로 질문을 시작하세요.
        - **토론 유도**: 학습자가 자신의 경험(특히 자국 문화와 한국 문화를 비교하는)을 바탕으로 토론에 참여하도록 유도하는 문장을 덧붙여야 합니다. (예: "이 주제는 사회나 문화에 따라 많은 차이를 보입니다. 여러분의 나라 경험이나 한국에서의 경험을 바탕으로 다양한 사례와 의견을 나누어 봅시다.")
        - **결과물**: 위의 지침을 종합하여, 2~3 문장으로 구성된 흥미로운 토론 유도 문단을 만드세요.

        **[입력 정보]**
        *   **주요 표현**: "${grammarItem}"
        *   **단원 주제**: "${unitData.주제 ?? '지정되지 않음'}"
        *   **듣기 과제**: "${unitData.듣기 ?? '지정되지 않음'}"
        *   **말하기 과제**: "${unitData.말하기 ?? '지정되지 않음'}"
        *   **읽기 과제**: "${unitData.읽기 ?? '지정되지 않음'}"
        *   **쓰기 과제**: "${unitData.쓰기 ?? '지정되지 않음'}"

        **!!! 절대 규칙: 당신의 유일한 임무는 입력 정보를 총동원하여, 아래 명시된 JSON 스키마를 단 하나의 오차도 없이 완벽하게 따르는 것입니다. 다른 어떤 설명이나 텍스트도 추가하지 말고, 순수한 JSON 객체만 반환하세요. !!!**

        {
          "unit_title": "${unitData.제목 ?? grammarItem}",
          "main_expression": "${grammarItem}",
          "expression_type": "[statement | question | suggestion | command]",
          "context_purpose": "string (AI가 위의 [context_purpose 필드 작성 특별 지침]에 따라 생성한, 학습자의 토론을 유도하는 질문 형식의 도입 문장)",
          "advanced_explanation": {
            "summary": "[이 표현이 유도하는 사회적·철학적·심리적 성찰 요약]",
            "themes": [
              {
                "title": "[심화 주제 1 제목]",
                "description": "[주제 1에 대한 설명: 어떻게 사고를 확장시키는지]",
                "questions": [
                  "[질문 1: 학습자 사고 유도용]",
                  "[질문 2: 경험·가치·구조 반추용]"
                ]
              },
              {
                "title": "[심화 주제 2 제목]",
                "description": "[주제 2에 대한 설명: 비판적·윤리적 관점 추가]",
                "questions": [
                  "[질문 1]",
                  "[질문 2]"
                ]
              }
            ]
          },
          "grammar_summary": {
            "description": "[이 표현의 핵심 문법 요소 개요]",
            "expressions": [
              {
                "form": "[문법 표현 1]",
                "meaning": "[그 의미와 기능]",
                "usage_notes": "[결합 규칙, 주의사항 등]",
                "example": "[예문]"
              }
            ]
          },
          "example_sentences": [
            "[응용 예문 1]",
            "[응용 예문 2]"
          ],
          "meta": {
            "level": "advanced",
            "topic_category": "[사회, 문화, 환경, 교육 등]",
            "language_focus": ["[문법 항목 1]", "[표현 기능 등]"],
            "skills_targeted": ["[말하기]", "[비판적 사고]", "[쓰기]", "[문화 이해]"]
          }
        }
      `;
    } else {
      // 초중급 또는 고급 레벨의 세부 문법 항목에 대한 프롬프트
      detailedPrompt = `
        당신은 한국어 교육 전문가입니다. 학습자를 위해 다음 '주요 표현'을 문법적으로 상세히 분석하고 설명하는 JSON 데이터를 생성해주세요.
        - **주요 표현**: "${grammarItem}"
        - **학습자 레벨**: ${isAdvancedLevel ? '고급' : '초급 또는 중급'}

        **분석 가이드라인:**
        1.  **핵심**: '**${grammarItem}**' 표현 자체를 하나의 단위로 보고, 그 의미와 사용법, 구조를 통합적으로 설명해야 합니다. **절대로 '${grammarItem}'을 더 작은 문법 단위로 쪼개서 개별적으로 설명하지 마세요.** 예를 들어, '-는 한이 있어도'를 설명할 때 '-는'과 '한이 있어도'를 분리해서 설명하면 안 됩니다.
        2.  **통합 설명**: 문법적 기능, 문장 내에서의 구조적 역할, 그리고 어떤 뉘앙스를 가지는지 종합적으로 설명합니다. 각 항목 앞에 bullet point(•)를 사용하여 구조화하고, Markdown을 사용하여 설명의 가독성을 높여주세요.
        3.  **응용 예문**: 학습자가 배운 내용을 다른 상황에서도 사용할 수 있도록, '**${grammarItem}**'을 사용한 새로운 예문을 제공합니다.
        ${needsEnglishTranslation ? `4.  **영어 번역 필수**: 초급1,2 중급1,2 학습자를 위해 다음 형식을 **정확히** 따라주세요:
            - overall_meaning: "한국어 설명 (English: 영어 번역)"
            - grammar_and_structure: "• **문법적 기능**: 한국어 설명\\n• **구조적 역할**: 한국어 설명\\n• **뉘앙스**: 한국어 설명\\n\\n(English:\\n• **Grammatical Function**: 영어 설명\\n• **Structural Role**: 영어 설명\\n• **Nuance**: 영어 설명)"
            - practical_examples: 각 예문에 영어 번역 포함
            - **절대 금지**: 한국어 설명 중간에 영어를 끼워 넣지 마세요. 반드시 한국어를 완전히 끝낸 후 영어를 추가하세요.` : '4.  **예문 번역**: 모든 한국어 예문에는 정확한 영어 번역을 반드시 포함해야 합니다.'}

        **!!! 절대 규칙: 모든 설명과 예문은 '주요 표현'("${grammarItem}")을 중심으로 이루어져야 합니다. 이 규칙은 다른 어떤 지시사항보다 중요하며, 절대 어겨서는 안 됩니다. !!!**

        아래 JSON 스키마를 엄격히 따라야 합니다. 다른 텍스트 없이 순수 JSON 객체만 반환해야 합니다:
        {
          "title_sentence": "${grammarItem}",
          "explanation": {
            "overall_meaning": "string (주요 표현 문장 전체의 의미와 사용 상황에 대한 간략한 설명)",
            "grammar_and_structure": "string (핵심 규칙: '${grammarItem}' 자체의 문법적 기능, 구조, 뉘앙스에 대한 통합적 설명. 형식: • **문법적 기능**: 설명... • **구조적 역할**: 설명... • **뉘앙스**: 설명...)",
            "practical_examples": [
              {
                "title": "string (응용 예문의 소제목, 예: '강한 의지를 나타내는 다른 상황')",
                "example": {
                  "korean": "string (핵심 문법을 사용한 새로운 응용 예문)",
                  "english": "string (영어 번역)"
                }
              }
            ]
          }
        }
      `;
    }

    // OpenAI API 요청

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

    // OpenAI API 응답 처리

    const explanationData = JSON.parse(explanationJsonString);

    // 응답 받은 설명을 DB에 저장
    console.log(`[DB_SAVE] Attempting to save grammar explanation for "${grammarItem}"`);
    
    // 데이터 검증
    if (!explanationData) {
      console.error(`[DB_SAVE_ERROR] explanationData is null or undefined for "${grammarItem}"`);
      return NextResponse.json(explanationData);
    }
    
    console.log(`[DB_SAVE] Explanation data:`, explanationData);
    console.log(`[DB_SAVE] Supabase URL: ${supabaseUrl ? 'SET' : 'MISSING'}`);
    console.log(`[DB_SAVE] Supabase Key: ${supabaseServiceKey ? 'SET' : 'MISSING'}`);
    
    // JSONB 컬럼에 저장하기 위해 객체 형태로 저장
    const insertData = {
      grammar_item: grammarItem,
      explanation: explanationData,  // JSONB 컬럼에 객체 직접 저장
      language: 'ko',  // 조회 API와 일치하도록 language 컬럼 추가
      created_by: 'ai',
      generated_by_ai: true  // 실제 테이블 컬럼명에 맞게 수정
    };
    console.log(`[DB_SAVE] Insert data:`, insertData);
    
    try {
      const { data: saveData, error: dbError } = await supabase
        .from('grammar_explanations')
        .insert(insertData);

      if (dbError) {
        console.error(`[DB_SAVE_ERROR] 구조화된 문법 설명 DB 저장 실패 for "${grammarItem}":`, dbError);
        console.error(`[DB_SAVE_ERROR] 저장 시도한 데이터:`, { grammarItem, explanation: explanationData });
      } else {
        console.log(`[DB_SAVE_SUCCESS] 문법 설명 저장 성공 for "${grammarItem}":`, saveData);
      }
    } catch (saveError) {
      console.error(`[DB_SAVE_CATCH] DB 저장 중 예외 발생 for "${grammarItem}":`, saveError);
    }



    return NextResponse.json(explanationData);

  } catch (error: any) {
    console.error("문법 설명 생성 중 에러 발생:", error);
    return NextResponse.json({ error: error.message || '알 수 없는 오류가 발생했습니다.' }, { status: 500 });
  }
} 