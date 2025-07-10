import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// 레벨별 프롬프트 템플릿 함수
function createLevelSpecificPrompt(prompt: string, context: any): string {
  const { unitTopic, unitTitle, unitLevel, relatedWords } = context || {};
  
  // 레벨 확인 (중급 1, 중급 2 감지)
  const isIntermediate = unitLevel && (unitLevel.includes('중급') || unitLevel.includes('intermediate'));
  const isAdvanced = unitLevel && (unitLevel.includes('고급') || unitLevel.includes('advanced'));
  const isBeginner = !isIntermediate && !isAdvanced;

  if (isIntermediate) {
    // 중급 1,2 프롬프트: 문법 구조, 용법, 4기능 중심
    return `한국어 중급 학습자(B1-B2 레벨)를 위한 "${prompt}" 관련 예문을 생성해주세요.

**학습 맥락:**
- 단원 주제: ${unitTopic || '일반'}
- 핵심 표현: ${unitTitle || ''}
- 연관 키워드: ${relatedWords?.join(', ') || '없음'}

**생성 지침:**
1. **문법 구조 및 용법 중심**: "${prompt}"의 다양한 문법적 용법과 문장 구조를 보여주는 예문
2. **4기능 통합**: 읽기, 쓰기, 듣기, 말하기 상황을 반영한 실용적 예문
3. **맥락 연결**: 단원 주제 "${unitTopic}"와 핵심 표현 "${unitTitle}"과의 연관성 고려
4. **난이도**: 중급 수준의 어휘와 문법 구조 사용 (복문, 연결어미, 높임법 등)
5. **상황 다양성**: 일상생활, 학업, 직장, 여가 등 다양한 상황별 활용

각 예문은 다음 요소를 포함해야 합니다:
- 적절한 문법 구조와 어휘 사용
- 실제 의사소통 상황에서의 활용 가능성
- 문화적 맥락과 적절한 격식 수준

2-3개의 의미 있는 예문을 생성해주세요.`;

  } else if (isAdvanced) {
    // 고급 1,2 프롬프트: 더 복잡하고 심화된 내용
    return `한국어 고급 학습자(C1-C2 레벨)를 위한 "${prompt}" 관련 심화 예문을 생성해주세요.

**학습 맥락:**
- 단원 주제: ${unitTopic || '일반'}
- 핵심 표현: ${unitTitle || ''}
- 연관 키워드: ${relatedWords?.join(', ') || '없음'}

**생성 지침:**
1. **고급 어휘 및 표현**: 격식체, 한자어, 관용표현 등 높은 수준의 언어 사용
2. **복잡한 문장 구조**: 복문, 내포문, 다양한 연결어미와 문법 요소 활용
3. **담화 기능**: 설명, 논증, 묘사, 분석 등 다양한 담화 기능 구현
4. **사회문화적 맥락**: 한국의 사회, 문화, 전통과 연관된 심화 내용
5. **전문성**: 학술적, 전문적 맥락에서 사용할 수 있는 수준

각 예문은 다음을 포함해야 합니다:
- 논리적이고 체계적인 문장 구조
- 풍부한 어휘와 표현의 다양성
- 문화적 깊이와 사회적 맥락

2-3개의 심화된 예문을 생성해주세요.`;

  } else {
    // 초급 1,2 프롬프트: 기존의 간단한 형태
    return `한국어 초급 학습자(A1-A2 레벨)를 위한 "${prompt}" 관련 예문을 생성해주세요.

**학습 맥락:**
- 단원 주제: ${unitTopic || '일반'}
- 핵심 표현: ${unitTitle || ''}

**생성 지침:**
1. 간단하고 명확한 문장 구조 사용
2. 기초 어휘와 문법 활용
3. 일상생활과 밀접한 상황 중심
4. 발음하기 쉽고 기억하기 쉬운 예문

2-3개의 쉽고 실용적인 예문을 생성해주세요.`;
  }
}

export async function POST(req: Request) {
  try {
    const { prompt, context } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }
    
    // Zod를 사용하여 AI가 생성할 객체의 스키마를 정의합니다.
    const examplesSchema = z.object({
      examples: z.array(
        z.object({
          korean_sentence: z.string().describe("Generated Korean example sentence."),
          english_translation: z.string().describe("English translation of the Korean sentence."),
        })
      ).describe("An array of 2 to 3 example sentences.")
    });

    // 레벨별 프롬프트 생성
    const levelSpecificPrompt = createLevelSpecificPrompt(prompt, context);

    const { object } = await generateObject({
      model: openai('gpt-4-turbo'),
      schema: examplesSchema,
      prompt: levelSpecificPrompt,
    });

    return NextResponse.json(object);

  } catch (error: any) {
    console.error('AI examples generation error:', error);
    const errorMessage = error.name === 'RateLimitError'
      ? 'OpenAI API rate limit exceeded. Please check your plan and billing details.'
      : error.message || 'An unexpected error occurred while generating examples.';
      
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 