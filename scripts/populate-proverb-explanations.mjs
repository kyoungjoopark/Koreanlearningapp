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

async function generateExplanation(expression, meaning) {
  try {
    const prompt = `
      너는 한국어 교육 전문가야. 다음 한국어 관용구와 그 의미를 바탕으로, 관용구의 어원, 뉘앙스, 추가 사용법 등을 포함한 상세 설명을 한국어로 생성해 줘.
      - 관용구: "${expression}"
      - 의미: "${meaning}"
      
      다른 말 없이, 상세 설명 텍스트만 markdown 형식으로 반환해 줘.
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ "role": "user", "content": prompt }],
      temperature: 0.5,
    });
    
    return response.choices[0].message?.content?.trim() || null;
  } catch (error) {
    console.error(`Error generating explanation for "${expression}":`, error);
    return null;
  }
}

async function main() {
  console.log("Finding idioms with missing explanations...");

  const { data: idioms, error } = await supabase
    .from('idioms')
    .select('id, expression, meaning')
    .or('explanation.is.null,explanation.eq.');

  if (error) {
    console.error("Error fetching idioms:", error);
    return;
  }

  if (!idioms || idioms.length === 0) {
    console.log("No idioms with missing explanations found. All set!");
    return;
  }

  console.log(`Found ${idioms.length} idioms to update.`);

  for (const idiom of idioms) {
    console.log(`\nProcessing idiom: "${idiom.expression}" (ID: ${idiom.id})`);
    
    const explanation = await generateExplanation(idiom.expression, idiom.meaning);

    if (explanation) {
      console.log(`  -> Generated explanation successfully.`);
      const { error: updateError } = await supabase
        .from('idioms')
        .update({ explanation, updated_at: new Date().toISOString() })
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