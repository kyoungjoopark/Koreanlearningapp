# roadmap.csv 연계 분석 및 구현 방안

## 📊 roadmap.csv 데이터 구조 분석

### **CSV 컬럼 구조**
```
교재명, level, 단원명, 주제, 목표, 문법1, 표현1, 문법2, 표현2
```

### **레벨 체계**
- **세종한국어 교육용 한국어 1**: 초급 1-1 ~ 1-14 (14개 단원)
- **세종한국어 교육용 한국어 2**: 초급 1-15 ~ 1-28 (14개 단원)  
- **세종한국어 교육용 한국어 3**: 중급1-1 ~ 1-14 (6개 단원 완성, 8개 미완성)

### **주제별 분류 (완성된 단원들)**
1. **인사**: 자기소개, 인사하기
2. **위치**: 장소 묻고 답하기
3. **음식**: 음식 주문, 취향 표현
4. **시간**: 시간, 날짜, 요일 표현
5. **쇼핑**: 물건 사기, 가격 묻기
6. **취미**: 취미 활동, 계획 세우기
7. **교통**: 교통수단, 길 찾기
8. **생활**: 일상 활동, 하루 일과
9. **외모**: 사람 묘사, 특징 설명
10. **의료**: 병원, 증상 표현
11. **전화**: 전화 통화, 약속 잡기
12. **학습**: 한국어 공부, 방법론

---

## 🔗 단어 학습 앱과의 연계 방안

### **1. 현재 Vocabulary 페이지 구조**
```typescript
interface Word {
  id: number
  korean: string
  meaning: string
  pronunciation: string
  example: string
  level: Level  // '초급' | '초중급' | '중급' | '고급'
}

const vocabularyData: Record<Level, Word[]>
```

### **2. roadmap.csv 기반 새로운 구조 제안**
```typescript
interface Curriculum {
  id: string           // 'beginner-1-1', 'intermediate-1-3'
  textbook: string     // '세종한국어 교육용 한국어 1'
  level: string        // '초급 1-1'
  unitName: string     // '안녕하세요'
  topic: string        // '인사'
  objective: string    // '인사하기, 자기소개하기'
  grammar1: string     // '이에요/예요'
  expression1: string  // '안녕하세요/안녕히계세요'
  grammar2?: string    // '은/는'
  expression2?: string // '저/제'
}

interface LevelWord extends Word {
  curriculumId: string  // curriculum과 연결
  topic: string         // 주제별 분류
  difficulty: 1 | 2 | 3 // 단원 내 난이도
  relatedGrammar: string[] // 관련 문법
}
```

### **3. 데이터베이스 테이블 설계**

#### **curriculum 테이블**
```sql
CREATE TABLE curriculum (
  id VARCHAR(50) PRIMARY KEY,
  textbook VARCHAR(100),
  level VARCHAR(20),
  unit_name VARCHAR(100),
  topic VARCHAR(50),
  objective TEXT,
  grammar1 VARCHAR(100),
  expression1 VARCHAR(100),
  grammar2 VARCHAR(100),
  expression2 VARCHAR(100),
  order_index INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **vocabulary 테이블** (기존 확장)
```sql
CREATE TABLE vocabulary (
  id BIGSERIAL PRIMARY KEY,
  korean VARCHAR(100) NOT NULL,
  meaning VARCHAR(200) NOT NULL,
  pronunciation VARCHAR(150),
  example TEXT,
  curriculum_id VARCHAR(50) REFERENCES curriculum(id),
  topic VARCHAR(50),
  difficulty INTEGER CHECK (difficulty IN (1, 2, 3)),
  related_grammar TEXT[],
  audio_url VARCHAR(255),
  image_url VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎯 구현 단계별 계획

### **Phase 1: 데이터 마이그레이션**

#### **1.1 roadmap.csv → 데이터베이스**
```python
# CSV 파싱 및 정제 스크립트
import pandas as pd
import re

def parse_roadmap_csv():
    df = pd.read_csv('roadmap.csv', encoding='utf-8')
    curriculum_data = []
    
    for index, row in df.iterrows():
        if pd.notna(row['단원명']) and row['단원명'].strip():
            curriculum_id = generate_curriculum_id(row['level'])
            curriculum_data.append({
                'id': curriculum_id,
                'textbook': row['교재명'],
                'level': row['level'],
                'unit_name': row['단원명'],
                'topic': row['주제'],
                'objective': row['목표'],
                'grammar1': row['문법1'],
                'expression1': row['표현1'],
                'grammar2': row['문법2'] if pd.notna(row['문법2']) else None,
                'expression2': row['표현2'] if pd.notna(row['표현2']) else None,
                'order_index': index + 1
            })
    
    return curriculum_data
```

#### **1.2 주제별 단어 데이터 생성**
```python
# 주제별 단어 자동 생성 (기존 dic 테이블 활용)
def generate_topic_vocabulary(topic, curriculum_id):
    # 주제별 키워드 매핑
    topic_keywords = {
        '인사': ['안녕', '만나다', '인사', '이름', '소개'],
        '음식': ['밥', '먹다', '맛있다', '주문', '메뉴'],
        '위치': ['여기', '저기', '어디', '장소', '위치'],
        # ... 더 많은 매핑
    }
    
    # dic 테이블에서 관련 내용 검색하여 단어 추출
    # AI를 활용한 단어 생성 및 검증
```

### **Phase 2: UI 개선**

#### **2.1 새로운 Vocabulary 페이지 구조**
```typescript
// 커리큘럼 기반 학습 진행
export default function EnhancedVocabularyPage() {
  const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum>()
  const [currentProgress, setCurrentProgress] = useState(0)
  const [completedUnits, setCompletedUnits] = useState<string[]>([])
  
  // 커리큘럼별 단어 로드
  // 진도 추적 시스템
  // 단계별 학습 가이드
}
```

#### **2.2 학습 진도 시각화**
```typescript
// 진도 표시 컴포넌트
const ProgressVisualization = () => (
  <div className="curriculum-progress">
    <div className="level-group">
      <h3>초급 1권</h3>
      <div className="units-grid">
        {beginnerUnits.map(unit => (
          <div className={`unit-card ${isCompleted(unit.id) ? 'completed' : ''}`}>
            <span className="unit-number">{unit.level}</span>
            <span className="unit-topic">{unit.topic}</span>
            <div className="progress-bar">
              <div className="progress-fill" style={{width: `${getProgress(unit.id)}%`}} />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)
```

### **Phase 3: 고급 기능**

#### **3.1 적응형 학습 시스템**
```typescript
// 사용자 실력에 따른 단어 추천
interface LearningAnalytics {
  weakTopics: string[]        // 약한 주제들
  strongGrammar: string[]     // 잘하는 문법
  recommendedNext: string[]   // 다음 추천 단원
  averageRetention: number    // 평균 기억률
}

// 개인 맞춤형 복습 시스템
const generateReviewWords = (analytics: LearningAnalytics) => {
  // 틀린 단어 우선 복습
  // 약한 주제 보강
  // 망각 곡선 기반 복습 스케줄링
}
```

#### **3.2 문법 연계 학습**
```typescript
// 단어와 문법 동시 학습
interface WordWithGrammar {
  word: LevelWord
  grammarPattern: string
  exampleSentences: string[]
  practiceQuestions: Question[]
}

// 예: "학교" 단어 + "에 가다" 문법
const createGrammarPractice = (word: string, grammar: string) => ({
  word: "학교",
  pattern: "N + 에 가다",
  examples: [
    "저는 학교에 갑니다.",
    "친구와 함께 학교에 가요.",
    "내일 학교에 갈 거예요."
  ],
  practice: generatePracticeQuestions(word, grammar)
})
```

---

## 📱 사용자 경험 시나리오

### **학습자 여정**
1. **레벨 테스트** → 적절한 시작점 결정
2. **커리큘럼 확인** → 전체 학습 계획 파악  
3. **단원별 학습** → 주제별 단어 + 문법 학습
4. **진도 추적** → 완료된 단원과 남은 단원 확인
5. **복습 시스템** → AI 기반 맞춤형 복습 제공

### **선생님 관리 기능**
- **커리큘럼 관리**: 단원별 단어 추가/수정
- **학습자 진도 모니터링**: 개별 학습 현황 확인
- **어려움 분석**: 많이 틀리는 단어/문법 파악
- **맞춤형 과제**: 학습자별 약점 보완 과제 생성

---

## 🔧 기술적 구현 사항

### **1. 데이터 동기화**
```typescript
// roadmap.csv → Supabase 자동 동기화
const syncCurriculumData = async () => {
  const csvData = await parseCurriculumCSV()
  const { data, error } = await supabase
    .from('curriculum')
    .upsert(csvData, { onConflict: 'id' })
  
  if (!error) {
    await generateTopicVocabulary(csvData)
  }
}
```

### **2. 검색 및 필터링**
```typescript
// 다양한 방식으로 단어 검색
const searchVocabulary = async (filters: {
  level?: string
  topic?: string
  difficulty?: number
  searchTerm?: string
}) => {
  let query = supabase
    .from('vocabulary')
    .select(`
      *,
      curriculum:curriculum_id (
        level,
        topic,
        unit_name
      )
    `)
  
  if (filters.level) query = query.eq('curriculum.level', filters.level)
  if (filters.topic) query = query.eq('topic', filters.topic)
  if (filters.searchTerm) {
    query = query.or(`korean.ilike.%${filters.searchTerm}%,meaning.ilike.%${filters.searchTerm}%`)
  }
  
  return query
}
```

### **3. 학습 진도 추적**
```typescript
// 사용자별 학습 진도 관리
interface UserProgress {
  userId: string
  curriculumId: string
  wordsLearned: number
  totalWords: number
  completedAt?: Date
  averageScore: number
  reviewSchedule: Date[]
}

const updateProgress = async (userId: string, wordId: number, isCorrect: boolean) => {
  // 학습 기록 업데이트
  // 진도율 계산
  // 복습 스케줄 조정
  // 다음 추천 단어/단원 결정
}
```

---

## 📈 예상 효과

### **학습자 관점**
1. **체계적 학습**: 교육과정 기반 단계별 진행
2. **명확한 목표**: 단원별 학습 목표와 진도 확인
3. **문맥적 학습**: 단어가 문법, 표현과 함께 학습
4. **개인화**: 개인 수준에 맞는 맞춤형 학습

### **선생님 관점**
1. **표준화된 커리큘럼**: 검증된 교육과정 활용
2. **학습자 모니터링**: 개별 진도와 약점 파악 용이
3. **효율적 관리**: 자동화된 진도 추적 및 분석
4. **질문 예측**: 단원별 자주 나오는 질문 패턴 파악

---

## 🎯 결론

**roadmap.csv는 단어 학습 앱과 완벽하게 연계 가능합니다.**

### **핵심 장점**
1. **검증된 커리큘럼**: 세종한국어 교육과정 기반
2. **체계적 레벨링**: 초급→중급 단계별 진행  
3. **주제별 학습**: 실생활 연관 주제 중심
4. **문법 연계**: 단어와 문법이 함께 학습

### **구현 우선순위**
1. **즉시**: CSV 데이터 파싱 및 데이터베이스 구축
2. **단기**: 기존 vocabulary 페이지를 커리큘럼 기반으로 개선
3. **중기**: 진도 추적 및 적응형 학습 시스템
4. **장기**: AI 기반 개인 맞춤형 학습 및 복습 시스템

이 연계를 통해 단순한 단어 암기에서 **체계적이고 문맥적인 한국어 학습 시스템**으로 발전할 수 있습니다.

---

*작성일: 2024-01-23*
*작성자: AI Assistant* 