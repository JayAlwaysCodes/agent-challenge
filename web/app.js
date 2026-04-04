// ===== State =====
let chatHistory = [];
let isAuthenticated = false;

// ===== Init =====
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  setupNav();
  setupChat();
  setupEmails();
  setupCalendar();
  setupReminders();
  checkURLParams();
});

// ===== Auth =====
async function checkAuth() {
  try {
    const res = await fetch("/auth/status");
    const data = await res.json();
    isAuthenticated = data.authenticated;
    updateAuthUI();
  } catch (e) {
    console.error("Auth check failed", e);
  }
}

function updateAuthUI() {
  const dot = document.querySelector(".status-dot");
  const label = document.getElementById("auth-label");
  const btn = document.getElementById("auth-toggle");
  const banner = document.getElementById("auth-banner");

  if (isAuthenticated) {
    dot.className = "status-dot connected";
    label.textContent = "Connected";
    btn.textContent = "Disconnect";
    btn.onclick = logout;
    banner.classList.add("hidden");
  } else {
    dot.className = "status-dot disconnected";
    label.textContent = "Not connected";
    btn.textContent = "Connect Google";
    btn.onclick = () => window.location.href = "/auth/google";
    banner.classList.remove("hidden");
  }
}

async function logout() {
  await fetch("/auth/logout");
  isAuthenticated = false;
  updateAuthUI();
  showToast("Disconnected from Google", "info");
}

function checkURLParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("auth") === "success") {
    isAuthenticated = true;
    updateAuthUI();
    showToast("✅ Google account connected!", "success");
    window.history.replaceState({}, "", "/");
  } else if (params.get("auth") === "error") {
    showToast("❌ Google auth failed. Try again.", "error");
    window.history.replaceState({}, "", "/");
  }
}

// ===== Navigation =====
function setupNav() {
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
    });
  });
}

// ===== Chat =====
function setupChat() {
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) sendMessage();
  });

  document.querySelectorAll(".quick-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      input.value = btn.dataset.msg;
      sendMessage();
    });
  });
}

async function sendMessage() {
  const input = document.getElementById("chat-input");
  const message = input.value.trim();
  if (!message) return;

  input.value = "";
  appendMessage("user", message);

  const typing = appendTyping();
  document.getElementById("send-btn").disabled = true;

  try {
    const res = await fetch("/agent/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history: chatHistory }),
    });

    const data = await res.json();
    typing.remove();

    const reply = data.reply || data.error || "Something went wrong.";
    appendMessage("agent", reply);

    chatHistory.push({ role: "user", content: message });
    chatHistory.push({ role: "assistant", content: reply });

    // Keep history manageable
    if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);

  } catch (e) {
    typing.remove();
    appendMessage("agent", "⚠️ Couldn't reach Jayzen. Check your server.");
  }

  document.getElementById("send-btn").disabled = false;
}

function appendMessage(role, text) {
  const window_ = document.getElementById("chat-window");
  const div = document.createElement("div");
  div.className = `message ${role}`;
  div.innerHTML = `
    <div class="avatar">${role === "agent" ? "🤖" : "👤"}</div>
    <div class="bubble">${text.replace(/\n/g, "<br/>")}</div>
  `;
  window_.appendChild(div);
  window_.scrollTop = window_.scrollHeight;
  return div;
}

function appendTyping() {
  const window_ = document.getElementById("chat-window");
  const div = document.createElement("div");
  div.className = "message agent typing";
  div.innerHTML = `
    <div class="avatar">🤖</div>
    <div class="bubble">
      <div class="dot"></div><div class="dot"></div><div class="dot"></div>
    </div>
  `;
  window_.appendChild(div);
  window_.scrollTop = window_.scrollHeight;
  return div;
}

// ===== Emails =====
function setupEmails() {
  document.getElementById("fetch-emails").addEventListener("click", fetchEmails);
}

async function fetchEmails() {
  if (!isAuthenticated) {
    showToast("⚠️ Connect Google first!", "error"); return;
  }

  const list = document.getElementById("emails-list");
  list.innerHTML = "<p style='color:var(--text2)'>Fetching emails...</p>";

  try {
    const res = await fetch("/agent/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Fetch my last 5 emails and list them", history: [] }),
    });
    const data = await res.json();

    list.innerHTML = `
      <div class="card">
        <div class="card-body">${data.reply.replace(/\n/g, "<br/>")}</div>
      </div>
    `;
  } catch (e) {
    list.innerHTML = "<p style='color:var(--error)'>Failed to fetch emails.</p>";
  }
}

// ===== Calendar =====
function setupCalendar() {
  document.getElementById("fetch-events").addEventListener("click", fetchEvents);

  document.getElementById("show-add-event").addEventListener("click", () => {
    document.getElementById("add-event-form").classList.toggle("hidden");
  });

  document.getElementById("cancel-event").addEventListener("click", () => {
    document.getElementById("add-event-form").classList.add("hidden");
  });

  document.getElementById("create-event").addEventListener("click", createEvent);
}

async function fetchEvents() {
  if (!isAuthenticated) {
    showToast("⚠️ Connect Google first!", "error"); return;
  }

  const list = document.getElementById("events-list");
  list.innerHTML = "<p style='color:var(--text2)'>Fetching events...</p>";

  try {
    const res = await fetch("/agent/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "What are my upcoming calendar events?", history: [] }),
    });
    const data = await res.json();
    list.innerHTML = `
      <div class="card">
        <div class="card-body">${data.reply.replace(/\n/g, "<br/>")}</div>
      </div>
    `;
  } catch (e) {
    list.innerHTML = "<p style='color:var(--error)'>Failed to fetch events.</p>";
  }
}

async function createEvent() {
  if (!isAuthenticated) {
    showToast("⚠️ Connect Google first!", "error"); return;
  }

  const title = document.getElementById("event-title").value.trim();
  const start = document.getElementById("event-start").value;
  const end = document.getElementById("event-end").value;
  const location = document.getElementById("event-location").value.trim();

  if (!title || !start) {
    showToast("⚠️ Title and start time are required!", "error"); return;
  }

  try {
    const res = await fetch("/agent/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Create a calendar event: "${title}" starting at ${start}${end ? ` ending at ${end}` : ""}${location ? ` at ${location}` : ""}`,
        history: [],
      }),
    });
    const data = await res.json();
    showToast("✅ Event created!", "success");
    document.getElementById("add-event-form").classList.add("hidden");
    fetchEvents();
  } catch (e) {
    showToast("❌ Failed to create event.", "error");
  }
}

// ===== Reminders =====
function setupReminders() {
  document.getElementById("add-reminder").addEventListener("click", addReminder);
  fetchReminders();
}

async function addReminder() {
  const text = document.getElementById("reminder-text").value.trim();
  const time = document.getElementById("reminder-time").value;

  if (!text || !time) {
    showToast("⚠️ Fill in both fields!", "error"); return;
  }

  try {
    const res = await fetch("/reminders/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, time }),
    });
    const data = await res.json();
    showToast(`⏰ Reminder set for ${time}!`, "success");
    document.getElementById("reminder-text").value = "";
    document.getElementById("reminder-time").value = "";
    fetchReminders();
  } catch (e) {
    showToast("❌ Failed to set reminder.", "error");
  }
}

async function fetchReminders() {
  try {
    const res = await fetch("/reminders/list");
    const reminders = await res.json();
    const list = document.getElementById("reminders-list");

    if (reminders.length === 0) {
      list.innerHTML = "<p style='color:var(--text2)'>No reminders set yet.</p>";
      return;
    }

    list.innerHTML = reminders.map(r => `
      <div class="card">
        <div class="card-title">⏰ ${r.text}</div>
        <div class="card-meta">Fires at ${r.time} daily</div>
        <div class="card-actions">
          <button class="card-btn danger" onclick="deleteReminder('${r.id}')">Delete</button>
        </div>
      </div>
    `).join("");
  } catch (e) {
    console.error("Failed to fetch reminders", e);
  }
}

async function deleteReminder(id) {
  try {
    await fetch(`/reminders/${id}`, { method: "DELETE" });
    showToast("🗑️ Reminder deleted", "info");
    fetchReminders();
  } catch (e) {
    showToast("❌ Failed to delete reminder.", "error");
  }
}

// ===== Toast =====
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
