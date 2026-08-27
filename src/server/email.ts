import { Resend } from "resend";
import { logAudit } from "@/server/security/audit";

// Initialize Resend safely - if the key is missing, we will just mock the emails
const resendKey = process.env.RESEND_API_KEY;
const resend = resendKey ? new Resend(resendKey) : null;
const SENDER_EMAIL = "onboarding@straxonsecure.com";

export async function sendWelcomeEmail(email: string, name: string = "User") {
  if (!resend) {
    console.log(`[MOCK EMAIL] Sending welcome email to ${email}`);
    return { success: true, mocked: true };
  }

  try {
    const data = await resend.emails.send({
      from: `StraxonSecure <${SENDER_EMAIL}>`,
      to: [email],
      subject: "Welcome to StraxonSecure Enterprise",
      html: `
        <div>
          <h1>Welcome to StraxonSecure, ${name}!</h1>
          <p>Your enterprise security platform is now ready. Log in to explore the External Attack Surface Management tools and start your first CTF challenge.</p>
          <p>Stay secure,<br/>The Straxon Team</p>
        </div>
      `,
    });
    
    logAudit(context as ServerContext, {
      action: "email_sent",
      serverFn: "sendWelcomeEmail",
      metadata: { type: "welcome", to: email, id: data.data?.id }
    });

    return { success: true, data };
  } catch (error) {
    console.error("[Email Error] Failed to send welcome email:", error);
    return { success: false, error };
  }
}

export async function sendSubscriptionReceipt(email: string, planName: string, amount: string) {
  if (!resend) {
    console.log(`[MOCK EMAIL] Sending receipt to ${email} for ${planName}`);
    return { success: true, mocked: true };
  }

  try {
    const data = await resend.emails.send({
      from: `Straxon Billing <${SENDER_EMAIL}>`,
      to: [email],
      subject: `Your Receipt for StraxonSecure ${planName}`,
      html: `
        <div>
          <h1>Subscription Confirmed</h1>
          <p>Thank you for upgrading to the <strong>${planName}</strong> plan!</p>
          <p>Amount paid: <strong>${amount}</strong></p>
          <p>Your upgraded features are now available in your dashboard.</p>
        </div>
      `,
    });
    
    return { success: true, data };
  } catch (error) {
    console.error("[Email Error] Failed to send receipt:", error);
    return { success: false, error };
  }
}
