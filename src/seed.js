import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import Scenario from "./models/Scenario.js";
import Progress from "./models/Progress.js";
import ExamSession from "./models/ExamSession.js";

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 1 — Phishing Detection (20 emails)
// Phishing at indices: 0,2,4,5,6,7,8,9,11,14  (10 phishing, 10 legit)
// ─────────────────────────────────────────────────────────────────────────────
const inboxAmbush = {
  title: "Inbox Ambush",
  slug: "inbox-ambush",
  description:
    "Twenty emails have landed in the company inbox. Classify each one as Phishing or Legitimate — a single misclassification will cost you the flag.",
  category: "phishing",
  type: "phishing",
  difficulty: "basic",
  points: 200,
  timeLimit: 600,
  hints: [
    { text: "Check the sender domain character by character — attackers use subtle typos like 'micr0soft' or 'paypa1'.", cost: 20 },
    { text: "Legitimate company emails always come from the official company domain (e.g. @insidebreach.io), never third-party lookalikes.", cost: 15 },
    { text: "Urgency, fear, and requests for credentials or gift cards are classic phishing signals.", cost: 10 }
  ],
  content: {
    emails: [
      // 0 — PHISHING
      {
        id: 0,
        subject: "URGENT: Your account will be suspended in 24 hours",
        sender: "security@micr0soft-support.com",
        body: "We detected unusual sign-in activity on your Microsoft account. Verify your identity immediately by clicking the link below or your account will be permanently locked within 24 hours. Do not share this email."
      },
      // 1 — LEGIT
      {
        id: 1,
        subject: "Weekly Standup Notes — 9 Apr",
        sender: "manager@insidebreach.io",
        body: "Hi team, attached are the notes from today's standup. Action items are highlighted. Next sync is Thursday at 10:00. Reach out if you have any blockers."
      },
      // 2 — PHISHING
      {
        id: 2,
        subject: "Invoice #4521 — Payment Failed, Immediate Action Required",
        sender: "billing@paypa1-secure.com",
        body: "Your last payment of £49.99 failed due to insufficient funds. Update your billing information within 12 hours to avoid service interruption and a £15 late fee. Click here: http://paypa1-secure.com/update"
      },
      // 3 — LEGIT
      {
        id: 3,
        subject: "Expense Report EXP-2041 Approved",
        sender: "finance@insidebreach.io",
        body: "Your expense report (ref: EXP-2041) for £230.00 has been reviewed and approved. Payment will be included in the next payroll cycle. Contact finance@insidebreach.io with any questions."
      },
      // 4 — PHISHING
      {
        id: 4,
        subject: "Action Required: Update Your Employee Benefits by Friday",
        sender: "hr@company-benefits-update.net",
        body: "All employees must re-confirm benefit selections by this Friday or they will be reset to the default plan. Log in with your company SSO at the link below and confirm your choices."
      },
      // 5 — PHISHING
      {
        id: 5,
        subject: "IT Helpdesk: Your Password Expires Tonight",
        sender: "helpdesk@it-insidebreach-support.biz",
        body: "Your network password expires at midnight. To avoid being locked out, reset it now using your current credentials via our portal: http://it-support-insidebreach.biz/reset. This is time-sensitive."
      },
      // 6 — PHISHING (CEO fraud / BEC)
      {
        id: 6,
        subject: "Quick Favour — Confidential",
        sender: "ceo@insidebreach-corp.co",
        body: "Hi, it's Sarah. I'm in back-to-back board meetings and can't access my account. I need you to purchase 4 × £100 Amazon gift cards and WhatsApp me the redemption codes urgently. I'll reimburse you end of day. Please keep this between us."
      },
      // 7 — PHISHING
      {
        id: 7,
        subject: "Your Apple ID has been locked",
        sender: "noreply@app1e-id-verify.com",
        body: "Your Apple ID was used to sign in from an unrecognised device in Ukraine. If this wasn't you, your account has been locked for security. Verify your identity at: http://app1e-id-verify.com/unlock"
      },
      // 8 — PHISHING
      {
        id: 8,
        subject: "LinkedIn: Someone viewed your profile 47 times today",
        sender: "security@1inkedin-verify.net",
        body: "Your LinkedIn account shows suspicious activity. Multiple unauthorised access attempts were detected. Confirm your identity now to secure your account before it is permanently restricted."
      },
      // 9 — PHISHING
      {
        id: 9,
        subject: "Sarah Porter shared 'Q4_Financials_FINAL.xlsx' with you",
        sender: "noreply@dropb0x-share.net",
        body: "Sarah Porter (sarah.porter@insidebreach.io) has shared a file with you. Click the button below to view the document. This link expires in 48 hours. You may need to sign in with your company credentials."
      },
      // 10 — LEGIT
      {
        id: 10,
        subject: "PR Review Requested: feat/auth-refresh-tokens",
        sender: "noreply@github.com",
        body: "James Porter requested your review on pull request #47: feat/auth-refresh-tokens in inside-breach/server. You can view, comment on, or approve this pull request on GitHub."
      },
      // 11 — PHISHING
      {
        id: 11,
        subject: "NatWest Alert: Suspicious Transaction Detected — Verify Now",
        sender: "fraud-alert@natwest-verify.co.uk",
        body: "A transaction of £893.00 to an overseas merchant was flagged on your account. If you did not authorise this, click here immediately to freeze your card and dispute the charge. Failure to act within 2 hours may result in permanent loss of funds."
      },
      // 12 — LEGIT
      {
        id: 12,
        subject: "Trello: New card added to 'Sprint 12 — In Progress'",
        sender: "taco@trello.com",
        body: "James Porter added 'Fix token refresh race condition' to the 'Sprint 12 — In Progress' list on the Inside Breach Dev board. You are a member of this board and will receive notifications for this card."
      },
      // 13 — LEGIT
      {
        id: 13,
        subject: "Your Zoom webinar recording is ready",
        sender: "no-reply@zoom.us",
        body: "The recording for 'Security Best Practices for Developers — April Edition' is now available in your Zoom account. It will be stored for 30 days. You can also share the recording link with attendees."
      },
      // 14 — PHISHING
      {
        id: 14,
        subject: "Amazon: Problem with your order #205-3847291-5748302",
        sender: "order-update@amaz0n-orders-support.com",
        body: "We were unable to process your recent Amazon order due to a billing address mismatch. To avoid cancellation, confirm your address and payment method within 24 hours. Click here to resolve: http://amaz0n-orders-support.com/verify"
      },
      // 15 — LEGIT
      {
        id: 15,
        subject: "All-Hands Meeting — Thu 11 Apr, 14:00 BST",
        sender: "calendar@insidebreach.io",
        body: "You are invited to the quarterly all-hands. Agenda: Q1 results, product roadmap, and open Q&A with leadership. Meeting link will be sent 30 minutes before the session. Please confirm your attendance."
      },
      // 16 — LEGIT
      {
        id: 16,
        subject: "New message from Dev Team in #general",
        sender: "notifications@slack.com",
        body: "James Porter posted in #general: 'Reminder — PR review deadline is EOD today. Three PRs still need a second approval before merge freeze.' Reply or view the conversation in Slack."
      },
      // 17 — LEGIT
      {
        id: 17,
        subject: "Updated Holiday Policy — Effective 1 May",
        sender: "hr@insidebreach.io",
        body: "Please review the updated holiday booking policy attached to this email. Key changes include: carry-over allowance increased to 5 days, and the booking window now opens 6 months in advance. Reach out to hr@insidebreach.io with questions."
      },
      // 18 — LEGIT
      {
        id: 18,
        subject: "DevNews Weekly: OWASP Top 10 2025 Draft, Node 22 LTS, and more",
        sender: "hello@devnews.io",
        body: "This week in DevNews: The OWASP Top 10 2025 draft is open for public comment — supply chain attacks join the list. Node.js 22 enters LTS. GitHub Copilot adds multi-file context. Unsubscribe at any time."
      },
      // 19 — LEGIT
      {
        id: 19,
        subject: "Reminder: 1:1 with Sarah — Tomorrow 10:00",
        sender: "calendar-noreply@google.com",
        body: "This is a reminder for your upcoming event: 1:1 with Sarah Porter, Wednesday 10 April at 10:00 BST. Location: Google Meet. You can view or edit this event in Google Calendar."
      }
    ]
  },
  answers: {
    phishingMap: [true, false, true, false, true, true, true, true, true, true, false, true, false, false, true, false, false, false, false, false]
  },
  flag: "FLAG{ph1sh_m4st3r_1nb0x_4mbu5h_l3v3l1}"
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 2 — Social Engineering (20 messages)
// Phishing at indices: 0,2,4,5,6,8,9,10,13,16  (10 social-eng, 10 legit)
// ─────────────────────────────────────────────────────────────────────────────
const pretextingCall = {
  title: "Pretexting Probe",
  slug: "pretexting-call",
  description:
    "Twenty messages arrived over email, Slack, and SMS. Some are social engineering attacks using manipulation, impersonation, or pretexting. Classify each one correctly.",
  category: "social-engineering",
  type: "phishing",
  difficulty: "basic",
  points: 200,
  timeLimit: 600,
  hints: [
    { text: "Legitimate IT staff never ask for your password over any channel — that's an unconditional rule.", cost: 20 },
    { text: "Social engineering attacks often impersonate authority figures (IT, CEO, HR, bank) and manufacture urgency.", cost: 15 },
    { text: "Verify unexpected requests through a separate trusted channel before acting.", cost: 10 }
  ],
  content: {
    emails: [
      // 0 — SOCIAL ENG
      {
        id: 0,
        subject: "[IT Helpdesk] Critical patch — credentials required",
        sender: "it-helpdesk@corp-insidebreach-support.net",
        body: "Hi, this is Mike from IT. We're deploying a critical security patch tonight. To complete the remote install on your machine I'll need your Windows login and current password. Please reply directly to this email. Deadline: 22:00 tonight."
      },
      // 1 — LEGIT
      {
        id: 1,
        subject: "Planned Maintenance — Sat 13 Apr 02:00–04:00 UTC",
        sender: "ops@insidebreach.io",
        body: "Reminder: scheduled maintenance this Saturday between 02:00 and 04:00 UTC. The main dashboard and API will be temporarily unavailable. No action required. Contact ops@insidebreach.io if you have dependencies on these systems."
      },
      // 2 — SOCIAL ENG (vishing follow-up email)
      {
        id: 2,
        subject: "Following up on our call — urgent account verification",
        sender: "support@insidebreach-accounts.co",
        body: "As discussed on our call, we need to verify your account before the system migration tonight. Please reply with your employee ID, date of birth, and the answer to your security question. This is required by 18:00 or your access will be suspended."
      },
      // 3 — LEGIT
      {
        id: 3,
        subject: "Your expense report has been approved",
        sender: "finance@insidebreach.io",
        body: "Your expense claim (ref: EXP-2088) for £180.50 was approved and will be paid in the next payroll cycle. No further action is needed."
      },
      // 4 — SOCIAL ENG (CEO fraud)
      {
        id: 4,
        subject: "Confidential — board request",
        sender: "ceo@insidebreach-leadership.co",
        body: "I'm in a confidential board discussion and need your help urgently. Please wire £4,200 to the account details below. This is time-sensitive and must not be discussed with anyone else until I authorise it. I'll explain everything tomorrow."
      },
      // 5 — SOCIAL ENG
      {
        id: 5,
        subject: "[Security Alert] Your VPN token is expiring — re-enrol now",
        sender: "vpn-admin@insidebreach-network.biz",
        body: "Your two-factor VPN token expires at midnight. Use the following temporary bypass code to re-enrol: BYPASS-7741. Enter this on the VPN login page along with your usual credentials to complete re-enrolment."
      },
      // 6 — SOCIAL ENG (Slack message)
      {
        id: 6,
        subject: "Slack DM from @it_admin_tom",
        sender: "it_admin_tom via Slack",
        body: "Hey! I'm locking down admin access after a breach last night. Can you quickly share your Slack SSO token from Settings > Advanced > Token? I need to rotate it manually. Takes 30 seconds — really urgent."
      },
      // 7 — LEGIT
      {
        id: 7,
        subject: "New Confluence page: Engineering Onboarding Guide Updated",
        sender: "confluence@insidebreach.io",
        body: "Alice Chen updated the Engineering Onboarding Guide in the Company Space. Changes include the new repo access request process and updated VPN setup instructions. View the page in Confluence."
      },
      // 8 — SOCIAL ENG
      {
        id: 8,
        subject: "HMRC: Outstanding tax return — legal action pending",
        sender: "noreply@hmrc-gov-uk.net",
        body: "Our records show you have an outstanding self-assessment tax return from 2022–23. Failure to respond within 48 hours will result in a court summons and £3,000 penalty. Call our automated line or click here to make payment and avoid prosecution."
      },
      // 9 — SOCIAL ENG
      {
        id: 9,
        subject: "You've been selected for a security training survey — gift card reward",
        sender: "surveys@corporate-training-hub.net",
        body: "You've been selected to complete a 5-minute cybersecurity awareness survey. As a thank-you, you'll receive a £50 Amazon gift card. Please provide your full name, work email, and employee ID to claim your reward after completion."
      },
      // 10 — SOCIAL ENG (reverse social engineering)
      {
        id: 10,
        subject: "RE: Your support ticket #8821 — we need remote access",
        sender: "support@insidebreach-helpdesk.net",
        body: "Thank you for raising ticket #8821. Our engineer will resolve the issue remotely. Please install our support tool from the link below and share the 6-digit access code displayed on screen. The session is fully encrypted and audited."
      },
      // 11 — LEGIT
      {
        id: 11,
        subject: "Sprint Review — Recording Available",
        sender: "scrum@insidebreach.io",
        body: "The Sprint 12 review recording has been uploaded to the shared drive. Highlights: auth module shipped, dashboard performance improved by 40%, two bugs deferred to Sprint 13. Retrospective notes are in Confluence."
      },
      // 12 — LEGIT
      {
        id: 12,
        subject: "Reminder: Fire Drill — 15 Apr 11:00",
        sender: "facilities@insidebreach.io",
        body: "Annual fire drill is scheduled for Monday 15 April at 11:00. Please evacuate promptly when the alarm sounds and proceed to the assembly point at the car park north entrance. No action needed in advance."
      },
      // 13 — SOCIAL ENG (SMS spoof)
      {
        id: 13,
        subject: "SMS from: InsideBreach-IT",
        sender: "SMS +447911123456",
        body: "InsideBreach IT: Your MFA device has been deregistered due to suspicious activity. Reply YES to re-register your current device, or call 0800-123-456 to speak to IT security. Do not log in until this is resolved."
      },
      // 14 — LEGIT
      {
        id: 14,
        subject: "New Hire Announcement — Welcome Priya Sharma",
        sender: "hr@insidebreach.io",
        body: "Please join us in welcoming Priya Sharma who joins the QA team as a Senior Test Engineer starting Monday 15 April. Priya comes from a background in fintech security testing. Feel free to reach out and say hello!"
      },
      // 15 — LEGIT
      {
        id: 15,
        subject: "GitHub Actions: Build passed on main",
        sender: "noreply@github.com",
        body: "✅ Build passed for commit a3f9d12 on branch main in inside-breach/server. All 42 tests passed. Deployment to staging was triggered automatically."
      },
      // 16 — SOCIAL ENG (watering hole)
      {
        id: 16,
        subject: "Industry report: 2025 Cyber Threat Landscape — free download",
        sender: "reports@cybersec-insights-hub.net",
        body: "Download the 2025 Cyber Threat Landscape report — used by 5,000+ security professionals. Enter your work email and LinkedIn profile to receive the full PDF instantly. No spam, unsubscribe anytime."
      },
      // 17 — LEGIT
      {
        id: 17,
        subject: "Quarterly performance review scheduled — 22 Apr",
        sender: "hr@insidebreach.io",
        body: "Your Q1 performance review has been scheduled for Monday 22 April at 14:00 with your line manager. Please complete the self-assessment form in the HR portal before the session. The form is due by 19 April."
      },
      // 18 — LEGIT
      {
        id: 18,
        subject: "New comment on your Jira ticket IB-341",
        sender: "jira@insidebreach.atlassian.net",
        body: "Alice Chen commented on IB-341 (Rate limiting on auth endpoints): 'I've reproduced the issue in staging — the window resets on server restart. I'll pick this up in Sprint 13.' You can view the ticket in Jira."
      },
      // 19 — LEGIT
      {
        id: 19,
        subject: "Snyk: 1 new vulnerability found in inside-breach/server",
        sender: "alerts@snyk.io",
        body: "Snyk detected a new high-severity vulnerability in express-rate-limit@7.4.1 (CVE-2024-XXXX). A patch is available in version 7.5.0. View the full report and apply the fix in your Snyk dashboard."
      }
    ]
  },
  answers: {
    phishingMap: [true, false, true, false, true, true, true, false, true, true, true, false, false, true, false, false, true, false, false, false]
  },
  flag: "FLAG{s0c14l_3ng_pr3t3xt_busted_l3v3l2}"
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 3 — Code Review (20 MCQ across 4 code blocks)
// ─────────────────────────────────────────────────────────────────────────────
const brokenAuth = {
  title: "Security Audit",
  slug: "broken-auth",
  description:
    "You are auditing a Node.js web application codebase. Four code modules have been flagged for review. Analyse each one and answer the questions.",
  category: "code-review",
  type: "code-review",
  difficulty: "basic",
  points: 300,
  timeLimit: 900,
  hints: [
    { text: "For SQL vulnerabilities: look at how user input reaches the database query. Direct string concatenation is dangerous.", cost: 25 },
    { text: "For XSS: innerHTML directly assigns HTML — any user-supplied string becomes executable markup.", cost: 20 },
    { text: "MD5 and SHA-1 are NOT safe for password storage — they are too fast and have no salt by default.", cost: 20 },
    { text: "Path traversal: '../' sequences in filenames let attackers walk outside the intended directory.", cost: 15 }
  ],
  content: {
    codeBlocks: [
      {
        title: "Module A — user-auth.js (SQL Injection)",
        code: `async function loginUser(username, password) {
  const query =
    "SELECT * FROM users WHERE username = '" + username +
    "' AND password = '" + password + "'";
  const result = await db.query(query);
  return result.rows.length > 0
    ? { success: true, user: result.rows[0] }
    : { success: false };
}

async function getUserById(userId) {
  const query = \`SELECT * FROM users WHERE id = \${userId}\`;
  return await db.query(query);
}

async function searchUsers(searchTerm) {
  const query = "SELECT id, name FROM users WHERE name LIKE '%" + searchTerm + "%'";
  return await db.query(query);
}`
      },
      {
        title: "Module B — comments.js (XSS)",
        code: `function renderComment(comment) {
  const div = document.createElement('div');
  div.innerHTML = comment.text;   // user-supplied
  document.getElementById('comments').appendChild(div);
}

function displayUsername(username) {
  document.getElementById('welcome').innerHTML =
    'Welcome back, ' + username + '!';
}

function buildProfileCard(user) {
  return \`<div class="profile">
    <h2>\${user.displayName}</h2>
    <p>\${user.bio}</p>
  </div>\`;
}`
      },
      {
        title: "Module C — registration.js (Password Storage)",
        code: `const md5 = require('md5');
const sha1 = require('sha1');

async function registerUser(username, password) {
  const hashedPassword = md5(password);
  await db.query(
    'INSERT INTO users (username, password) VALUES ($1, $2)',
    [username, hashedPassword]
  );
}

async function verifyPassword(input, storedHash) {
  return md5(input) === storedHash;
}

async function resetPassword(userId, newPassword) {
  const hashed = sha1(newPassword);
  await db.query(
    'UPDATE users SET password = $1 WHERE id = $2',
    [hashed, userId]
  );
}`
      },
      {
        title: "Module D — files.js (Path Traversal + IDOR)",
        code: `const path = require('path');

// File download endpoint
app.get('/download', (req, res) => {
  const filename = req.query.file;
  const filepath = path.join(__dirname, 'uploads', filename);
  res.sendFile(filepath);
});

// Invoice endpoint — no authorisation check
app.get('/api/invoice/:id', async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  res.json(invoice);
});

// User profile — reads file from username
app.get('/profile-pic', async (req, res) => {
  const username = req.query.user;
  res.sendFile(\`/var/www/avatars/\${username}.png\`);
});`
      }
    ],
    questions: [
      // ── Module A (SQL Injection) — Q1–5 ─────────────────────────────────
      {
        id: 0, codeBlockIndex: 0,
        text: "What vulnerability class is present in the loginUser function?",
        options: ["Cross-Site Scripting (XSS)", "SQL Injection", "Command Injection", "CSRF"]
      },
      {
        id: 1, codeBlockIndex: 0,
        text: "Which username input would allow an attacker to log in without knowing any valid password?",
        options: ["admin@test.com", "' OR '1'='1' --", "<script>alert(1)</script>", "admin; TRUNCATE users; --"]
      },
      {
        id: 2, codeBlockIndex: 0,
        text: "getUserById is also vulnerable. What value in userId could return all rows from the users table?",
        options: ["0", "1 OR 1=1", "NULL", "-1"]
      },
      {
        id: 3, codeBlockIndex: 0,
        text: "What is the correct fix for all three functions in Module A?",
        options: [
          "Wrap each query in a try/catch block",
          "Use parameterised queries (prepared statements)",
          "Hash the input before appending it to the query",
          "Limit input to 50 characters"
        ]
      },
      {
        id: 4, codeBlockIndex: 0,
        text: "Which OWASP Top 10 2021 category does SQL Injection fall under?",
        options: ["A02 – Cryptographic Failures", "A03 – Injection", "A07 – Identification Failures", "A05 – Security Misconfiguration"]
      },
      // ── Module B (XSS) — Q6–10 ──────────────────────────────────────────
      {
        id: 5, codeBlockIndex: 1,
        text: "What vulnerability exists in the renderComment function?",
        options: ["SQL Injection", "CSRF", "Cross-Site Scripting (XSS)", "Path Traversal"]
      },
      {
        id: 6, codeBlockIndex: 1,
        text: "Which input for comment.text would execute an alert in the victim's browser?",
        options: [
          "'; DROP TABLE comments; --",
          "<script>alert('xss')</script>",
          "../../../etc/passwd",
          "1 UNION SELECT * FROM users"
        ]
      },
      {
        id: 7, codeBlockIndex: 1,
        text: "Which DOM property should replace innerHTML to safely display plain text?",
        options: ["innerText", "outerHTML", "textContent", "nodeValue"]
      },
      {
        id: 8, codeBlockIndex: 1,
        text: "The buildProfileCard function uses template literals. If user.bio comes from a database populated by users, what type of XSS is this?",
        options: ["Reflected XSS", "Stored XSS", "DOM-based XSS", "Blind XSS"]
      },
      {
        id: 9, codeBlockIndex: 1,
        text: "Which HTTP security header helps mitigate XSS by restricting which scripts can execute?",
        options: ["X-Frame-Options", "Strict-Transport-Security", "Content-Security-Policy", "X-Content-Type-Options"]
      },
      // ── Module C (Password Storage) — Q11–15 ────────────────────────────
      {
        id: 10, codeBlockIndex: 2,
        text: "What is wrong with using MD5 to hash passwords?",
        options: [
          "MD5 produces output that is too long to store in a database",
          "MD5 is designed for speed, making brute-force attacks trivial",
          "MD5 requires a private key that must be rotated regularly",
          "MD5 cannot handle Unicode passwords"
        ]
      },
      {
        id: 11, codeBlockIndex: 2,
        text: "A pre-computed table that maps hash values back to original passwords is called a:",
        options: ["Brute-force table", "Rainbow table", "Hash collision", "Salt dictionary"]
      },
      {
        id: 12, codeBlockIndex: 2,
        text: "The resetPassword function uses SHA-1. Why is this also insecure for password storage?",
        options: [
          "SHA-1 output is too short at 20 bytes",
          "SHA-1 is also a fast, unsalted hash — unsuitable for passwords",
          "SHA-1 requires a secret key and will throw an error without one",
          "SHA-1 is deprecated and no longer available in Node.js"
        ]
      },
      {
        id: 13, codeBlockIndex: 2,
        text: "Which algorithm is recommended for password hashing in 2024?",
        options: ["SHA-256", "AES-256", "bcrypt / scrypt / Argon2", "PBKDF2 with 100 iterations"]
      },
      {
        id: 14, codeBlockIndex: 2,
        text: "Even with bcrypt, what additional measure prevents two users with the same password from having the same hash?",
        options: ["A per-user random salt (automatically added by bcrypt)", "A global application secret key", "Encoding the hash in Base64", "Increasing the hash output length"]
      },
      // ── Module D (Path Traversal + IDOR) — Q16–20 ───────────────────────
      {
        id: 15, codeBlockIndex: 3,
        text: "What vulnerability exists in the /download endpoint?",
        options: ["SQL Injection", "CSRF", "Path Traversal (Directory Traversal)", "Insecure Deserialization"]
      },
      {
        id: 16, codeBlockIndex: 3,
        text: "Which value for the ?file= parameter could expose the server's /etc/passwd file?",
        options: [
          "etc/passwd",
          "../../../../etc/passwd",
          "/root/passwd",
          "C:\\Windows\\System32\\drivers\\etc\\passwd"
        ]
      },
      {
        id: 17, codeBlockIndex: 3,
        text: "What is the most effective fix for the path traversal vulnerability in /download?",
        options: [
          "Limit file size to 10 MB",
          "Only allow GET requests to this endpoint",
          "Validate that the resolved path starts with the expected uploads directory",
          "Require the user to be logged in"
        ]
      },
      {
        id: 18, codeBlockIndex: 3,
        text: "The /api/invoice/:id endpoint has a vulnerability. What is it?",
        options: [
          "The endpoint uses GET instead of POST",
          "The ID is not validated as a number",
          "There is no authorisation check — any authenticated user can access any invoice",
          "The response is not encrypted"
        ]
      },
      {
        id: 19, codeBlockIndex: 3,
        text: "The vulnerability in /api/invoice/:id is an example of which OWASP Top 10 2021 category?",
        options: [
          "A01 – Broken Access Control",
          "A02 – Cryptographic Failures",
          "A04 – Insecure Design",
          "A09 – Security Logging and Monitoring Failures"
        ]
      }
    ]
  },
  answers: {
    questionAnswers: [1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 2, 0, 2, 1, 2, 2, 0]
  },
  flag: "FLAG{c0d3_4ud1t_p4ss3d_s3cur1ty_4ud1t}"
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 4 — Log Analysis (20 MCQ, large log file, multiple incidents)
// ─────────────────────────────────────────────────────────────────────────────
const ghostLogs = {
  title: "Ghost in the Logs",
  slug: "ghost-in-the-logs",
  description:
    "The SOC team has flagged unusual activity across three server logs from the past hour. Analyse each log section and answer the 20 investigation questions.",
  category: "log-analysis",
  type: "log-analysis",
  difficulty: "basic",
  points: 250,
  timeLimit: 720,
  hints: [
    { text: "Repeated 401 responses from one IP in a short timespan = brute force. Look at frequency and timing.", cost: 20 },
    { text: "Port scanning shows up as rapid GET requests to many different endpoints from one IP, often returning 404.", cost: 20 },
    { text: "Data exfiltration often appears as unusually large response sizes (bytes column) on export or download endpoints.", cost: 15 },
    { text: "Privilege escalation: watch for a non-admin account suddenly accessing /api/admin or /api/users/all.", cost: 15 }
  ],
  content: {
    description: "Three log excerpts are shown below. Each covers a different incident window. Read all logs carefully, then answer the questions.",
    logs: [
      "─── LOG SECTION A: Authentication Server — 2024-11-01 08:00–08:20 ─────────",
      "08:00:12  192.168.1.10   GET  /dashboard                200  312B   0.11s",
      "08:00:44  10.0.0.55      POST /api/auth/login            401  98B    0.08s",
      "08:00:45  10.0.0.55      POST /api/auth/login            401  98B    0.07s",
      "08:00:46  10.0.0.55      POST /api/auth/login            401  98B    0.07s",
      "08:00:47  10.0.0.55      POST /api/auth/login            401  98B    0.08s",
      "08:00:48  10.0.0.55      POST /api/auth/login            401  98B    0.07s",
      "08:00:49  10.0.0.55      POST /api/auth/login            401  98B    0.09s",
      "08:00:50  10.0.0.55      POST /api/auth/login            401  98B    0.07s",
      "08:00:51  10.0.0.55      POST /api/auth/login            401  98B    0.08s",
      "08:00:52  10.0.0.55      POST /api/auth/login            200  512B   0.14s   [user: admin@insidebreach.io]",
      "08:01:03  192.168.1.10   GET  /settings                  200  1.2KB  0.11s",
      "08:01:15  203.0.113.42   GET  /robots.txt                200  240B   0.03s",
      "08:02:00  10.0.0.55      GET  /api/users/all             200  28KB   0.33s   [user: admin@insidebreach.io]",
      "08:02:44  10.0.0.55      POST /api/users/promote         200  210B   0.12s   [user: admin@insidebreach.io, promoted: attacker@evil.io → admin]",
      "─── LOG SECTION B: Web Server — 2024-11-01 09:00–09:05 ─────────────────",
      "09:00:01  45.33.32.156   GET  /                          200  4.1KB  0.09s",
      "09:00:02  45.33.32.156   GET  /admin                     404  512B   0.04s",
      "09:00:02  45.33.32.156   GET  /admin.php                 404  512B   0.04s",
      "09:00:02  45.33.32.156   GET  /wp-admin                  404  512B   0.04s",
      "09:00:03  45.33.32.156   GET  /phpmyadmin                404  512B   0.04s",
      "09:00:03  45.33.32.156   GET  /.env                      404  512B   0.04s",
      "09:00:03  45.33.32.156   GET  /config.php                404  512B   0.04s",
      "09:00:04  45.33.32.156   GET  /backup.zip                404  512B   0.04s",
      "09:00:04  45.33.32.156   GET  /server-status             404  512B   0.04s",
      "09:00:05  45.33.32.156   GET  /.git/config               200  843B   0.03s   [⚠ sensitive file exposed]",
      "09:00:05  192.168.1.22   POST /api/orders                201  1.1KB  0.18s",
      "─── LOG SECTION C: Data Server — 2024-11-01 10:00–10:15 ────────────────",
      "10:00:03  192.168.1.50   GET  /api/reports/summary       200  4.2KB  0.22s",
      "10:00:44  192.168.1.50   GET  /api/reports/details       200  8.1KB  0.31s",
      "10:01:12  192.168.1.50   POST /api/data/export           200  142KB  1.44s   [format: csv]",
      "10:01:58  192.168.1.50   POST /api/data/export           200  238KB  2.11s   [format: csv]",
      "10:02:44  192.168.1.50   POST /api/data/export           200  411KB  3.22s   [format: csv]",
      "10:03:30  192.168.1.50   POST /api/data/export           200  658KB  4.87s   [format: csv]",
      "10:04:15  192.168.1.50   POST /api/data/export           200  892KB  6.12s   [format: csv]",
      "10:05:00  192.168.1.50   POST /api/data/export           200  1.2MB  8.44s   [format: csv]",
      "10:10:00  192.168.1.22   GET  /api/orders                200  2.1KB  0.14s"
    ],
    questions: [
      // ── Section A (Brute Force) — Q1–7 ──────────────────────────────────
      {
        id: 0,
        text: "In Log Section A, which IP address is performing the brute-force attack?",
        options: ["192.168.1.10", "10.0.0.55", "203.0.113.42", "192.168.1.22"]
      },
      {
        id: 1,
        text: "How many failed login attempts did the attacker make before succeeding?",
        options: ["5", "6", "8", "10"]
      },
      {
        id: 2,
        text: "Approximately how long did it take the attacker to complete all login attempts (success included)?",
        options: ["Less than 5 seconds", "About 8 seconds", "About 30 seconds", "About 2 minutes"]
      },
      {
        id: 3,
        text: "Was the brute-force attack ultimately successful?",
        options: [
          "No — every attempt returned 401",
          "Yes — a 200 was returned after repeated attempts",
          "Partially — the account was locked after 5 attempts",
          "Unknown — logs are truncated"
        ]
      },
      {
        id: 4,
        text: "After gaining access, what did the attacker do at 08:02:44?",
        options: [
          "Exported the database as CSV",
          "Scanned for open admin endpoints",
          "Promoted their own account to admin",
          "Deleted all user records"
        ]
      },
      {
        id: 5,
        text: "What security control would have most directly prevented this brute-force attack?",
        options: [
          "HTTPS on the login endpoint",
          "Rate limiting or account lockout after N failed attempts",
          "Requiring passwords to be at least 12 characters",
          "Using JWT tokens instead of session cookies"
        ]
      },
      {
        id: 6,
        text: "The /api/users/promote endpoint was used by the attacker. What access control flaw does this reveal?",
        options: [
          "The endpoint was not rate-limited",
          "The endpoint should require HTTPS",
          "Any authenticated admin could promote any user with no additional approval",
          "The endpoint returned verbose error messages"
        ]
      },
      // ── Section B (Reconnaissance / Scanning) — Q8–13 ───────────────────
      {
        id: 7,
        text: "In Log Section B, what type of activity is IP 45.33.32.156 performing?",
        options: [
          "Brute-force login attack",
          "Automated reconnaissance / vulnerability scanning",
          "Data exfiltration via exports",
          "Distributed Denial of Service (DDoS)"
        ]
      },
      {
        id: 8,
        text: "How long did the scanning activity from 45.33.32.156 take?",
        options: ["About 1 second", "About 5 seconds", "About 30 seconds", "About 5 minutes"]
      },
      {
        id: 9,
        text: "Which sensitive file was successfully accessed by the scanner?",
        options: ["/.env", "/backup.zip", "/.git/config", "/config.php"]
      },
      {
        id: 10,
        text: "What information could an attacker extract from an exposed /.git/config file?",
        options: [
          "The server's TLS private key",
          "Remote repository URL, branch names, and potentially embedded credentials",
          "The database connection string only",
          "A list of all registered users"
        ]
      },
      {
        id: 11,
        text: "What is the most effective remediation for the exposed /.git/config?",
        options: [
          "Rename the file to .git-config",
          "Block requests to /.git/ at the web server / CDN level and never deploy .git directories to production",
          "Require authentication to access the file",
          "Encrypt the file contents"
        ]
      },
      {
        id: 12,
        text: "What log pattern is the strongest indicator that 45.33.32.156 is an automated scanner rather than a human?",
        options: [
          "It used a GET method",
          "Multiple different paths hit within 1–2 seconds, all returning 404",
          "It received a 200 response on /.git/config",
          "The IP is from an external network"
        ]
      },
      // ── Section C (Data Exfiltration) — Q14–20 ──────────────────────────
      {
        id: 13,
        text: "In Log Section C, which indicator most strongly suggests a data exfiltration attempt?",
        options: [
          "The user is accessing /api/reports which is an admin-only endpoint",
          "Six successive POST /api/data/export calls with rapidly increasing response sizes over 5 minutes",
          "The response time exceeds 1 second",
          "The IP 192.168.1.50 is on an internal subnet"
        ]
      },
      {
        id: 14,
        text: "Approximately how much data was exported in total across all six export calls?",
        options: ["Under 500 KB", "About 1 MB", "About 3.5 MB", "Over 10 MB"]
      },
      {
        id: 15,
        text: "The export response sizes grow with each request (142KB → 1.2MB). What does this pattern suggest?",
        options: [
          "The server is under increasing load",
          "The attacker is progressively downloading larger dataset slices",
          "CSV files are always larger than JSON equivalents",
          "The database is running a slow query"
        ]
      },
      {
        id: 16,
        text: "Which security control would have limited the impact of this exfiltration?",
        options: [
          "Switching from HTTP to HTTPS",
          "Requiring re-authentication for every export request",
          "Rate-limiting and size-capping export endpoints, and alerting on anomalous download volume",
          "Disabling the CSV export feature entirely"
        ]
      },
      {
        id: 17,
        text: "Across all three log sections, which IP appears in Section B AND made a normal POST in Section C?",
        options: ["45.33.32.156", "192.168.1.50", "192.168.1.22", "10.0.0.55"]
      },
      {
        id: 18,
        text: "Which of the three log sections shows the highest-severity incident?",
        options: [
          "Section A — brute-force followed by privilege escalation",
          "Section B — reconnaissance and exposed .git config",
          "Section C — data exfiltration",
          "All three are equally severe"
        ]
      },
      {
        id: 19,
        text: "If you could implement only one security improvement to address incidents across all three sections, which would have the broadest impact?",
        options: [
          "Enforce HTTPS site-wide",
          "Implement anomaly-based alerting on authentication failures, rapid endpoint scanning, and abnormal data volumes",
          "Add a CAPTCHA to the login page",
          "Move the application behind a VPN"
        ]
      }
    ]
  },
  answers: {
    questionAnswers: [1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 1, 2, 2, 0, 1]
  },
  flag: "FLAG{l0g_4n4lys15_3xp3rt_gh0st_caught}"
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 5 — QA Bug Hunt (20 observations — e-commerce checkout)
// Bugs at indices: 0,2,3,5,7,9,11,12,14,16  (10 bugs, 10 expected)
// ─────────────────────────────────────────────────────────────────────────────
const bugBounty = {
  title: "Bug Bounty: Checkout Flow",
  slug: "bug-bounty-login",
  description:
    "You are testing a newly built e-commerce checkout page. Review the 10 requirements and classify each of the 20 test observations as a real Bug or Expected Behaviour.",
  category: "qa-bugs",
  type: "qa-bugs",
  difficulty: "basic",
  points: 200,
  timeLimit: 600,
  hints: [
    { text: "Read each requirement precisely — bugs are deviations from the spec, not just things that look wrong.", cost: 15 },
    { text: "Security-related defects (e.g. exposing card numbers, no validation) count as bugs even if the UX 'works'.", cost: 15 },
    { text: "Accessibility and keyboard navigation are explicit requirements — failures are real bugs.", cost: 10 }
  ],
  content: {
    description:
      "You are performing QA on the checkout page of InsideBreach Shop. Review all requirements, then classify each test observation as Bug or Expected Behaviour.",
    requirements: [
      "REQ-01: All form fields (Name, Email, Address, Card Number, Expiry, CVV) are required — empty submission must be blocked with field-level validation messages.",
      "REQ-02: Card number field must accept only 16-digit numeric input and display it in groups of four (e.g. 1234 5678 9012 3456).",
      "REQ-03: CVV field must be masked (shown as dots). The raw CVV must never appear in logs, network requests, or error messages.",
      "REQ-04: Expiry date must reject past dates with the message 'Card has expired'.",
      "REQ-05: Email field must validate format — invalid formats should show 'Please enter a valid email address'.",
      "REQ-06: On successful order, the user must see a confirmation page with order ID — the full card number must NOT appear on this page.",
      "REQ-07: The Place Order button must be disabled while any required field is empty.",
      "REQ-08: The form must be fully keyboard-accessible (Tab key navigates all fields and buttons in logical order).",
      "REQ-09: After 3 failed payment attempts the session must lock for 5 minutes with a clear message.",
      "REQ-10: All form submissions must use HTTPS. The browser address bar must not show HTTP at any point during checkout."
    ],
    bugReports: [
      // 0 — BUG
      {
        id: 0,
        observation: "Submitting the form with an empty CVV field shows no validation message — the form submits and returns a generic server error (500).",
        requirement: "REQ-01"
      },
      // 1 — EXPECTED
      {
        id: 1,
        observation: "Entering a 17-digit card number is rejected with the message 'Card number must be 16 digits'.",
        requirement: "REQ-02"
      },
      // 2 — BUG
      {
        id: 2,
        observation: "The CVV value (e.g. '123') is visible in plain text in the browser's Network tab under the request payload when Place Order is clicked.",
        requirement: "REQ-03"
      },
      // 3 — BUG
      {
        id: 3,
        observation: "Entering expiry date '01/2020' (a past date) is accepted without error and the order proceeds to payment.",
        requirement: "REQ-04"
      },
      // 4 — EXPECTED
      {
        id: 4,
        observation: "Entering 'user@company.co.uk' passes email validation and the form proceeds.",
        requirement: "REQ-05"
      },
      // 5 — BUG
      {
        id: 5,
        observation: "The order confirmation page displays the full card number (e.g. '4111 1111 1111 1111') next to the order summary.",
        requirement: "REQ-06"
      },
      // 6 — EXPECTED
      {
        id: 6,
        observation: "The Place Order button is greyed out and unclickable when the Name field is empty.",
        requirement: "REQ-07"
      },
      // 7 — BUG
      {
        id: 7,
        observation: "Pressing Tab from the Card Number field skips directly to the Place Order button, bypassing Expiry and CVV fields.",
        requirement: "REQ-08"
      },
      // 8 — EXPECTED
      {
        id: 8,
        observation: "After 3 failed payment attempts, the session locks for 5 minutes and displays 'Too many failed attempts. Please try again in 5 minutes.'",
        requirement: "REQ-09"
      },
      // 9 — BUG
      {
        id: 9,
        observation: "The checkout page loads over HTTP (http://insidebreach-shop.io/checkout) without redirecting to HTTPS.",
        requirement: "REQ-10"
      },
      // 10 — EXPECTED
      {
        id: 10,
        observation: "Entering 'notanemail' in the email field shows 'Please enter a valid email address' and blocks submission.",
        requirement: "REQ-05"
      },
      // 11 — BUG
      {
        id: 11,
        observation: "The card number field accepts letters — typing 'ABCD EFGH IJKL MNOP' passes client-side validation.",
        requirement: "REQ-02"
      },
      // 12 — BUG
      {
        id: 12,
        observation: "The CVV field displays the entered digits in plain text instead of masking them as dots.",
        requirement: "REQ-03"
      },
      // 13 — EXPECTED
      {
        id: 13,
        observation: "The order confirmation page shows only the last four digits of the card (e.g. '•••• •••• •••• 1234').",
        requirement: "REQ-06"
      },
      // 14 — BUG
      {
        id: 14,
        observation: "Submitting the form with all fields valid but using a screen reader results in no accessible success or error announcements — the page changes silently.",
        requirement: "REQ-08"
      },
      // 15 — EXPECTED
      {
        id: 15,
        observation: "Entering a correctly formatted future expiry date (e.g. '12/2027') passes validation.",
        requirement: "REQ-04"
      },
      // 16 — BUG
      {
        id: 16,
        observation: "After the 5-minute lockout period ends, the failed attempt counter resets to 0 instead of requiring the user to re-enter their details — a new set of 3 attempts begins immediately.",
        requirement: "REQ-09"
      },
      // 17 — EXPECTED
      {
        id: 17,
        observation: "The Place Order button becomes enabled only after all six required fields contain non-empty values.",
        requirement: "REQ-07"
      },
      // 18 — EXPECTED
      {
        id: 18,
        observation: "Navigating through all form fields using the Tab key focuses them in the order: Name → Email → Address → Card Number → Expiry → CVV → Place Order.",
        requirement: "REQ-08"
      },
      // 19 — BUG — (edge case: entering card number as spaces)
      {
        id: 19,
        observation: "Entering 16 space characters in the Card Number field passes validation and the form submits, returning a server error.",
        requirement: "REQ-01"
      }
    ]
  },
  answers: {
    bugMap: [true, false, true, true, false, true, false, true, false, true, false, true, true, false, true, false, true, false, false, true]
  },
  flag: "FLAG{qu4l1ty_4ss3ss0r_chckout_fl0w_d0n3}"
};

// ─────────────────────────────────────────────────────────────────────────────

const scenarios = [inboxAmbush, pretextingCall, brokenAuth, ghostLogs, bugBounty];

const seed = async () => {
  await connectDB();
  await Scenario.deleteMany({});
  await Progress.deleteMany({});
  await ExamSession.deleteMany({});
  await Scenario.insertMany(scenarios);
  console.log(`✅ Seeded ${scenarios.length} scenarios (20 questions each). All progress cleared.`);
  await mongoose.connection.close();
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
