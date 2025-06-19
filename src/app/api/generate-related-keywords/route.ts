import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  try {
    const { word } = await request.json();

    if (!word || typeof word !== 'string') {
      return NextResponse.json({ error: 'Invalid input: word is required and must be a string.' }, { status: 400 });
    }

    const prompt = `
주어진 한국어 단어 '${word}'와 직접적으로 관련된 키워드를 5개에서 10개 사이로 생성해주세요.
각 키워드는 명사 형태여야 하며, 한국어 학습자가 이해하기 쉬운 단어로 구성해주세요.
결과는 반드시 다음 JSON 스키마를 따라야 합니다:
{
  "related_keywords": ["키워드1", "키워드2", ...]
}
출력 시에는 오직 JSON 스키마만, 설명 없이 내보내주세요.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 100,
      // response_format: { type: "json_object" }, // GPT-3.5-turbo는 이 옵션을 지원하지 않을 수 있음
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    console.log(`OpenAI response for related keywords (${word}):`, content);

    // OpenAI 응답이 JSON 문자열로 왔는지 확인하고 파싱
    let parsedKeywords;
    try {
      // 가끔 응답 앞뒤로 마크다운 코드 블록 표시가 붙는 경우가 있어서 제거
      const cleanedContent = content.replace(/^```json\\n|\\n```$/g, '');
      const jsonResponse = JSON.parse(cleanedContent);
      parsedKeywords = jsonResponse.related_keywords;
    } catch (e) {
      console.error('Failed to parse OpenAI response as JSON:', e);
      // JSON 파싱 실패 시, 텍스트에서 직접 키워드를 추출 시도 (쉼표 등으로 구분된 경우)
      // 이는 최후의 수단이며, 프롬프트를 통해 JSON을 받도록 하는 것이 가장 좋습니다.
      parsedKeywords = content.split(/[\\n,]+/).map(k => k.trim()).filter(k => k.length > 0);
      if (parsedKeywords.length === 0) {
        throw new Error('Failed to parse keywords from OpenAI response. Response was not valid JSON and contained no extractable keywords.');
      }
      console.warn('Parsed keywords from raw string as a fallback:', parsedKeywords)
    }

    if (!Array.isArray(parsedKeywords) || !parsedKeywords.every(k => typeof k === 'string')) {
      throw new Error('Invalid format for related_keywords from OpenAI. Expected an array of strings.');
    }

    return NextResponse.json({ related_keywords: parsedKeywords });

  } catch (error: any) {
    console.error('Error generating related keywords:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate related keywords' }, { status: 500 });
  }
} 