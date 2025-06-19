import { Suspense } from 'react'
import AuthForm from './AuthForm'

function Loading() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-lg text-gray-600">페이지를 불러오는 중...</div>
    </div>
  )
}

export default function AuthPageContainer() {
  return (
    <Suspense fallback={<Loading />}>
      <AuthForm />
    </Suspense>
  )
} 