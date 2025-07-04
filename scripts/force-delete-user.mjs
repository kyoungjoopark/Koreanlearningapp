import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local file in the root of korean-learning-app
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_AUTH_SUPABASE_URL;
const serviceKey = process.env.AUTH_SUPABASE_SERVICE_ROLE_KEY;
const userEmailToDelete = 'park106801@naver.com'; // <--- 삭제할 사용자의 이메일

if (!supabaseUrl || !serviceKey) {
  console.error('Error: Supabase URL or Service Role Key is not defined in the environment variables.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceKey);

async function forceDeleteUser(email) {
  console.log(`Attempting to find user with email: ${email}...`);

  // 1. 모든 사용자를 가져와 이메일로 사용자를 찾습니다.
  // listUsers는 UI에 보이지 않는 사용자를 포함할 수 있습니다.
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

  if (listError) {
    console.error('Error listing users:', listError.message);
    return;
  }
  
  const userToDelete = users.find(u => u.email === email);

  if (!userToDelete) {
    console.log(`User with email ${email} not found. Nothing to do.`);
    return;
  }

  console.log(`User found with ID: ${userToDelete.id}. Attempting to delete...`);

  // 2. ID를 사용하여 사용자를 강제로 삭제합니다.
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userToDelete.id);

  if (deleteError) {
    console.error(`Error deleting user with ID ${userToDelete.id}:`, deleteError.message);
  } else {
    console.log(`Successfully deleted user with email ${email} and ID ${userToDelete.id}.`);
  }
}

forceDeleteUser(userEmailToDelete); 