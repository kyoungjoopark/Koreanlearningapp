'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, FileText, BookOpen, Eye } from 'lucide-react'

const PDF_FILES = [
  {
    id: 1,
    title: '한글 자음 모음표',
    description: '한국어 자음과 모음을 익힐 수 있는 기본 표입니다.',
    filename: 'Alphabet_table.pdf',
    type: '학습 자료'
  },
  {
    id: 2,
    title: '한글 연습장',
    description: '한글을 직접 써보며 연습할 수 있는 빈 연습지입니다.',
    filename: 'Alphabet_Blank.pdf',
    type: '연습지'
  }
]

export default function IntroductionPage() {
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null)

  const handleViewPdf = (filename: string) => {
    setSelectedPdf(filename)
  }

  const handleDownloadPdf = (filename: string, title: string) => {
    const link = document.createElement('a')
    link.href = `/pdfs/${filename}`
    link.download = `${title}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const closePdfViewer = () => {
    setSelectedPdf(null)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 뒤로가기 버튼 */}
        <div className="flex items-center mb-8">
          <Link href="/courses" className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors group">
            <ArrowLeft size={20} className="mr-2 transition-transform group-hover:-translate-x-1" />
            코스 선택으로 돌아가기
          </Link>
        </div>

        {/* 제목 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">한국어 입문</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            한국어 학습을 시작하기 위한 기본 자료들입니다. 
            한글의 자음과 모음을 익히고 직접 써보며 연습해보세요.
          </p>
        </div>

        {/* PDF 뷰어가 열려있을 때 */}
        {selectedPdf && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
              {/* PDF 뷰어 헤더 */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">
                  {PDF_FILES.find(pdf => pdf.filename === selectedPdf)?.title}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const file = PDF_FILES.find(pdf => pdf.filename === selectedPdf)
                      if (file) handleDownloadPdf(file.filename, file.title)
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-korean-500 text-white rounded-md hover:bg-korean-600 transition-colors"
                  >
                    <Download size={16} />
                    다운로드
                  </button>
                  <button
                    onClick={closePdfViewer}
                    className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                  >
                    닫기
                  </button>
                </div>
              </div>

              {/* PDF 뷰어 */}
              <div className="flex-1 p-4">
                <iframe
                  src={`/pdfs/${selectedPdf}`}
                  className="w-full h-full border rounded-md"
                  title="PDF Viewer"
                />
              </div>
            </div>
          </div>
        )}

        {/* PDF 파일 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {PDF_FILES.map((pdf) => (
            <div key={pdf.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {/* 카드 헤더 */}
              <div className="bg-gradient-to-r from-korean-500 to-korean-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText size={24} />
                    <div>
                      <h3 className="text-xl font-bold">{pdf.title}</h3>
                      <span className="text-korean-100 text-sm">{pdf.type}</span>
                    </div>
                  </div>
                  <BookOpen size={24} className="opacity-70" />
                </div>
              </div>

              {/* 카드 내용 */}
              <div className="p-6">
                <p className="text-gray-600 mb-6 leading-relaxed">{pdf.description}</p>
                
                {/* 버튼들 */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleViewPdf(pdf.filename)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-korean-500 text-white rounded-lg hover:bg-korean-600 transition-colors font-medium"
                  >
                    <Eye size={18} />
                    보기
                  </button>
                  <button
                    onClick={() => handleDownloadPdf(pdf.filename, pdf.title)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    <Download size={18} />
                    다운로드
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 추가 안내 */}
        <div className="mt-12 bg-korean-50 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-korean-800 mb-4">학습 가이드</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-korean-700 mb-2">1단계: 자음 모음표 학습</h3>
              <p className="text-gray-600 text-sm">
                한글 자음 모음표를 보며 기본적인 한글 구조를 익혀보세요.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-korean-700 mb-2">2단계: 직접 연습하기</h3>
              <p className="text-gray-600 text-sm">
                연습장을 인쇄하여 직접 한글을 써보며 연습해보세요.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 