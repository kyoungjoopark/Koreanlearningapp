'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getCurrentUser, updateUserProfile, getUserProfile } from '@/lib/auth'
import { User } from '@supabase/supabase-js'

export default function MyPage() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [quickQuestion, setQuickQuestion] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 편집 폼 상태
  const [editForm, setEditForm] = useState({
    fullname: '',
    nationality: '',
    nickname: '',
    level: 'beginner'
  })

  const [qaHistory, setQaHistory] = useState<any[]>([])

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentUser = await getCurrentUser()
        const profile = await getUserProfile()
        
        if (currentUser && profile) {
          setUser(currentUser)
          setUserProfile(profile)
          setEditForm({
            fullname: profile.fullname || '',
            nationality: profile.nationality || '',
            nickname: profile.nickname || '',
            level: profile.level || 'beginner'
          })

          // 사용자의 질문 목록 불러오기
          await loadQuestions(currentUser.email)
        }
      } catch (error) {
        console.error('사용자 데이터 로딩 오류:', error)
        setError('사용자 정보를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [])

  const loadQuestions = async (email: string | undefined) => {
    if (!email) return
    
    try {
      const response = await fetch(`/api/questions?studentEmail=${email}`)
      const data = await response.json()
      
      if (data.success) {
        setQaHistory(data.questions.map((q: any) => ({
          id: q.id,
          question: q.question,
          answer: q.answer,
          date: new Date(q.created_at).toLocaleDateString('ko-KR'),
          status: q.status === 'answered' ? '답변 완료' : '답변 대기중',
          answeredAt: q.answered_at ? new Date(q.answered_at).toLocaleDateString('ko-KR') : null
        })))
      }
    } catch (error) {
      console.error('질문 목록 로딩 오류:', error)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await updateUserProfile(editForm)
      
      // 업데이트된 프로필 다시 가져오기
      const updatedProfile = await getUserProfile()
      setUserProfile(updatedProfile)
      setIsEditing(false)
      setSuccess('프로필이 성공적으로 업데이트되었습니다!')
      
      // 성공 메시지 3초 후 제거
      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      setError(error.message || '프로필 업데이트 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setError('')
    setSuccess('')
    // 원래 값으로 되돌리기
    if (userProfile) {
      setEditForm({
        fullname: userProfile.fullname || '',
        nationality: userProfile.nationality || '',
        nickname: userProfile.nickname || '',
        level: userProfile.level || 'beginner'
      })
    }
  }

  const recentLogs = [
    { id: 1, type: '단어학습', topic: '일상회화', score: 85, date: '2024-01-20' },
    { id: 2, type: '문법연습', topic: '과거형', score: 92, date: '2024-01-19' },
    { id: 3, type: 'Q&A', topic: '존댓말 사용법', date: '2024-01-18' },
  ]

  const handleQuickQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickQuestion.trim()) return
    
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: quickQuestion,
          studentEmail: user?.email,
          studentName: userProfile?.fullname || userProfile?.nickname || '익명',
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert(`질문이 선생님께 전달되었습니다!\n\n"${quickQuestion}"\n\n📱 답변은 마이페이지의 'Q&A 기록'에서 확인하실 수 있습니다.\n🔔 선생님이 답변하시면 상태가 업데이트됩니다.`)
        setQuickQuestion('')
        
        // 질문 목록 새로고침
        await loadQuestions(user?.email)
      } else {
        throw new Error(data.error || '질문 전송에 실패했습니다.')
      }
    } catch (error: any) {
      console.error('Quick question error:', error)
      alert(`질문 전송 중 오류가 발생했습니다: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-korean-600 text-xl">로딩 중...</div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <main className="container mx-auto px-4 py-8">
        <Link href="/" className="text-korean-600 hover:text-korean-800 mb-6 inline-block">
          ← 홈으로 돌아가기
        </Link>
        
        <h1 className="text-3xl font-bold text-korean-800 mb-8">마이 페이지</h1>
        
        {/* 오류/성공 메시지 */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 사용자 정보 */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-korean-800">내 정보</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-secondary text-sm"
                >
                  ✏️ 수정
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelEdit}
                    className="text-sm px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    취소
                  </button>
                </div>
              )}
            </div>

            {!isEditing ? (
              // 보기 모드
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-korean-600">이름:</span>
                  <span className="font-medium">{userProfile?.fullname || '미설정'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-korean-600">닉네임:</span>
                  <span className="font-medium">{userProfile?.nickname || '미설정'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-korean-600">국적:</span>
                  <span className="font-medium">{userProfile?.nationality || '미설정'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-korean-600">이메일:</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-korean-600">현재 레벨:</span>
                  <span className="font-medium text-korean-700">{userProfile?.level || 'beginner'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-korean-600">가입일:</span>
                  <span className="font-medium">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : '미설정'}</span>
                </div>
              </div>
            ) : (
              // 편집 모드
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-korean-700 mb-1">
                    이름
                  </label>
                  <input
                    type="text"
                    value={editForm.fullname}
                    onChange={(e) => setEditForm({...editForm, fullname: e.target.value})}
                    className="input-field"
                    placeholder="전체 이름을 입력하세요"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-korean-700 mb-1">
                    닉네임
                  </label>
                  <input
                    type="text"
                    value={editForm.nickname}
                    onChange={(e) => setEditForm({...editForm, nickname: e.target.value})}
                    className="input-field"
                    placeholder="닉네임을 입력하세요"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-korean-700 mb-1">
                    국적
                  </label>
                  <input
                    type="text"
                    value={editForm.nationality}
                    onChange={(e) => setEditForm({...editForm, nationality: e.target.value})}
                    className="input-field"
                    placeholder="국적을 입력하세요"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-korean-700 mb-1">
                    한국어 레벨
                  </label>
                  <select
                    value={editForm.level}
                    onChange={(e) => setEditForm({...editForm, level: e.target.value})}
                    className="input-field"
                  >
                    <option value="beginner1">초급 1</option>
                    <option value="beginner2">초급 2</option>
                    <option value="intermediate1">중급 1</option>
                    <option value="intermediate2">중급 2</option>
                    <option value="advanced1">고급 1</option>
                    <option value="advanced2">고급 2</option>
                  </select>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary flex-1"
                  >
                    {saving ? '저장 중...' : '💾 저장'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* 학습 통계 */}
          <div className="card">
            <h2 className="text-xl font-semibold text-korean-800 mb-4">학습 통계</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-korean-600">총 학습 일수:</span>
                <span className="font-medium">15일</span>
              </div>
              <div className="flex justify-between">
                <span className="text-korean-600">완료한 연습:</span>
                <span className="font-medium">23개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-korean-600">학습한 단어:</span>
                <span className="font-medium">156개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-korean-600">평균 점수:</span>
                <span className="font-medium text-korean-700">87점</span>
              </div>
            </div>
          </div>

          {/* 선생님께 질문 */}
          <div className="card">
            <h2 className="text-xl font-semibold text-korean-800 mb-4">선생님께 질문</h2>
            <form onSubmit={handleQuickQuestion} className="space-y-4">
              <div>
                <textarea
                  value={quickQuestion}
                  onChange={(e) => setQuickQuestion(e.target.value)}
                  placeholder="한국어에 대해 궁금한 점을 빠르게 질문해보세요..."
                  className="input-field min-h-[100px] resize-none"
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <button 
                  type="submit" 
                  className="btn-primary flex-1"
                  disabled={!quickQuestion.trim()}
                >
                  빠른 질문
                </button>
                <Link href="/korean-qa" className="btn-secondary">
                  상세 Q&A
                </Link>
              </div>
            </form>
            
            {/* 질문 제안 */}
            <div className="mt-4 pt-4 border-t border-korean-200">
              <h3 className="text-sm font-medium text-korean-700 mb-2">💡 질문 예시:</h3>
              <div className="space-y-1 text-xs text-korean-600">
                <p>"~고 있다"와 "~고 있습니다"의 차이는?</p>
                <p>높임말은 언제 사용하나요?</p>
                <p>한국어 발음을 더 자연스럽게 하려면?</p>
              </div>
            </div>
          </div>

          {/* 최근 학습 로그 */}
          <div className="card">
            <h2 className="text-xl font-semibold text-korean-800 mb-4">최근 학습 로그</h2>
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="border-l-4 border-korean-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-korean-800">{log.type}</h3>
                      <p className="text-sm text-korean-600">{log.topic}</p>
                    </div>
                    <div className="text-right">
                      {log.score && (
                        <span className="text-sm font-medium text-korean-700">{log.score}점</span>
                      )}
                      <p className="text-xs text-korean-500">{log.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Q&A 기록 */}
          <div className="card">
            <h2 className="text-xl font-semibold text-korean-800 mb-4">Q&A 기록</h2>
            <div className="space-y-3">
              {qaHistory.length === 0 ? (
                <p className="text-korean-500 text-center py-4">아직 질문한 내용이 없습니다.</p>
              ) : (
                qaHistory.map((qa) => (
                  <div key={qa.id} className="border border-korean-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-sm font-medium text-korean-800">{qa.question}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ml-2 ${
                        qa.status === '답변 완료' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {qa.status}
                      </span>
                    </div>
                    
                    {qa.answer && (
                      <div className="mt-3 pt-3 border-t border-korean-100">
                        <h4 className="text-xs font-medium text-korean-600 mb-1">선생님 답변:</h4>
                        <p className="text-sm text-korean-700 bg-blue-50 p-3 rounded">{qa.answer}</p>
                        {qa.answeredAt && (
                          <p className="text-xs text-korean-500 mt-1">답변일: {qa.answeredAt}</p>
                        )}
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-korean-500">질문일: {qa.date}</p>
                      {qa.status === '답변 대기중' && (
                        <button
                          onClick={() => loadQuestions(user?.email)}
                          className="text-xs text-korean-600 hover:text-korean-800"
                        >
                          🔄 새로고침
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link href="/korean-qa" className="btn-secondary w-full mt-4">
              더 많은 질문하기
            </Link>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
} 