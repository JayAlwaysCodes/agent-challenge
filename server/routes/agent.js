import express from "express";
import dotenv from "dotenv";
import { getOAuthClient } from "./auth.js";
import { getEmails, sendEmail } from "../plugins/gmail.js";
import { getEvents, createEvent } from "../plugins/calendar.js";

dotenv.config();

export const agentRouter = express.Router();

// Call Nosana's Qwen model
async function callJayzen(messages) {
  const response = await fetch(`${process.env.OPENAI_API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.MODEL_NAME,
      messages,
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

// Main chat endpoint
agentRouter.post("/chat", async (req, res) => {
  const { message, history = [] } = req.body;

  try {
    const auth = getOAuthClient();
    let contextData = "";

    // Detect intent and fetch relevant data
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes("email") || lowerMsg.includes("inbox") || lowerMsg.includes("mail")) {
      const emails = await getEmails(auth, 5);
      contextData = `\n\nRecent emails:\n${JSON.stringify(emails, null, 2)}`;
    }

    if (lowerMsg.includes("calendar") || lowerMsg.includes("schedule") || lowerMsg.includes("event") || lowerMsg.includes("meeting")) {
      const events = await getEvents(auth, 5);
      contextData = `\n\nUpcoming calendar events:\n${JSON.stringify(events, null, 2)}`;
    }

    const systemPrompt = `You are Jayzen, a personal AI productivity assistant. You help manage Gmail, Google Calendar, and reminders. You are calm, focused, and slightly GenZ — no fluff, just results. Always be concise and helpful.${contextData}`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message },
    ];

    const reply = await callJayzen(messages);
    res.json({ reply });

  } catch (error) {
    console.error("Agent error:", error);
    res.status(500).json({ error: "Jayzen hit a snag. Try again!" });
  }
});
