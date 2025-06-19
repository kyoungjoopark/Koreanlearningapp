import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화 (DB 작업용)
const supabaseUrl = process.env.NEXT_PUBLIC_LEARNING_SUPABASE_URL;
const supabaseServiceKey = process.env.LEARNING_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Supabase URL or service key is not set for sentence explanation API.");
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// OpenAI 클라이언트 초기화 (기존 방식)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { 
      sentence, unitLevel, unitTopic, unitVocabulary, 
      speakingTask, unitGrammar, unitAdditionalGrammar, 
      listeningTask, readingTask, writingTask, unitId
    } = await req.json();

    // 학습자 레벨에 따라 동적으로 프롬프트 및 JSON 스키마 결정
    let promptContent;
    const systemMessage = `You are a helpful and detailed Korean language teacher. You must output a valid JSON object strictly following the provided schema.`;

    if (unitLevel === '고급') {
      promptContent = `
        당신은 한국어 고급 학습자를 위한 깊이 있는 토론을 이끌어내는 AI 촉진자입니다. 다음 단원 주제에 대해, 한국의 사회적 맥락을 보여주고, 핵심 문법을 활용하여 학습자가 스스로 생각하게 만드는 JSON 데이터를 생성해주세요.
        **절대 규칙: 다른 텍스트 없이 순수 JSON 객체만 반환해야 합니다.**
        
        - 단원 주제: "${unitTopic}"
        - 이 단원의 핵심 문법: "${unitGrammar}"
        - 이 단원의 부가 문법: "${unitAdditionalGrammar || '없음'}"
        - 학습자 레벨: 고급

        아래 JSON 스키마를 엄격히 따르세요. 설명은 학습자의 사고를 자극하도록 작성되어야 합니다.
        {
          "topic_introduction": "string (단원 주제에 대한 한국의 일반적인 상황이나 견해를 간략히 소개하고, 학습자에게 생각할 거리를 던지는 질문)",
          "cultural_insight": {
            "title": "string (문화/사회적 탐구 제목)",
            "explanation": "string (주제와 관련된 한국의 특정 문화, 사회 현상 또는 역사적 배경에 대한 해설)"
          },
          "grammar_in_context": {
            "title": "string (문법이 활용된 심층 시나리오 제목)",
            "explanation": "string (주제와 관련된 복잡한 상황을 제시하고, 이 상황에서 핵심 문법이 어떻게 미묘한 뉘앙스를 전달하는지 설명)",
            "example": { 
              "korean": "string (반드시 '${unitGrammar}' 또는 '${unitAdditionalGrammar}' 문법을 사용한 예문)", 
              "english": "string (예문 번역)" 
            }
          },
          "related_idiom_or_proverb": {
            "expression": "string (주제와 관련된 한국 관용구 또는 속담)",
            "explanation": "string (해당 표현의 의미와 주제와의 연관성 설명)",
            "example": { "korean": "string (관용구/속담 사용 예문)", "english": "string (예문 번역)" }
          },
          "food_for_thought": "string (학습자가 주제에 대해 더 깊이 생각해볼 수 있는 최종 질문 또는 성찰 포인트)"
        }
      `;
    } else {
      promptContent = `
        당신은 한국어 학습자를 위한 친절한 AI 선생님입니다. 다음 단원의 핵심 표현에 대해 설명하는 JSON 데이터를 생성해주세요.
        **절대 규칙: 다른 텍스트 없이 순수 JSON 객체만 반환해야 합니다.**
        - 핵심 표현: "${sentence}"
        - 학습자 레벨: ${unitLevel}
        - 단원 주제: ${unitTopic}
        아래 JSON 스키마를 엄격히 따라, **2~3개의 다양한 사용 시나리오를 포함하여** 설명해주세요:
        {
          "introduction": "string (핵심 표현에 대한 간결한 한두 문장 소개)",
          "usage_scenarios": [
            {
              "title": "string (첫 번째 사용 시나리오 제목)",
              "explanation": "string (첫 번째 시나리오에 대한 상세 설명)",
              "example": { "korean": "string (예문)", "english": "string (번역)" }
            },
            {
              "title": "string (두 번째 사용 시나리오 제목)",
              "explanation": "string (두 번째 시나리오에 대한 상세 설명)",
              "example": { "korean": "string (예문)", "english": "string (번역)" }
            }
          ],
          "structure_analysis": "string (문법적 구조 분석)",
          "key_takeaway": "string (핵심 요약)"
        }
      `;
    }
    
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: promptContent }
        ],
        response_format: { type: "json_object" },
    });
    
    const content = completion.choices[0].message.content;
    if (!content) {
        throw new Error("AI로부터 비어있는 응답을 받았습니다.");
    }

    let explanationData;
    try {
        explanationData = JSON.parse(content);
    } catch (parseError) {
        console.error("AI 응답 JSON 파싱 오류:", parseError, "원본 텍스트:", content);
        throw new Error("AI가 유효하지 않은 형식의 설명을 생성했습니다.");
    }

    // 생성된 설명을 DB에 저장
    const { error: dbError } = await supabase
      .from('grammar_explanations')
      .upsert({
        grammar_item: sentence,
        explanation: explanationData,
        language: 'ko',
        explanation_type: 'sentence',
        created_by: 'openai_gpt-4o',
        unit_id: unitId,
      }, {
        onConflict: 'grammar_item'
      });

    if (dbError) {
      console.error('단원 해설 DB 저장 실패:', dbError);
    }

    return NextResponse.json(explanationData);

  } catch (error: any) {
    console.error('AI sentence generation error:', error);
    const errorMessage = error.name === 'RateLimitError'
      ? 'OpenAI API rate limit exceeded'
      : error.message || 'An unexpected error occurred';
      
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}