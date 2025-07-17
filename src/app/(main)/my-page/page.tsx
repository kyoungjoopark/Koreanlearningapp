'use client'

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { type User } from '@supabase/supabase-js';
import Link from 'next/link';
import { ArrowLeft, BookCheck, UserCircle, Mail, Calendar, Hash, Edit, MessageSquare, HelpCircle, Send } from 'lucide-react';

// 국적에 따른 기본 언어 설정 함수
const getDefaultLanguageByNationality = (nationality: string): string => {
  const langMap: Record<string, string> = {
    'USA': 'en',
    'Canada': 'en', 
    'UK': 'en',
    'Australia': 'en',
    'Japan': 'ja',
    'China': 'zh',
    'Spain': 'es',
    'Mexico': 'es',
    'Korea': 'ko'
  };
  return langMap[nationality] || 'ko'; // 기본값은 한국어
};

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

interface ExpressionProgress {
  contentType: 'idioms' | 'proverbs';
  level: string;
  currentIndex: number;
  totalItems: number;
  completedItems: number[];
  isLevelCompleted: boolean;
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

  // 관용구/속담 진행 상황 관련 상태 추가
  const [expressionProgress, setExpressionProgress] = useState<ExpressionProgress[]>([]);
  const [loadingExpressionProgress, setLoadingExpressionProgress] = useState(true);

  // TTS 공지사항 언어 선택 상태
  const [selectedTTSLang, setSelectedTTSLang] = useState<string>('ko');



  // 다국어 TTS 공지사항 내용
  const ttsNotices = {
    ko: {
      title: "음성 기능 안내",
      mobile: {
        title: "📱 모바일에서 음성 기능 최적화",
        content: "모바일에서 음성 기능을 원활하게 사용하려면 Chrome 브라우저를 사용해주세요.",
        items: [
          "• 추천 브라우저: Chrome (iOS, Android 모두 지원)",
          "• 한국어: 완벽 지원", 
          "• 영어: 원어민 발음으로 제공"
        ]
      },
      troubleshoot: {
        title: "⚠️ 음성 기능이 작동하지 않는 경우",
        ios: {
          title: "iOS (iPhone/iPad):",
          items: [
            "• 설정 → 접근성 → 음성 콘텐츠 → 음성 활성화",
            "• Safari 대신 Chrome 앱 사용 권장"
          ]
        },
        android: {
          title: "Android:",
          items: [
            "• 설정 → 접근성 → 텍스트 음성 변환 → Google TTS 설치",
            "• Chrome 브라우저 최신 버전 사용"
          ]
        },
        common: {
          title: "공통 확인사항:",
          items: [
            "• 시스템 볼륨 및 미디어 볼륨 확인",
            "• 브라우저 최신 버전으로 업데이트", 
            "• Wi-Fi 연결 상태 확인"
          ]
        }
      },
      tips: {
        title: "✨ 음성 기능 활용 팁",
        items: [
          "• 각 텍스트 옆의 🔊 버튼을 클릭하여 음성으로 들어보세요",
          "• 한국어와 영어가 섞인 텍스트도 자동으로 구분하여 재생됩니다",
          "• 재생 중 버튼을 다시 클릭하면 중지됩니다"
        ]
      }
    },
    en: {
      title: "Voice Guide",
      mobile: {
        title: "📱 Mobile TTS Optimization",
        content: "For optimal TTS experience on mobile devices, please use Chrome browser.",
        items: [
          "• Recommended Browser: Chrome (supports both iOS and Android)",
          "• Korean: Fully supported",
          "• English: Native pronunciation quality"
        ]
      },
      troubleshoot: {
        title: "⚠️ If TTS is not working",
        ios: {
          title: "iOS (iPhone/iPad):",
          items: [
            "• Settings → Accessibility → Spoken Content → Enable Speech",
            "• Recommend using Chrome app instead of Safari"
          ]
        },
        android: {
          title: "Android:",
          items: [
            "• Settings → Accessibility → Text-to-Speech → Install Google TTS",
            "• Use latest version of Chrome browser"
          ]
        },
        common: {
          title: "Common Checklist:",
          items: [
            "• Check system volume and media volume",
            "• Update browser to latest version",
            "• Check Wi-Fi connection status"
          ]
        }
      },
      tips: {
        title: "✨ TTS Usage Tips",
        items: [
          "• Click the 🔊 button next to any text to hear it spoken",
          "• Mixed Korean-English text is automatically detected and played with appropriate voices",
          "• Click the button again during playback to stop"
        ]
      }
    },
    ja: {
      title: "音声ガイド",
      mobile: {
        title: "📱 モバイルでの音声機能最適化",
        content: "モバイルデバイスで音声機能を最適に使用するには、Chromeブラウザをご利用ください。",
        items: [
          "• 推奨ブラウザ: Chrome（iOS、Android両方対応）",
          "• 韓国語: 完全サポート",
          "• 英語: ネイティブ発音品質"
        ]
      },
      troubleshoot: {
        title: "⚠️ 音声機能が動作しない場合",
        ios: {
          title: "iOS (iPhone/iPad):",
          items: [
            "• 設定 → アクセシビリティ → 読み上げコンテンツ → 音声を有効にする",
            "• SafariよりもChromeアプリの使用を推奨"
          ]
        },
        android: {
          title: "Android:",
          items: [
            "• 設定 → アクセシビリティ → テキスト読み上げ → Google TTSをインストール",
            "• Chromeブラウザの最新バージョンを使用"
          ]
        },
        common: {
          title: "共通確認事項:",
          items: [
            "• システム音量とメディア音量を確認",
            "• ブラウザを最新バージョンに更新",
            "• Wi-Fi接続状態を確認"
          ]
        }
      },
      tips: {
        title: "✨ 音声機能活用のヒント",
        items: [
          "• 各テキストの隣にある🔊ボタンをクリックして音声で聞くことができます",
          "• 韓国語と英語が混在するテキストも自動的に識別して再生されます",
          "• 再生中にボタンを再度クリックすると停止します"
        ]
      }
    },
    zh: {
      title: "语音指南",
      mobile: {
        title: "📱 移动设备语音功能优化",
        content: "为了在移动设备上获得最佳的语音功能体验，请使用Chrome浏览器。",
        items: [
          "• 推荐浏览器：Chrome（支持iOS和Android）",
          "• 韩语：完全支持",
          "• 英语：母语发音质量"
        ]
      },
      troubleshoot: {
        title: "⚠️ 如果语音功能无法正常工作",
        ios: {
          title: "iOS (iPhone/iPad):",
          items: [
            "• 设置 → 辅助功能 → 朗读内容 → 启用语音",
            "• 建议使用Chrome应用而不是Safari"
          ]
        },
        android: {
          title: "Android:",
          items: [
            "• 设置 → 辅助功能 → 文字转语音 → 安装Google TTS",
            "• 使用最新版本的Chrome浏览器"
          ]
        },
        common: {
          title: "常见检查项目:",
          items: [
            "• 检查系统音量和媒体音量",
            "• 将浏览器更新到最新版本",
            "• 检查Wi-Fi连接状态"
          ]
        }
      },
      tips: {
        title: "✨ 语音功能使用技巧",
        items: [
          "• 点击任何文本旁边的🔊按钮即可听到语音朗读",
          "• 韩语和英语混合的文本会自动识别并用相应的语音播放",
          "• 播放期间再次点击按钮可停止播放"
        ]
      }
    },
    es: {
      title: "Guía de Voz",
      mobile: {
        title: "📱 Optimización de TTS en Móvil",
        content: "Para una experiencia óptima de texto a voz en dispositivos móviles, utilice el navegador Chrome.",
        items: [
          "• Navegador Recomendado: Chrome (compatible con iOS y Android)",
          "• Coreano: Totalmente compatible",
          "• Inglés: Calidad de pronunciación nativa"
        ]
      },
      troubleshoot: {
        title: "⚠️ Si la función de voz no funciona",
        ios: {
          title: "iOS (iPhone/iPad):",
          items: [
            "• Configuración → Accesibilidad → Contenido Hablado → Activar Voz",
            "• Recomendamos usar la app Chrome en lugar de Safari"
          ]
        },
        android: {
          title: "Android:",
          items: [
            "• Configuración → Accesibilidad → Texto a Voz → Instalar Google TTS",
            "• Usar la última versión del navegador Chrome"
          ]
        },
        common: {
          title: "Lista de Verificación Común:",
          items: [
            "• Verificar volumen del sistema y volumen multimedia",
            "• Actualizar navegador a la última versión",
            "• Verificar estado de conexión Wi-Fi"
          ]
        }
      },
      tips: {
        title: "✨ Consejos de Uso de TTS",
        items: [
          "• Haga clic en el botón 🔊 junto a cualquier texto para escucharlo",
          "• El texto mixto coreano-inglés se detecta automáticamente y se reproduce con voces apropiadas",
          "• Haga clic en el botón nuevamente durante la reproducción para detener"
        ]
      }
    }
  };

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
          
          // 사용자 국적에 따라 TTS 공지사항 기본 언어 설정
          if (profileData.nationality) {
            const defaultTTSLang = getDefaultLanguageByNationality(profileData.nationality);
            setSelectedTTSLang(defaultTTSLang);
          }
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

    const fetchExpressionProgress = async () => {
      if (!user?.id) return;
      
      try {
        const progressData: ExpressionProgress[] = [];
        
        // 관용구 레벨들 (초급, 중급, 고급)
        const idiomLevels = ['초급', '중급', '고급'];
        // 속담 레벨들 (모든 한글 초성 포함)
        const proverbLevels = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
        
        // 관용구 진행 상황 가져오기
        for (const level of idiomLevels) {
          const response = await fetch(`/api/expression-progress?contentType=idioms&level=${level}`);
          if (response.ok) {
            const data = await response.json();
            progressData.push({
              contentType: 'idioms',
              level,
              ...data
            });
          }
        }
        
        // 속담 진행 상황 가져오기
        for (const level of proverbLevels) {
          const response = await fetch(`/api/expression-progress?contentType=proverbs&level=${level}`);
          if (response.ok) {
            const data = await response.json();
            progressData.push({
              contentType: 'proverbs',
              level,
              ...data
            });
          }
        }
        
        setExpressionProgress(progressData);
      } catch (error) {
        console.error("Error fetching expression progress:", error);
      } finally {
        setLoadingExpressionProgress(false);
      }
    };

    fetchUserData();
    fetchProgress();
    
    if (user?.id) {
      fetchExpressionProgress();
    }
  }, [user?.id]);

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

        <h1 className="text-3xl font-bold text-gray-800 mb-8">마이페이지</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 왼쪽 섹션 (2/3 너비) */}
          <div className="lg:col-span-2 space-y-8">
            {/* 내 정보 카드 */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">내 정보</h2>
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
                  <div className="col-span-2"><span className="font-semibold text-gray-500">이메일:</span><br/><span className="ml-0 text-sm break-all">{user.email}</span></div>
                  <div className="col-span-2 sm:col-span-1"><span className="font-semibold text-gray-500">가입일:</span><br className="sm:hidden"/><span className="ml-2 sm:ml-2">{new Date(user.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                </div>
              ) : <p>사용자 정보를 불러올 수 없습니다.</p>}
            </div>

            {/* TTS 음성 기능 다국어 공지사항 카드 */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl shadow-lg p-4 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-blue-800 mb-3 sm:mb-0">
                  🔊 {ttsNotices[selectedTTSLang as keyof typeof ttsNotices].title}
                </h2>
                
                {/* 언어 선택 탭 - 모바일 최적화 */}
                <div className="overflow-x-auto">
                  <div className="flex bg-white rounded-lg p-1 border border-blue-200 min-w-max">
                    {[
                      { code: 'ko', name: '한국어', flag: '🇰🇷' },
                      { code: 'en', name: 'English', flag: '🇺🇸' },
                      { code: 'ja', name: '日本語', flag: '🇯🇵' },
                      { code: 'zh', name: '中文', flag: '🇨🇳' },
                      { code: 'es', name: 'Español', flag: '🇪🇸' }
                    ].map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setSelectedTTSLang(lang.code)}
                        className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                          selectedTTSLang === lang.code
                            ? 'bg-blue-600 text-white'
                            : 'text-blue-600 hover:bg-blue-100'
                        }`}
                      >
                        <span className="mr-1">{lang.flag}</span>
                        <span className="hidden sm:inline">{lang.name}</span>
                        <span className="sm:hidden">{lang.code.toUpperCase()}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* 모바일 최적화 섹션 */}
                <div className="bg-white p-4 rounded-lg border border-blue-100">
                  <h3 className="font-semibold text-blue-700 mb-2">
                    {ttsNotices[selectedTTSLang as keyof typeof ttsNotices].mobile.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {ttsNotices[selectedTTSLang as keyof typeof ttsNotices].mobile.content}
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {ttsNotices[selectedTTSLang as keyof typeof ttsNotices].mobile.items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                
                {/* 문제 해결 섹션 */}
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-yellow-700 mb-2">
                    {ttsNotices[selectedTTSLang as keyof typeof ttsNotices].troubleshoot.title}
                  </h3>
                  <div className="text-sm text-gray-600 space-y-3">
                    <div>
                      <strong>{ttsNotices[selectedTTSLang as keyof typeof ttsNotices].troubleshoot.ios.title}</strong>
                      <ul className="ml-4 mt-1 space-y-1">
                        {ttsNotices[selectedTTSLang as keyof typeof ttsNotices].troubleshoot.ios.items.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <strong>{ttsNotices[selectedTTSLang as keyof typeof ttsNotices].troubleshoot.android.title}</strong>
                      <ul className="ml-4 mt-1 space-y-1">
                        {ttsNotices[selectedTTSLang as keyof typeof ttsNotices].troubleshoot.android.items.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <strong>{ttsNotices[selectedTTSLang as keyof typeof ttsNotices].troubleshoot.common.title}</strong>
                      <ul className="ml-4 mt-1 space-y-1">
                        {ttsNotices[selectedTTSLang as keyof typeof ttsNotices].troubleshoot.common.items.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 활용 팁 섹션 */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-700 mb-2">
                    {ttsNotices[selectedTTSLang as keyof typeof ttsNotices].tips.title}
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {ttsNotices[selectedTTSLang as keyof typeof ttsNotices].tips.items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 선생님께 질문 카드 */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">선생님께 질문</h2>
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
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-korean-600"/>
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
                                <span className="font-semibold text-blue-900">답변</span>
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
            {/* 관용구/속담 학습 진행 상황 카드 */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <BookCheck className="w-6 h-6 text-korean-600"/>
                관용구/속담 학습 진행 상황
              </h2>
              {loadingExpressionProgress ? (
                <p>진행 상황을 불러오는 중입니다...</p>
              ) : (
                <div className="space-y-4">
                  {/* 관용구와 속담을 가로로 나란히 배치 */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* 관용구 섹션 */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="text-base font-semibold text-blue-700 mb-3 text-center border-b border-blue-200 pb-2">관용구</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {expressionProgress
                          .filter(p => p.contentType === 'idioms')
                          .map((progress) => (
                            <div key={`idioms-${progress.level}`} className="bg-white p-2 rounded">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">{progress.level}</span>
                                <span className="text-xs text-gray-600">
                                  {progress.completedItems.length}/{progress.totalItems}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                  style={{ 
                                    width: `${progress.totalItems > 0 ? (progress.completedItems.length / progress.totalItems) * 100 : 0}%` 
                                  }}
                                ></div>
                              </div>
                              {progress.isLevelCompleted && (
                                <div className="text-center mt-1">
                                  <span className="text-xs text-green-600 font-bold">✓ 완료</span>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* 속담 섹션 */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <h3 className="text-base font-semibold text-green-700 mb-3 text-center border-b border-green-200 pb-2">속담</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {expressionProgress
                          .filter(p => p.contentType === 'proverbs')
                          .map((progress) => (
                            <div key={`proverbs-${progress.level}`} className="bg-white p-2 rounded">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">{progress.level}</span>
                                <span className="text-xs text-gray-600">
                                  {progress.completedItems.length}/{progress.totalItems}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                                  style={{ 
                                    width: `${progress.totalItems > 0 ? (progress.completedItems.length / progress.totalItems) * 100 : 0}%` 
                                  }}
                                ></div>
                              </div>
                              {progress.isLevelCompleted && (
                                <div className="text-center mt-1">
                                  <span className="text-xs text-green-600 font-bold">✓ 완료</span>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* 진행 상황이 없을 때 */}
                  {expressionProgress.length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-gray-500 mb-4">아직 학습을 시작하지 않았습니다.</p>
                      <div className="flex gap-2 justify-center">
                        <Link href="/learn/idioms" className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                          관용구 학습 시작
                        </Link>
                        <Link href="/learn/proverbs" className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                          속담 학습 시작
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 한국어 학습 진행 상황 카드 */}
            <div className="bg-white rounded-xl shadow-lg p-8 h-full">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <BookCheck className="w-6 h-6 text-korean-600"/>
                한국어 학습 진행 상황
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