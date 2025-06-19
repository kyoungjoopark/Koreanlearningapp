import { createLearningClient } from '@/utils/supabase/server';
import Link from 'next/link';
import ProverbsClient from './ProverbsClient';

export const dynamic = 'force-dynamic';

export interface Proverb {
  id: number;
  proverb: string;
  meaning: string;
}

async function getProverbs() {
  const supabase = createLearningClient();
  const { data, error } = await supabase
    .from('proverbs')
    .select('*')
    .order('proverb', { ascending: true });

  if (error) {
    console.error('Error fetching proverbs:', error);
    return [];
  }
  return data || [];
}

export default async function ProverbsPage() {
  const proverbs = await getProverbs();

  return (
    <div className="container mx-auto px-4 py-8">
       <Link href="/expressions" className="text-korean-600 hover:text-korean-800 mb-10 inline-block">
        &larr; 종류 선택으로 돌아가기
      </Link>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-korean-800">속담 학습</h1>
        <p className="text-lg text-korean-600 mt-2">
          초성으로 필터링하며 한국의 속담을 배워보세요.
        </p>
      </div>
      <ProverbsClient proverbs={proverbs} />
    </div>
  );
} 