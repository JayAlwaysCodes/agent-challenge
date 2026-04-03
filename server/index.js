import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authRouter } from "./routes/auth.js";
import { agentRouter } from "./routes/agent.js";
import { remindersRouter } from "./routes/reminders.js";

dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("web"));

// Routes
app.use("/auth", authRouter);
app.use("/agent", agentRouter);
app.use("/reminders", remindersRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", agent: "Jayzen", version: "1.0.0" });
});

app.listen(PORT, () => {
  console.log(`🤖 Jayzen is running on http://localhost:${PORT}`);
});
