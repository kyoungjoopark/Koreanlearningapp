export interface DicEntry {
  id: number
  chunk_id: number
  content: string
  word_count: number
  char_count: number
  created_at: string
}

export interface EmbeddingEntry {
  id: number
  content: string
  embedding: string
  metadata: {
    pos?: string
    type: string
    word: string
    index: number
    source: string
  }
  created_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  initial_level: string
  current_level: string
  preferred_language: string
  created_at: string
  updated_at: string
}

export interface LearningLog {
  id: number
  user_id: string
  activity_type: string
  level: string
  topic: string
  content: string
  score?: number
  created_at: string
}

export interface QAHistory {
  id: number
  user_id: string
  question: string
  answer: string
  created_at: string
}

export interface PracticeHistory {
  id: number
  user_id: string
  practice_type: string
  level: string
  topic: string
  questions: any[]
  answers: any[]
  score: number
  created_at: string
}

export interface VocabularyProgress {
  id: number
  user_id: string
  level: string
  topic: string
  word: string
  mastery_level: number
  last_reviewed: string
  created_at: string
}

export type LearningLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced'
export type PracticeType = 'listening' | 'speaking' | 'conversation' | 'translation'
export type Language = 'ko' | 'en' | 'zh' | 'ja' | 'it' | 'de' | 'fi' 