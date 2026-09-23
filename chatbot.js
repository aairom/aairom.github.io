/**
 * chatbot.js — Vanilla JS FAQ Chatbot for aairom.github.io
 * License: MIT
 * No dependencies · No backend · No API keys required
 *
 * ── HOW TO CUSTOMIZE ──────────────────────────────────────────────────────
 * 1. Edit CHATBOT_CONFIG below with your own profile links
 * 2. Edit KNOWLEDGE_BASE — each entry has `patterns` (keywords to match)
 *    and `response` (reply text). Patterns are matched case-insensitively.
 * 3. Responses support **bold**, *italic*, [link](url), and \n line breaks.
 * 4. Add new topics by appending entries to KNOWLEDGE_BASE.
 * ──────────────────────────────────────────────────────────────────────────
 */

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE CONFIG
// ═══════════════════════════════════════════════════════════════════════════
const CHATBOT_CONFIG = {
  ownerName:    'Alain Airom',
  ownerHandle:  'aairom',
  ownerCompany: 'IBM France',
  ownerCountry: 'France',
  githubUrl:    'https://github.com/aairom',
  linkedinUrl:  'https://fr.linkedin.com/in/aairom',
  credlyUrl:    'https://www.credly.com/users/alain-airom/badges/credly'
};

// ═══════════════════════════════════════════════════════════════════════════
// KNOWLEDGE BASE
// ═══════════════════════════════════════════════════════════════════════════
const KNOWLEDGE_BASE = [
  {
    id: 'greeting',
    patterns: ['hello', 'hey', 'bonjour', 'salut', 'good morning', 'good afternoon', 'howdy', 'sup', '^hi$', 'hi there', 'hi!'],
    response: `👋 Hello! I'm Alain's assistant bot.\nAsk me about his **background**, **skills**, **projects**, **blog**, or **how to reach him**.\nType **help** to see all topics!`
  },
  {
    id: 'who',
    patterns: ['who are you', 'who is alain', 'about alain', 'tell me about', 'introduce', 'bio', 'background'],
    response: `🧑‍💻 **Alain Airom** (aka *aairom*) is an IBMer based in **France**.\nHe's passionate about the full tech stack — from cloud infrastructure and AI/ML to developer tools and open-source. On GitHub since **2015**, he believes in *learning by doing and sharing what you build*.`
  },
  {
    id: 'work',
    patterns: ['work', 'job', 'ibm', 'company', 'employer', 'profession', 'role', 'what do you do', 'where do you work'],
    response: `🏢 Alain works at **IBM France**.\nHe covers cloud, AI, DevOps, and platform engineering — and is an active open-source contributor who shares everything publicly on GitHub.`
  },
  {
    id: 'skills',
    patterns: ['skills', 'skill', 'technology', 'tech stack', 'expertise', 'speciality', 'specialization', 'what do you know', 'tools', 'stack', 'languages', 'frameworks'],
    response: `🛠️ **Alain's tech areas:**\n\n🤖 **AI & LLMs** — Docling, RAG, GraphRAG, Ollama, llama.cpp, watsonx\n☁️ **Cloud & IBM** — IBM Cloud, OpenShift, Kubernetes, Power Systems, HashiCorp Vault\n🐍 **Dev** — Python, FastAPI, JavaScript, Node.js, Streamlit, Gradio, Docker, Podman\n🔧 **Ops** — Git, GitHub, Ansible, OpenSearch, MCP, IBM Bob`
  },
  {
    id: 'ai',
    patterns: ['ai', 'llm', 'machine learning', 'artificial intelligence', 'rag', 'ollama', 'watsonx', 'docling', 'graphrag', 'langchain', 'llama'],
    response: `🤖 AI & LLMs are Alain's primary focus area.\nHe works with **RAG pipelines**, **GraphRAG / Knowledge Graphs**, **Ollama / llama.cpp** for local LLMs, and **IBM watsonx** for enterprise AI.\nCheck his articles on [Medium](https://medium.com/@alain-airom) or [ZyVOP](https://zyvop.com/author/alain) for deep-dives on these topics!`
  },
  {
    id: 'cloud',
    patterns: ['cloud', 'kubernetes', 'openshift', 'ibm cloud', 'power systems', 'vault', 'k8s', 'container', 'hashicorp'],
    response: `☁️ On the cloud side, Alain specializes in:\n**IBM Cloud**, **OpenShift & Kubernetes**, **IBM Power Systems**, and **HashiCorp Vault** for secrets management.\nHe publishes hands-on labs and demos covering all of these on GitHub.`
  },
  {
    id: 'projects',
    patterns: ['project', 'projects', 'repo', 'repos', 'repository', 'repositories', 'portfolio', 'built', 'demo', 'lab', 'show me', 'github'],
    response: `📦 Alain has **100+ public repositories** on GitHub covering AI/ML experiments, IBM Cloud labs, automation scripts, and community contributions.\n\n👉 [Browse all repos on GitHub](https://github.com/aairom?tab=repositories)\n\nOr scroll down to the **Repositories** section of this page for a live, searchable view!`
  },
  {
    id: 'blog',
    patterns: ['blog', 'article', 'write', 'post', 'medium', 'dev.to', 'dzone', 'zyvop', 'publish', 'writing', 'read', 'content'],
    response: `✍️ Alain publishes technical articles on multiple platforms:\n\n📰 [Medium](https://medium.com/@alain-airom)\n💻 [Dev.to](https://dev.to/dashboard)\n🌐 [ZyVOP](https://zyvop.com/author/alain)\n📊 [DZone](https://dzone.com/users/1458735/aairom.html)`
  },
  {
    id: 'contact',
    patterns: ['contact', 'email', 'reach', 'message', 'get in touch', 'talk', 'connect', 'hire', 'collaboration', 'collab', 'dm'],
    response: `📬 **Reach Alain via:**\n\n💼 [LinkedIn](https://fr.linkedin.com/in/aairom)\n🐙 [GitHub](https://github.com/aairom)\n\nHe's open to collaboration, questions, and interesting conversations. 🤝\nYou can also scroll to the **Contact** section of this page!`
  },
  {
    id: 'linkedin',
    patterns: ['linkedin', 'professional network', 'cv', 'resume'],
    response: `💼 Find Alain on LinkedIn: [linkedin.com/in/aairom](https://fr.linkedin.com/in/aairom)\n\nFor **certifications and badges**, check his Credly profile:\n🏅 [credly.com/users/alain-airom](https://www.credly.com/users/alain-airom/badges/credly)`
  },
  {
    id: 'certifications',
    patterns: ['certif', 'certification', 'certifications', 'badge', 'credly', 'credential', 'award', 'certified'],
    response: `🏅 Alain holds various professional certifications visible on Credly:\n👉 [View all badges](https://www.credly.com/users/alain-airom/badges/credly)`
  },
  {
    id: 'location',
    patterns: ['where', 'location', 'country', 'france', 'city', 'based', 'live'],
    response: `📍 Alain is based in **France** and works at **IBM France**. He's active in both the French and international tech communities.`
  },
  {
    id: 'opensource',
    patterns: ['open source', 'open-source', 'contribute', 'contribution', 'community', 'oss'],
    response: `🌍 Open-source is central to Alain's work. He shares experiments, labs, and tools publicly on GitHub and contributes to the community through articles and code.\n👉 [github.com/aairom](https://github.com/aairom)`
  },
  {
    id: 'python',
    patterns: ['python', 'fastapi', 'streamlit', 'gradio', 'jupyter', 'notebook'],
    response: `🐍 Python is Alain's primary language for AI/ML pipelines, REST APIs (**FastAPI**), interactive demos (**Streamlit**, **Gradio**), and Jupyter notebooks for research and experimentation.`
  },
  {
    id: 'docker',
    patterns: ['docker', 'podman', 'ansible', 'automation', 'devops', 'infrastructure'],
    response: `🐳 For containerization & DevOps, Alain uses **Docker**, **Podman**, **Ansible** for automation, and **Kubernetes/OpenShift** for orchestration. Most of his repos include ready-to-run container setups.`
  },
  {
    id: 'github_profile',
    patterns: ['github profile', 'followers', 'stars', 'since 2015', 'member since', 'how long'],
    response: `🐙 Alain joined GitHub in **2015** and has **100+ public repos** and **101+ followers**.\n👉 [github.com/aairom](https://github.com/aairom)`
  },
  {
    id: 'help',
    patterns: ['help', 'what can you do', 'what can i ask', 'commands', 'options', 'menu', 'topics', '?'],
    response: `💡 **Things you can ask me:**\n\n👤 Who is Alain / About him\n🛠️ Skills / Tech stack\n📦 Projects / Repositories\n✍️ Blog / Articles\n📬 Contact / LinkedIn\n🏢 Work / IBM\n🏅 Certifications\n📍 Location\n🌍 Open-source contributions\n🤖 AI & LLMs\n☁️ Cloud & Kubernetes\n\nJust type naturally — I'll do my best!`
  },
  {
    id: 'thanks',
    patterns: ['thank', 'thanks', 'merci', 'great', 'awesome', 'cool', 'perfect', 'nice', 'good job', 'well done'],
    response: `😊 You're welcome! Anything else you'd like to know about Alain?`
  },
  {
    id: 'bye',
    patterns: ['bye', 'goodbye', 'ciao', 'au revoir', 'see you', 'later', 'quit', 'exit', 'close'],
    response: `👋 See you later! Connect with Alain on [LinkedIn](https://fr.linkedin.com/in/aairom) or [GitHub](https://github.com/aairom). Have a great day! 🚀`
  }
];

// ═══════════════════════════════════════════════════════════════════════════
// FALLBACK RESPONSES (cycled round-robin when no pattern matches)
// ═══════════════════════════════════════════════════════════════════════════
const FALLBACK_RESPONSES = [
  `🤔 I'm not sure about that one. Try asking about Alain's **skills**, **projects**, **blog**, or **contact info**. Or type **help** to see all topics.`,
  `❓ I didn't catch that. You can ask about Alain's **background**, **tech stack**, **GitHub repos**, or **how to reach him**.`,
  `🤷 That's outside my knowledge! Try asking about Alain's **work**, **AI projects**, or **articles**. Type **help** for all options.`
];

// ═══════════════════════════════════════════════════════════════════════════
// QUICK-REPLY CHIPS
// ═══════════════════════════════════════════════════════════════════════════
const QUICK_REPLIES = [
  { label: '👤 About',     message: 'Who is Alain?' },
  { label: '🛠️ Skills',   message: 'What are his skills?' },
  { label: '📦 Projects',  message: 'Show me his projects' },
  { label: '✍️ Blog',     message: 'Where does he write?' },
  { label: '📬 Contact',   message: 'How to contact him?' }
];

// ═══════════════════════════════════════════════════════════════════════════
// ENGINE
// ═══════════════════════════════════════════════════════════════════════════
let _fallbackIndex = 0;

function _chatFindResponse(userMessage) {
  const msg = userMessage.toLowerCase().trim();
  for (const entry of KNOWLEDGE_BASE) {
    if (entry.patterns.some(p => {
      // Patterns starting with ^ are raw regex (e.g. '^hi$' for exact-match words)
      if (p.startsWith('^')) return new RegExp(p, 'i').test(msg);
      // Multi-word patterns: plain substring match (e.g. "tech stack", "get in touch")
      if (p.includes(' ')) return msg.includes(p);
      // Single-word patterns: \b on both sides = whole-word match.
      // Prevents "hi" matching "his"/"this". Patterns that need prefix-match
      // (e.g. "skills" covers "skill" too) are listed explicitly with their full form.
      return new RegExp('\\b' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(msg);
    })) {
      return entry.response;
    }
  }
  const reply = FALLBACK_RESPONSES[_fallbackIndex % FALLBACK_RESPONSES.length];
  _fallbackIndex++;
  return reply;
}

function _chatRenderMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\n/g, '<br>');
}

// ═══════════════════════════════════════════════════════════════════════════
// UI — runs immediately as an IIFE, consistent with main.js style
// ═══════════════════════════════════════════════════════════════════════════
(function buildChatbotUI() {

  // ── Inject scoped CSS (inherits site CSS custom properties) ─────────────
  const style = document.createElement('style');
  style.id = 'aam-chatbot-styles';
  style.textContent = `
    #aam-chat-fab {
      position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999;
      width: 56px; height: 56px; border-radius: 50%;
      background: var(--clr-accent, #58a6ff);
      border: none; cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,.45);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; color: #fff;
      transition: transform .2s, box-shadow .2s;
    }
    #aam-chat-fab:hover { transform: scale(1.1); box-shadow: 0 6px 28px rgba(0,0,0,.55); }
    #aam-chat-fab:focus-visible { outline: 2px solid var(--clr-accent, #58a6ff); outline-offset: 3px; }
    .aam-fab-badge {
      position: absolute; top: -3px; right: -3px;
      background: #f85149; color: #fff; border-radius: 50%;
      width: 18px; height: 18px; font-size: .62rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      animation: aam-pulse 2s infinite;
    }
    @keyframes aam-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.25); } }

    #aam-chat-window {
      position: fixed; bottom: 5.2rem; right: 1.5rem; z-index: 9998;
      width: 340px; max-width: calc(100vw - 2rem);
      height: 490px; max-height: calc(100vh - 8rem);
      background: var(--clr-bg-alt, #161b22);
      border: 1px solid var(--clr-border, #21262d);
      border-radius: 14px;
      box-shadow: 0 10px 40px rgba(0,0,0,.65);
      display: flex; flex-direction: column;
      font-family: var(--font-sans, 'Inter', system-ui, sans-serif);
      font-size: .875rem;
      color: var(--clr-text, #e6edf3);
      transition: opacity .25s, transform .25s;
    }
    #aam-chat-window.aam-hidden {
      opacity: 0; transform: translateY(14px) scale(.96); pointer-events: none;
    }

    .aam-chat-header {
      padding: .85rem 1rem; display: flex; align-items: center; gap: .6rem;
      background: var(--clr-accent, #58a6ff);
      border-radius: 14px 14px 0 0; color: #fff; flex-shrink: 0;
    }
    .aam-chat-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: rgba(255,255,255,.22);
      display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
    }
    .aam-chat-header-info { flex: 1; min-width: 0; }
    .aam-chat-header-name { font-size: .9rem; font-weight: 700; line-height: 1.2; }
    .aam-chat-header-status { font-size: .7rem; opacity: .85; margin-top: .1rem; }
    .aam-chat-close {
      background: none; border: none; color: #fff; font-size: 1.3rem;
      cursor: pointer; padding: .2rem .35rem; border-radius: 4px; line-height: 1;
    }
    .aam-chat-close:hover { background: rgba(255,255,255,.18); }

    .aam-chat-messages {
      flex: 1; overflow-y: auto; padding: .75rem;
      display: flex; flex-direction: column; gap: .5rem;
      scroll-behavior: smooth;
    }
    .aam-chat-messages::-webkit-scrollbar { width: 4px; }
    .aam-chat-messages::-webkit-scrollbar-thumb {
      background: var(--clr-border, #21262d); border-radius: 4px;
    }

    .aam-msg {
      max-width: 88%; padding: .55rem .85rem; border-radius: 12px;
      line-height: 1.55; word-wrap: break-word;
      animation: aam-msgIn .18s ease; font-size: .84rem;
    }
    @keyframes aam-msgIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
    .aam-msg--bot {
      background: var(--clr-bg, #0d1117);
      border: 1px solid var(--clr-border, #21262d);
      color: var(--clr-text, #e6edf3);
      align-self: flex-start; border-bottom-left-radius: 3px;
    }
    .aam-msg--bot a { color: var(--clr-accent, #58a6ff); }
    .aam-msg--bot a:hover { text-decoration: underline; }
    .aam-msg--user {
      background: var(--clr-accent, #58a6ff); color: #fff;
      align-self: flex-end; border-bottom-right-radius: 3px;
    }

    .aam-typing-dots span {
      display: inline-block; width: 6px; height: 6px;
      background: var(--clr-text-muted, #8b949e); border-radius: 50%; margin: 0 2px;
      animation: aam-dot 1.2s infinite;
    }
    .aam-typing-dots span:nth-child(2) { animation-delay: .2s; }
    .aam-typing-dots span:nth-child(3) { animation-delay: .4s; }
    @keyframes aam-dot {
      0%,80%,100% { transform: scale(.8); opacity: .4; }
      40% { transform: scale(1.15); opacity: 1; }
    }

    .aam-quick-replies {
      display: flex; flex-wrap: wrap; gap: .3rem;
      padding: .4rem .75rem .5rem; flex-shrink: 0;
      border-top: 1px solid var(--clr-border, #21262d);
    }
    .aam-quick-btn {
      background: none;
      border: 1px solid var(--clr-accent, #58a6ff);
      color: var(--clr-accent, #58a6ff);
      border-radius: 20px; padding: .28rem .65rem;
      font-size: .72rem; cursor: pointer; white-space: nowrap;
      transition: background .15s, color .15s;
    }
    .aam-quick-btn:hover { background: var(--clr-accent, #58a6ff); color: #fff; }

    .aam-chat-form {
      display: flex; gap: .4rem; padding: .6rem .75rem; flex-shrink: 0;
      border-top: 1px solid var(--clr-border, #21262d);
      background: var(--clr-bg-alt, #161b22);
      border-radius: 0 0 14px 14px;
    }
    .aam-chat-input {
      flex: 1; background: var(--clr-bg, #0d1117);
      border: 1px solid var(--clr-border, #21262d);
      border-radius: 8px; padding: .45rem .75rem;
      color: var(--clr-text, #e6edf3); font-size: .84rem;
      font-family: inherit; outline: none;
      transition: border-color .2s;
    }
    .aam-chat-input:focus { border-color: var(--clr-accent, #58a6ff); }
    .aam-chat-input::placeholder { color: var(--clr-text-muted, #8b949e); }
    .aam-chat-send {
      background: var(--clr-accent, #58a6ff); color: #fff;
      border: none; border-radius: 8px;
      padding: .45rem .8rem; cursor: pointer; font-size: 1rem;
      transition: background .15s, transform .1s; flex-shrink: 0;
    }
    .aam-chat-send:hover { background: var(--clr-accent-hover, #79b8ff); }
    .aam-chat-send:active { transform: scale(.94); }

    @media (max-width: 400px) {
      #aam-chat-window { right: .75rem; left: .75rem; width: auto; }
      #aam-chat-fab { bottom: 1rem; right: 1rem; }
    }
  `;
  document.head.appendChild(style);

  // ── FAB button ─────────────────────────────────────────────────────────
  const fab = document.createElement('button');
  fab.id = 'aam-chat-fab';
  fab.setAttribute('aria-label', 'Open chat assistant');
  fab.setAttribute('aria-expanded', 'false');
  fab.setAttribute('aria-controls', 'aam-chat-window');
  fab.innerHTML = `<span aria-hidden="true">💬</span><span class="aam-fab-badge" aria-label="1 new message">1</span>`;
  document.body.appendChild(fab);

  // ── Chat window ────────────────────────────────────────────────────────
  const win = document.createElement('div');
  win.id = 'aam-chat-window';
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-label', "Chat with Alain's assistant");
  win.setAttribute('aria-modal', 'false');
  win.classList.add('aam-hidden');
  win.innerHTML = `
    <div class="aam-chat-header">
      <div class="aam-chat-avatar" aria-hidden="true">🤖</div>
      <div class="aam-chat-header-info">
        <div class="aam-chat-header-name">Alain's Assistant</div>
        <div class="aam-chat-header-status">● Online · Ask me anything</div>
      </div>
      <button class="aam-chat-close" id="aam-chat-close" aria-label="Close chat">✕</button>
    </div>
    <div class="aam-chat-messages" id="aam-chat-messages" aria-live="polite" aria-label="Chat messages"></div>
    <div class="aam-quick-replies" id="aam-quick-replies" aria-label="Quick questions"></div>
    <form class="aam-chat-form" id="aam-chat-form" autocomplete="off">
      <input
        type="text"
        class="aam-chat-input"
        id="aam-chat-input"
        placeholder="Ask me about Alain…"
        aria-label="Type your message"
        maxlength="200"
      />
      <button type="submit" class="aam-chat-send" aria-label="Send message">➤</button>
    </form>
  `;
  document.body.appendChild(win);

  // ── DOM refs ────────────────────────────────────────────────────────────
  const messagesEl = document.getElementById('aam-chat-messages');
  const inputEl    = document.getElementById('aam-chat-input');
  const formEl     = document.getElementById('aam-chat-form');
  const closeBtn   = document.getElementById('aam-chat-close');
  const quickEl    = document.getElementById('aam-quick-replies');

  // ── Quick-reply chips ───────────────────────────────────────────────────
  QUICK_REPLIES.forEach(qr => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'aam-quick-btn';
    btn.textContent = qr.label;
    btn.addEventListener('click', () => sendMessage(qr.message));
    quickEl.appendChild(btn);
  });

  // ── Open / close ────────────────────────────────────────────────────────
  function openChat() {
    win.classList.remove('aam-hidden');
    fab.setAttribute('aria-expanded', 'true');
    const badge = fab.querySelector('.aam-fab-badge');
    if (badge) badge.remove();
    if (messagesEl.childElementCount === 0) showWelcome();
    inputEl.focus();
  }

  function closeChat() {
    win.classList.add('aam-hidden');
    fab.setAttribute('aria-expanded', 'false');
    fab.focus();
  }

  fab.addEventListener('click', () =>
    win.classList.contains('aam-hidden') ? openChat() : closeChat()
  );
  closeBtn.addEventListener('click', closeChat);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !win.classList.contains('aam-hidden')) closeChat();
  });

  // ── Message rendering ────────────────────────────────────────────────────
  function appendMessage(text, role) {
    const el = document.createElement('div');
    el.className = `aam-msg aam-msg--${role}`;
    if (role === 'bot') {
      el.innerHTML = _chatRenderMarkdown(text);
    } else {
      el.textContent = text;
    }
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'aam-msg aam-msg--bot';
    el.id = 'aam-typing';
    el.innerHTML = `<span class="aam-typing-dots"><span></span><span></span><span></span></span>`;
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function removeTyping() {
    const el = document.getElementById('aam-typing');
    if (el) el.remove();
  }

  function showWelcome() {
    appendMessage(
      `👋 Hi! I'm Alain's virtual assistant.\n\nAsk me about his **skills**, **projects**, **blog**, or **contact info** — or type **help** for all topics! 😊`,
      'bot'
    );
  }

  // ── Send & respond ────────────────────────────────────────────────────────
  function sendMessage(text) {
    const trimmed = (text !== undefined ? text : inputEl.value).trim();
    if (!trimmed) return;
    inputEl.value = '';

    appendMessage(trimmed, 'user');
    showTyping();

    setTimeout(() => {
      removeTyping();
      appendMessage(_chatFindResponse(trimmed), 'bot');
    }, 550);
  }

  formEl.addEventListener('submit', e => {
    e.preventDefault();
    sendMessage();
  });

})();
