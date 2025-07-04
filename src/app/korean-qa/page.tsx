'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import TTSButton from '@/components/TTSButton'
import SpeechInput from '@/components/SpeechInput'
import { ArrowLeft, Download, Trash2 } from 'lucide-react'

interface RecentChat {
  id: number
  title: string
  date: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

function KoreanQAContent() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '안녕하세요! 한국어에 대한 궁금한 점이 있으시면 언제든 물어보세요. 문법, 단어, 발음, 문화 등 모든 질문을 환영합니다! 😊'
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState('gpt-4-turbo')

  // 메시지가 업데이트될 때마다 스크롤을 아래로
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // 대화 로그 저장 함수
  const saveConversationLog = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const logContent = messages
      .filter(m => m.id !== 'welcome') // 환영 메시지 제외
      .map(m => {
        const role = m.role === 'user' ? '사용자' : 'AI'
        const time = new Date().toLocaleString('ko-KR')
        return `[${time}] ${role}: ${m.content}\n`
      })
      .join('\n')

    if (logContent.trim()) {
      const blob = new Blob([`한국어 질문과 답변 대화 로그\n생성 시간: ${new Date().toLocaleString('ko-KR')}\n${'='.repeat(50)}\n\n${logContent}`], 
        { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `korean-qa-log-${timestamp}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else {
      alert('저장할 대화 내용이 없습니다.')
    }
  }

  // 대화 기록 초기화 함수
  const clearMessages = () => {
    if (confirm('대화 기록을 모두 삭제하시겠습니까?')) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: '안녕하세요! 한국어에 대한 궁금한 점이 있으시면 언제든 물어보세요. 문법, 단어, 발음, 문화 등 모든 질문을 환영합니다! 😊'
      }])
    }
  }

  // 최근 5개 대화 (예시 데이터 - 향후 실제 대화 히스토리로 대체)
  const recentChats: RecentChat[] = [
    { id: 1, title: '존댓말 사용법', date: '2024-01-20' },
    { id: 2, title: '과거형 문법', date: '2024-01-19' },
    { id: 3, title: '일상 인사말', date: '2024-01-18' },
    { id: 4, title: '음식 관련 어휘', date: '2024-01-17' },
    { id: 5, title: '시간 표현법', date: '2024-01-16' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const question = input.trim()
    setInput('')
    setIsLoading(true)

    console.log('질문 전송:', question)

    // 사용자 메시지 추가
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question
    }
    setMessages(prev => [...prev, userMessage])

    try {
      console.log('API 호출 시작')
      
      // API 호출
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          previousMessages: messages.slice(1).map(m => ({ role: m.role, content: m.content }))
        }),
      })

      console.log('API 응답 상태:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API 오류 응답:', errorData)
        throw new Error(`API 응답 오류: ${response.status} - ${errorData.error || response.statusText}`)
      }

      // 응답 처리
      const data = await response.json()
      console.log('API 응답 데이터:', data)
      
      const assistantContent = data.choices?.[0]?.message?.content || '응답을 받을 수 없습니다.'

      // AI 응답 메시지 추가
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent
      }
      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Chat 상세 에러:', error)
      // 에러 메시지 추가
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/" className="text-korean-600 hover:text-korean-800 mb-4 inline-block">
          ← 홈으로 돌아가기
        </Link>
        <h1 className="text-3xl font-bold text-korean-800 mb-2">한국어 질문과 답변</h1>
        <p className="text-korean-600">
          AI 선생님과 함께 한국어에 대한 궁금한 점을 해결해보세요! 문법, 어휘, 발음, 문화 등 무엇이든 물어보세요.
        </p>
      </div>

      {/* 모델 선택 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-korean-700 mb-2">
          AI 모델 선택:
        </label>
        <div className="flex items-center justify-between">
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="px-3 py-2 border border-korean-300 rounded-md focus:outline-none focus:ring-2 focus:ring-korean-500"
          >
            <option value="gpt-4-turbo">GPT-4 Turbo (더 정확한 답변)</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo (빠른 답변)</option>
          </select>
          
          {/* 대화 관리 버튼들 */}
          <div className="flex gap-2">
            <button
              onClick={saveConversationLog}
              disabled={messages.length <= 1}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
            >
              📄 로그 저장
            </button>
            <button
              onClick={clearMessages}
              disabled={messages.length <= 1}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
            >
              🗑️ 대화 삭제
            </button>
          </div>
        </div>
      </div>

      {/* 대화 기록 */}
      <div ref={scrollRef} className="bg-white rounded-lg shadow-lg mb-6 h-[65vh] overflow-y-auto p-4 border">
        {messages.length === 0 ? (
          <div className="text-center text-korean-500 mt-20">
            <div className="text-4xl mb-4">👋</div>
            <p className="text-lg">안녕하세요! 한국어에 대해 무엇이든 물어보세요.</p>
            <p className="text-sm mt-2">예: "안녕하세요와 안녕의 차이가 뭔가요?"</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-korean-600 text-white'
                      : 'bg-korean-100 text-korean-800'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.role === 'assistant' && message.content && (
                    <div className="flex justify-end mt-2">
                      <TTSButton 
                        text={message.content} 
                        size="sm" 
                        className="!bg-blue-600 hover:!bg-blue-700"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-korean-100 text-korean-800 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-korean-700 mr-2"></div>
                    <span>답변을 생각하고 있어요...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden p-2">
          <SpeechInput onTranscript={setInput} isSubmitting={isLoading} />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="여기에 질문을 입력하거나 마이크 버튼을 누르세요..."
            className="flex-grow px-4 py-2 bg-transparent focus:outline-none text-gray-800 disabled:bg-gray-100"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-korean-600 text-white px-6 py-2 rounded-lg hover:bg-korean-700 focus:outline-none focus:ring-2 focus:ring-korean-500 focus:ring-offset-2 disabled:bg-korean-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '전송 중...' : '전송'}
          </button>
        </div>
      </form>

      {/* 추천 질문들 */}
      {messages.length === 1 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-korean-800 mb-4">추천 질문</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              '"안녕하세요"와 "안녕"의 차이는 무엇인가요?',
              '한국어 높임말은 언제 사용하나요?',
              '"을/를"과 "이/가"의 차이점을 알려주세요',
              '한국어 발음을 연습하는 좋은 방법이 있나요?',
              '한국 문화에서 예의바른 인사법을 알려주세요',
              '"ㅂ니다"와 "어요/아요" 중 언제 뭘 써야 하나요?'
            ].map((question, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-korean-50 hover:bg-korean-100 rounded-lg transition-colors">
                <button
                  onClick={() => setInput(question)}
                  className="flex-1 text-left text-korean-700"
                >
                  {question}
                </button>
                <TTSButton text={question} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function KoreanQAPage() {
  return (
    <ProtectedRoute>
      <KoreanQAContent />
    </ProtectedRoute>
  )
}