import { openai } from '@ai-sdk/openai'
import { generateText, streamText } from 'ai'
import { createClient } from '@supabase/supabase-js'
import type { DicEntry, EmbeddingEntry } from '@/types/supabase'

// Supabase 관리자 클라이언트 생성
// 서비스 키를 사용하므로 서버 사이드에서만 사용해야 합니다.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// OpenAI API 키 확인
export const hasOpenAIKey = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here'

// AI 모델 설정 - OpenAI 전용 (키가 있을 때만)
export const aiModel = hasOpenAIKey ? openai('gpt-4-turbo') : null
export const aiModelFast = hasOpenAIKey ? openai('gpt-3.5-turbo') : null

// AI 모델 정보 가져오기
export function getAIModelInfo() {
  return {
    provider: 'openai' as const,
    mainModel: 'GPT-4 Turbo',
    fastModel: 'GPT-3.5 Turbo',
    description: 'OpenAI GPT - 강력하고 다양한 AI 모델'
  }
}

// 벡터 검색을 통한 사전 내용 검색
export async function searchDictionary(query: string, limit: number = 5): Promise<DicEntry[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('dic')
      .select('*')
      .textSearch('content', query)
      .limit(limit)

    if (error) {
      console.error('Dictionary search error:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Dictionary search error:', error)
    return []
  }
}

// 임베딩 검색 (더 정확한 의미 검색)
export async function searchEmbeddings(query: string, limit: number = 5): Promise<EmbeddingEntry[]> {
  try {
    // 실제 구현에서는 쿼리의 임베딩을 생성하고 유사도 검색을 수행해야 합니다
    // 여기서는 단순 텍스트 검색으로 대체
    const { data, error } = await supabaseAdmin
      .from('embeddings')
      .select('*')
      .textSearch('content', query)
      .limit(limit)

    if (error) {
      console.error('Embedding search error:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Embedding search error:', error)
    return []
  }
}

// 한국어 Q&A 챗봇 응답 생성
export async function generateKoreanQAResponse(
  question: string,
  previousMessages: { role: 'user' | 'assistant'; content: string }[] = []
) {
  try {
    // OpenAI API 키가 없으면 기본 응답 제공
    if (!hasOpenAIKey || !aiModel) {
      return `안녕하세요! 현재 AI 서비스 설정이 완료되지 않아 임시 응답을 제공하고 있습니다.

질문: "${question}"

죄송하지만 현재 OpenAI API 키가 설정되지 않아 AI 답변을 생성할 수 없습니다. 관리자에게 API 키 설정을 요청해주세요.

임시로 다음과 같은 기본 안내를 드립니다:
- 한국어 문법, 어휘, 발음 등에 대해 질문하실 수 있습니다
- 구체적인 예시와 함께 질문하시면 더 정확한 답변을 받으실 수 있습니다
- 궁금한 것이 있으시면 언제든 질문해주세요!`
    }

    // 관련 사전 내용 검색
    const dictionaryResults = await searchDictionary(question, 3)
    const embeddingResults = await searchEmbeddings(question, 3)

    // 컨텍스트 구성
    const context = [
      ...dictionaryResults.map(entry => entry.content),
      ...embeddingResults.map(entry => entry.content)
    ].join('\n\n')

    const systemPrompt = `당신은 한국어 학습을 도와주는 전문 튜터입니다. 
다음 사전 내용을 참고하여 정확하고 친절한 답변을 제공하세요.

참고 자료:
${context}

규칙:
- 항상 한국어로 답변하세요
- 명확하고 이해하기 쉽게 설명하세요
- 예시를 들어 설명하세요
- 학습자의 수준을 고려하여 답변하세요`

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...previousMessages,
      { role: 'user' as const, content: question }
    ]

    const result = await generateText({
      model: aiModel,
      messages,
      temperature: 0.3,
      maxTokens: 1000
    })

    return result.text
  } catch (error) {
    console.error('AI response generation error:', error)
    return '죄송합니다. 현재 답변을 생성할 수 없습니다. 잠시 후 다시 시도해 주세요.'
  }
}

// 스트리밍 응답 생성
export async function generateStreamingResponse(
  question: string,
  previousMessages: { role: 'user' | 'assistant'; content: string }[] = []
) {
  try {
    // OpenAI API 키가 없으면 기본 응답을 스트림으로 제공
    if (!hasOpenAIKey || !aiModel) {
      const fallbackResponse = `안녕하세요! 현재 AI 서비스 설정이 완료되지 않아 임시 응답을 제공하고 있습니다.

질문: "${question}"

죄송하지만 현재 OpenAI API 키가 설정되지 않아 AI 답변을 생성할 수 없습니다. 관리자에게 API 키 설정을 요청해주세요.

임시로 다음과 같은 기본 안내를 드립니다:
- 한국어 문법, 어휘, 발음 등에 대해 질문하실 수 있습니다
- 구체적인 예시와 함께 질문하시면 더 정확한 답변을 받으실 수 있습니다
- 궁금한 것이 있으시면 언제든 질문해주세요!`

      // ReadableStream을 생성하여 AI SDK와 호환되도록 함
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          // AI SDK 형식의 스트림 데이터로 전송
          const chunks = fallbackResponse.split(' ')
          let index = 0
          
          const sendChunk = () => {
            if (index < chunks.length) {
              const chunk = chunks[index] + (index < chunks.length - 1 ? ' ' : '')
              // AI SDK 형식: data: {"content":"텍스트"}\n\n
              const formattedChunk = `data: ${JSON.stringify({ content: chunk })}\n\n`
              controller.enqueue(encoder.encode(formattedChunk))
              index++
              setTimeout(sendChunk, 50) // 50ms 지연으로 타이핑 효과
            } else {
              // 스트림 종료
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              controller.close()
            }
          }
          
          sendChunk()
        }
      })

      return {
        toDataStreamResponse: () => {
          return new Response(stream, {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          })
        }
      }
    }

    // 관련 사전 내용 검색
    const dictionaryResults = await searchDictionary(question, 3)
    const embeddingResults = await searchEmbeddings(question, 3)

    // 컨텍스트 구성
    const context = [
      ...dictionaryResults.map(entry => entry.content),
      ...embeddingResults.map(entry => entry.content)
    ].join('\n\n')

    const systemPrompt = `당신은 한국어 학습을 도와주는 전문 튜터입니다. 
다음 사전 내용을 참고하여 정확하고 친절한 답변을 제공하세요.

참고 자료:
${context}

규칙:
- 항상 한국어로 답변하세요
- 명확하고 이해하기 쉽게 설명하세요
- 예시를 들어 설명하세요
- 학습자의 수준을 고려하여 답변하세요`

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...previousMessages,
      { role: 'user' as const, content: question }
    ]

    return streamText({
      model: aiModel,
      messages,
      temperature: 0.3,
      maxTokens: 1000
    })
  } catch (error) {
    console.error('Streaming response generation error:', error)
    throw error
  }
} 