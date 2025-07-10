'use client'

import { useState, useEffect } from 'react'
import { Session, User as SupabaseUser } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { BookMarked, ChevronRight, ArrowLeft, Layers, Library, BookOpen } from 'lucide-react'
import Image from 'next/image'
import sejongHakdangImage from '@/assets/sejong_hakdang.png';
import sejongPracticalImage from '@/assets/sejong_practical.png';
import sejongKoreanImage from '@/assets/sejong_korean.png';
import introductionImage from '@/assets/HG.png';

const MAIN_COURSES = [
  { name: "입문", image: introductionImage, isPending: false, isIntroduction: true, description: "한국어 학습의 첫걸음을 시작해보세요" },
  { name: "세종학당 한국어", image: sejongHakdangImage, isPending: false, isIntroduction: false },
  { name: "세종학당 실용 한국어", image: sejongPracticalImage, isPending: false, isIntroduction: false },
  { name: "세종한국어", image: sejongKoreanImage, isPending: false, isIntroduction: false }
];

export default function CoursesPage() {
  const supabase = createClient()
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null | undefined>(undefined); // undefined로 초기화하여 명시적으로 로딩 안된 상태 표시
  const [isLoading, setIsLoading] = useState(true); // 전체 페이지 로딩 상태
  const router = useRouter();
  const pathname = usePathname();

  const [units, setUnits] = useState<any[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false); // 실제 unit fetching 시에만 true
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [stages, setStages] = useState<string[]>([]);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  // 1. 사용자 인증 상태 확인 useEffect
  useEffect(() => {
    let mounted = true;
    console.log("[Auth Effect] Running");

    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (mounted) {
        console.log("[Auth Effect] getSession result:", currentSession);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      }
    }).catch(error => {
      if (mounted) {
        console.error("[Auth Effect] Error in getSession:", error);
        setUser(null); // 오류 발생 시 사용자 없음으로 처리
      }
    });

    // 인증 상태 변경 리스너
    const { data: authListenerObj } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (mounted) {
        console.log("[Auth Effect] onAuthStateChange event:", event, "session:", currentSession);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (event === 'SIGNED_OUT') {
          router.push('/auth');
        }
      }
    });

    return () => {
      mounted = false;
      authListenerObj?.subscription?.unsubscribe();
      console.log("[Auth Effect] Unsubscribed");
    };
  }, [router]);

  // 2. 모든 학습 단위(units)를 DB에서 가져오기 useEffect (user.id 의존)
  useEffect(() => {
    // user 상태가 undefined이면 (초기 auth 로딩 중) 아무것도 하지 않음.
    if (user === undefined) {
      console.log("[Data Effect] User state is undefined, waiting for auth.");
      // setIsLoading(true)는 이미 기본값이므로 호출 필요 없음
      return;
    }

    // 사용자 ID가 없으면 (로그인 안됨) 데이터 가져오지 않고 로딩 완료 처리
    if (!user?.id) {
      console.log("[Data Effect] No user ID. Clearing units. Page loading finished.");
      setUnits([]);
      setUnitsLoading(false);
      setIsLoading(false); // 데이터 가져올 필요 없으므로 페이지 로딩 완료
      return;
    }

    // 사용자 ID가 있으면 데이터 가져오기 시작
    console.log(`[Data Effect] User ID: ${user.id}. Fetching units...`);
    setUnitsLoading(true);
    if (!isLoading) setIsLoading(true); // 이전 상태가 로딩완료였고, 사용자가 로그인 등으로 변경되어 다시 fetch하면 로딩중으로 변경

    async function fetchAllUnitsForUser() {
      try {
        const response = await fetch('/api/koreantraining/units', { cache: 'no-store' });
        if (!response.ok) throw new Error(`Failed to fetch units: ${response.status}`);
        const data = await response.json();
        setUnits(data || []);
        console.log("[Data Effect] Units fetched successfully:", data.length);
      } catch (error) {
        console.error("[Data Effect] Error fetching units:", error);
        setUnits([]);
      } finally {
        setUnitsLoading(false);
        setIsLoading(false); // 데이터 가져오기 시도 후 페이지 로딩 최종 완료
        console.log("[Data Effect] Unit fetching finished. Page loading complete.");
      }
    }

    fetchAllUnitsForUser();

  }, [user?.id]); // user.id의 변경에만 의존

  // 3. 선택된 대표 과목이 변경되면, 해당 과목의 단계 목록 업데이트 useEffect
  useEffect(() => {
    if (user === undefined || isLoading) return; // 아직 사용자 정보 로딩중이거나 전체 페이지 로딩 중이면 실행하지 않음

    // DB에 저장된 모든 고유한 '과목' 값을 콘솔에 출력 (디버깅용, 필요시 유지 또는 제거)
    if (units && units.length > 0) { 
        const uniqueCoursesInDB = Array.from(new Set(units.map(unit => unit.과목)));
        console.log('[Debug] DB에 실제 저장된 과목명 목록:', uniqueCoursesInDB);
    }

    console.log('[Stage Effect] 대표 과목 변경됨:', selectedCourse, '전체 유닛 수:', units.length);

    if (selectedCourse && units.length > 0) {
      const courseUnits = units.filter(unit => unit.과목 && unit.과목.startsWith(selectedCourse));
      console.log(`[Stage Effect] "${selectedCourse}" 대표 과목으로 시작하는 유닛들로 필터링된 유닛들:`, courseUnits.length);

      // --- 추가된 디버깅 로그 시작 ---
      if (courseUnits.length > 0) {
        const stagesInFilteredCourseUnits = Array.from(new Set(courseUnits.map(unit => unit.단계).filter(Boolean)));
        console.log(`[Debug] "${selectedCourse}" 과목 내 실제 단계명들 (필터링된 유닛 기준):`, stagesInFilteredCourseUnits);
      }
      // --- 추가된 디버깅 로그 끝 ---

      let distinctStages = Array.from(new Set(courseUnits.map(unit => unit.단계).filter(Boolean)));
      const stageOrder = ["초급 1", "초급 2", "중급 1", "중급 2", "고급 1", "고급 2"];
      
      distinctStages.sort((a, b) => {
        const aStr = String(a).trim(); // DB값에 공백이 있을 수 있으므로 trim()
        const bStr = String(b).trim();

        let indexA = stageOrder.indexOf(aStr);
        let indexB = stageOrder.indexOf(bStr);

        // 둘 다 stageOrder에 있는 경우
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        // a만 stageOrder에 있는 경우
        if (indexA !== -1) {
          return -1; // a가 더 앞에 온다
        }
        // b만 stageOrder에 있는 경우
        if (indexB !== -1) {
          return 1;  // b가 더 앞에 온다
        }

        // 둘 다 stageOrder에 없는 경우, parseStage로 비교
        const parseStageFallback = (stageStr: string) => {
          const levelMap: { [key: string]: number } = { '초급': 1, '중급': 2, '고급': 3 };
          const match = stageStr.match(/(\D+)(\d+)/); // "문자들숫자" 패턴 (예: "초급1")
          if (match) {
            const textPart = match[1].trim();
            const numPart = parseInt(match[2]);
            const levelOrder = levelMap[textPart] || 99; // 모르는 레벨은 뒤로
            return { levelOrder, numPart, textPart };
          }
          // 매칭 안되면 그냥 문자열과 0으로 처리 (또는 다른 기본값)
          return { levelOrder: 99, numPart: 0, textPart: stageStr };
        };

        const stageAInfo = parseStageFallback(aStr);
        const stageBInfo = parseStageFallback(bStr);

        if (stageAInfo.levelOrder !== stageBInfo.levelOrder) {
          return stageAInfo.levelOrder - stageBInfo.levelOrder;
        }
        if (stageAInfo.numPart !== stageBInfo.numPart) {
          return stageAInfo.numPart - stageBInfo.numPart;
        }
        return stageAInfo.textPart.localeCompare(stageBInfo.textPart);
      });
      
      console.log('[Stage Effect] 정렬된 단계:', distinctStages);
      setStages(distinctStages);
    } else {
      setStages([]);
    }
    setSelectedStage(null);
  }, [selectedCourse, units, user, isLoading]); // user, isLoading 추가하여 데이터 로딩 완료 후 실행되도록 보장

  // 4. 로그인 상태에 따른 리다이렉션 useEffect
  useEffect(() => {
    // isLoading은 전체 페이지 로딩 (인증 및 초기 데이터)
    // user === null은 인증 후 사용자가 없음을 의미. undefined는 아직 모름.
    if (!isLoading && user === null && pathname !== '/auth') {
      console.log("[Redirect Effect] No user after loading, redirecting to /auth");
      router.push('/auth');
    }
  }, [user, pathname, isLoading, router]);

  // 최종 필터링된 단원 목록
  const filteredUnits = (selectedCourse && selectedStage)
    ? units.filter(unit => {
        const unitStage = unit.단계 ? String(unit.단계).trim() : null;
        const currentSelectedStage = selectedStage ? String(selectedStage).trim() : null;
        return unit.과목 && unit.과목.startsWith(selectedCourse) && 
               unitStage && currentSelectedStage && unitStage === currentSelectedStage;
      })
    : [];

  // 로딩 처리
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-korean-600 text-xl">로딩 중...</div>
      </div>
    );
  }

  // 과목 버튼 클릭 핸들러
  const handleCourseSelect = (courseName: string) => {
    const course = MAIN_COURSES.find(c => c.name === courseName);
    if (course && course.isPending) {
      return; // 예정 과목은 선택 불가
    }
    
    // 입문 과목인 경우 바로 페이지로 이동
    if (course && course.isIntroduction) {
      router.push('/learn/introduction');
      return;
    }
    
    if (selectedCourse === courseName) {
      setSelectedCourse(null);
    } else {
      setSelectedCourse(courseName);
    }
  };
  
  // 단계 버튼 클릭 핸들러
  const handleStageSelect = (stageName: string) => {
    setSelectedStage(stageName);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="text-center text-gray-500">
            <div role="status" className="flex justify-center items-center">
              <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-korean-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0492C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5424 39.6781 93.9676 39.0409Z" fill="currentFill"/>
              </svg>
              <span className="sr-only">Loading...</span>
            </div>
            <p className="mt-4">사용자 정보를 확인하는 중입니다...</p>
          </div>
        ) : user ? (
          <>
            {/* 뒤로가기 버튼 및 페이지 타이틀 */}
            <div className="flex items-center mb-10">
              <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors group">
                <ArrowLeft size={20} className="mr-2 transition-transform group-hover:-translate-x-1" />
                홈으로 돌아가기
              </Link>
            </div>

            {/* 과목 또는 단계 컨테이너 */}
            <div className="bg-white p-6 md:p-10 rounded-2xl shadow-lg">
              {!selectedCourse ? (
                // 1. 대표 과목 선택 (제목 제거됨)
                <div>
                  <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {MAIN_COURSES.map((course) => (
                        <div
                          key={course.name}
                          onClick={() => !course.isPending && handleCourseSelect(course.name)}
                          className={`
                            p-4 rounded-lg border-2 transition-all flex flex-col items-center justify-center text-center gap-4 group
                            ${course.isPending
                              ? 'bg-gray-100 cursor-not-allowed text-gray-400'
                              : 'bg-white hover:border-korean-400 hover:bg-korean-50 cursor-pointer transform hover:-translate-y-1'
                            }
                            ${selectedCourse === course.name ? 'border-korean-500 bg-korean-50' : 'border-gray-200'}
                          `}
                        >
                          <div className="w-full h-40 relative mb-2">
                            {course.image ? (
                              <Image
                                src={course.image}
                                alt={`${course.name} 표지`}
                                fill
                                style={{ objectFit: "contain" }}
                                className="rounded-md transition-transform group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-korean-100 to-korean-200 rounded-md">
                                <BookOpen size={48} className="text-korean-500" />
                              </div>
                            )}
                          </div>
                          <span className="font-semibold text-lg">{course.name}</span>
                          {course.description && (
                            <span className="text-sm text-gray-500 mt-1">{course.description}</span>
                          )}
                          {course.isPending && <span className="text-sm font-medium">[준비 중]</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                // 2. 단계 및 단원 선택
                <div>
                  {/* ... 기존 단계 및 단원 선택 로직 ... */}
                   {/* 단계 선택 */}
                   {selectedCourse && (
                      <div>
                        <button onClick={() => { setSelectedCourse(null); setSelectedStage(null); }} className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors group mb-8">
                            <ArrowLeft size={20} className="mr-2 transition-transform group-hover:-translate-x-1" />
                            과목 선택으로 돌아가기
                        </button>
                        
                        <div className="text-center mb-10">
                          <h1 className="text-3xl font-bold text-gray-800">{selectedCourse}</h1>
                          <p className="text-gray-500 mt-2">학습할 단계를 선택해주세요.</p>
                        </div>

                        {unitsLoading ? (
                          <div className="text-center text-gray-500">로딩 중...</div>
                        ) : stages.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {stages.map((stage) => (
                              <button
                                key={stage}
                                onClick={() => handleStageSelect(stage)}
                                className={`p-4 rounded-lg text-center font-semibold transition-colors ${
                                  selectedStage === stage
                                    ? 'bg-korean-500 text-white shadow-md'
                                    : 'bg-gray-100 hover:bg-korean-100 text-gray-700'
                                }`}
                              >
                                {stage}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-8">선택한 과목에 대한 학습 단계 정보가 없습니다.</div>
                        )}
                      </div>
                   )}

                  {/* 단원 목록 */}
                  {selectedStage && (
                    <div className="mt-10 pt-8 border-t border-gray-200">
                       <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">{selectedStage} 단원 목록</h2>
                       {filteredUnits.length > 0 ? (
                        <div className="space-y-3">
                          {filteredUnits
                            .sort((a, b) => a.id - b.id)
                            .map(unit => {
                              const topic = unit.주제 || `단원 ${unit.id}`;
                              const mainExpression = unit.제목;
                              return (
                                <Link key={unit.id} href={`/learn/${unit.id}`}>
                                  <div className="block p-4 rounded-lg bg-white border border-gray-200 hover:border-korean-400 hover:bg-korean-50 transition-all shadow-sm">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <p className="font-semibold text-gray-800">{topic}</p>
                                        {mainExpression && (
                                          <p className="text-sm text-gray-500 mt-1">주요 표현: {mainExpression}</p>
                                        )}
                                      </div>
                                      <ChevronRight className="text-gray-400" />
                                    </div>
                                  </div>
                                </Link>
                              );
                          })}
                        </div>
                       ) : (
                        <div className="text-center text-gray-500 py-8">이 단계에는 아직 학습할 단원이 없습니다.</div>
                       )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500">
            로그인이 필요합니다. 로그인 페이지로 이동합니다...
          </div>
        )}
      </main>
    </div>
  );
} 