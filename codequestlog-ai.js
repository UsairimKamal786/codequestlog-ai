// codequestlog-ai.js — frontend logic for CodeQuestLog AI
// Calls the Cloudflare Pages Function at /api — the Gemini key never appears here.

const API_URL = '/api'; // handled by functions/api.js on Cloudflare Pages

const inputArea = document.getElementById('inputArea');
const sendBtn = document.getElementById('sendBtn');
const chatArea = document.getElementById('chatArea');
const welcome = document.getElementById('welcome');
const voiceBtn = document.getElementById('voiceBtn');
const toast = document.getElementById('toast');
const msgCountEl = document.getElementById('msgCount');
const limitBanner = document.getElementById('limitBanner');

let messages = [];
let isLoading = false;
let isListening = false;
let recognition = null;

// ── Daily message limit (50/day, stored per-browser) ──
const DAILY_LIMIT = 50;

function getTodayKey() {
  return 'cql_msgs_' + new Date().toISOString().split('T')[0];
}

function getMsgCount() {
  return parseInt(localStorage.getItem(getTodayKey()) || '0');
}

function incrementMsgCount() {
  const count = getMsgCount() + 1;
  localStorage.setItem(getTodayKey(), count);
  updateCounter();
  return count;
}

function updateCounter() {
  const count = getMsgCount();
  msgCountEl.textContent = count;
  if (count >= DAILY_LIMIT) {
    limitBanner.classList.add('show');
    sendBtn.disabled = true;
    inputArea.disabled = true;
    inputArea.placeholder = 'Daily limit reached. Come back tomorrow!';
  }
}

// ── Toast ──
function showToast(msg, type) {
  toast.textContent = msg;
  toast.className = 'toast ' + type + ' show';
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Auto-resize textarea ──
inputArea.addEventListener('input', () => {
  inputArea.style.height = 'auto';
  inputArea.style.height = Math.min(inputArea.scrollHeight, 160) + 'px';
});

// ── Quick prompt chips ──
function setPrompt(text) {
  inputArea.value = text;
  inputArea.dispatchEvent(new Event('input'));
  inputArea.focus();
}

// ── New chat ──
document.getElementById('newBtn').addEventListener('click', () => {
  messages = [];
  chatArea.innerHTML = '';
  chatArea.style.display = 'none';
  welcome.style.display = 'flex';
});

// ── Crown/logo SVG for AI avatar ──
function crownSVG() {
  return `<svg viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 28L9 14L16 21L19 10L22 21L29 14L33 28H5Z" fill="url(#ag)" stroke="#7c3aed" stroke-width="1.5" stroke-linejoin="round"/>
    <rect x="5" y="30" width="28" height="3" rx="1.5" fill="#7c3aed"/>
    <defs><linearGradient id="ag" x1="5" y1="10" x2="33" y2="28" gradientUnits="userSpaceOnUse">
      <stop stop-color="#a78bfa"/><stop offset="1" stop-color="#5b21b6"/>
    </linearGradient></defs>
  </svg>`;
}

// ── Append a message bubble ──
function appendMsg(role, text) {
  welcome.style.display = 'none';
  chatArea.style.display = 'flex';

  const div = document.createElement('div');
  div.className = 'msg ' + role;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  if (role === 'user') avatar.textContent = 'You';
  else avatar.innerHTML = crownSVG();

  const col = document.createElement('div');
  col.className = 'msg-col';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.textContent = text;
  col.appendChild(bubble);

  if (role === 'ai') {
    const tag = document.createElement('div');
    tag.className = 'msg-tag';
    tag.textContent = 'CodeQuestLog AI · Gemini 2.0 Flash';
    col.appendChild(tag);
  }

  div.appendChild(avatar);
  div.appendChild(col);
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
  return bubble;
}

// ── Typing indicator ──
function showTyping() {
  welcome.style.display = 'none';
  chatArea.style.display = 'flex';
  const div = document.createElement('div');
  div.className = 'msg ai';
  div.id = 'typing';
  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.innerHTML = crownSVG();
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
  div.appendChild(avatar);
  div.appendChild(bubble);
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function hideTyping() {
  const t = document.getElementById('typing');
  if (t) t.remove();
}

// ── Send message ──
async function sendMessage() {
  const text = inputArea.value.trim();
  if (!text || isLoading) return;

  if (getMsgCount() >= DAILY_LIMIT) {
    limitBanner.classList.add('show');
    return;
  }

  isLoading = true;
  sendBtn.disabled = true;
  inputArea.value = '';
  inputArea.style.height = 'auto';

  appendMsg('user', text);
  messages.push({ role: 'user', content: text });
  incrementMsgCount();
  showTyping();

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    });

    const data = await res.json();
    hideTyping();

    if (data.error) {
      showToast(data.error, 'err');
      messages.pop();
    } else {
      messages.push({ role: 'assistant', content: data.reply });
      appendMsg('ai', data.reply);
    }
  } catch (err) {
    hideTyping();
    showToast('Cannot reach the server. Check the Function is deployed.', 'err');
    messages.pop();
  }

  isLoading = false;
  if (getMsgCount() < DAILY_LIMIT) sendBtn.disabled = false;
  inputArea.focus();
}

sendBtn.addEventListener('click', sendMessage);
inputArea.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

// ── Voice input (browser speech recognition) ──
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.onresult = (e) => {
    inputArea.value = Array.from(e.results).map(r => r[0].transcript).join('');
    inputArea.dispatchEvent(new Event('input'));
  };
  recognition.onend = () => { isListening = false; voiceBtn.classList.remove('listening'); };
  recognition.onerror = () => { isListening = false; voiceBtn.classList.remove('listening'); showToast('Voice error. Try again.', 'err'); };
  voiceBtn.addEventListener('click', () => {
    if (isListening) { recognition.stop(); }
    else { recognition.start(); isListening = true; voiceBtn.classList.add('listening'); }
  });
} else {
  voiceBtn.style.opacity = '.4';
  voiceBtn.style.cursor = 'not-allowed';
  voiceBtn.title = 'Voice not supported in this browser';
}

// Init counter on load
updateCounter();
