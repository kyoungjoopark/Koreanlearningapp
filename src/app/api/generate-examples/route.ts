import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }
    
    // Zod를 사용하여 AI가 생성할 객체의 스키마를 정의합니다.
    const examplesSchema = z.object({
      examples: z.array(
        z.object({
          korean_sentence: z.string().describe("Generated Korean example sentence."),
          english_translation: z.string().describe("English translation of the Korean sentence."),
        })
      ).describe("An array of 2 to 3 example sentences.")
    });

    const { object } = await generateObject({
      model: openai('gpt-4-turbo'),
      schema: examplesSchema,
      prompt: prompt,
    });

    return NextResponse.json(object);

  } catch (error: any) {
    console.error('AI examples generation error:', error);
    const errorMessage = error.name === 'RateLimitError'
      ? 'OpenAI API rate limit exceeded. Please check your plan and billing details.'
      : error.message || 'An unexpected error occurred while generating examples.';
      
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 