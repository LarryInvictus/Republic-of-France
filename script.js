// Wait for DOM
window.addEventListener("DOMContentLoaded", () => {
  // Grab elements
  const inviteBtn   = document.getElementById("inviteBtn");
  const registerBtn = document.getElementById("registerBtn");
  const loginBtn    = document.getElementById("loginBtn");
  const logoutBtn   = document.getElementById("logoutBtn");

  const authStatus  = document.getElementById("authStatus");
  const emailInput  = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  const messages    = document.getElementById("messages");
  const chatInput   = document.getElementById("chatInput");
  const sendBtn     = document.getElementById("sendBtn");

  // ----------------------
  // WebSocket (live chat)
  // ----------------------
  let ws;
  try {
    ws = new WebSocket("ws://" + window.location.host);
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      addMessage(msg.author || "System", msg.text || msg.system);
    };
  } catch (e) {
    console.log("WebSocket error:", e);
  }

  // ----------------------
  // AUTH
  // ----------------------
  async function register() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      alert("Email and password required");
      return;
    }

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (data.error) alert(data.error);
    else alert("Registered, now log in.");
  }

  async function login() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      alert("Email and password required");
      return;
    }

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (data.error) {
      alert(data.error);
    } else {
      await updateAuth();
    }
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    await updateAuth();
  }

  async function updateAuth() {
    const res = await fetch("/api/me");
    if (res.status === 401) {
      authStatus.textContent = "Not logged in";
      logoutBtn.style.display = "none";
      loginBtn.style.display = "inline-block";
      registerBtn.style.display = "inline-block";
    } else {
      const user = await res.json();
      authStatus.textContent = "Logged in as " + user.email;
      logoutBtn.style.display = "inline-block";
      loginBtn.style.display = "none";
      registerBtn.style.display = "none";
    }
  }

  // ----------------------
  // CHAT
  // ----------------------
  async function loadMessages() {
    const res = await fetch("/api/chat/messages");
    const msgs = await res.json();
    messages.innerHTML = "";
    msgs.forEach(m => addMessage(m.author, m.text));
  }

  function addMessage(author, text) {
    if (!text) return;
    const div = document.createElement("div");
    div.className = "message";
    div.textContent = author + ": " + text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    const res = await fetch("/api/chat/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    const data = await res.json();
    if (data.error) {
      alert(data.error);
    } else {
      chatInput.value = "";
    }
  }

  // ----------------------
  // Buttons
  // ----------------------
  inviteBtn.addEventListener("click", () => {
    window.open("https://discord.gg/cJJ8vG6Kk", "_blank");
  });

  registerBtn.addEventListener("click", register);
  loginBtn.addEventListener("click", login);
  logoutBtn.addEventListener("click", logout);

  sendBtn.addEventListener("click", sendMessage);
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });

  // ----------------------
  // Initial load
  // ----------------------
  loadMessages();
  updateAuth();
});
