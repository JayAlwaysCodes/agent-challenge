import express from "express";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

export const authRouter = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Store tokens in memory (good enough for personal use)
export let tokens = null;
export const getOAuthClient = () => {
  if (tokens) oauth2Client.setCredentials(tokens);
  return oauth2Client;
};

// Step 1 - Redirect to Google login
authRouter.get("/google", (req, res) => {
  const scopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.compose",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
  });

  res.redirect(url);
});

// Step 2 - Google redirects back here
authRouter.get("/google/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens: newTokens } = await oauth2Client.getToken(code);
    tokens = newTokens;
    oauth2Client.setCredentials(tokens);
    res.redirect("/?auth=success");
  } catch (error) {
    console.error("Auth error:", error);
    res.redirect("/?auth=error");
  }
});

// Check auth status
authRouter.get("/status", (req, res) => {
  res.json({ authenticated: !!tokens });
});

// Logout
authRouter.get("/logout", (req, res) => {
  tokens = null;
  res.json({ success: true });
});
