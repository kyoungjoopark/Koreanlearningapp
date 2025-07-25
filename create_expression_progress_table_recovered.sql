-- 愿?⑷뎄/?띾떞 ?숈뒿 吏꾨룄 異붿쟻 ?뚯씠釉?CREATE TABLE IF NOT EXISTS expression_learning_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('idioms', 'proverbs')),
  level VARCHAR(20) NOT NULL, -- '珥덇툒', '以묎툒', '怨좉툒', '??, '??, '?? ??  current_index INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  completed_items INTEGER[] DEFAULT '{}', -- ?꾨즺???꾩씠?쒕뱾???몃뜳??諛곗뿴
  last_accessed TIMESTAMP DEFAULT NOW(),
  is_level_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- 以묐났 諛⑹?: ?ъ슜?먮떦 而⑦뀗痢좏????덈꺼 議고빀? ?좎씪?댁빞 ??  UNIQUE(user_id, content_type, level)
);

-- ?몃뜳???앹꽦 (鍮좊Ⅸ 議고쉶瑜??꾪빐)
CREATE INDEX IF NOT EXISTS idx_expression_progress_user_content 
ON expression_learning_progress(user_id, content_type, level);

-- updated_at ?먮룞 ?낅뜲?댄듃 ?⑥닔
CREATE OR REPLACE FUNCTION update_expression_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ?몃━嫄??앹꽦
CREATE TRIGGER trigger_expression_progress_updated_at
  BEFORE UPDATE ON expression_learning_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_expression_progress_updated_at();

-- ?섑뵆 二쇱꽍
COMMENT ON TABLE expression_learning_progress IS '愿?⑷뎄? ?띾떞 ?숈뒿 吏꾨룄 異붿쟻 ?뚯씠釉?;
COMMENT ON COLUMN expression_learning_progress.content_type IS 'idioms ?먮뒗 proverbs';
COMMENT ON COLUMN expression_learning_progress.level IS '?숈뒿 ?덈꺼 (珥덇툒/以묎툒/怨좉툒 ?먮뒗 ??????..)';
COMMENT ON COLUMN expression_learning_progress.current_index IS '?꾩옱 ?숈뒿 以묒씤 ?꾩씠?쒖쓽 ?몃뜳??(0遺???쒖옉)';
COMMENT ON COLUMN expression_learning_progress.completed_items IS '?꾨즺???꾩씠?쒕뱾???몃뜳??諛곗뿴'; 
