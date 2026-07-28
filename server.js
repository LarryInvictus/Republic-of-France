const express = require("express");
const fs = require("fs");
const path = require("path");
const session = require("express-session");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());
app.use(express.static("public"));

app.use(
  session({
    secret: "france-secret",
    resave: false,
    saveUninitialized: false,
  })
);

const USERS_FILE = "users.json";
const MSG_FILE = "messages.json";

function load(file) {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file));
}

function save(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ----------------------
// AUTH
// ----------------------
app.post("/api/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Missing fields" });

  const users = load(USERS_FILE);
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: "Email already exists" });
  }

  users.push({ email, password });
  save(USERS_FILE, users);

  res.json({ success: true });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const users = load(USERS_FILE);

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: "Invalid login" });

  req.session.user = { email };
  res.json({ success: true });
});

app.get("/api/me", (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Not logged in" });
  res.json(req.session.user);
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// ----------------------
// CHAT
// ----------------------
app.get("/api/chat/messages", (req, res) => {
  const msgs = load(MSG_FILE);
  res.json(msgs);
});

app.post("/api/chat/send", (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Login required" });

  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Empty message" });

  const msgs = load(MSG_FILE);
  const msg = {
    author: req.session.user.email,
    text,
    time: Date.now(),
  };

  msgs.push(msg);
  save(MSG_FILE, msgs);

  // Broadcast to all WebSocket clients
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(msg));
    }
  });

  res.json({ success: true });
});

// ----------------------
// WEBSOCKET
// ----------------------
wss.on("connection", ws => {
  ws.send(JSON.stringify({ system: "Bienvenue au chat 🇫🇷" }));
});

// ----------------------
server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
