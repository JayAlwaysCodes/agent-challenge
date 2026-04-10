import { google } from "googleapis";

export async function getEmails(auth, maxResults = 5000, unreadOnly = false) {
  try {
    const gmail = google.gmail({ version: "v1", auth });

    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults,
      labelIds: unreadOnly ? ["INBOX", "UNREAD"] : ["INBOX"],
    });

    const messages = response.data.messages || [];
    const resultSizeEstimate = response.data.resultSizeEstimate || 0;

    const emails = await Promise.all(
      messages.map(async (msg) => {
        const detail = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
          format: "metadata",
          metadataHeaders: ["From", "Subject", "Date"],
        });

        const headers = detail.data.payload.headers;
        const get = (name) => headers.find((h) => h.name === name)?.value || "";
        const isUnread = detail.data.labelIds?.includes("UNREAD") || false;

        return {
          id: msg.id,
          from: get("From"),
          subject: get("Subject"),
          date: get("Date"),
          snippet: detail.data.snippet,
          isUnread,
        };
      })
    );

    return { emails, total: resultSizeEstimate };
  } catch (error) {
    console.error("Gmail error:", error.message);
    return { emails: [], total: 0 };
  }
}

export async function sendEmail(auth, { to, subject, body }) {
  try {
    const gmail = google.gmail({ version: "v1", auth });
    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      body,
    ].join("\n");

    const encoded = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encoded },
    });

    return { success: true };
  } catch (error) {
    console.error("Send email error:", error.message);
    return { success: false, error: error.message };
  }
}
