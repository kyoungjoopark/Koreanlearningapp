-- questions 테이블 생성
CREATE TABLE questions (
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

-- 인덱스 생성 (성능 향상을 위해)
CREATE INDEX idx_questions_student_email ON questions(student_email);
CREATE INDEX idx_questions_status ON questions(status);
CREATE INDEX idx_questions_created_at ON questions(created_at DESC);

-- Row Level Security (RLS) 활성화
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- 정책 생성
-- 학생은 자신의 질문만 조회 가능
CREATE POLICY "학생은 자신의 질문만 조회 가능" ON questions
  FOR SELECT USING (auth.jwt() ->> 'email' = student_email);

-- 학생은 자신의 질문만 삽입 가능
CREATE POLICY "학생은 자신의 질문만 삽입 가능" ON questions
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = student_email);

-- 선생님(kpark71@hanmail.net)은 모든 질문 조회 가능
CREATE POLICY "선생님은 모든 질문 조회 가능" ON questions
  FOR SELECT USING (auth.jwt() ->> 'email' = 'kpark71@hanmail.net');

-- 선생님(kpark71@hanmail.net)은 모든 질문 업데이트 가능 (답변 추가)
CREATE POLICY "선생님은 모든 질문 업데이트 가능" ON questions
  FOR UPDATE USING (auth.jwt() ->> 'email' = 'kpark71@hanmail.net');

-- 선생님(kpark71@hanmail.net)은 질문 삭제 가능
CREATE POLICY "선생님은 질문 삭제 가능" ON questions
  FOR DELETE USING (auth.jwt() ->> 'email' = 'kpark71@hanmail.net'); 