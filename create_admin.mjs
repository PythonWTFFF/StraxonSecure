import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "http://127.0.0.1:54321";
const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log("Creating admin account...");

  // Create user using Admin API (bypasses rate limits and email confirmation)
  const { data: user, error: userError } = await supabase.auth.admin.createUser({
    email: "admin@straxon.io",
    password: "AdminOverride123!",
    email_confirm: true,
    user_metadata: { name: "Super Admin" },
  });

  if (userError) {
    if (
      userError.message.includes("already been registered") ||
      userError.code === "email_exists"
    ) {
      console.log("User already exists, proceeding to role elevation.");
    } else {
      console.error("Failed to create user:", userError);
      process.exit(1);
    }
  }

  // Get user ID
  const {
    data: { users },
    error: getError,
  } = await supabase.auth.admin.listUsers();
  if (getError || !users) {
    console.error("Failed to get users:", getError);
    process.exit(1);
  }

  const adminUser = users.find((u) => u.email === "admin@straxon.io");
  if (!adminUser) {
    console.error("Could not find admin user after creation");
    process.exit(1);
  }

  // Elevate to admin role in profiles
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", adminUser.id);

  if (profileError) {
    console.error("Failed to elevate role:", profileError);
    process.exit(1);
  }

  console.log("Admin account created and elevated successfully!");
  console.log("Email: admin@straxon.io");
  console.log("Password: AdminOverride123!");
}

main();
