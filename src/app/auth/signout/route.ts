import { createAuthClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const cookieStore = cookies()
  const supabase = createAuthClient(cookieStore)

  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    await supabase.auth.signOut()
    revalidatePath('/', 'layout') // Revalidate all paths to reflect logged-out state
  }

  // Redirect to the login page after signing out
  return NextResponse.redirect(new URL('/auth', req.url), {
    status: 302,
  })
} 