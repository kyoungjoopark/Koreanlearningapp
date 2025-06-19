import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// AI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 학습 데이터용 Supabase 클라이언트
const supabaseUrl = process.env.NEXT_PUBLIC_LEARNING_SUPABASE_URL;
const supabaseServiceKey = process.env.LEARNING_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Supabase credentials for learning DB are not set in .env.local");
  throw new Error("Supabase credentials for learning DB are not defined");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { expression, meaning, situation, level } = await request.json();

    if (!expression || !meaning) {
      return NextResponse.json({ error: 'Expression and meaning are required.' }, { status: 400 });
    }

    const situationPrompt = situation
      ? `또한, 대화 예문은 다음 특정 상황에 맞게 만들어줘: "${situation}"`
      : '';

    const prompt = `
      너는 한국어 교육 콘텐츠 생성 전문가야. 다음 한국어 관용구와 그 의미, 그리고 레벨을 바탕으로 학습 콘텐츠를 생성해 줘.

      관용구: "${expression}"
      의미: "${meaning}"
      레벨: "${level}"
      ${situationPrompt}

      아래 4가지 항목을 포함하는 JSON 응답을 생성해 줘:
      1.  의미의 영어 번역 (키: "meaning_english")
      2.  관용구를 사용한 자연스러운 대화 형식의 한국어 예문 (가/나 형식, 키: "example_dialogue_korean")
      3.  한국어 예문에 대한 영어 번역 (키: "example_dialogue_english")
      4.  관용구의 어원, 뉘앙스, 추가 사용법 등을 포함한 상세 설명 (키: "explanation")

      응답은 다른 설명 없이 JSON 형식이어야 하고, 위의 4가지 키를 반드시 포함해야 해.
    `;

    const openaiResponse = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = openaiResponse.choices[0].message?.content;
    if (!content) {
      throw new Error('Failed to get a valid response from AI.');
    }

    const parsedContent = JSON.parse(content);
    const { meaning_english, example_dialogue_korean, example_dialogue_english, explanation } = parsedContent;

    if (!meaning_english || !example_dialogue_korean || !example_dialogue_english || !explanation) {
        throw new Error('AI response was missing required fields.');
    }
    
    const dataToUpsert = {
      expression: expression.trim(),
      meaning: meaning.trim(),
      meaning_en: meaning_english,
      example_sentence: example_dialogue_korean,
      example_sentence_en: example_dialogue_english,
      explanation: explanation,
      situation: situation || null,
      updated_at: new Date().toISOString(),
      type: 'idiom',
      level: level || '중급',
    };

    const { data, error } = await supabaseAdmin
      .from('idioms')
      .upsert(dataToUpsert, { onConflict: 'expression' })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
} 