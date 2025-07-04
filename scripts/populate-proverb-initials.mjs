import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM 환경에서 __dirname과 유사한 기능 구현
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env.local 파일 로드 (프로젝트 루트에 있다고 가정)
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const {
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
} = process.env;

if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing required environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const INITIALS = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

// 한글 초성 추출 함수
const getInitial = (text) => {
  if (!text) return null;
  const firstChar = text.charCodeAt(0);
  if (firstChar >= 0xAC00 && firstChar <= 0xD7A3) { // 한글 음절 범위
    const index = Math.floor((firstChar - 0xAC00) / 588);
    return INITIALS[index];
  }
  return null; // 한글이 아닌 경우
};


async function populateProverbInitials() {
  console.log('Fetching proverbs that need initial population...');
  
  let totalUpdatedCount = 0;
  const pageSize = 500; // Process 500 records per batch
  let page = 0;

  while (true) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    console.log(`Fetching proverbs from row ${from} to ${to}...`);

    const { data: proverbs, error: fetchError } = await supabase
      .from('Proverbs')
      .select('id, Proverb')
      .is('initial', null) // Only fetch rows where 'initial' is NULL
      .range(from, to);

    if (fetchError) {
      console.error('Error fetching proverbs:', fetchError);
      break;
    }

    if (!proverbs || proverbs.length === 0) {
      console.log('No more proverbs to update.');
      break;
    }

    console.log(`Found ${proverbs.length} proverbs to process in this batch.`);
    let batchUpdatedCount = 0;

    for (const p of proverbs) {
      const initial = getInitial(p.Proverb);
      if (initial) {
        const { error: updateError } = await supabase
          .from('Proverbs')
          .update({ initial: initial })
          .eq('id', p.id);
        
        if (updateError) {
          console.error(`Error updating proverb ID ${p.id} (${p.Proverb}):`, updateError.message);
        } else {
          batchUpdatedCount++;
        }
      } else {
          console.warn(`Could not determine initial for proverb ID ${p.id} ("${p.Proverb}"). Skipping.`);
      }
    }
    
    totalUpdatedCount += batchUpdatedCount;
    console.log(`Successfully updated ${batchUpdatedCount} proverbs in this batch.`);

    // If the number of fetched proverbs is less than the page size, we've reached the end
    if (proverbs.length < pageSize) {
      console.log('Finished processing all remaining proverbs.');
      break;
    }

    page++;
    await new Promise(resolve => setTimeout(resolve, 1000)); // Add a small delay between batches
  }

  console.log(`\nFinished processing. Total updated proverbs in this run: ${totalUpdatedCount}.`);
}

populateProverbInitials(); 