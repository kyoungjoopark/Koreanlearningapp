-- profiles 테이블에 level 컬럼 안전하게 추가
-- 이미 존재하는 경우 무시됨

DO $$
BEGIN
    -- level 컬럼이 없는 경우에만 추가
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'level'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN level VARCHAR(50) DEFAULT 'beginner';
        
        RAISE NOTICE 'level 컬럼이 profiles 테이블에 추가되었습니다.';
    ELSE
        RAISE NOTICE 'level 컬럼이 이미 존재합니다.';
    END IF;
    
    -- starting_level과 current_level 컬럼도 추가 (교사 대시보드용)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'starting_level'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN starting_level VARCHAR(50);
        
        RAISE NOTICE 'starting_level 컬럼이 profiles 테이블에 추가되었습니다.';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'current_level'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN current_level VARCHAR(50);
        
        RAISE NOTICE 'current_level 컬럼이 profiles 테이블에 추가되었습니다.';
    END IF;
    
    -- 기본값 설정 (level이 비어있는 경우)
    UPDATE public.profiles 
    SET level = 'beginner' 
    WHERE level IS NULL OR level = '';
    
END $$; 