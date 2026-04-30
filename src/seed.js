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
    "Twenty emails have landed in the company inbox. Classify each one as Phishing or Legitimate — spot fake sender domains, urgency tactics, and credential-harvesting tricks.",
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
        body: "Your last payment of ₹4,999 failed due to insufficient funds. Update your billing information within 12 hours to avoid service interruption and a ₹500 late fee. Click here: http://paypa1-secure.com/update"
      },
      // 3 — LEGIT
      {
        id: 3,
        subject: "Expense Report EXP-2041 Approved",
        sender: "finance@insidebreach.io",
        body: "Your expense report (ref: EXP-2041) for ₹2,300 has been reviewed and approved. Payment will be included in the next payroll cycle. Contact finance@insidebreach.io with any questions."
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
        body: "Hi, it's Sarah. I'm in back-to-back board meetings and can't access my account. I need you to purchase 4 × ₹500 Amazon gift cards and WhatsApp me the redemption codes urgently. I'll reimburse you end of day. Please keep this between us."
      },
      // 7 — PHISHING
      {
        id: 7,
        subject: "Your Apple ID has been locked",
        sender: "noreply@app1e-id-verify.com",
        body: "Your Apple ID was used to sign in from an unrecognised device in another country. If this wasn't you, your account has been locked for security. Verify your identity at: http://app1e-id-verify.com/unlock"
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
        subject: "SBI Alert: Suspicious Transaction Detected — Verify Now",
        sender: "fraud-alert@sbi-verify.co.in",
        body: "A transaction of ₹89,300 to an overseas merchant was flagged on your account. If you did not authorise this, click here immediately to freeze your card and dispute the charge. Failure to act within 2 hours may result in permanent loss of funds."
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
        subject: "All-Hands Meeting — Thu 11 Apr, 14:00 IST",
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
        subject: "Updated Leave Policy — Effective 1 May",
        sender: "hr@insidebreach.io",
        body: "Please review the updated leave booking policy attached to this email. Key changes include: carry-over allowance increased to 5 days, and the booking window now opens 6 months in advance. Reach out to hr@insidebreach.io with questions."
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
        body: "This is a reminder for your upcoming event: 1:1 with Sarah Porter, Wednesday 10 April at 10:00 IST. Location: Google Meet. You can view or edit this event in Google Calendar."
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
        body: "Your expense claim (ref: EXP-2088) for ₹1,805 was approved and will be paid in the next payroll cycle. No further action is needed."
      },
      // 4 — SOCIAL ENG (CEO fraud)
      {
        id: 4,
        subject: "Confidential — board request",
        sender: "ceo@insidebreach-leadership.co",
        body: "I'm in a confidential board discussion and need your help urgently. Please transfer ₹42,000 to the account details below. This is time-sensitive and must not be discussed with anyone else until I authorise it. I'll explain everything tomorrow."
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
        subject: "Income Tax Dept: Outstanding return — legal action pending",
        sender: "noreply@incometax-gov-in.net",
        body: "Our records show you have an outstanding income tax return for AY 2022–23. Failure to respond within 48 hours will result in a court summons and ₹30,000 penalty. Call our automated line or click here to make payment and avoid prosecution."
      },
      // 9 — SOCIAL ENG
      {
        id: 9,
        subject: "You've been selected for a security training survey — gift card reward",
        sender: "surveys@corporate-training-hub.net",
        body: "You've been selected to complete a 5-minute cybersecurity awareness survey. As a thank-you, you'll receive a ₹500 Amazon gift card. Please provide your full name, work email, and employee ID to claim your reward after completion."
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
        sender: "SMS +91-98XXXXXXXX",
        body: "InsideBreach IT: Your MFA device has been deregistered due to suspicious activity. Reply YES to re-register your current device, or call 1800-XXX-XXXX to speak to IT security. Do not log in until this is resolved."
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
// SCENARIO 3 — Code Review with C & Java (20 MCQ across 4 code blocks)
// Designed for FY B.Tech students (Sem I & II) who know C/C++ and Java basics
// ─────────────────────────────────────────────────────────────────────────────
const brokenAuth = {
  title: "Code Clinic",
  slug: "broken-auth",
  description:
    "Four code snippets written by junior developers have been flagged for review. Use your knowledge of C and Java to find the bugs and security issues in each module.",
  category: "code-review",
  type: "code-review",
  difficulty: "basic",
  points: 300,
  timeLimit: 900,
  hints: [
    { text: "In C, gets() reads input without any length limit — it can overwrite memory beyond the buffer. Always use fgets() instead.", cost: 25 },
    { text: "In Java, using == to compare String objects checks memory address, not content. Use .equals() for correct string comparison.", cost: 20 },
    { text: "In C, accessing an array at index 5 when its size is 5 (valid indices: 0–4) causes undefined behaviour.", cost: 20 },
    { text: "Hardcoded passwords in source code are always a security risk — anyone with code access can read them.", cost: 15 }
  ],
  content: {
    codeBlocks: [
      {
        title: "Module A — input.c (Unsafe C Input Handling)",
        code: `#include <stdio.h>
#include <string.h>

void greetUser() {
    char name[10];
    printf("Enter your name: ");
    gets(name);                    // reads input from user
    printf("Hello, %s!\\n", name);
}

int isAdult(int age) {
    if (age = 18) {               // checks if user is an adult
        return 1;
    }
    return 0;
}

void copyData(char* dest, char* src) {
    strcpy(dest, src);            // copies src string into dest
}`
      },
      {
        title: "Module B — UserAuth.java (Java Authentication Class)",
        code: `public class UserAuth {
    private static final String ADMIN_PASS = "admin123";

    public boolean login(String username, String password) {
        if (username == "admin" && password == ADMIN_PASS) {
            return true;
        }
        return false;
    }

    public boolean isStrongPassword(String pass) {
        return pass.length() > 4;
    }

    public void printDetails(String user, String pass) {
        System.out.println("User: " + user + ", Pass: " + pass);
    }
}`
      },
      {
        title: "Module C — scores.c (C Array & Arithmetic Operations)",
        code: `#include <stdio.h>

int multiply(int a, int b) {
    return a * b;
}

float divide(float a, float b) {
    return a / b;              // divides two numbers
}

int getScore(int scores[], int index) {
    return scores[index];      // returns element at given index
}

int main() {
    int scores[5] = {80, 75, 90, 88, 70};
    printf("%d\\n", getScore(scores, 10));
    printf("%.2f\\n", divide(10.0, 0.0));
    return 0;
}`
      },
      {
        title: "Module D — MarksEntry.java (Java Array & Data Handling)",
        code: `import java.util.Scanner;

public class MarksEntry {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int[] marks = new int[5];

        for (int i = 0; i <= 5; i++) {   // loop to enter 5 marks
            marks[i] = sc.nextInt();
        }

        String dbPassword = "college@123";
        System.out.println("DB connected: " + dbPassword);

        int total = 0;
        for (int i = 0; i < 5; i++) {
            total += marks[i];
        }
        System.out.println("Total Marks: " + total);
    }
}`
      }
    ],
    questions: [
      // ── Module A (Unsafe C Input) — Q0–Q4 ─────────────────────────────────
      {
        id: 0, codeBlockIndex: 0,
        text: "What makes gets(name) in greetUser() dangerous?",
        options: [
          "It converts numbers to strings incorrectly",
          "It reads input without checking length, allowing the input to overflow the buffer",
          "It only reads a single character at a time",
          "It requires administrator permissions to run"
        ]
      },
      {
        id: 1, codeBlockIndex: 0,
        text: "In isAdult(), the condition 'if (age = 18)' is a bug. What does this line actually do at runtime?",
        options: [
          "Compares age to 18 — returns true only if they are equal",
          "Checks if age is greater than or equal to 18",
          "Assigns 18 to age, making the condition always evaluate to true (18 is non-zero)",
          "Causes a compilation error because = is not allowed inside if"
        ]
      },
      {
        id: 2, codeBlockIndex: 0,
        text: "What is the safer replacement for gets() when reading a string with a known maximum length in C?",
        options: [
          "scanf(\"%d\")",
          "fgets(name, sizeof(name), stdin)",
          "getchar()",
          "puts(name)"
        ]
      },
      {
        id: 3, codeBlockIndex: 0,
        text: "Why is using strcpy(dest, src) without checking sizes a security risk?",
        options: [
          "strcpy() only works with string literals, not variables",
          "strcpy() automatically adds extra null characters to both strings",
          "strcpy() copies all bytes from src into dest without checking whether src fits, which can overflow dest",
          "strcpy() requires both strings to be the same length"
        ]
      },
      {
        id: 4, codeBlockIndex: 0,
        text: "The misuse of gets() and unchecked strcpy() in Module A are examples of which type of vulnerability?",
        options: [
          "SQL Injection",
          "Logic Error",
          "Buffer Overflow",
          "Infinite Loop"
        ]
      },
      // ── Module B (Java Authentication) — Q5–Q9 ────────────────────────────
      {
        id: 5, codeBlockIndex: 1,
        text: "In Java, using == to compare strings (username == \"admin\") does NOT check string content. What is the correct method?",
        options: [
          "username.compare(\"admin\")",
          "username.equals(\"admin\")",
          "username === \"admin\"",
          "username.toString() == \"admin\""
        ]
      },
      {
        id: 6, codeBlockIndex: 1,
        text: "Storing the password directly in code as ADMIN_PASS = \"admin123\" is a security problem because:",
        options: [
          "Java constants cannot store String values",
          "Anyone who reads the source code or decompiles the program can immediately see the password",
          "static final variables are always printed to the console when the program starts",
          "The string \"admin123\" is too long to be stored as a Java constant"
        ]
      },
      {
        id: 7, codeBlockIndex: 1,
        text: "The isStrongPassword() method checks only that the password length is greater than 4. What important security check is missing?",
        options: [
          "It should check that the password is exactly 8 characters",
          "There is no check for uppercase letters, digits, or special characters — length alone is insufficient for a strong password policy",
          "The method should be declared static to function correctly",
          "pass.length() always returns -1 for empty strings in Java"
        ]
      },
      {
        id: 8, codeBlockIndex: 1,
        text: "The printDetails() method prints the password using System.out.println(). Why is this a bad security practice?",
        options: [
          "System.out.println() cannot handle strings that contain spaces",
          "Passwords printed to the screen or console logs can be read by anyone with access to the terminal or log files",
          "The method must use a return statement instead of printing",
          "Java requires printf() instead of println() for secure output"
        ]
      },
      {
        id: 9, codeBlockIndex: 1,
        text: "Because of the == bug, login() always returns false even for correct credentials. This is an example of which category of error?",
        options: [
          "A compilation error — the code will not compile at all",
          "A runtime exception that crashes the JVM",
          "A logic error — the code compiles and runs but produces the wrong result",
          "A type mismatch error between String and boolean"
        ]
      },
      // ── Module C (C Array & Arithmetic) — Q10–Q14 ─────────────────────────
      {
        id: 10, codeBlockIndex: 2,
        text: "getScore(scores, 10) is called on an array declared as int scores[5] (valid indices: 0–4). What happens?",
        options: [
          "The program automatically returns 0 for out-of-range indices",
          "It accesses memory outside the array boundaries, causing undefined behaviour",
          "The C compiler resizes the array to size 11 automatically",
          "The function safely returns the last valid element (index 4)"
        ]
      },
      {
        id: 11, codeBlockIndex: 2,
        text: "What happens when divide(10.0, 0.0) is executed in C?",
        options: [
          "The function returns 0.0 safely",
          "It produces undefined behaviour or returns infinity / NaN — dividing by zero is not safe in C",
          "The compiler detects division by zero at compile time and stops compilation",
          "It automatically throws a DivisionByZeroException like Java"
        ]
      },
      {
        id: 12, codeBlockIndex: 2,
        text: "What is the correct fix to prevent out-of-bounds access in getScore()?",
        options: [
          "Change the return type of getScore() from int to float",
          "Declare the scores array as a global variable",
          "Before accessing, check: if (index < 0 || index >= size) handle the error appropriately",
          "Always pass index as 0 to avoid boundary issues"
        ]
      },
      {
        id: 13, codeBlockIndex: 2,
        text: "Unlike Java, C does NOT automatically check for out-of-bounds array access. What does this mean for the programmer?",
        options: [
          "C handles array bounds checking automatically at runtime like Java does",
          "The programmer must always manually validate array indices before accessing — C does not protect against it",
          "C arrays automatically expand when the index exceeds the declared size",
          "Out-of-bounds access in C always produces a clear 'Array Error' message and halts the program"
        ]
      },
      {
        id: 14, codeBlockIndex: 2,
        text: "Which programming habit would prevent BOTH the divide-by-zero and array out-of-bounds bugs in Module C?",
        options: [
          "Using global variables instead of function parameters",
          "Always using float instead of int for all numeric variables",
          "Validating all input values before using them in calculations or array access",
          "Writing all logic in a single main() function instead of separate functions"
        ]
      },
      // ── Module D (Java Array & Data) — Q15–Q19 ────────────────────────────
      {
        id: 15, codeBlockIndex: 3,
        text: "The loop runs while i <= 5 on an array of size 5 (valid indices: 0–4). What happens when i reaches 5?",
        options: [
          "The loop exits normally because 5 is not a valid index",
          "An ArrayIndexOutOfBoundsException is thrown at runtime",
          "Java automatically increases the array size to 6 to accommodate the access",
          "marks[5] returns 0 by default without throwing any error"
        ]
      },
      {
        id: 16, codeBlockIndex: 3,
        text: "What is the correct loop condition to safely iterate over all 5 elements of int[] marks = new int[5]?",
        options: [
          "i <= 5",
          "i < 5",
          "i != 5",
          "i <= 4 && i > 0"
        ]
      },
      {
        id: 17, codeBlockIndex: 3,
        text: "The password \"college@123\" is stored as a plain-text String and printed to the console. What is the correct approach?",
        options: [
          "Store it as an int instead of a String",
          "Encode it in Base64 before printing to make it slightly harder to read",
          "Never hardcode credentials in source code, and never print passwords to any output",
          "Use a shorter password to reduce the security risk of exposure"
        ]
      },
      {
        id: 18, codeBlockIndex: 3,
        text: "In Java, what exception is thrown when you access an array with an index that is out of its declared bounds?",
        options: [
          "NullPointerException",
          "ArithmeticException",
          "ArrayIndexOutOfBoundsException",
          "NumberFormatException"
        ]
      },
      {
        id: 19, codeBlockIndex: 3,
        text: "Considering all four modules, which single coding habit would prevent the most bugs and security issues found?",
        options: [
          "Always write programs in C instead of Java for better performance",
          "Avoid using functions — put all code inside main() to keep it simple",
          "Validate all inputs and indices, use correct comparison operators, and never hardcode sensitive data",
          "Use only global variables throughout the program to share data between functions"
        ]
      }
    ]
  },
  answers: {
    //         Q0  Q1  Q2  Q3  Q4  Q5  Q6  Q7  Q8  Q9  Q10 Q11 Q12 Q13 Q14 Q15 Q16 Q17 Q18 Q19
    questionAnswers: [1,  2,  1,  2,  2,  1,  1,  1,  1,  2,  1,  1,  2,  1,  2,  1,  1,  2,  2,  2]
  },
  flag: "FLAG{c0d3_cl1n1c_c_4nd_j4v4_bugs_found}"
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 4 — Log Analysis (20 MCQ, large log file, multiple incidents)
// ─────────────────────────────────────────────────────────────────────────────
const ghostLogs = {
  title: "Ghost in the Logs",
  slug: "ghost-in-the-logs",
  description:
    "The security team has flagged unusual activity across three server logs from the past hour. Analyse each log section carefully and answer the 20 investigation questions.",
  category: "log-analysis",
  type: "log-analysis",
  difficulty: "basic",
  points: 250,
  timeLimit: 720,
  hints: [
    { text: "Repeated 401 responses from one IP in a short timespan = brute force. Look at frequency and timing.", cost: 20 },
    { text: "Automated scanning shows up as rapid GET requests to many different endpoints from one IP, often returning 404.", cost: 20 },
    { text: "Data exfiltration often appears as unusually large response sizes (bytes column) on export or download endpoints.", cost: 15 },
    { text: "Privilege escalation: watch for an account suddenly accessing admin-only endpoints after a successful login.", cost: 15 }
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
      // ── Section A (Brute Force) — Q0–Q6 ─────────────────────────────────
      {
        id: 0,
        text: "In Log Section A, which IP address is performing the suspicious login activity?",
        options: ["192.168.1.10", "10.0.0.55", "203.0.113.42", "192.168.1.22"]
      },
      {
        id: 1,
        text: "How many failed login attempts (401 responses) did the suspicious IP make before getting a successful login?",
        options: ["5", "6", "8", "10"]
      },
      {
        id: 2,
        text: "Approximately how long did all the login attempts (including the final success) take in total?",
        options: ["Less than 5 seconds", "About 8 seconds", "About 30 seconds", "About 2 minutes"]
      },
      {
        id: 3,
        text: "Was the login attack ultimately successful?",
        options: [
          "No — every attempt returned 401 Unauthorized",
          "Yes — a 200 OK response was returned after repeated failed attempts",
          "Partially — the account was locked after 5 attempts",
          "Unknown — the logs are incomplete"
        ]
      },
      {
        id: 4,
        text: "After gaining access, what did IP 10.0.0.55 do at 08:02:44?",
        options: [
          "Exported the entire database as a CSV file",
          "Scanned the server for open admin endpoints",
          "Promoted their own account (attacker@evil.io) to admin role",
          "Deleted all user records from the database"
        ]
      },
      {
        id: 5,
        text: "Which security control would have most directly prevented this brute-force login attack?",
        options: [
          "Using HTTPS on the login endpoint",
          "Rate limiting or account lockout after a certain number of failed login attempts",
          "Requiring passwords to be at least 12 characters long",
          "Using JWT tokens instead of session cookies"
        ]
      },
      {
        id: 6,
        text: "The attacker used /api/users/promote to give themselves admin access. What does this reveal about the application?",
        options: [
          "The promote endpoint was not rate-limited",
          "The endpoint should require HTTPS to be secure",
          "Any admin account could promote any user without additional confirmation or approval",
          "The endpoint returned too much information in error messages"
        ]
      },
      // ── Section B (Reconnaissance / Scanning) — Q7–Q12 ──────────────────
      {
        id: 7,
        text: "In Log Section B, what type of activity is IP 45.33.32.156 performing?",
        options: [
          "Brute-force login attack on the admin panel",
          "Automated reconnaissance — scanning for common sensitive files and admin paths",
          "Gradually downloading large amounts of data",
          "Sending many requests to crash the server (DDoS)"
        ]
      },
      {
        id: 8,
        text: "How long did the entire scanning activity from 45.33.32.156 take?",
        options: ["About 1 second", "About 5 seconds", "About 30 seconds", "About 5 minutes"]
      },
      {
        id: 9,
        text: "Which sensitive file was successfully accessed by the scanner (returned 200 OK)?",
        options: ["/.env", "/backup.zip", "/.git/config", "/config.php"]
      },
      {
        id: 10,
        text: "What information could an attacker extract from an exposed /.git/config file?",
        options: [
          "The server's TLS private key used for HTTPS",
          "Remote repository URL, branch names, and potentially hardcoded credentials in git history",
          "Only the database connection string",
          "A full list of all registered users and their passwords"
        ]
      },
      {
        id: 11,
        text: "What is the best remediation for the exposed /.git/config file on the web server?",
        options: [
          "Rename the file to .git-backup so it is harder to find",
          "Block all requests to /.git/ at the web server level and never deploy .git directories to production servers",
          "Require user authentication before the file can be accessed",
          "Encrypt the contents of the .git/config file"
        ]
      },
      {
        id: 12,
        text: "What log pattern most clearly indicates that 45.33.32.156 is an automated scanner rather than a human browsing the site?",
        options: [
          "It used the GET HTTP method for all requests",
          "Many different file paths were requested within 1–2 seconds, and most returned 404",
          "It received a 200 response on /.git/config",
          "The IP address belongs to an external network"
        ]
      },
      // ── Section C (Data Exfiltration) — Q13–Q19 ──────────────────────────
      {
        id: 13,
        text: "In Log Section C, which indicator most strongly suggests a data exfiltration attempt?",
        options: [
          "The user accessed /api/reports which is an admin-only path",
          "Six successive POST /api/data/export calls with rapidly growing response sizes over 5 minutes",
          "The response time of some requests exceeded 1 second",
          "IP 192.168.1.50 is on an internal subnet"
        ]
      },
      {
        id: 14,
        text: "Approximately how much total data was exported across all six export calls combined?",
        options: ["Under 500 KB", "About 1 MB", "About 3.5 MB", "Over 10 MB"]
      },
      {
        id: 15,
        text: "The export response sizes grow with each request (142 KB → 1.2 MB). What does this escalating pattern suggest?",
        options: [
          "The server is becoming slower under increasing load",
          "The attacker is progressively downloading larger slices of the dataset",
          "CSV files are always larger than JSON, so each export takes more space",
          "The database is running an increasingly expensive background query"
        ]
      },
      {
        id: 16,
        text: "Which security control would have most limited the impact of this data exfiltration?",
        options: [
          "Switching the server from HTTP to HTTPS",
          "Requiring the user to re-authenticate for every individual export request",
          "Rate-limiting export endpoints and alerting on unusually large or frequent download volumes",
          "Completely disabling the CSV export feature for all users"
        ]
      },
      {
        id: 17,
        text: "Across all three log sections, which IP address appears in Section B AND also makes a legitimate POST request in Section C?",
        options: ["45.33.32.156", "192.168.1.50", "192.168.1.22", "10.0.0.55"]
      },
      {
        id: 18,
        text: "Which of the three log sections shows the highest-severity security incident overall?",
        options: [
          "Section A — brute-force attack followed by privilege escalation to admin",
          "Section B — automated reconnaissance and one exposed sensitive file",
          "Section C — repeated data export suggesting exfiltration",
          "All three are equally severe and cannot be ranked"
        ]
      },
      {
        id: 19,
        text: "Under Indian law (IT Act 2000), which action visible in the logs would be considered unauthorised access to a computer system?",
        options: [
          "A legitimate user downloading their own reports in Section C",
          "IP 10.0.0.55 repeatedly attempting to log in with wrong passwords and then gaining access to an admin account",
          "The automated scanner requesting /robots.txt in Section B",
          "The normal POST /api/orders request by 192.168.1.22"
        ]
      }
    ]
  },
  answers: {
    //         Q0  Q1  Q2  Q3  Q4  Q5  Q6  Q7  Q8  Q9  Q10 Q11 Q12 Q13 Q14 Q15 Q16 Q17 Q18 Q19
    questionAnswers: [1,  2,  1,  1,  2,  1,  2,  1,  1,  2,  1,  1,  1,  1,  2,  1,  2,  2,  0,  1]
  },
  flag: "FLAG{l0g_4n4lys15_3xp3rt_gh0st_caught}"
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 5 — QA Bug Hunt: Student Portal (20 observations)
// Bugs at indices: 0,2,3,5,7,9,11,12,14,17  (10 bugs, 10 expected)
// Designed around a university student registration system — relatable to FY students
// ─────────────────────────────────────────────────────────────────────────────
const bugBounty = {
  title: "Bug Bounty: Student Portal",
  slug: "bug-bounty-login",
  description:
    "You are testing the new Atharva University Student Registration Portal. Review the 10 requirements and classify each of the 20 test observations as a real Bug or Expected Behaviour.",
  category: "qa-bugs",
  type: "qa-bugs",
  difficulty: "basic",
  points: 200,
  timeLimit: 600,
  hints: [
    { text: "Read each requirement precisely — a bug is a deviation from the spec, not just something that looks odd.", cost: 15 },
    { text: "Security-related failures (password shown in confirmation, no lockout after failed attempts) are always bugs.", cost: 15 },
    { text: "Input validation bugs include accepting data that the requirement says must be rejected (e.g., letters in Roll No).", cost: 10 }
  ],
  content: {
    description:
      "You are performing QA testing on the Atharva University Student Registration Portal. Review all requirements, then classify each test observation as Bug or Expected Behaviour.",
    requirements: [
      "REQ-01: All six fields (Full Name, Roll No, Email, Password, Branch, Year) are required. Submitting with any empty field must be blocked with a field-level validation message.",
      "REQ-02: Roll Number must be exactly 10 digits and contain only numeric characters. Non-numeric or incorrect-length entries must be rejected with 'Roll number must be 10 digits (numbers only)'.",
      "REQ-03: Password must be at least 8 characters long. Shorter passwords must be rejected with 'Password must be at least 8 characters'.",
      "REQ-04: Email field must validate format — it must contain '@' and a domain extension (e.g. .com, .edu, .in). Invalid emails show 'Please enter a valid email address'.",
      "REQ-05: Full Name must accept only letters and spaces. Entries containing digits or special symbols must be rejected with 'Name must contain only letters and spaces'.",
      "REQ-06: The Register button must be disabled (greyed out) while any required field is empty.",
      "REQ-07: Duplicate Roll Numbers must be rejected with the message 'Roll number already registered. Please contact the admin.'",
      "REQ-08: On successful registration, the confirmation page must show 'Welcome, [Name]! Your Roll No is [RollNo].' The password must NOT appear anywhere on this page.",
      "REQ-09: The Branch dropdown must force a valid selection. Submitting while 'Select Branch' placeholder is active must be blocked with a validation error.",
      "REQ-10: After 3 consecutive failed login attempts with wrong passwords, the account must lock for 2 minutes and display 'Too many attempts. Try again in 2 minutes.'"
    ],
    bugReports: [
      // 0 — BUG (REQ-01: empty Password submits)
      {
        id: 0,
        observation: "Submitting the registration form with the Password field left empty shows no validation message — the form submits and the server returns a 500 Internal Server Error.",
        requirement: "REQ-01"
      },
      // 1 — EXPECTED (REQ-02: alphanumeric roll no rejected)
      {
        id: 1,
        observation: "Entering 'ABCD123456' (letters + digits) in the Roll Number field shows 'Roll number must be 10 digits (numbers only)' and blocks submission.",
        requirement: "REQ-02"
      },
      // 2 — BUG (REQ-03: short password accepted)
      {
        id: 2,
        observation: "Entering a 5-character password 'abc12' is accepted without any validation error and registration proceeds.",
        requirement: "REQ-03"
      },
      // 3 — BUG (REQ-04: incomplete email accepted)
      {
        id: 3,
        observation: "Entering 'student@' in the Email field (missing the domain part) passes email validation and submission is not blocked.",
        requirement: "REQ-04"
      },
      // 4 — EXPECTED (REQ-04: valid university email accepted)
      {
        id: 4,
        observation: "Entering 'rahul.sharma@atharva.edu.in' passes email validation and the form proceeds normally.",
        requirement: "REQ-04"
      },
      // 5 — BUG (REQ-06: Register button active when fields are empty)
      {
        id: 5,
        observation: "On the registration page with all fields empty, the Register button is fully clickable and active — it is not disabled.",
        requirement: "REQ-06"
      },
      // 6 — EXPECTED (REQ-07: duplicate roll number rejected)
      {
        id: 6,
        observation: "Attempting to register with a Roll Number that already exists in the system shows 'Roll number already registered. Please contact the admin.' and blocks the submission.",
        requirement: "REQ-07"
      },
      // 7 — BUG (REQ-08: password visible on confirmation page)
      {
        id: 7,
        observation: "The confirmation page after successful registration displays 'Your password is: mypassword1' alongside the welcome message.",
        requirement: "REQ-08"
      },
      // 8 — EXPECTED (REQ-09: placeholder branch blocks submission)
      {
        id: 8,
        observation: "Clicking Register while 'Select Branch' is still showing in the Branch dropdown produces a validation error and blocks the form from submitting.",
        requirement: "REQ-09"
      },
      // 9 — BUG (REQ-10: no lockout after 3 wrong attempts)
      {
        id: 9,
        observation: "After 3 consecutive failed login attempts with incorrect passwords, no lockout occurs — the user can continue trying passwords indefinitely.",
        requirement: "REQ-10"
      },
      // 10 — EXPECTED (REQ-05: valid name accepted)
      {
        id: 10,
        observation: "Entering 'Priya Sharma' in the Full Name field (letters and a space) passes name validation and the form proceeds.",
        requirement: "REQ-05"
      },
      // 11 — BUG (REQ-05: name with digits accepted)
      {
        id: 11,
        observation: "Entering 'R4hul Sh4rm4' in the Full Name field (contains digits) passes name validation without any error.",
        requirement: "REQ-05"
      },
      // 12 — BUG (REQ-02: short roll number accepted)
      {
        id: 12,
        observation: "Entering '12345' (only 5 digits) in the Roll Number field passes validation and the form submits successfully.",
        requirement: "REQ-02"
      },
      // 13 — EXPECTED (REQ-10: lockout message shown correctly)
      {
        id: 13,
        observation: "After 3 wrong login attempts, the message 'Too many attempts. Try again in 2 minutes.' is displayed and further login attempts are blocked for 2 minutes.",
        requirement: "REQ-10"
      },
      // 14 — BUG (REQ-08: password leaked on confirmation page)
      {
        id: 14,
        observation: "The registration confirmation page shows 'Email: student@test.com | Password: pass1234' under the student's details section.",
        requirement: "REQ-08"
      },
      // 15 — EXPECTED (REQ-02: valid 10-digit roll number accepted)
      {
        id: 15,
        observation: "Entering '2024501001' (exactly 10 numeric digits) in the Roll Number field passes validation successfully.",
        requirement: "REQ-02"
      },
      // 16 — EXPECTED (REQ-06: button disabled when email is empty)
      {
        id: 16,
        observation: "When the Email field is cleared while all other fields are filled, the Register button becomes greyed out and unclickable immediately.",
        requirement: "REQ-06"
      },
      // 17 — BUG (REQ-05: name with symbols accepted)
      {
        id: 17,
        observation: "Entering 'Riya@Singh!' in the Full Name field (contains @ and !) passes name validation without showing any error.",
        requirement: "REQ-05"
      },
      // 18 — EXPECTED (REQ-04: invalid email format rejected)
      {
        id: 18,
        observation: "Entering 'notanemail' in the Email field shows 'Please enter a valid email address' and blocks form submission.",
        requirement: "REQ-04"
      },
      // 19 — EXPECTED (REQ-03: 8-character password accepted)
      {
        id: 19,
        observation: "Entering a password of exactly 8 characters 'secure01' passes the password length validation without any error.",
        requirement: "REQ-03"
      }
    ]
  },
  answers: {
    //    0     1      2     3     4      5     6      7     8      9     10     11    12    13     14    15     16     17    18     19
    bugMap: [true, false, true, true, false, true, false, true, false, true, false, true, true, false, true, false, false, true, false, false]
  },
  flag: "FLAG{qu4l1ty_4ss3ss0r_stud3nt_p0rt4l_d0n3}"
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
