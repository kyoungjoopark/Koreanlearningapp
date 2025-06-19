'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { isTeacher, getCurrentUser } from '../../lib/auth'
import { User } from '@supabase/supabase-js'
import { Users, Trash2, CheckCircle, XCircle, Filter, Edit } from 'lucide-react'

interface Question {
  id: number
  student_name: string
  student_email: string
  question: string
  category: string
  priority: 'urgent' | 'normal' | 'low'
  status: 'pending' | 'answered' | 'archived'
  created_at: string
  answered_at?: string;
  answer?: string
}

interface ManagedUser {
  id: string;
  nickname: string;
  fullname: string;
  nationality: string;
  status: 'active' | 'inactive';
  email: string;
  created_at: string;
  starting_level: string | null;
  current_level: string | null;
}

export default function TeacherDashboardClient() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [submittingAnswer, setSubmittingAnswer] = useState(false)
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [userActionLoading, setUserActionLoading] = useState<Record<string, boolean>>({})
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [editedLevels, setEditedLevels] = useState({ starting_level: '', current_level: '' });
  const [isSavingLevels, setIsSavingLevels] = useState(false);

  const userCounts = useMemo(() => {
    return {
      all: users.length,
      active: users.filter(u => u.status === 'active').length,
      inactive: users.filter(u => u.status === 'inactive').length,
    };
  }, [users]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser()
        setCurrentUser(user)
        
        if (user) {
          const authorized = isTeacher(user)
          setIsAuthorized(authorized)
          
          if (authorized) {
            await loadQuestions()
            await loadUsers()
          }
        } else {
          setIsAuthorized(false)
        }
      } catch (error) {
        console.error('인증 확인 오류:', error)
        setIsAuthorized(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await fetch('/api/users', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '사용자 목록을 불러오는데 실패했습니다.');
      }
      setUsers(data.users || []);
    } catch (error: any) {
      console.error('사용자 목록 로딩 오류:', error);
      alert(`사용자 목록을 불러오는데 실패했습니다. 원인: ${error.message}`);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleUserStatusChange = async (userId: string, currentStatus: 'active' | 'inactive') => {
    const action = currentStatus === 'active' ? 'deactivate' : 'reactivate';
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    setUsers(prevUsers => prevUsers.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ));
    setUserActionLoading(prev => ({ ...prev, [userId]: true }));

    try {
      const response = await fetch(`/api/users/${userId}/${action}`, {
        method: 'POST'
      });
      const data = await response.json();
      if (!response.ok) {
        setUsers(prevUsers => prevUsers.map(user => 
          user.id === userId ? { ...user, status: currentStatus } : user
        ));
        throw new Error(data.error || '작업에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('사용자 상태 변경 오류:', error);
      alert(`오류: ${error.message}`);
    } finally {
      setUserActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const openLevelModal = (user: ManagedUser) => {
    setSelectedUser(user);
    setEditedLevels({
      starting_level: user.starting_level || '',
      current_level: user.current_level || ''
    });
    setIsLevelModalOpen(true);
  };

  const handleSaveLevels = async () => {
    if (!selectedUser) return;
    setIsSavingLevels(true);
    try {
      const response = await fetch(`/api/users/${selectedUser.id}/level`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedLevels),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '레벨 저장에 실패했습니다.');
      }
      
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...editedLevels } : u));
      setIsLevelModalOpen(false);
      setSelectedUser(null);

    } catch (error: any) {
      alert(`오류: ${error.message}`);
    } finally {
      setIsSavingLevels(false);
    }
  };

  const loadQuestions = async () => {
    try {
      const response = await fetch('/api/questions?isTeacher=true')
      const data = await response.json()
      
      if (data.success) {
        setQuestions(data.questions)
      } else {
        console.error('질문 로딩 실패:', data.error)
      }
    } catch (error) {
      console.error('질문 로딩 오류:', error)
    }
  }

  const handleAnswerSubmit = async (questionId: number) => {
    if (!answerText.trim() || submittingAnswer) return

    setSubmittingAnswer(true)
    
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answer: answerText,
          teacherName: '박선생님'
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('답변이 성공적으로 저장되었습니다!')
        setSelectedQuestion(null)
        setAnswerText('')
        await loadQuestions() 
      } else {
        throw new Error(data.error || '답변 저장에 실패했습니다.')
      }
    } catch (error: any) {
      console.error('답변 저장 오류:', error)
      alert(`답변 저장 중 오류가 발생했습니다: ${error.message}`)
    } finally {
      setSubmittingAnswer(false)
    }
  }

  const levelOptions = [
    '입문', '초급 1', '초급 2', '중급 1', '중급 2', '고급 1', '고급 2'
  ];

  const filteredUsers = useMemo(() => {
    return users
      .filter(user => {
        if (statusFilter === 'all') return true;
        return user.status === statusFilter;
      })
      .filter(user => {
        if (levelFilter === 'all') return true;
        return user.current_level === levelFilter;
      });
  }, [users, statusFilter, levelFilter]);


  if (isLoading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-korean-600 mx-auto mb-4"></div>
        <p className="text-korean-600">인증 확인 중...</p>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="card max-w-md mx-auto text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">로그인이 필요합니다</h1>
        <p className="text-gray-600 mb-4">
          교사 대시보드에 접근하려면 먼저 로그인해주세요.
        </p>
        <Link href="/auth" className="btn-primary mr-2">
          로그인
        </Link>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="card max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">접근 권한이 없습니다</h1>
          <p className="text-gray-600 mb-4">
            선생님 계정({currentUser.email})으로만 접근할 수 있습니다.
          </p>
      </div>
    )
  }

  const pendingQuestions = questions.filter(q => q.status === 'pending')
  const answeredQuestions = questions.filter(q => q.status === 'answered')

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-korean-800 mb-2">선생님 대시보드</h1>
        <p className="text-korean-600">안녕하세요, 박선생님! 👩‍🏫</p>
      </div>

      {/* 오늘의 통계 */}
      <div className="card mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-korean-800">📊 오늘의 통계</h2>
          <button
            onClick={() => {
              loadQuestions();
              loadUsers();
            }}
            className="btn-secondary text-sm"
          >
            🔄 새로고침
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600">{pendingQuestions.length}</div>
            <div className="text-sm text-red-600">새 질문</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">{answeredQuestions.length}</div>
            <div className="text-sm text-green-600">답변 완료</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{questions.length}</div>
            <div className="text-sm text-blue-600">총 질문 수</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">{new Set(questions.map(q => q.student_email)).size}</div>
            <div className="text-sm text-purple-600">질문한 학생 수</div>
          </div>
        </div>
      </div>

      {/* 사용자 관리 섹션 */}
      <div className="card mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h2 className="text-xl font-semibold text-korean-800 flex items-center">
            <Users className="mr-3" /> 사용자 관리 ({filteredUsers.length}명)
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center rounded-lg border border-gray-300 p-1">
              {(['all', 'active', 'inactive'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    statusFilter === status
                      ? 'bg-korean-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {status === 'all' ? `전체 (${userCounts.all})` : status === 'active' ? `활성 (${userCounts.active})` : `비활성 (${userCounts.inactive})`}
                </button>
              ))}
            </div>
            <div className="relative">
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="input-field pl-9 pr-8 py-2 text-sm"
              >
                <option value="all">모든 단계</option>
                {levelOptions.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {usersLoading ? (
          <div className="text-center py-8">사용자 목록을 불러오는 중...</div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="w-40 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">닉네임/이름</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                  <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가입일</th>
                  <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시작/현재 단계</th>
                  <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {user.status === 'active' ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">활성</span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">비활성</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{user.nickname || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{user.fullname || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 truncate">
                      <div>{user.starting_level || '미설정'}</div>
                      <div className="text-xs font-bold">{user.current_level || '미설정'}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUserStatusChange(user.id, user.status)}
                          disabled={userActionLoading[user.id]}
                          className={`px-3 py-1 text-xs rounded-md flex items-center transition-colors
                            ${user.status === 'active' 
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : 'bg-green-500 text-white hover:bg-green-600'}
                            ${userActionLoading[user.id] ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                        >
                          {userActionLoading[user.id] ? (
                            '처리중...'
                          ) : user.status === 'active' ? (
                            <><XCircle size={14} className="mr-1" /> 비활성화</>
                          ) : (
                            <><CheckCircle size={14} className="mr-1" /> 활성화</>
                          )}
                        </button>
                        <button
                          onClick={() => openLevelModal(user)}
                          className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-md transition-colors"
                          aria-label="레벨 수정"
                        >
                          <Edit size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-500">
                      조건에 맞는 사용자가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isLevelModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">레벨 수정: {selectedUser.nickname || selectedUser.email}</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="starting_level" className="block text-sm font-medium text-gray-700 mb-1">시작 단계</label>
                <select
                  id="starting_level"
                  value={editedLevels.starting_level}
                  onChange={(e) => setEditedLevels({ ...editedLevels, starting_level: e.target.value })}
                  className="input-field"
                >
                  <option value="">단계를 선택하세요</option>
                  {levelOptions.map(level => <option key={`start-${level}`} value={level}>{level}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="current_level" className="block text-sm font-medium text-gray-700 mb-1">현재 단계</label>
                <select
                  id="current_level"
                  value={editedLevels.current_level}
                  onChange={(e) => setEditedLevels({ ...editedLevels, current_level: e.target.value })}
                  className="input-field"
                >
                  <option value="">단계를 선택하세요</option>
                  {levelOptions.map(level => <option key={`current-${level}`} value={level}>{level}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setIsLevelModalOpen(false)} className="btn-secondary">
                취소
              </button>
              <button
                onClick={handleSaveLevels}
                className="btn-primary"
                disabled={isSavingLevels}
              >
                {isSavingLevels ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold text-korean-800 mb-4">
              🔔 답변 대기 질문 ({pendingQuestions.length}개)
            </h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {pendingQuestions.length === 0 ? (
                <p className="text-korean-500 text-center py-8">새로운 질문이 없습니다.</p>
              ) : (
                questions.filter(q=>q.status === 'pending').map((question) => (
                  <div
                    key={question.id}
                    className={`p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow ${
                      selectedQuestion?.id === question.id ? 'ring-2 ring-korean-500' : ''
                    }`}
                    onClick={() => setSelectedQuestion(question)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-korean-800">{question.student_name}</span>
                        <span className="text-xs text-korean-500">({question.student_email})</span>
                      </div>
                      <span className="text-xs text-korean-500">
                        {new Date(question.created_at).toLocaleDateString('ko-KR')} {new Date(question.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-korean-700 text-sm">{question.question}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          {selectedQuestion ? (
            <div className="card">
              <h3 className="text-lg font-semibold text-korean-800 mb-4">답변 작성</h3>
              <div className="mb-4">
                <p className="text-sm text-korean-600 mb-2">
                  <strong>{selectedQuestion.student_name}</strong>님의 질문:
                </p>
                <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedQuestion.question}</p>
                <p className="text-xs text-korean-500 mt-1">
                  질문 시간: {new Date(selectedQuestion.created_at).toLocaleString('ko-KR')}
                </p>
              </div>
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="답변을 작성해주세요..."
                className="input-field min-h-[150px] mb-4"
                rows={6}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleAnswerSubmit(selectedQuestion.id)}
                  className="btn-primary flex-1"
                  disabled={!answerText.trim() || submittingAnswer}
                >
                  {submittingAnswer ? '전송 중...' : '답변 전송'}
                </button>
                <button
                  onClick={() => setSelectedQuestion(null)}
                  className="btn-secondary"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div className="card text-center">
              <p className="text-korean-600">질문을 선택하면 답변을 작성할 수 있습니다.</p>
            </div>
          )}
        </div>
      </div>
       {answeredQuestions.length > 0 && (
          <div className="card mt-8">
            <h2 className="text-xl font-semibold text-korean-800 mb-4">
              ✅ 최근 답변 완료 질문 ({answeredQuestions.length}개)
            </h2>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {answeredQuestions.map((question) => (
                <div key={question.id} className="border border-green-200 rounded-lg p-3 bg-green-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-medium text-korean-800">{question.student_name}</span>
                      <span className="text-xs text-korean-500 ml-2">({question.student_email})</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-korean-500">질문: {new Date(question.created_at).toLocaleDateString('ko-KR')}</p>
                      {question.answered_at && (
                        <p className="text-xs text-green-600">답변: {new Date(question.answered_at).toLocaleDateString('ko-KR')}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-korean-700 mb-2">{question.question}</p>
                  <div className="pl-4 border-l-2 border-green-300">
                    <p className="text-sm text-green-700">{question.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
    </>
  )
} 