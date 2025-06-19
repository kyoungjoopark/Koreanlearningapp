import { generateKoreanQAResponse, hasOpenAIKey } from '@/lib/ai'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  console.log('Chat API 호출됨')
  
  try {
    const body = await req.json()
    console.log('받은 요청:', body)
    
    const { question, previousMessages = [] } = body

    if (!question || typeof question !== 'string') {
      console.log('질문이 없음:', question)
      return Response.json({ error: '질문이 필요합니다.' }, { status: 400 })
    }

    console.log('OpenAI API 키 상태:', hasOpenAIKey)
    console.log('질문:', question)

    // OpenAI API 키가 없으면 기본 응답 제공
    if (!hasOpenAIKey) {
      const fallbackResponse = `안녕하세요! 현재 AI 서비스 설정이 완료되지 않아 임시 응답을 제공하고 있습니다.

질문: "${question}"

죄송하지만 현재 OpenAI API 키가 설정되지 않아 AI 답변을 생성할 수 없습니다. 관리자에게 API 키 설정을 요청해주세요.

임시로 다음과 같은 기본 안내를 드립니다:
- 한국어 문법, 어휘, 발음 등에 대해 질문하실 수 있습니다
- 구체적인 예시와 함께 질문하시면 더 정확한 답변을 받으실 수 있습니다
- 궁금한 것이 있으시면 언제든 질문해주세요!`

      return Response.json({
        choices: [{
          message: {
            role: 'assistant',
            content: fallbackResponse
          }
        }]
      })
    }

    // AI 응답 생성 (스트리밍이 아닌 일반 응답)
    const response = await generateKoreanQAResponse(question, previousMessages)
    console.log('AI 응답 생성됨:', response?.substring(0, 100) + '...')

    return Response.json({
      choices: [{
        message: {
          role: 'assistant',
          content: response
        }
      }]
    })
  } catch (error) {
    console.error('Chat API 상세 에러:', error)
    return Response.json({ 
      error: '답변 생성 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function GET() {
  return Response.json({ message: 'Chat API is running', hasOpenAIKey })
} 