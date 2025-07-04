import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file in the project root
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const {
  NEXT_PUBLIC_LEARNING_SUPABASE_URL,
  LEARNING_SUPABASE_SERVICE_ROLE_KEY,
  OPENAI_API_KEY
} = process.env;

if (!NEXT_PUBLIC_LEARNING_SUPABASE_URL || !LEARNING_SUPABASE_SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
  console.error("Missing one or more required environment variables from .env.local");
  process.exit(1);
}

const supabase = createClient(NEXT_PUBLIC_LEARNING_SUPABASE_URL, LEARNING_SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Using the exact same logic as the admin panel API to generate the explanation
async function generateExplanationFromAdminPrompt(expression, meaning, level) {
  try {
    const prompt = `
      너는 한국어 교육 콘텐츠 생성 전문가야. 다음 한국어 관용구와 그 의미, 그리고 레벨을 바탕으로 학습 콘텐츠를 생성해 줘.

      관용구: "${expression}"
      의미: "${meaning}"
      레벨: "${level || '중급'}"

      **절대 규칙:** 아래 4가지 항목을 **반드시 모두 포함**하는 JSON 응답을 생성해야 한다. 어떤 항목도 누락해서는 안 된다.
      1.  **meaning_english**: 의미의 영어 번역 (string)
      2.  **example_dialogue_korean**: 관용구를 사용한 자연스러운 대화 형식의 한국어 예문 (가/나 형식의 string). **절대로 JSON 객체나 배열을 사용하지 말고, 하나의 문자열로 만들어야 한다.**
      3.  **example_dialogue_english**: 한국어 예문에 대한 영어 번역 (string). **이 또한 하나의 문자열이어야 한다.**
      4.  **explanation**: 관용구의 어원, 뉘앙스, 추가 사용법 등을 포함한 상세 설명을 **영어로(in English)** 작성해 줘. (string)

      **응답 형식:**
      - 응답은 다른 어떤 설명도 없이, 순수한 JSON 객체여야 한다.
      - 모든 값은 반드시 문자열(string)이어야 한다.
    `;
    
    const openaiResponse = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ "role": "user", "content": prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });
    
    const content = openaiResponse.choices[0].message?.content;
    if (!content) {
      throw new Error('Failed to get a valid response from AI.');
    }
    
    const parsedContent = JSON.parse(content);
    const { explanation } = parsedContent;

    if (!explanation) {
        throw new Error('AI response was missing the explanation field.');
    }

    return explanation;

  } catch (error) {
    console.error(`Error generating English explanation for "${expression}":`, error);
    return null;
  }
}

async function main() {
  console.log("Finding idioms with missing or incorrect ENGLISH explanations (using admin panel prompt)...");

  // Find idioms that have null, 'EMPTY', or Korean explanations
  const { data: idioms, error } = await supabase
    .from('idioms')
    .select('id, expression, meaning, level, explanation')
    .or('explanation.is.null,explanation.eq.EMPTY,explanation.eq.,explanation.like.###*');

  if (error) {
    console.error("Error fetching idioms:", error);
    return;
  }

  if (!idioms || idioms.length === 0) {
    console.log("No idioms with missing or incorrect (Korean) explanations found. All set!");
    return;
  }

  console.log(`Found ${idioms.length} idioms to update with English explanations.`);

  for (const idiom of idioms) {
    // Defensive check to avoid overwriting valid data
    if (idiom.explanation && !idiom.explanation.startsWith('###') && idiom.explanation.trim() !== 'EMPTY' && idiom.explanation.trim() !== '') {
        console.log(`  -> Skipping idiom (ID: ${idiom.id}) as it seems to already have a valid English explanation.`);
        continue;
    }
      
    console.log(`\nProcessing idiom: "${idiom.expression}" (ID: ${idiom.id})`);
    
    const explanation = await generateExplanationFromAdminPrompt(idiom.expression, idiom.meaning, idiom.level);

    if (explanation) {
      console.log(`  -> Generated English explanation successfully.`);
      const { error: updateError } = await supabase
        .from('idioms')
        .update({ explanation: explanation, updated_at: new Date().toISOString() })
        .eq('id', idiom.id);

      if (updateError) {
        console.error(`  -> Failed to update idiom (ID: ${idiom.id}):`, updateError.message);
      } else {
        console.log(`  -> Successfully updated idiom (ID: ${idiom.id}) in the database.`);
      }
    } else {
      console.log(`  -> Skipped updating idiom (ID: ${idiom.id}) due to generation failure.`);
    }
    
    // To avoid hitting API rate limits
    await new Promise(resolve => setTimeout(resolve, 1000)); 
  }

  console.log("\nFinished processing all idioms.");
}

main().catch(console.error); 