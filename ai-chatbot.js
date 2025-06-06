// === AI CHATBOT SYSTÉM ===

class AIChatbot {
    constructor() {
        // ⚠️ VAROVÁNÍ: V produkci NIKDY API klíč do frontend kódu!
        // Vytvořte backend endpoint pro bezpečnost
        this.apiKey = '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';
        this.apiUrl = 'https://api.openai.com/v1/chat/completions';
        
        this.isOpen = false;
        this.isTyping = false;
        this.conversationHistory = [];
        this.isAuthenticated = false;
        
        // Nastavení chatbota
        this.settings = {
            model: 'gpt-3.5-turbo',
            maxTokens: 1000,
            temperature: 0.7,
            systemPrompt: `Jsi pomocný AI asistent pro systém Mobil Maják - systém pro správu prodejních dat mobilních operátorů. 

Můžeš pomoci s:
- Vysvětlením funkcí systému
- Analýzou prodejních dat  
- Tipy pro optimalizaci prodeje
- Odpovědi na otázky o statistikách
- Obecné dotazy související s prodejem mobilních služeb

Odpovídej v češtině, buď přátelský a profesionální. Pokud nevíš odpověď, přiznej to a navrhni alternativní řešení.`
        };
        
        this.init();
    }

    init() {
        this.checkAuthentication();
        
        if (this.isAuthenticated) {
            this.createChatbotUI();
            this.loadConversationHistory();
            console.log('🤖 AI Chatbot inicializován');
        }
    }

    checkAuthentication() {
        // Chatbot je dostupný pro všechny uživatele
        this.isAuthenticated = true;
    }

    // === UI VYTVOŘENÍ ===
    createChatbotUI() {
        // Přidej styly nejdříve
        this.addChatbotStyles();
        
        // Floating chatbot button
        const chatButton = document.createElement('div');
        chatButton.className = 'chatbot-button';
        chatButton.innerHTML = '🤖';
        chatButton.title = 'Otevřít AI asistenta';
        
        chatButton.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex !important;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
            z-index: 1000;
            transition: all 0.3s ease;
            animation: chatbot-pulse 2s infinite;
        `;

        // Chatbot window
        const chatWindow = document.createElement('div');
        chatWindow.className = 'chatbot-window';
        chatWindow.style.cssText = `
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 380px;
            height: 500px;
            background: var(--bg-primary);
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            border: 1px solid var(--border-color);
            z-index: 1001;
            transform: scale(0);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            display: flex;
            flex-direction: column;
            max-height: 80vh;
        `;

        chatWindow.innerHTML = `
            <div class="chatbot-header" style="
                padding: 1rem;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 16px 16px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div class="chatbot-title" style="
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 600;
                ">
                    <span>🤖</span>
                    <span>AI Asistent</span>
                    <div class="status-indicator" style="
                        width: 8px;
                        height: 8px;
                        background: #22c55e;
                        border-radius: 50%;
                        animation: pulse 2s infinite;
                    "></div>
                </div>
                <div class="chatbot-controls" style="display: flex; gap: 0.5rem;">
                    <button class="minimize-btn" style="
                        background: rgba(255,255,255,0.2);
                        border: none;
                        color: white;
                        width: 24px;
                        height: 24px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">−</button>
                    <button class="close-btn" style="
                        background: rgba(255,255,255,0.2);
                        border: none;
                        color: white;
                        width: 24px;
                        height: 24px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">×</button>
                </div>
            </div>
            
            <div class="chatbot-messages" style="
                flex: 1;
                padding: 1rem;
                overflow-y: auto;
                background: var(--bg-secondary);
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                max-height: 320px;
            ">
                <div class="welcome-message">
                    <div class="message bot-message">
                        <div class="message-avatar">🤖</div>
                        <div class="message-content">
                            <div class="message-text">
                                Ahoj! Jsem AI asistent systému Mobil Maják. Mohu ti pomoci s:
                                <br><br>
                                • Vysvětlením funkcí systému<br>
                                • Analýzou prodejních dat<br>  
                                • Tipy pro optimalizaci prodeje<br>
                                • Odpovědi na dotazy<br><br>
                                Na co se chceš zeptat?
                            </div>
                            <div class="message-time">${new Date().toLocaleTimeString('cs-CZ', {hour: '2-digit', minute: '2-digit'})}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="chatbot-input" style="
                padding: 1rem;
                border-top: 1px solid var(--border-color);
                background: var(--bg-primary);
                border-radius: 0 0 16px 16px;
            ">
                <div class="input-container" style="
                    display: flex;
                    gap: 0.5rem;
                    align-items: flex-end;
                ">
                    <div class="input-wrapper" style="
                        flex: 1;
                        position: relative;
                    ">
                        <textarea 
                            class="message-input" 
                            placeholder="Napiš svou otázku..."
                            style="
                                width: 100%;
                                min-height: 40px;
                                max-height: 100px;
                                padding: 0.75rem;
                                border: 2px solid var(--border-color);
                                border-radius: 20px;
                                background: var(--bg-secondary);
                                color: var(--text-primary);
                                resize: none;
                                outline: none;
                                font-family: inherit;
                                line-height: 1.4;
                                transition: border-color 0.2s ease;
                            "
                            rows="1"
                        ></textarea>
                        <div class="char-counter" style="
                            position: absolute;
                            bottom: -18px;
                            right: 8px;
                            font-size: 10px;
                            color: var(--text-muted);
                        ">0/500</div>
                    </div>
                    <button class="send-btn" style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border: none;
                        color: white;
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s ease;
                        flex-shrink: 0;
                    " disabled>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                        </svg>
                    </button>
                </div>
                
                <div class="quick-questions" style="
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 0.75rem;
                    flex-wrap: wrap;
                ">
                    <button class="quick-btn" data-question="Jak funguje systém Mobil Maják?">
                        Jak funguje systém?
                    </button>
                    <button class="quick-btn" data-question="Jak analyzovat prodejní data?">
                        Analýza dat
                    </button>
                    <button class="quick-btn" data-question="Tipy pro zvýšení prodeje">
                        Tipy pro prodej
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(chatButton);
        document.body.appendChild(chatWindow);

        this.chatButton = chatButton;
        this.chatWindow = chatWindow;
        this.messagesContainer = chatWindow.querySelector('.chatbot-messages');
        this.messageInput = chatWindow.querySelector('.message-input');
        this.sendButton = chatWindow.querySelector('.send-btn');
        this.charCounter = chatWindow.querySelector('.char-counter');

        this.setupEventListeners();
        this.addChatbotStyles();
    }

    addChatbotStyles() {
        // Přidej CSS animace
        if (!document.getElementById('chatbot-animations')) {
            const animationStyle = document.createElement('style');
            animationStyle.id = 'chatbot-animations';
            animationStyle.textContent = `
                @keyframes chatbot-pulse {
                    0% { transform: scale(1); box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4); }
                    50% { transform: scale(1.05); box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6); }
                    100% { transform: scale(1); box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4); }
                }
                
                .chatbot-button:hover {
                    transform: scale(1.1) !important;
                    box-shadow: 0 8px 30px rgba(102, 126, 234, 0.8) !important;
                }
            `;
            document.head.appendChild(animationStyle);
        }
        const styles = `
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            
            @keyframes typing {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-10px); }
            }
            
            .chatbot-button:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
            }
            
            .chatbot-window.open {
                transform: scale(1);
                opacity: 1;
            }
            
            .message {
                display: flex;
                gap: 0.5rem;
                align-items: flex-start;
                animation: messageSlideIn 0.3s ease;
            }
            
            @keyframes messageSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .message-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                flex-shrink: 0;
            }
            
            .bot-message .message-avatar {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            
            .user-message {
                flex-direction: row-reverse;
            }
            
            .user-message .message-avatar {
                background: var(--accent-color, #007bff);
                color: white;
                font-weight: bold;
            }
            
            .message-content {
                flex: 1;
                min-width: 0;
            }
            
            .message-text {
                background: var(--bg-primary);
                padding: 0.75rem 1rem;
                border-radius: 16px;
                border: 1px solid var(--border-color);
                color: var(--text-primary);
                line-height: 1.5;
                word-wrap: break-word;
                position: relative;
            }
            
            .user-message .message-text {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
            }
            
            .message-time {
                font-size: 0.7rem;
                color: var(--text-muted);
                margin-top: 0.25rem;
                text-align: right;
            }
            
            .user-message .message-time {
                text-align: left;
            }
            
            .typing-indicator {
                display: flex;
                gap: 4px;
                padding: 1rem;
                justify-content: center;
            }
            
            .typing-dot {
                width: 6px;
                height: 6px;
                background: var(--text-muted);
                border-radius: 50%;
                animation: typing 1.4s infinite;
            }
            
            .typing-dot:nth-child(2) { animation-delay: 0.2s; }
            .typing-dot:nth-child(3) { animation-delay: 0.4s; }
            
            .quick-btn {
                background: var(--bg-tertiary, #f0f0f0);
                border: 1px solid var(--border-color);
                color: var(--text-secondary);
                padding: 0.5rem 0.75rem;
                border-radius: 16px;
                cursor: pointer;
                font-size: 0.8rem;
                transition: all 0.2s ease;
                white-space: nowrap;
            }
            
            .quick-btn:hover {
                background: var(--accent-color, #007bff);
                color: white;
                border-color: var(--accent-color, #007bff);
            }
            
            .message-input:focus {
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }
            
            .send-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .send-btn:not(:disabled):hover {
                transform: scale(1.1);
            }
            
            .chatbot-messages::-webkit-scrollbar {
                width: 4px;
            }
            
            .chatbot-messages::-webkit-scrollbar-track {
                background: transparent;
            }
            
            .chatbot-messages::-webkit-scrollbar-thumb {
                background: var(--border-color);
                border-radius: 2px;
            }
            
            .error-message {
                color: var(--danger-color, #dc3545);
                font-style: italic;
            }
            
            @media (max-width: 480px) {
                .chatbot-window {
                    width: calc(100vw - 40px);
                    height: calc(100vh - 140px);
                    bottom: 90px;
                    right: 20px;
                    left: 20px;
                }
                
                .chatbot-button {
                    bottom: 20px;
                    right: 20px;
                }
            }
        `;

        const styleElement = document.createElement('style');
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }

    // === EVENT LISTENERS ===
    setupEventListeners() {
        // Toggle chatbot
        this.chatButton.addEventListener('click', () => {
            this.toggleChatbot();
        });

        // Close/minimize buttons
        this.chatWindow.querySelector('.close-btn').addEventListener('click', () => {
            this.closeChatbot();
        });

        this.chatWindow.querySelector('.minimize-btn').addEventListener('click', () => {
            this.minimizeChatbot();
        });

        // Message input
        this.messageInput.addEventListener('input', () => {
            this.handleInputChange();
        });

        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Send button
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });

        // Quick questions
        this.chatWindow.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const question = btn.dataset.question;
                this.messageInput.value = question;
                this.sendMessage();
            });
        });

        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 100) + 'px';
        });
    }

    // === CHATBOT ACTIONS ===
    toggleChatbot() {
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            this.chatWindow.classList.add('open');
            this.messageInput.focus();
        } else {
            this.chatWindow.classList.remove('open');
        }
    }

    closeChatbot() {
        this.isOpen = false;
        this.chatWindow.classList.remove('open');
    }

    minimizeChatbot() {
        this.closeChatbot();
    }

    handleInputChange() {
        const text = this.messageInput.value;
        const length = text.length;
        
        // Update character counter
        this.charCounter.textContent = `${length}/500`;
        
        // Enable/disable send button
        this.sendButton.disabled = length === 0 || length > 500;
        
        // Color coding for char counter
        if (length > 450) {
            this.charCounter.style.color = 'var(--danger-color, #dc3545)';
        } else if (length > 350) {
            this.charCounter.style.color = 'var(--warning-color, #ffc107)';
        } else {
            this.charCounter.style.color = 'var(--text-muted)';
        }
    }

    // === MESSAGE HANDLING ===
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isTyping) return;

        // Add user message
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.handleInputChange();

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Send to OpenAI
            const response = await this.callOpenAI(message);
            this.hideTypingIndicator();
            this.addMessage(response, 'bot');
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('Omlouvám se, nastala chyba při zpracování vaší zprávy. Zkuste to prosím znovu.', 'bot', true);
            console.error('Chatbot error:', error);
        }
    }

    addMessage(text, sender, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = sender === 'user' ? (localStorage.getItem('userInitial') || 'U') : '🤖';
        const time = new Date().toLocaleTimeString('cs-CZ', {hour: '2-digit', minute: '2-digit'});
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-text ${isError ? 'error-message' : ''}">
                    ${this.formatMessage(text)}
                </div>
                <div class="message-time">${time}</div>
            </div>
        `;

        // Add to conversation history
        this.conversationHistory.push({
            role: sender === 'user' ? 'user' : 'assistant',
            content: text,
            timestamp: new Date().toISOString()
        });

        // Add to UI
        const welcomeMessage = this.messagesContainer.querySelector('.welcome-message');
        if (welcomeMessage && this.conversationHistory.length > 1) {
            welcomeMessage.remove();
        }

        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();

        // Save conversation
        this.saveConversationHistory();
    }

    formatMessage(text) {
        // Format text with basic markdown-like styling
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code style="background: var(--bg-tertiary, #f0f0f0); padding: 2px 4px; border-radius: 3px;">$1</code>')
            .replace(/\n/g, '<br>');
    }

    showTypingIndicator() {
        this.isTyping = true;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-message';
        typingDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="message-text">
                    <div class="typing-indicator">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            </div>
        `;

        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.isTyping = false;
        const typingMessage = this.messagesContainer.querySelector('.typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    // === OPENAI API ===
    async callOpenAI(message) {
        const messages = [
            {
                role: 'system',
                content: this.settings.systemPrompt
            },
            // Include last 10 messages for context
            ...this.conversationHistory.slice(-10),
            {
                role: 'user',
                content: message
            }
        ];

        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.settings.model,
                messages: messages,
                max_tokens: this.settings.maxTokens,
                temperature: this.settings.temperature,
                stream: false
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`OpenAI API Error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    // === CONVERSATION PERSISTENCE ===
    saveConversationHistory() {
        try {
            localStorage.setItem('chatbot_conversation', JSON.stringify(this.conversationHistory));
        } catch (error) {
            console.warn('Could not save conversation history:', error);
        }
    }

    loadConversationHistory() {
        try {
            const saved = localStorage.getItem('chatbot_conversation');
            if (saved) {
                this.conversationHistory = JSON.parse(saved);
                
                // Restore messages to UI (excluding system messages)
                this.conversationHistory.forEach(msg => {
                    if (msg.role !== 'system') {
                        this.addMessageToUI(msg.content, msg.role === 'user' ? 'user' : 'bot');
                    }
                });
                
                // Remove welcome message if there's conversation history
                if (this.conversationHistory.length > 0) {
                    const welcomeMessage = this.messagesContainer.querySelector('.welcome-message');
                    if (welcomeMessage) welcomeMessage.remove();
                }
            }
        } catch (error) {
            console.warn('Could not load conversation history:', error);
        }
    }

    addMessageToUI(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = sender === 'user' ? (localStorage.getItem('userInitial') || 'U') : '🤖';
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-text">
                    ${this.formatMessage(text)}
                </div>
            </div>
        `;

        this.messagesContainer.appendChild(messageDiv);
    }

    clearConversation() {
        this.conversationHistory = [];
        this.messagesContainer.innerHTML = `
            <div class="welcome-message">
                <div class="message bot-message">
                    <div class="message-avatar">🤖</div>
                    <div class="message-content">
                        <div class="message-text">
                            Konverzace byla vymazána. Jak ti mohu pomoci?
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.saveConversationHistory();
    }

    // === PUBLIC API ===
    open() {
        if (!this.isOpen) {
            this.toggleChatbot();
        }
    }

    close() {
        if (this.isOpen) {
            this.toggleChatbot();
        }
    }

    destroy() {
        if (this.chatButton) this.chatButton.remove();
        if (this.chatWindow) this.chatWindow.remove();
        console.log('🤖 AI Chatbot byl zničen');
    }
}

// === GLOBAL INSTANCE ===
let aiChatbot = null;

// Inicializace po načtení DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('🤖 Inicializuji AI Chatbot...');
    
    try {
        aiChatbot = new AIChatbot();
        
        // Přidej do globálního kontextu
        window.aiChatbot = aiChatbot;
        
        console.log('🤖 AI Chatbot úspěšně inicializován a je viditelný!');
    } catch (error) {
        console.error('❌ Chyba při inicializaci chatbota:', error);
    }
});

// Export pro ES6 moduly
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIChatbot;
} 