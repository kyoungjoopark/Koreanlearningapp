import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM 환경에서 __dirname과 유사한 기능 구현
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env.local 파일 로드 (프로젝트 루트에 있다고 가정)
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const { 
  NEXT_PUBLIC_LEARNING_SUPABASE_URL,
  NEXT_PUBLIC_LEARNING_SUPABASE_ANON_KEY,
  OPENAI_API_KEY
} = process.env;

if (!NEXT_PUBLIC_LEARNING_SUPABASE_URL || !NEXT_PUBLIC_LEARNING_SUPABASE_ANON_KEY || !OPENAI_API_KEY) {
  console.error('Error: Missing required environment variables. Make sure NEXT_PUBLIC_LEARNING_SUPABASE_URL, NEXT_PUBLIC_LEARNING_SUPABASE_ANON_KEY, and OPENAI_API_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(NEXT_PUBLIC_LEARNING_SUPABASE_URL, NEXT_PUBLIC_LEARNING_SUPABASE_ANON_KEY);
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// OpenAI API를 호출하여 관련 키워드를 생성하는 함수
async function generateKeywordsForWord(word) {
  if (!word || typeof word !== 'string' || word.trim().length === 0) {
    console.warn(`Skipping keyword generation for invalid or empty word: "${word}"`);
    return [];
  }
  try {
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
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // console.log(`OpenAI response for related keywords (${word}):`, content); // 상세 로그 필요시 주석 해제
    let parsedKeywords;
    try {
      const cleanedContent = content.replace(/^```json\n|\n```$/g, '');
      const jsonResponse = JSON.parse(cleanedContent);
      parsedKeywords = jsonResponse.related_keywords;
    } catch (e) {
      console.error(`Failed to parse OpenAI response for "${word}" as JSON:`, e, "Content:", content);
      parsedKeywords = content.split(/[\n,]+/).map(k => k.trim()).filter(k => k.length > 0 && k.length < 50); // 너무 긴 문자열 필터링
      if (parsedKeywords.length === 0) {
         console.warn(`No keywords extracted from raw string for "${word}".`);
         return [];
      }
      console.warn(`Parsed keywords from raw string for "${word}" as a fallback:`, parsedKeywords);
    }

    if (!Array.isArray(parsedKeywords) || !parsedKeywords.every(k => typeof k === 'string')) {
        console.error('Invalid format for related_keywords from OpenAI. Expected an array of strings. Word:', word, 'Response:', parsedKeywords);
        return []; // 오류 발생 시 빈 배열 반환
    }
    return parsedKeywords.filter(k => k.length < 50); // 너무 긴 키워드 필터링

  } catch (error) {
    console.error(`Error generating keywords for word "${word}":`, error);
    return []; // 오류 발생 시 빈 배열 반환
  }
}

async function populateRelatedKeywords() {
  console.log('Fetching vocabulary from koreantraining table...');
  const { data: units, error: fetchError } = await supabase
    .from('koreantraining')
    .select('id, 어휘');

  if (fetchError) {
    console.error('Error fetching units:', fetchError);
    return;
  }

  if (!units || units.length === 0) {
    console.log('No units found in koreantraining table.');
    return;
  }

  console.log(`Found ${units.length} units to process.`);

  for (const unit of units) {
    if (!unit.어휘 || unit.어휘.trim() === '') {
      console.log(`Unit ID ${unit.id} has no vocabulary. Skipping.`);
      continue;
    }

    const individualWords = unit.어휘.split(/[,、;]+/).map(word => word.trim()).filter(word => word.length > 0);
    if (individualWords.length === 0) {
        console.log(`Unit ID ${unit.id} vocabulary "${unit.어휘}" parsed into zero valid words. Skipping.`);
        continue;
    }
    
    let allRelatedKeywordsForUnit = [];
    console.log(`
Processing Unit ID: ${unit.id} - Vocabulary: "${unit.어휘}"`);
    console.log(`  Individual words to process: ${individualWords.join(', ')}`);

    for (const word of individualWords) {
      console.log(`  Fetching related keywords for: "${word}"...`);
      const keywords = await generateKeywordsForWord(word);
      if (keywords && keywords.length > 0) {
        allRelatedKeywordsForUnit.push(...keywords);
      }
      // OpenAI API 속도 제한을 피하기 위해 약간의 딜레이 추가 (예: 1초)
      await new Promise(resolve => setTimeout(resolve, 1000)); 
    }

    // 중복 제거
    const uniqueKeywords = Array.from(new Set(allRelatedKeywordsForUnit));

    if (uniqueKeywords.length > 0) {
      console.log(`  Updating Unit ID ${unit.id} with related keywords: ${uniqueKeywords.join(', ')}`);
      const { error: updateError } = await supabase
        .from('koreantraining')
        .update({ related_keywords: uniqueKeywords })
        .eq('id', unit.id);

      if (updateError) {
        console.error(`  Error updating unit ID ${unit.id}:`, updateError);
      } else {
        console.log(`  Successfully updated Unit ID ${unit.id}.`);
      }
    } else {
      console.log(`  No related keywords generated for Unit ID ${unit.id}. Nothing to update.`);
    }
  }
  console.log('\nFinished populating related keywords for all units.');
}

populateRelatedKeywords(); 