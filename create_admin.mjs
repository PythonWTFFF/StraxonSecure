import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length) {
    env[key.trim()] = values.join('=').trim().replace(/^['"](.*)['"]$/, '$1');
  }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing URL or Key in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log("Creating admin user...");
  let userId;
  
  // 1. Create User
  const { data: authData, error: userError } = await supabase.auth.admin.createUser({
    email: 'admin@straxon.local',
    password: 'password123',
    email_confirm: true,
  });

  if (userError) {
    console.error("User creation error (might already exist):", userError.message);
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const found = existingUsers.users.find(u => u.email === 'admin@straxon.local');
    if (found) {
      userId = found.id;
      console.log("Found existing user id:", userId);
    } else {
      process.exit(1);
    }
  } else {
    userId = authData.user.id;
    console.log("Created new user id:", userId);
  }

  // 2. Ensure they are in profiles
  await supabase.from('profiles').upsert({ id: userId, display_name: 'Admin User' });

  // 3. Find or create a team
  let teamId;
  const { data: existingTeam } = await supabase.from('teams').select('*').limit(1).single();
  if (existingTeam) {
    teamId = existingTeam.id;
  } else {
    const { data: newTeam } = await supabase
      .from('teams')
      .insert({ name: 'System Admin Team', created_by: userId })
      .select()
      .single();
    teamId = newTeam.id;
  }
  console.log("Target Team ID:", teamId);

  // 4. Add or update as admin in team_members
  const { error: memberError } = await supabase
    .from('team_members')
    .upsert({ team_id: teamId, user_id: userId, role: 'admin' }, { onConflict: 'team_id,user_id' });

  if (memberError) {
    console.error("Failed to make admin:", memberError);
  } else {
    console.log("\nSuccess! Admin account created.");
    console.log("Email: admin@straxon.local");
    console.log("Password: password123");
  }
}

main();
