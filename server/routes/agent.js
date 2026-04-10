import express from "express";
import dotenv from "dotenv";
import { getOAuthClient } from "./auth.js";
import { getEmails } from "../plugins/gmail.js";
import { getEvents } from "../plugins/calendar.js";
import { reminders } from "./reminders.js";
import cron from "node-cron";

dotenv.config();

export const agentRouter = express.Router();

// ====================== CLEAN RESPONSE ======================
function cleanResponse(content) {
  if (!content) return null;

  // Strip DeepSeek-R1 <think> blocks
  content = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // Remove new thinking/monologue patterns (the exact leakage in your screenshot)
  const reasoningRegex = /^(?:Okay,?\s*let's see\.?|Alright,?\s*|So,?\s*|Well,?\s*|Hmm,?\s*|I need to|The rules say|According to the rules|Let's see\.?|I think that's a good response|I should respond|Another thing I'm thinking about|I'm thinking about).*?(?:\n\n|\n\s*\n|$)/is;
  content = content.replace(reasoningRegex, "").trim();

  // Remove leading filler phrases
  const fillerPrefixes = [
    /^(okay,?\s*)/i,
    /^(alright,?\s*)/i,
    /^(so,?\s+)/i,
    /^(well,?\s+)/i,
    /^(sure[!,]?\s*)/i,
    /^(hmm,?\s*)/i,
    /^(yeah,?\s*)/i,
    /^(got it,?\s*)/i,
  ];
  for (const pattern of fillerPrefixes) {
    content = content.replace(pattern, "");
  }

  // Keep only the last paragraph if multiple remain (reasoning is always first)
  const paragraphs = content.split(/\n\s*\n/);
  if (paragraphs.length > 1) {
    content = paragraphs[paragraphs.length - 1].trim();
  }

  // Enforce 1-3 sentences max
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];
  if (sentences.length > 3) {
    content = sentences.slice(0, 3).join(" ").trim();
  }

  return content.trim() || null;
}

// ====================== CALL JAYZEN ======================
async function callJayzen(chatMessages) {
  try {
    const response = await fetch(`${process.env.OPENAI_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.MODEL_NAME,
        messages: chatMessages,
        max_tokens: 512,
        temperature: 0.4,        // lowered → more rule-following
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content returned from model");
    }

    const cleaned = cleanResponse(content);
    return cleaned || "Sorry, I glitched. Try again?";
  } catch (error) {
    console.error("callJayzen error:", error);
    return `Snag: ${error.message}`;
  }
}

// ====================== ROUTE ======================
agentRouter.post("/chat", async (req, res) => {
  const { message, history = [] } = req.body;

  try {
    const auth = getOAuthClient();
    const lowerMsg = message.toLowerCase();
    const contextParts = [];

    // ==================== EMAIL CONTEXT ====================
    if (lowerMsg.includes("email") || lowerMsg.includes("inbox") || lowerMsg.includes("mail")) {
      const wantsUnread = lowerMsg.includes("unread");
      const { emails, total } = await getEmails(auth, 500, wantsUnread);

      if (emails.length === 0) {
        contextParts.push(`No ${wantsUnread ? "unread " : ""}emails found.`);
      } else {
        const unreadCount = emails.filter((e) => e.isUnread).length;
        const emailList = emails
          .slice(0, 20)
          .map((e, i) => `${i + 1}. [${e.isUnread ? "UNREAD" : "READ"}] From: ${e.from} | Subject: ${e.subject} | Preview: ${e.snippet}`)
          .join("\n");

        contextParts.push(
          `EMAIL SUMMARY:\n- Total in inbox: ${total}\n- Fetched: ${emails.length}\n- Unread: ${unreadCount}\n\nRecent emails:\n${emailList}`
        );
      }
    }

    // ==================== CALENDAR CONTEXT ====================
    if (
      lowerMsg.includes("calendar") ||
      lowerMsg.includes("schedule") ||
      lowerMsg.includes("event") ||
      lowerMsg.includes("meeting") ||
      lowerMsg.includes("planned") ||
      lowerMsg.includes("today")
    ) {
      const events = await getEvents(auth, 20);
      if (events?.length > 0) {
        contextParts.push(
          `CALENDAR EVENTS:\n${events
            .map((e) => `- ${e.summary || "No title"} at ${e.start?.dateTime || e.start?.date}`)
            .join("\n")}`
        );
      } else {
        contextParts.push("CALENDAR EVENTS: No upcoming events found.");
      }
    }

    // ==================== REMINDER CREATION ====================
    if (lowerMsg.includes("remind") || lowerMsg.includes("reminder")) {
      const timeMatch = message.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i) || message.match(/(\d{1,2})\s*(am|pm)/i);
      const textMatch = message.match(/remind(?:er)?\s*(?:me\s*)?(?:to\s*)?(.+?)(?:\s*at\s*|\s*by\s*)\d/i);

      if (timeMatch) {
        let hour = parseInt(timeMatch[1]);
        let minute = timeMatch[2] && !["am","pm"].includes(timeMatch[2].toLowerCase()) ? parseInt(timeMatch[2]) : 0;
        const period = (timeMatch[3] || timeMatch[2] || "").toLowerCase();
        if (period === "pm" && hour !== 12) hour += 12;
        if (period === "am" && hour === 12) hour = 0;
        const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
        const reminderText = textMatch ? textMatch[1].trim() : message;
        const id = Date.now().toString();

        const task = cron.schedule(`0 ${hour} * * *`, () => {
          console.log(`Reminder fired: ${reminderText}`);
        });

        reminders.push({ id, text: reminderText, time, task });

        contextParts.push(`Reminder successfully created: "${reminderText}" at ${time} daily.`);
        console.log(`Reminder set: "${reminderText}" at ${time}`);
      }
    }

    // ==================== SYSTEM PROMPT (STRONGER) ====================
    const systemPrompt = `You are Jayzen, a personal AI productivity assistant that is on lock 24/7.

CRITICAL RULES — FOLLOW EVERY TIME:
- NEVER show reasoning, thinking, "I'm thinking", "another thing", "let's see", or any meta-commentary.
- You are an AI agent with DIRECT ACCESS to the user's Gmail and Google Calendar. NEVER say "check your phone" or "I'll check my phone" or suggest using external apps.
- When a reminder is set, confirm it directly: "Done. Reminder set for [time]."
- When user says bye/goodbye, respond briefly: "Later! 👋"
- Your response must be ONLY the final reply the user sees. Nothing else.
- Respond in 1-3 short sentences MAX.
- Be direct, concise, slightly GenZ, no fluff.
- If REAL DATA is given below, use it exactly and reference it.
- If REAL DATA contains "ACTION CONFIRMED" or "CONFIRMATION REQUIRED", you MUST include that exact confirmation in your reply (usually as the first sentence).`;
    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...history,
    ];

    // Inject real context as a separate system message
    if (contextParts.length > 0) {
      chatMessages.push({
        role: "system",
        content: `REAL DATA (use this to answer the user):\n\n${contextParts.join("\n\n")}`,
      });
    }

    chatMessages.push({ role: "user", content: message });

    const reply = await callJayzen(chatMessages);
    res.json({ reply });
  } catch (error) {
    console.error("Agent error:", error.message);
    res.status(500).json({ reply: `Snag: ${error.message}` });
  }
});