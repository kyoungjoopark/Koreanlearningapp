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

async function generateProverbExplanation(proverb, meaning) {
  try {
    const prompt = `
      You are an expert Korean language educator. Your task is to generate a high-quality, detailed explanation for a Korean proverb in ENGLISH.
      The explanation should be clear, concise, and easy for a language learner to understand. Include details about its origin, lesson, and common usage scenarios.

      - Korean Proverb: "${proverb}"
      - Korean Meaning: "${meaning}"
      
      Please return ONLY the detailed English explanation text in Markdown format. Do not add any other text, titles, or introductions.
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ "role": "user", "content": prompt }],
      temperature: 0.6,
    });
    
    return response.choices[0].message?.content?.trim() || null;
  } catch (error) {
    console.error(`Error generating English explanation for "${proverb}":`, error);
    return null;
  }
}

async function main() {
  console.log("Finding PROVERBS with missing ENGLISH explanations...");

  const { data: proverbs, error } = await supabase
    .from('Proverbs')
    .select('id, Proverb, Meaning') // Using capitalized column names
    .or('explanation_en.is.null,explanation_en.eq.EMPTY,explanation_en.eq.');

  if (error) {
    console.error("Error fetching proverbs:", error.message);
    return;
  }

  if (!proverbs || proverbs.length === 0) {
    console.log("No proverbs with missing English explanations found. All set!");
    return;
  }

  console.log(`Found ${proverbs.length} proverbs to update.`);

  for (const p of proverbs) {
    console.log(`\nProcessing PROVERB: "${p.Proverb}" (ID: ${p.id})`);
    
    const explanation_en = await generateProverbExplanation(p.Proverb, p.Meaning);

    if (explanation_en) {
      console.log(`  -> Generated English explanation successfully.`);
      const { error: updateError } = await supabase
        .from('Proverbs')
        .update({ 
          explanation_en: explanation_en
        })
        .eq('id', p.id);

      if (updateError) {
        console.error(`  -> Failed to update proverb (ID: ${p.id}):`, updateError.message);
      } else {
        console.log(`  -> Successfully updated proverb (ID: ${p.id}) with English explanation.`);
      }
    } else {
      console.log(`  -> Skipped updating proverb (ID: ${p.id}) due to generation failure.`);
    }
    
    // To avoid hitting API rate limits
    await new Promise(resolve => setTimeout(resolve, 1000)); 
  }

  console.log("\nFinished processing all proverbs.");
}

main().catch(console.error);