import OpenAI from "https://cdn.jsdelivr.net/npm/openai@4.28.0/+esm";
import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

// 1. CẤU HÌNH API
const openai = new OpenAI({
    apiKey: "sk-4bd27113b7dc78d1-lh6jld-f4f9c69f",
    baseURL: "https://9router.vuhai.io.vn/v1",
    dangerouslyAllowBrowser: true // Bắt buộc khi dùng SDK trên frontend
});

// Trạng thái cục bộ
let systemPrompt = "";
let chatHistory = [];

const DOM = {
    container: document.getElementById('chat-container'),
    messages: document.getElementById('chat-messages'),
    input: document.getElementById('chat-input'),
    sendBtn: document.getElementById('chat-send'),
    refreshBtn: document.getElementById('chat-refresh'),
    closeBtn: document.getElementById('chat-close'),
};

// 2. TẠO SYSTEM PROMPT TỪ FILE DATA
async function initChatbot() {
    try {
        const response = await fetch('chatbot_data.txt');
        const data = await response.text();
        
        systemPrompt = `Bạn là AI trợ lý độc quyền cho chuyên gia Nguyễn Văn A.
Dưới đây là kiến thức (Knowledge Base) của bạn:
${data}

YÊU CẦU:
- Chỉ được trả lời dựa trên Knowledge Base.
- Phải trả lời bằng Markdown đẹp, trình bày rõ ràng.
- Luôn chào thân thiện và trả lời rõ ràng.
- Kết thúc luôn có một lời mời hỏi thêm thông tin.
- Nếu người dùng hỏi ngoài phạm vi kiến thức, từ chối nhẹ nhàng và hướng dẫn người dùng liên hệ qua thông tin được cung cấp.`;
        
        chatHistory = [{ role: "system", content: systemPrompt }];
        appendMessage("ai", "Xin chào! Tôi là trợ lý AI của chuyên gia Nguyễn Văn A. Tôi có thể giúp gì cho bạn hôm nay?");
    } catch (e) {
        console.error("Lỗi khi load chatbot_data.txt:", e);
    }
}

// 3. XỬ LÝ GIAO DIỆN
function appendMessage(role, text) {
    const msgEl = document.createElement('div');
    msgEl.className = `message ${role}`;
    
    if (role === 'ai') {
        const parsedMarkdown = marked.parse(text);
        msgEl.innerHTML = `<div class="chat-markdown">${parsedMarkdown}</div>`;
    } else {
        msgEl.textContent = text;
    }
    
    DOM.messages.appendChild(msgEl);
    scrollToBottom();
}

function showTyping() {
    const typingEl = document.createElement('div');
    typingEl.id = 'typing-indicator';
    typingEl.className = 'typing-indicator';
    typingEl.innerHTML = `Đang nhập <div class="typing-dots"><span></span><span></span><span></span></div>`;
    DOM.messages.appendChild(typingEl);
    scrollToBottom();
}

function removeTyping() {
    const typingEl = document.getElementById('typing-indicator');
    if (typingEl) typingEl.remove();
}

function scrollToBottom() {
    DOM.messages.scrollTop = DOM.messages.scrollHeight;
}

// 4. LOGIC GỬI YÊU CẦU TRÒ CHUYỆN
async function sendMessage() {
    const text = DOM.input.value.trim();
    if (!text) return;

    DOM.input.value = '';
    appendMessage('user', text);
    chatHistory.push({ role: "user", content: text });
    
    showTyping();

    try {
        const completion = await openai.chat.completions.create({
            model: "ces-chatbot-gpt-5.4",
            messages: chatHistory
        });

        const reply = completion.choices[0].message.content;
        removeTyping();
        appendMessage('ai', reply);
        chatHistory.push({ role: "assistant", content: reply });
        
    } catch (error) {
        console.error(error);
        removeTyping();
        appendMessage('ai', "Xin lỗi, hiện tại tôi không thể kết nối đến hệ thống. Vui lòng thử lại sau.");
    }
}

// 5. CÁC EVENT LISTENER CHO CHAT HEADER
DOM.refreshBtn.addEventListener('click', () => {
    DOM.refreshBtn.classList.add('refresh-spin');
    DOM.messages.innerHTML = '';
    
    setTimeout(() => {
        DOM.refreshBtn.classList.remove('refresh-spin');
        chatHistory = [{ role: "system", content: systemPrompt }];
        appendMessage("ai", "Xin chào! Tôi là trợ lý AI của chuyên gia Nguyễn Văn A. Tôi có thể giúp gì cho bạn hôm nay?");
    }, 500);
});

DOM.sendBtn.addEventListener('click', sendMessage);
DOM.input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

DOM.closeBtn.addEventListener('click', () => {
    DOM.container.style.opacity = '0';
    setTimeout(() => {
        DOM.container.style.display = 'none';
    }, 300);
});

// Khởi chạy
initChatbot();
