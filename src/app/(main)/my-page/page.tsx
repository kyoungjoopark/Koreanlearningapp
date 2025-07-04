'use client'

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { type User } from '@supabase/supabase-js';
import Link from 'next/link';
import { ArrowLeft, BookCheck, UserCircle, Mail, Calendar, Hash, Edit, MessageSquare, HelpCircle, Send } from 'lucide-react';

interface CompletedLesson {
  id: number;
  과목: string;
  단계: string;
  주제: string;
  제목: string;
  completed_at: string;
}

interface GroupedProgress {
  [course: string]: {
    [stage: string]: CompletedLesson[];
  };
}

interface Question {
  id: number;
  question: string;
  answer?: string;
  status: 'pending' | 'answered';
  created_at: string;
  answered_at?: string;
  teacher_name?: string;
}

export default function MyPage() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  const [progress, setProgress] = useState<CompletedLesson[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(true);

  const [question, setQuestion] = useState('');
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);

  // 질문/답변 관련 상태 추가
  const [myQuestions, setMyQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [loadingAllQuestions, setLoadingAllQuestions] = useState(true);

  // 프로필 수정을 위한 상태 추가
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState('');
  const [name, setName] = useState('');
  const [nationality, setNationality] = useState(''); // 국적 상태 추가
  const [level, setLevel] = useState(''); // 레벨 상태 추가

  useEffect(() => {
    const fetchUserData = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user);
        // 프로필 정보도 함께 가져오기
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*') // 모든 컬럼 선택
          .eq('id', data.user.id)
          .single();
        
        console.log('Profile data:', profileData);
        console.log('Profile error:', profileError);
        
        if (profileData) {
          setName(profileData.name || profileData.fullname || '');
          setNickname(profileData.nickname || '');
          setNationality(profileData.nationality || ''); 
          setLevel(profileData.level || profileData.starting_level || profileData.current_level || '');
        }
      }
      setLoadingUser(false);
    };

    const fetchProgress = async () => {
      try {
        const response = await fetch('/api/progress');
        if (response.ok) {
          const data = await response.json();
          setProgress(data);
        } else {
          console.error("Failed to fetch progress");
        }
      } catch (error) {
        console.error("Error fetching progress:", error);
      } finally {
        setLoadingProgress(false);
      }
    };

    fetchUserData();
    fetchProgress();
  }, []);

  // 사용자가 로드된 후 질문 목록 가져오기
  useEffect(() => {
    const fetchMyQuestions = async () => {
      if (!user?.email) return;
      
      try {
        const response = await fetch(`/api/questions?student_email=${user.email}`);
        if (response.ok) {
          const data = await response.json();
          setMyQuestions(data);
        } else {
          console.error("Failed to fetch questions");
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setLoadingQuestions(false);
      }
    };

    if (user?.email) {
      fetchMyQuestions();
    }
  }, [user?.email]);

  const groupedProgress = progress.reduce((acc, lesson) => {
    const course = lesson.과목 || '기타';
    const stage = lesson.단계 || '기타';

    if (!acc[course]) {
      acc[course] = {};
    }
    if (!acc[course][stage]) {
      acc[course][stage] = [];
    }
    acc[course][stage].push(lesson);
    return acc;
  }, {} as GroupedProgress);

  // --- 이벤트 핸들러 ---
  const handleQuestionSubmit = async () => {
    if (question.trim() === '') {
      alert('질문 내용을 입력해주세요.');
      return;
    }
    setIsSubmittingQuestion(true);
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim() })
      });
      if (response.ok) {
        alert('질문이 성공적으로 전송되었습니다.');
        setQuestion('');
        // 질문 목록 새로고침
        if (user?.email) {
          const questionsResponse = await fetch(`/api/questions?student_email=${user.email}`);
          if (questionsResponse.ok) {
            const questionsData = await questionsResponse.json();
            setMyQuestions(questionsData);
          }
        }
      } else {
        // 응답 본문이 있는지 확인 후 JSON 파싱 시도
        const text = await response.text();
        let errorData = { error: '알 수 없는 오류가 발생했습니다.' };
        try {
          if (text) {
            errorData = JSON.parse(text);
          } else {
            errorData.error = `서버에서 빈 응답을 받았습니다. (상태 코드: ${response.status})`;
          }
        } catch (e) {
          errorData.error = '서버 응답을 파싱하는 데 실패했습니다.';
          console.error('Failed to parse error response:', text);
        }
        alert(`질문 전송 중 오류가 발생했습니다: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Question submission error:", error);
      alert('질문 전송 중 네트워크 오류가 발생했습니다.');
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!name.trim() && !nickname.trim()) {
      alert('이름 또는 닉네임 중 하나는 입력해야 합니다.');
      return;
    }

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, nickname, nationality, level }),
      });

      if (response.ok) {
        alert('프로필이 성공적으로 업데이트되었습니다.');
        setIsEditing(false);
      } else {
        const errorData = await response.json();
        alert(`프로필 업데이트 실패: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Profile update fetch error:', error);
      alert('프로필 업데이트 중 오류가 발생했습니다.');
    }
  };

  const InfoCard = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | undefined }) => (
    <div className="flex items-center gap-4">
      <Icon className="w-6 h-6 text-korean-500" />
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-semibold text-gray-800">{value || '정보 없음'}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-korean-50">
      <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
        
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-lg text-gray-700 hover:text-korean-600 font-semibold transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            홈으로 돌아가기
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-gray-800 mb-8">마이 페이지</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 왼쪽 섹션 (2/3 너비) */}
          <div className="lg:col-span-2 space-y-8">
            {/* 내 정보 카드 */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">내 정보</h2>
                {isEditing ? (
                  <div className="flex gap-2">
                    <button onClick={() => setIsEditing(false)} className="text-sm text-gray-600 font-semibold hover:underline">
                      취소
                    </button>
                    <button onClick={handleProfileUpdate} className="flex items-center gap-2 text-sm px-4 py-1.5 bg-korean-600 text-white rounded-lg font-semibold hover:bg-korean-700">
                      저장
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-sm text-korean-600 font-semibold hover:underline">
                    <Edit size={16} /> 수정
                  </button>
                )}
              </div>
              {loadingUser ? <p>로딩 중...</p> : user ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                  {isEditing ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">이름</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full p-2 border rounded-md"/>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">닉네임</label>
                        <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} className="mt-1 w-full p-2 border rounded-md"/>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">국적</label>
                        <select value={nationality} onChange={(e) => setNationality(e.target.value)} className="mt-1 w-full p-2 border rounded-md bg-white">
                          <option value="">국적 선택</option>
                          <option value="Korea">Korea (한국)</option>
                          <option value="China">China (중국)</option>
                          <option value="Japan">Japan (일본)</option>
                          <option value="USA">USA (미국)</option>
                          <option value="Canada">Canada (캐나다)</option>
                          <option value="Australia">Australia (호주)</option>
                          <option value="UK">UK (영국)</option>
                          <option value="Germany">Germany (독일)</option>
                          <option value="France">France (프랑스)</option>
                          <option value="Spain">Spain (스페인)</option>
                          <option value="Italy">Italy (이탈리아)</option>
                          <option value="Russia">Russia (러시아)</option>
                          <option value="Brazil">Brazil (브라질)</option>
                          <option value="Mexico">Mexico (멕시코)</option>
                          <option value="India">India (인도)</option>
                          <option value="Thailand">Thailand (태국)</option>
                          <option value="Vietnam">Vietnam (베트남)</option>
                          <option value="Philippines">Philippines (필리핀)</option>
                          <option value="Indonesia">Indonesia (인도네시아)</option>
                          <option value="Malaysia">Malaysia (말레이시아)</option>
                          <option value="Singapore">Singapore (싱가포르)</option>
                          <option value="Other">Other (기타)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">시작 레벨</label>
                        <select value={level} onChange={(e) => setLevel(e.target.value)} className="mt-1 w-full p-2 border rounded-md bg-white">
                          <option value="">레벨 선택</option>
                          <option value="초급1">초급 1</option>
                          <option value="초급2">초급 2</option>
                          <option value="중급1">중급 1</option>
                          <option value="중급2">중급 2</option>
                          <option value="고급1">고급 1</option>
                          <option value="고급2">고급 2</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div><span className="font-semibold text-gray-500">이름:</span><span className="ml-2">{name || '정보 없음'}</span></div>
                      <div><span className="font-semibold text-gray-500">닉네임:</span><span className="ml-2">{nickname || '정보 없음'}</span></div>
                      <div><span className="font-semibold text-gray-500">국적:</span><span className="ml-2">{nationality || '정보 없음'}</span></div>
                      <div><span className="font-semibold text-gray-500">시작 레벨:</span><span className="ml-2">{level || '정보 없음'}</span></div>
                    </>
                  )}
                  {/* 이메일과 가입일은 수정 불가 항목으로 항상 표시 */}
                  <div><span className="font-semibold text-gray-500">이메일:</span><span className="ml-2">{user.email}</span></div>
                  <div><span className="font-semibold text-gray-500">가입일:</span><span className="ml-2">{new Date(user.created_at).toLocaleDateString()}</span></div>
                </div>
              ) : <p>사용자 정보를 불러올 수 없습니다.</p>}
            </div>

            {/* 선생님께 질문 카드 */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">선생님께 질문</h2>
              <p className="text-sm text-gray-600 mb-6">
                한국어에 대해 궁금한 점을 빠르게 질문해보세요. 관리자가 확인 후 답변해드립니다.
              </p>
              
              <div className="flex items-start gap-4">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="예: '-(으)ㄴ/는 반면에' 와 '는데'의 차이점은 무엇인가요?"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-korean-500 focus:border-korean-500 transition"
                  rows={3}
                />
                <button
                  onClick={handleQuestionSubmit}
                  disabled={isSubmittingQuestion}
                  className="px-4 py-2 h-full bg-korean-600 text-white font-semibold rounded-lg hover:bg-korean-700 disabled:bg-gray-400 transition-colors flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">질문 예시:</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setQuestion('"~고 있다"와 "~고 있습니다"의 차이?')} className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition">"~고 있다"와 "~고 있습니다"의 차이?</button>
                  <button onClick={() => setQuestion('높임말은 언제 사용하나요?')} className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition">높임말은 언제 사용하나요?</button>
                </div>
              </div>
            </div>

            {/* 내 질문과 답변 카드 */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <MessageSquare className="w-7 h-7 text-korean-600"/>
                내 질문과 답변
              </h2>
              
              {loadingQuestions ? (
                <p className="text-center py-8 text-gray-500">질문 목록을 불러오는 중...</p>
              ) : myQuestions.length > 0 ? (
                <div className="space-y-4">
                  {myQuestions.map((q) => (
                    <div key={q.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* 질문 헤더 */}
                      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <HelpCircle className="w-5 h-5 text-blue-600" />
                            <span className="font-semibold text-gray-900">질문</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              q.status === 'answered' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {q.status === 'answered' ? '답변 완료' : '답변 대기'}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(q.created_at).toLocaleDateString('ko-KR')} {new Date(q.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* 질문 내용 */}
                      <div className="px-6 py-4 bg-white">
                        <p className="text-gray-800 leading-relaxed">{q.question}</p>
                      </div>

                      {/* 답변 부분 */}
                      {q.status === 'answered' && q.answer ? (
                        <div className="bg-blue-50 border-t border-blue-200">
                          <div className="px-6 py-3 bg-blue-100 border-b border-blue-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <MessageSquare className="w-5 h-5 text-blue-600" />
                                <span className="font-semibold text-blue-900">
                                  {q.teacher_name || '선생님'}의 답변
                                </span>
                              </div>
                              {q.answered_at && (
                                <span className="text-sm text-blue-600">
                                  {new Date(q.answered_at).toLocaleDateString('ko-KR')} {new Date(q.answered_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="px-6 py-4">
                            <p className="text-gray-800 leading-relaxed">{q.answer}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 border-t border-yellow-200 px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="animate-pulse w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <p className="text-yellow-700 font-medium">답변을 준비 중입니다...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                  <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">아직 질문한 내용이 없습니다.</p>
                  <p className="text-gray-400 text-sm">위에서 궁금한 점을 질문해보세요!</p>
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽 섹션 (1/3 너비) */}
          <div className="lg:col-span-1 space-y-8">
            {/* 나의 학습 현황 카드 */}
            <div className="bg-white rounded-xl shadow-lg p-8 h-full">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <BookCheck className="w-7 h-7 text-korean-600"/>
                나의 학습 현황
              </h2>
              {loadingProgress ? (
                <p>학습 기록을 불러오는 중입니다...</p>
              ) : progress.length > 0 ? (
                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                  {Object.entries(groupedProgress).map(([course, stages]) => (
                    <div key={course}>
                      <h3 className="text-xl font-semibold text-gray-700 border-b-2 border-korean-200 pb-2 mb-3">{course}</h3>
                      <div className="space-y-4">
                        {Object.entries(stages).map(([stage, lessons]) => (
                          <div key={stage}>
                            <h4 className="text-lg font-medium text-gray-600 mb-2">{stage}</h4>
                            <ul className="space-y-1 pl-2">
                              {lessons.map(lesson => (
                                <li key={lesson.id} className="flex items-center gap-2">
                                  <Link href={`/learn/${lesson.id}`} className="text-sm text-gray-700 hover:text-korean-600 hover:underline">
                                    {lesson.주제 || lesson.제목}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">아직 완료한 학습 기록이 없습니다.</p>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
} 