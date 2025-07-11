-- 관용구/속담 학습 진도 추적 테이블
CREATE TABLE IF NOT EXISTS expression_learning_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('idioms', 'proverbs')),
  level VARCHAR(20) NOT NULL, -- '초급', '중급', '고급', 'ㄱ', 'ㄴ', 'ㄷ' 등
  current_index INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  completed_items INTEGER[] DEFAULT '{}', -- 완료한 아이템들의 인덱스 배열
  last_accessed TIMESTAMP DEFAULT NOW(),
  is_level_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- 중복 방지: 사용자당 컨텐츠타입+레벨 조합은 유일해야 함
  UNIQUE(user_id, content_type, level)
);

-- 인덱스 생성 (빠른 조회를 위해)
CREATE INDEX IF NOT EXISTS idx_expression_progress_user_content 
ON expression_learning_progress(user_id, content_type, level);

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_expression_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trigger_expression_progress_updated_at
  BEFORE UPDATE ON expression_learning_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_expression_progress_updated_at();

-- 테이블 주석
COMMENT ON TABLE expression_learning_progress IS '관용구와 속담 학습 진도 추적 테이블';
COMMENT ON COLUMN expression_learning_progress.content_type IS 'idioms 또는 proverbs';
COMMENT ON COLUMN expression_learning_progress.level IS '학습 레벨 (초급/중급/고급 또는 ㄱㄴㄷ등)';
COMMENT ON COLUMN expression_learning_progress.current_index IS '현재 학습 중인 아이템의 인덱스(0부터시작)';
COMMENT ON COLUMN expression_learning_progress.completed_items IS '완료한 아이템들의 인덱스 배열'; 