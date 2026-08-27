import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 1. Get a random user ID
async function setupWebhook() {
  const { data: users } = await supabase.auth.admin.listUsers();
  const userId = users.users[0]?.id;
  
  if (!userId) {
    console.error("No users found in database!");
    return;
  }
  
  console.log(`Setting up webhook for user: ${userId}`);

  // 2. Encrypt the secret, just like the backend does in developer.ts
  const ALGORITHM = "aes-256-gcm";
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex");

  function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  }

  const rawSecret = `whsec_test_${crypto.randomBytes(16).toString("hex")}`;
  const encryptedSecret = encrypt(rawSecret);
  
  console.log(`Generated Raw Secret: ${rawSecret}`);

  // 3. Insert Webhook
  const { data, error } = await supabase
    .from("webhooks")
    .insert({
      user_id: userId,
      url: "http://localhost:8085/webhook",
      secret: encryptedSecret,
      active: true
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to insert webhook:", error);
  } else {
    console.log("✅ Webhook inserted successfully!", data);
    console.log("Run the mock server with this secret to verify signatures:");
    console.log(`WEBHOOK_SECRET=${rawSecret} node scratch/mock_webhook_server.js`);
  }
}

setupWebhook();
