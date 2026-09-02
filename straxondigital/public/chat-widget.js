/**
 * Straxon Digital — Embeddable RAG AI Chat & Lead Capture Widget
 * White-label autonomous support & conversion agent for client websites.
 * 
 * Usage:
 * <script src="https://yourdomain.com/chat-widget.js" data-workspace="WORKSPACE_ID" data-brand="Your Agency"></script>
 */
(function () {
  const currentScript = document.currentScript || (function () {
    const scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1];
  })();

  const workspaceId = currentScript?.getAttribute("data-workspace") || "";
  const brandName = currentScript?.getAttribute("data-brand") || "AI Assistant";
  const apiUrl = currentScript?.getAttribute("data-api-url") || "https://odxuhqovqgylsflshkga.supabase.co/functions/v1";

  // Prevent multiple injections
  if (document.getElementById("straxon-chat-widget-root")) return;

  // Insert styles
  const style = document.createElement("style");
  style.innerHTML = `
    #straxon-chat-widget-root {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #straxon-chat-bubble {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      box-shadow: 0 8px 30px rgba(99, 102, 241, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #fff;
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease;
    }
    #straxon-chat-bubble:hover {
      transform: scale(1.08);
      box-shadow: 0 12px 40px rgba(99, 102, 241, 0.6);
    }
    #straxon-chat-window {
      position: absolute;
      bottom: 75px;
      right: 0;
      width: 380px;
      max-width: calc(100vw - 32px);
      height: 560px;
      max-height: calc(100vh - 120px);
      background: #0d0f17;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
      display: none;
      flex-direction: column;
      overflow: hidden;
      backdrop-filter: blur(20px);
    }
    #straxon-chat-window.open {
      display: flex;
      animation: straxonChatIn 0.25s ease forwards;
    }
    @keyframes straxonChatIn {
      from { opacity: 0; transform: translateY(15px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .straxon-chat-header {
      padding: 16px 20px;
      background: rgba(255, 255, 255, 0.04);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .straxon-chat-title {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .straxon-chat-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
    }
    .straxon-chat-close {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 20px;
      line-height: 1;
      padding: 4px;
    }
    .straxon-chat-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .straxon-msg {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 13px;
      line-height: 1.5;
      word-break: break-word;
    }
    .straxon-msg.bot {
      background: rgba(255, 255, 255, 0.08);
      color: #f1f5f9;
      border: 1px solid rgba(255, 255, 255, 0.06);
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    .straxon-msg.user {
      background: #6366f1;
      color: #fff;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .straxon-chat-lead-gate {
      padding: 20px;
      background: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.2);
      border-radius: 14px;
      margin: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .straxon-chat-lead-gate input {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      padding: 10px 12px;
      color: #fff;
      font-size: 13px;
      outline: none;
    }
    .straxon-chat-lead-gate input:focus {
      border-color: #6366f1;
    }
    .straxon-chat-lead-gate button {
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      border: none;
      border-radius: 8px;
      color: #fff;
      padding: 10px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .straxon-chat-footer {
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.02);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      gap: 8px;
    }
    .straxon-chat-input {
      flex: 1;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      padding: 10px 14px;
      color: #fff;
      font-size: 13px;
      outline: none;
    }
    .straxon-chat-input:focus {
      border-color: #6366f1;
    }
    .straxon-chat-send {
      background: #6366f1;
      border: none;
      border-radius: 10px;
      width: 40px;
      height: 40px;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s;
    }
    .straxon-chat-send:hover {
      background: #4f46e5;
    }
    .straxon-chat-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(style);

  // Create Container
  const root = document.createElement("div");
  root.id = "straxon-chat-widget-root";
  root.innerHTML = `
    <div id="straxon-chat-window">
      <div class="straxon-chat-header">
        <div class="straxon-chat-title">
          <div class="straxon-chat-indicator"></div>
          <span>${brandName} AI</span>
        </div>
        <button class="straxon-chat-close" id="straxon-close-btn">&times;</button>
      </div>

      <div class="straxon-chat-messages" id="straxon-msgs">
        <div class="straxon-msg bot">
          👋 Hello! I am the ${brandName} autonomous intelligence agent. Ask me anything about our services, pricing, or strategic deliverables!
        </div>
      </div>

      <div id="straxon-gate-container"></div>

      <div class="straxon-chat-footer">
        <input type="text" id="straxon-input" class="straxon-chat-input" placeholder="Type a question..." />
        <button id="straxon-send" class="straxon-chat-send">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>

    <div id="straxon-chat-bubble" title="Chat with AI">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    </div>
  `;
  document.body.appendChild(root);

  // Widget Logic
  const bubble = document.getElementById("straxon-chat-bubble");
  const win = document.getElementById("straxon-chat-window");
  const closeBtn = document.getElementById("straxon-close-btn");
  const msgs = document.getElementById("straxon-msgs");
  const input = document.getElementById("straxon-input");
  const sendBtn = document.getElementById("straxon-send");
  const gateContainer = document.getElementById("straxon-gate-container");

  let isOpen = false;
  let userIdentified = localStorage.getItem("straxon_lead_captured") === "true";
  let leadName = localStorage.getItem("straxon_lead_name") || "";
  let leadEmail = localStorage.getItem("straxon_lead_email") || "";

  function toggleChat() {
    isOpen = !isOpen;
    if (isOpen) {
      win.classList.add("open");
      if (!userIdentified) renderLeadGate();
      setTimeout(() => input?.focus(), 100);
    } else {
      win.classList.remove("open");
    }
  }

  bubble.addEventListener("click", toggleChat);
  closeBtn.addEventListener("click", toggleChat);

  function renderLeadGate() {
    gateContainer.innerHTML = `
      <div class="straxon-chat-lead-gate" id="straxon-lead-form">
        <p style="margin: 0; font-size: 12px; color: #cbd5e1; line-height: 1.4;">
          Introduce yourself to unlock personalized AI assistance and instant pricing proposals:
        </p>
        <input type="text" id="straxon-lead-input-name" placeholder="Your Name" required />
        <input type="email" id="straxon-lead-input-email" placeholder="Work Email" required />
        <button id="straxon-lead-submit">Start Conversation</button>
      </div>
    `;

    document.getElementById("straxon-lead-submit")?.addEventListener("click", () => {
      const nameVal = (document.getElementById("straxon-lead-input-name") as HTMLInputElement)?.value.trim();
      const emailVal = (document.getElementById("straxon-lead-input-email") as HTMLInputElement)?.value.trim();

      if (!nameVal || !emailVal) return;

      leadName = nameVal;
      leadEmail = emailVal;
      userIdentified = true;
      localStorage.setItem("straxon_lead_captured", "true");
      localStorage.setItem("straxon_lead_name", leadName);
      localStorage.setItem("straxon_lead_email", leadEmail);

      gateContainer.innerHTML = "";

      // Post lead asynchronously to agency CRM
      try {
        fetch(`${apiUrl}/notify-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "chat_lead_captured",
            name: leadName,
            email: leadEmail,
            brand: brandName,
            workspaceId,
          }),
        }).catch(() => {});
      } catch (_) {}

      appendMessage(`Nice to meet you, ${leadName}! How can we accelerate your business today?`, "bot");
    });
  }

  function appendMessage(text, sender) {
    const msg = document.createElement("div");
    msg.className = `straxon-msg ${sender}`;
    msg.innerText = text;
    msgs.appendChild(msg);
    msgs.scrollTop = msgs.scrollHeight;
  }

  async function handleSend() {
    const query = input.value.trim();
    if (!query) return;

    if (!userIdentified) {
      appendMessage(query, "user");
      input.value = "";
      renderLeadGate();
      return;
    }

    appendMessage(query, "user");
    input.value = "";
    sendBtn.disabled = true;

    // Show typing indicator
    const typing = document.createElement("div");
    typing.className = "straxon-msg bot";
    typing.innerText = "Analyzing Knowledge Base...";
    typing.id = "straxon-typing";
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;

    try {
      const res = await fetch(`${apiUrl}/chat-assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          workspaceId: workspaceId || undefined,
          leadInfo: { name: leadName, email: leadEmail },
        }),
      });

      typing.remove();

      if (res.ok) {
        const data = await res.json();
        appendMessage(data.reply || data.response || "I have received your request and shared it with our team.", "bot");
      } else {
        appendMessage("Thank you for your question. Our senior strategist will follow up directly at " + leadEmail, "bot");
      }
    } catch (e) {
      typing.remove();
      appendMessage("Thank you for your message! Our team has been notified and will reach out to " + leadEmail, "bot");
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  sendBtn.addEventListener("click", handleSend);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSend();
  });
})();
