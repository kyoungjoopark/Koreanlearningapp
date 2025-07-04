import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
console.log('Loading environment variables from:', path.resolve(process.cwd(), '.env.local'));
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Auth 프로젝트 (jhevxnqthntmxajogfne - questions 테이블이 현재 있는 곳)
const AUTH_SUPABASE_URL = 'https://jhevxnqthntmxajogfne.supabase.co';
const AUTH_SUPABASE_SERVICE_KEY = process.env.AUTH_SUPABASE_SERVICE_ROLE_KEY;

// Learning 프로젝트 (iljysqrpapazahbihcwd - 목적지)
const LEARNING_SUPABASE_URL = process.env.NEXT_PUBLIC_LEARNING_SUPABASE_URL;
const LEARNING_SUPABASE_SERVICE_KEY = process.env.LEARNING_SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment variables check:');
console.log('- AUTH_SUPABASE_SERVICE_KEY:', AUTH_SUPABASE_SERVICE_KEY ? `Found (${AUTH_SUPABASE_SERVICE_KEY.substring(0, 20)}...)` : 'Missing');
console.log('- LEARNING_SUPABASE_URL:', LEARNING_SUPABASE_URL ? 'Found' : 'Missing');
console.log('- LEARNING_SUPABASE_SERVICE_KEY:', LEARNING_SUPABASE_SERVICE_KEY ? `Found (${LEARNING_SUPABASE_SERVICE_KEY.substring(0, 20)}...)` : 'Missing');

if (!AUTH_SUPABASE_SERVICE_KEY || !LEARNING_SUPABASE_URL || !LEARNING_SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables:');
  console.error('AUTH_SUPABASE_SERVICE_KEY:', AUTH_SUPABASE_SERVICE_KEY ? 'Found' : 'Missing');
  console.error('LEARNING_SUPABASE_URL:', LEARNING_SUPABASE_URL ? 'Found' : 'Missing');
  console.error('LEARNING_SUPABASE_SERVICE_KEY:', LEARNING_SUPABASE_SERVICE_KEY ? 'Found' : 'Missing');
  process.exit(1);
}

const authSupabase = createClient(AUTH_SUPABASE_URL, AUTH_SUPABASE_SERVICE_KEY);
const learningSupabase = createClient(LEARNING_SUPABASE_URL, LEARNING_SUPABASE_SERVICE_KEY);

async function migrateQuestions() {
  console.log('🔄 Starting questions migration from Auth to Learning project...');

  try {
    // 1. Auth 프로젝트에서 모든 questions 데이터 가져오기
    console.log('📥 Fetching questions from Auth project...');
    const { data: questionsFromAuth, error: fetchError } = await authSupabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching questions from Auth project:', fetchError);
      return;
    }

    if (!questionsFromAuth || questionsFromAuth.length === 0) {
      console.log('ℹ️ No questions found in Auth project.');
      return;
    }

    console.log(`📊 Found ${questionsFromAuth.length} questions to migrate.`);

    // 2. Learning 프로젝트에 questions 테이블이 있는지 확인
    console.log('🔍 Checking if questions table exists in Learning project...');
    const { data: existingQuestions, error: checkError } = await learningSupabase
      .from('questions')
      .select('id')
      .limit(1);

    if (checkError) {
      console.log('📋 Questions table does not exist in Learning project. Creating it...');
      
      // questions 테이블 생성 (SQL 실행)
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS questions (
          id BIGSERIAL PRIMARY KEY,
          question TEXT NOT NULL,
          student_email VARCHAR(255) NOT NULL,
          student_name VARCHAR(255) NOT NULL,
          status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'archived')),
          answer TEXT,
          teacher_name VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
          answered_at TIMESTAMP WITH TIME ZONE
        );

        -- 인덱스 생성
        CREATE INDEX IF NOT EXISTS idx_questions_student_email ON questions(student_email);
        CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
        CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at DESC);

        -- RLS 활성화
        ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

        -- 정책 생성
        CREATE POLICY IF NOT EXISTS "학생은 자신의 질문만 조회 가능" ON questions
          FOR SELECT USING (auth.jwt() ->> 'email' = student_email);

        CREATE POLICY IF NOT EXISTS "학생은 자신의 질문만 삽입 가능" ON questions
          FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = student_email);

        CREATE POLICY IF NOT EXISTS "선생님은 모든 질문 조회 가능" ON questions
          FOR SELECT USING (auth.jwt() ->> 'email' = 'kpark71@hanmail.net');

        CREATE POLICY IF NOT EXISTS "선생님은 모든 질문 업데이트 가능" ON questions
          FOR UPDATE USING (auth.jwt() ->> 'email' = 'kpark71@hanmail.net');

        CREATE POLICY IF NOT EXISTS "선생님은 질문 삭제 가능" ON questions
          FOR DELETE USING (auth.jwt() ->> 'email' = 'kpark71@hanmail.net');
      `;

      // Note: Supabase 클라이언트로는 직접 DDL 실행이 어려우므로, 
      // 이 부분은 수동으로 Supabase SQL Editor에서 실행해야 합니다.
      console.log('⚠️ Please run the following SQL in Learning project SQL Editor:');
      console.log(createTableSQL);
      console.log('\nAfter creating the table, run this script again.');
      return;
    }

    // 3. 중복 확인을 위해 Learning 프로젝트의 기존 questions ID 가져오기
    console.log('🔍 Checking for existing questions in Learning project...');
    const { data: existingQuestionsList, error: existingError } = await learningSupabase
      .from('questions')
      .select('id, student_email, question');

    if (existingError) {
      console.error('❌ Error checking existing questions:', existingError);
      return;
    }

    const existingQuestionSet = new Set(
      existingQuestionsList?.map(q => `${q.student_email}:${q.question.trim()}`) || []
    );

    // 4. 새로운 questions만 필터링
    const questionsToMigrate = questionsFromAuth.filter(q => 
      !existingQuestionSet.has(`${q.student_email}:${q.question.trim()}`)
    );

    if (questionsToMigrate.length === 0) {
      console.log('✅ All questions already exist in Learning project. No migration needed.');
      return;
    }

    console.log(`📝 Migrating ${questionsToMigrate.length} new questions...`);

    // 5. 배치 단위로 데이터 이관
    const batchSize = 50;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < questionsToMigrate.length; i += batchSize) {
      const batch = questionsToMigrate.slice(i, i + batchSize);
      
      console.log(`📤 Inserting batch ${Math.floor(i/batchSize) + 1} (${batch.length} questions)...`);

      // ID 필드 제거 (auto-increment이므로)
      const batchWithoutId = batch.map(({ id, ...rest }) => rest);

      const { data: insertedData, error: insertError } = await learningSupabase
        .from('questions')
        .insert(batchWithoutId);

      if (insertError) {
        console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, insertError);
        errorCount += batch.length;
      } else {
        console.log(`✅ Successfully inserted batch ${Math.floor(i/batchSize) + 1}`);
        successCount += batch.length;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully migrated: ${successCount} questions`);
    console.log(`❌ Failed to migrate: ${errorCount} questions`);
    console.log(`📋 Total processed: ${questionsToMigrate.length} questions`);

    if (successCount > 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('📝 Next steps:');
      console.log('1. Update your application to use the Learning project for questions');
      console.log('2. Test the questions functionality');
      console.log('3. Once confirmed working, you can remove questions from Auth project');
    }

  } catch (error) {
    console.error('💥 Unexpected error during migration:', error);
  }
}

migrateQuestions().catch(error => {
  console.error('💥 Script failed with error:', error);
  process.exit(1);
}); 