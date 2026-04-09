import { env } from "../config/env.js";

/**
 * Send student account creation email using Brevo REST API.
 * Uses the xkeysib- API key (NOT SMTP) — no nodemailer needed.
 */
export const sendStudentCredentials = async ({ name, email, password, studentId }) => {
  if (!env.brevoSmtpKey) {
    throw new Error("BREVO_SMTP_KEY is not set in .env");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": env.brevoSmtpKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: {
        name: "CyberSage",
        email: env.brevoUser
      },
      to: [{ email, name }],
      subject: "Your CyberSage Exam Account — Credentials Inside",
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #050d1a; color: #d4e8ff; margin: 0; padding: 0; }
            .wrapper { max-width: 560px; margin: 40px auto; background: #0a1426; border: 1px solid rgba(0,255,159,0.15); border-radius: 16px; overflow: hidden; }
            .header { background: #040d18; padding: 32px; text-align: center; border-bottom: 1px solid rgba(0,255,159,0.12); }
            .header h1 { color: #00ff9f; font-size: 1.6rem; margin: 12px 0 4px; letter-spacing: 0.04em; }
            .header p { color: #4d7090; font-size: 0.85rem; margin: 0; }
            .body { padding: 32px; }
            .greeting { font-size: 1rem; color: #d4e8ff; margin-bottom: 18px; }
            .creds-box { background: #040d18; border: 1px solid rgba(0,255,159,0.25); border-radius: 10px; padding: 20px 24px; margin: 20px 0; }
            .cred-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
            .cred-row:last-child { border: none; }
            .cred-label { font-size: 0.75rem; color: #4d7090; text-transform: uppercase; letter-spacing: 0.07em; }
            .cred-value { font-family: 'Courier New', monospace; font-size: 1rem; color: #00ff9f; font-weight: 700; letter-spacing: 0.06em; }
            .notice { background: rgba(255,191,36,0.08); border: 1px solid rgba(255,191,36,0.25); border-radius: 8px; padding: 14px 18px; margin-top: 20px; font-size: 0.85rem; color: #fde68a; line-height: 1.6; }
            .footer { padding: 20px 32px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); font-size: 0.78rem; color: #4d7090; }
            .btn { display: inline-block; background: rgba(0,255,159,0.16); color: #00ff9f; border: 1px solid rgba(0,255,159,0.4); padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 0.9rem; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="header">
              <h1>CyberSage</h1>
              <p>Intern Entry Exam Platform</p>
            </div>
            <div class="body">
              <p class="greeting">Hi <strong>${name}</strong>,</p>
              <p style="color:#4d7090; font-size:0.9rem; line-height:1.7;">
                Your account has been created for the <strong style="color:#d4e8ff;">CyberSage Intern Entry Exam</strong>.
                Use the credentials below to sign in and begin your assessment.
              </p>
              <div class="creds-box">
                <div class="cred-row">
                  <span class="cred-label">Student ID</span>
                  <span class="cred-value">${studentId}</span>
                </div>
                <div class="cred-row">
                  <span class="cred-label">Email</span>
                  <span class="cred-value">${email}</span>
                </div>
                <div class="cred-row">
                  <span class="cred-label">Password</span>
                  <span class="cred-value">${password}</span>
                </div>
              </div>
              <div class="notice">
                ⚠ <strong>Important rules before you start:</strong><br/>
                • The exam is <strong>30 minutes</strong> — once started, the timer cannot be paused.<br/>
                • Switching or minimising the browser tab will <strong>auto-submit</strong> your exam immediately.<br/>
                • You have <strong>one attempt only</strong> — there are no retakes.<br/>
                • Keep these credentials private.
              </div>
              <div style="text-align:center;">
                <a class="btn" href="${env.clientUrl}/login">Sign In to Exam →</a>
              </div>
            </div>
            <div class="footer">
              CyberSage · Intern Assessment Platform<br/>
              Do not reply to this email.
            </div>
          </div>
        </body>
        </html>
      `
    })
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      `Brevo API error ${response.status}: ${errorBody.message || JSON.stringify(errorBody)}`
    );
  }
};
