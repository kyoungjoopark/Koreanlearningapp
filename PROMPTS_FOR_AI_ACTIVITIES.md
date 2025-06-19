<!-- @formatter:off -->
# AI 기반 학습 활동 생성 프롬프트

이 문서는 한국어 학습 애플리케이션의 AI 기반 학습 활동 생성 기능에 사용되는 프롬프트와 관련 정보를 기술합니다.

## 1. 문장 생성 (sentence_creation)

사용자가 제공한 단어의 여러 의미를 활용하여, 각 의미에 맞는 예문을 생성합니다.

### 1.1. API 요청 정보

-   **Endpoint**: `POST /api/generate-activity`
-   **`activityType`**: `"sentence_creation"`

### 1.2. 입력 데이터 (Request Body 예시)

```json
{
  "wordData": {
    "word": "달다",
    "meanings": [
      {
        "partOfSpeech": "형용사",
        "level": "A1",
        "koreanDefinition": "꿀이나 설탕의 맛과 같다.",
        "exampleSentence": "이 사탕은 아주 달다."
      },
      {
        "partOfSpeech": "동사",
        "level": "A1",
        "koreanDefinition": "물건을 어떤 곳에 걸거나 매달다.",
        "exampleSentence": "벽에 그림을 달다."
      }
    ],
    "forbiddenWords": ["사과", "단추"]
  },
  "activityType": "sentence_creation"
}
```

### 1.3. OpenAI API 요청 프롬프트 (예시: `wordData.word` = "달다")

```text
한국어 동사/형용사 '달다'의 다음 의미들을 사용하여, 교과서 체 문체, 초급 레벨(A1~A2)에 맞는 새로운 예문과 영어 번역을 의미별로 **정확히 2개씩** 만들어주세요.

의미 정보:
의미 1 (형용사, A1): 꿀이나 설탕의 맛과 같다. (예: 이 사탕은 아주 달다.)
의미 2 (동사, A1): 물건을 어떤 곳에 걸거나 매달다. (예: 벽에 그림을 달다.)

추가 지침:
- 금지어: 사과, 단추
- 각 예문의 난이도(A1 또는 A2)를 명확히 표기해주세요.
- 각 예문에서 '달다'가 어떤 의미(예: '의미 1', '의미 2')로 사용되었는지 명시해주세요.

결과는 반드시 다음 JSON 스키마를 따라야 합니다:
{
  "activityType": "sentence_creation",
  "word": "달다",
  "generated_examples_meaning_1": [
    {
      "meaning_id_used": "의미 1",
      "korean_sentence": "string",
      "english_translation": "string",
      "difficulty_level": "string (A1 or A2)",
      "part_of_speech_used": "string (e.g., '형용사')"
    },
    {
      "meaning_id_used": "의미 1",
      "korean_sentence": "string",
      "english_translation": "string",
      "difficulty_level": "string (A1 or A2)",
      "part_of_speech_used": "string (e.g., '형용사')"
    }
  ],
  "generated_examples_meaning_2": [
    {
      "meaning_id_used": "의미 2",
      "korean_sentence": "string",
      "english_translation": "string",
      "difficulty_level": "string (A1 or A2)",
      "part_of_speech_used": "string (e.g., '동사')"
    },
    {
      "meaning_id_used": "의미 2",
      "korean_sentence": "string",
      "english_translation": "string",
      "difficulty_level": "string (A1 or A2)",
      "part_of_speech_used": "string (e.g., '동사')"
    }
  ]
  // 만약 의미가 3개 이상이라면 generated_examples_meaning_N 형식으로 추가될 수 있습니다.
}
출력 시에는 오직 JSON 스키마만, 설명 없이 내보내주세요.
```

### 1.4. 출력 데이터 (Response Body 예시)

```json
{
  "activityType": "sentence_creation",
  "word": "달다",
  "generated_examples_meaning_1": [
    {
      "meaning_id_used": "의미 1",
      "korean_sentence": "이 꿀은 정말 달아요.",
      "english_translation": "This honey is really sweet.",
      "difficulty_level": "A1",
      "part_of_speech_used": "형용사"
    },
    {
      "meaning_id_used": "의미 1",
      "korean_sentence": "우리 엄마가 만든 과자는 항상 달아요.",
      "english_translation": "The cookies made by our mom are always sweet.",
      "difficulty_level": "A1",
      "part_of_speech_used": "형용사"
    }
  ],
  "generated_examples_meaning_2": [
    {
      "meaning_id_used": "의미 2",
      "korean_sentence": "벽에 그림을 달았어요.",
      "english_translation": "I hung a picture on the wall.",
      "difficulty_level": "A1",
      "part_of_speech_used": "동사"
    },
    {
      "meaning_id_used": "의미 2",
      "korean_sentence": "어제 새 커튼을 창가에 달았어요.",
      "english_translation": "I hung new curtains by the window yesterday.",
      "difficulty_level": "A1",
      "part_of_speech_used": "동사"
    }
  ]
}
```

## 2. 빈칸 채우기 (fill_in_the_blank)

제공된 단어와 대상 문장들을 사용하여, 각 문장에서 해당 단어가 들어갈 자리를 빈칸으로 만드는 퀴즈를 생성합니다.

### 2.1. API 요청 정보

-   **Endpoint**: `POST /api/generate-activity`
-   **`activityType`**: `"fill_in_the_blank"`

### 2.2. 입력 데이터 (Request Body 예시)

```json
{
  "wordData": {
    "word": "달다",
    "meanings": [
      {
        "partOfSpeech": "형용사",
        "level": "A1",
        "koreanDefinition": "꿀이나 설탕의 맛과 같다.",
        "exampleSentence": "이 사탕은 아주 달다."
      },
      {
        "partOfSpeech": "동사",
        "level": "A1",
        "koreanDefinition": "물건을 어떤 곳에 걸거나 매달다.",
        "exampleSentence": "벽에 그림을 달다."
      }
    ]
  },
  "activityType": "fill_in_the_blank",
  "targetSentences": [
    {
      "meaning_id": "의미 1",
      "korean": "이 사탕은 아주 달다.",
      "english": "This candy is very sweet."
    },
    {
      "meaning_id": "의미 2",
      "korean": "벽에 그림을 달았다.",
      "english": "I hung a picture on the wall."
    }
  ]
}
```

### 2.3. OpenAI API 요청 프롬프트 (예시: `wordData.word` = "달다")

```text
당신은 한국어 학습 자료 생성 전문가입니다. 다음 지침에 따라 빈칸 채우기 퀴즈를 생성해주세요.

입력 데이터:
1. 단어 정보 (wordData):
   - 단어: 달다
   - 의미:
     - ID: 의미 1, 품사: 형용사, 레벨: A1, 정의: 꿀이나 설탕의 맛과 같다., 예시: 이 사탕은 아주 달다.
     - ID: 의미 2, 품사: 동사, 레벨: A1, 정의: 물건을 어떤 곳에 걸거나 매달다., 예시: 벽에 그림을 달다.
2. 대상 문장 목록 (targetSentences):
- 의미 ID: 의미 1, 한국어: "이 사탕은 아주 달다.", 영어 번역: "This candy is very sweet."
- 의미 ID: 의미 2, 한국어: "벽에 그림을 달았다.", 영어 번역: "I hung a picture on the wall."

요청 사항:
- 위에 제공된 '대상 문장 목록 (targetSentences)'의 각 문장에 대해 빈칸 채우기 퀴즈를 만드세요.
- 각 퀴즈는 '달다' 단어가 들어갈 자리를 빈칸으로 만듭니다.
- 각 퀴즈는 초급 레벨(A1~A2)에 적합해야 합니다.
- 각 퀴즈에는 정확한 답 1개와 그럴듯한 오답 2개 (총 3개 선택지)를 한국어 단어로 제공해야 합니다.
- 각 퀴즈의 난이도 (A1 또는 A2)와 어떤 의미 ID의 단어가 사용되었는지 명시해주세요.
- 빈칸에 들어갈 단어의 예상 품사를 명시해주세요.

출력 형식:
결과는 반드시 다음 JSON 스키마를 따라야 하며, 다른 텍스트 설명 없이 순수 JSON 객체만 반환해야 합니다.

출력 JSON 스키마:
{
  "activityType": "fill_in_the_blank",
  "word": "달다",
  "quizzes": [
    {
      "meaning_id_used": "string (예: 의미 1)",
      "difficulty_level": "string (A1 또는 A2)",
      "question": "string (예: 다음 빈칸에 들어갈 알맞은 단어를 고르세요: ...가 ____.)",
      "options": [
        {"option": "string (한국어 단어)", "isCorrect": true},
        {"option": "string (한국어 단어)", "isCorrect": false},
        {"option": "string (한국어 단어)", "isCorrect": false}
      ],
      "part_of_speech_expected": "string (예: 형용사)"
    }
    // targetSentences의 각 문장에 대해 하나의 quiz 객체가 생성됩니다.
  ]
}

출력 예시 (JSON):
{
  "activityType": "fill_in_the_blank",
  "word": "달다",
  "quizzes": [
    {
      "meaning_id_used": "의미 1",
      "difficulty_level": "A1",
      "question": "다음 빈칸에 들어갈 알맞은 단어를 고르세요: 우유가 ____.",
      "options": [
        {"option": "달아요", "isCorrect": true},
        {"option": "간다", "isCorrect": false},
        {"option": "자요", "isCorrect": false}
      ],
      "part_of_speech_expected": "형용사"
    },
    {
      "meaning_id_used": "의미 2",
      "difficulty_level": "A1",
      "question": "다음 빈칸에 들어갈 알맞은 단어를 고르세요: 그림을 벽에 ____.",
      "options": [
        {"option": "달았어요", "isCorrect": true},
        {"option": "먹었어요", "isCorrect": false},
        {"option": "읽었어요", "isCorrect": false}
      ],
      "part_of_speech_expected": "동사"
    }
  ]
}
출력 시에는 오직 JSON 스키마만, 설명 없이 내보내주세요.
```

### 2.4. 출력 데이터 (Response Body 예시)

```json
{
  "activityType": "fill_in_the_blank",
  "word": "달다",
  "quizzes": [
    {
      "meaning_id_used": "의미 1",
      "difficulty_level": "A1",
      "question": "다음 빈칸에 들어갈 알맞은 단어를 고르세요: 이 사탕은 아주 ____.",
      "options": [
        {
          "option": "달다",
          "isCorrect": true
        },
        {
          "option": "크다",
          "isCorrect": false
        },
        {
          "option": "맛있다",
          "isCorrect": false
        }
      ],
      "part_of_speech_expected": "형용사"
    },
    {
      "meaning_id_used": "의미 2",
      "difficulty_level": "A1",
      "question": "다음 빈칸에 들어갈 알맞은 단어를 고르세요: 벽에 그림을 ____.",
      "options": [
        {
          "option": "달다",
          "isCorrect": true
        },
        {
          "option": "보다",
          "isCorrect": false
        },
        {
          "option": "만나다",
          "isCorrect": false
        }
      ],
      "part_of_speech_expected": "동사"
    }
  ]
}
```
<!-- @formatter:on --> 