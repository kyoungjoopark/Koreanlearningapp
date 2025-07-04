'use client'

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import TeacherDashboardClient from './TeacherDashboardClient';

export default function TeacherDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <Link href="/" className="flex items-center text-lg text-korean-600 hover:text-korean-700 font-semibold">
            <ArrowLeft className="w-5 h-5 mr-2" />
            홈으로 돌아가기
          </Link>
        </div>
        <TeacherDashboardClient />
            </div>
          </div>
  );
} 