// === REAL-TIME UPDATES SYSTÉM ===

class RealTimeUpdates {
    constructor() {
        this.eventSource = null;
        this.reconnectDelay = 1000;
        this.maxReconnectDelay = 30000;
        this.currentReconnectDelay = this.reconnectDelay;
        this.isConnecting = false;
        this.listeners = new Map();
        this.heartbeatInterval = null;
        this.lastHeartbeat = Date.now();
        
        this.init();
    }

    init() {
        this.connect();
        this.setupEventListeners();
        this.setupVisibilityHandling();
        this.startHeartbeat();
    }

    // === CONNECTION MANAGEMENT ===
    connect() {
        if (this.isConnecting || (this.eventSource && this.eventSource.readyState === EventSource.OPEN)) {
            return;
        }

        this.isConnecting = true;
        this.showConnectionStatus('Připojování...', 'warning');

        try {
            // Pro demo účely - v produkci by to byl skutečný endpoint
            this.eventSource = new EventSource('/api/stream');
            
            this.eventSource.onopen = () => {
                console.log('✅ Real-time spojení navázáno');
                this.isConnecting = false;
                this.currentReconnectDelay = this.reconnectDelay;
                this.showConnectionStatus('Online', 'success');
                this.hideConnectionStatus();
            };

            this.eventSource.onmessage = (event) => {
                this.handleMessage(event);
            };

            this.eventSource.onerror = (error) => {
                console.error('❌ Real-time spojení přerušeno:', error);
                this.handleConnectionError();
            };

            // Specifické event handlery
            this.eventSource.addEventListener('comment', (event) => {
                this.handleNewComment(JSON.parse(event.data));
            });

            this.eventSource.addEventListener('like', (event) => {
                this.handleLikeUpdate(JSON.parse(event.data));
            });

            this.eventSource.addEventListener('post', (event) => {
                this.handleNewPost(JSON.parse(event.data));
            });

            this.eventSource.addEventListener('heartbeat', (event) => {
                this.lastHeartbeat = Date.now();
            });

        } catch (error) {
            console.error('Chyba při vytváření SSE spojení:', error);
            this.handleConnectionError();
        }
    }

    disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        this.isConnecting = false;
        this.stopHeartbeat();
    }

    reconnect() {
        if (this.isConnecting) return;

        this.disconnect();
        
        setTimeout(() => {
            console.log(`🔄 Pokus o znovupřipojení za ${this.currentReconnectDelay}ms...`);
            this.connect();
            
            // Exponential backoff
            this.currentReconnectDelay = Math.min(
                this.currentReconnectDelay * 2, 
                this.maxReconnectDelay
            );
        }, this.currentReconnectDelay);
    }

    handleConnectionError() {
        this.isConnecting = false;
        this.showConnectionStatus('Offline', 'error');
        
        // Simulate connection in demo mode
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            this.startDemoMode();
        } else {
            this.reconnect();
        }
    }

    // === DEMO MODE (pro testování bez serveru) ===
    startDemoMode() {
        console.log('🎭 Spouštím demo režim real-time aktualizací');
        this.showConnectionStatus('Demo', 'warning');
        
        // Simulace real-time událostí
        this.demoInterval = setInterval(() => {
            const events = [
                () => this.simulateNewComment(),
                () => this.simulateLikeUpdate(),
                () => this.simulateNewPost()
            ];
            
            // 30% šance na událost každých 5 sekund
            if (Math.random() < 0.3) {
                const randomEvent = events[Math.floor(Math.random() * events.length)];
                randomEvent();
            }
        }, 5000);

        // Označit jako "připojeno" v demo režimu
        setTimeout(() => {
            this.hideConnectionStatus();
        }, 2000);
    }

    simulateNewComment() {
        const comments = [
            "Skvělý příspěvek! 👍",
            "Moc zajímavé, díky za sdílení",
            "Tohle je přesně to, co jsem hledal",
            "Perfektní timing s tímto obsahem",
            "Můžeš prosím více rozvinout tento bod?"
        ];
        
        const randomComment = {
            id: Date.now(),
            postId: 'demo-post-1',
            author: `Uživatel${Math.floor(Math.random() * 100)}`,
            content: comments[Math.floor(Math.random() * comments.length)],
            timestamp: new Date().toISOString(),
            avatar: null
        };

        this.handleNewComment(randomComment);
    }

    simulateLikeUpdate() {
        const likeUpdate = {
            postId: 'demo-post-1',
            liked: Math.random() > 0.5,
            totalLikes: Math.floor(Math.random() * 50) + 1,
            userId: 'current-user'
        };

        this.handleLikeUpdate(likeUpdate);
    }

    simulateNewPost() {
        // Pro demo pouze logování
        console.log('📝 Nový příspěvek by byl přidán');
    }

    // === EVENT HANDLERS ===
    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            this.emit('message', data);
        } catch (error) {
            console.error('Chyba při parsování zprávy:', error);
        }
    }

    handleNewComment(commentData) {
        console.log('💬 Nový komentář:', commentData);
        
        // Najdi příspěvek
        const postElement = document.querySelector(`[data-post-id="${commentData.postId}"]`) || 
                           document.querySelector('.post');
        
        if (postElement) {
            this.addCommentToPost(postElement, commentData);
            this.updateCommentCount(postElement, 1);
            this.showNotification(`Nový komentář od ${commentData.author}`, 'info');
        }

        this.emit('newComment', commentData);
    }

    handleLikeUpdate(likeData) {
        console.log('❤️ Aktualizace líbí se mi:', likeData);
        
        const postElement = document.querySelector(`[data-post-id="${likeData.postId}"]`) || 
                           document.querySelector('.post');
        
        if (postElement) {
            this.updateLikeButton(postElement, likeData);
            
            if (likeData.userId !== 'current-user') {
                this.showNotification(
                    likeData.liked ? 'Někomu se líbí váš příspěvek!' : 'Někdo odebral like',
                    likeData.liked ? 'success' : 'info'
                );
            }
        }

        this.emit('likeUpdate', likeData);
    }

    handleNewPost(postData) {
        console.log('📝 Nový příspěvek:', postData);
        this.addNewPostToFeed(postData);
        this.showNotification(`Nový příspěvek od ${postData.author}`, 'info');
        this.emit('newPost', postData);
    }

    // === DOM MANIPULATION ===
    addCommentToPost(postElement, commentData) {
        const commentsContainer = postElement.querySelector('.comments-list') || 
                                 this.createCommentsContainer(postElement);
        
        const commentElement = this.createCommentElement(commentData);
        commentsContainer.appendChild(commentElement);

        // Animace
        commentElement.classList.add('fade-in');
        
        // Scroll do view
        commentElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
        });
    }

    createCommentsContainer(postElement) {
        const container = document.createElement('div');
        container.className = 'comments-list';
        
        const commentsSection = postElement.querySelector('.comments-section');
        if (commentsSection) {
            commentsSection.appendChild(container);
        } else {
            postElement.appendChild(container);
        }
        
        return container;
    }

    createCommentElement(commentData) {
        const comment = document.createElement('div');
        comment.className = 'comment';
        comment.dataset.commentId = commentData.id;
        
        const avatar = commentData.avatar || this.generateAvatar(commentData.author);
        const timeAgo = this.formatTimeAgo(new Date(commentData.timestamp));
        
        comment.innerHTML = `
            <div class="comment-avatar">${avatar}</div>
            <div class="comment-content">
                <div class="comment-author">${commentData.author}</div>
                <div class="comment-text">${commentData.content}</div>
                <div class="comment-time">${timeAgo}</div>
            </div>
        `;
        
        return comment;
    }

    updateLikeButton(postElement, likeData) {
        const likeButton = postElement.querySelector('.like-button') || 
                          postElement.querySelector('[data-action="like"]');
        
        if (likeButton) {
            // Aktualizuj počet
            const countElement = likeButton.querySelector('.like-count');
            if (countElement) {
                countElement.textContent = likeData.totalLikes;
            }
            
            // Aktualizuj stav (pouze pokud to není od současného uživatele)
            if (likeData.userId !== 'current-user') {
                if (likeData.liked) {
                    likeButton.classList.add('liked');
                } else {
                    likeButton.classList.remove('liked');
                }
            }
            
            // Animace aktualizace
            likeButton.classList.add('pulse');
            setTimeout(() => likeButton.classList.remove('pulse'), 600);
        }
    }

    updateCommentCount(postElement, increment) {
        const commentButton = postElement.querySelector('.comment-button') || 
                             postElement.querySelector('[data-action="comment"]');
        
        if (commentButton) {
            const countElement = commentButton.querySelector('.comment-count');
            if (countElement) {
                const currentCount = parseInt(countElement.textContent) || 0;
                countElement.textContent = currentCount + increment;
            }
        }
    }

    addNewPostToFeed(postData) {
        const postsContainer = document.querySelector('.posts-container') || 
                              document.querySelector('.container');
        
        if (postsContainer) {
            const postElement = this.createPostElement(postData);
            postsContainer.insertBefore(postElement, postsContainer.firstChild);
            
            // Animace
            postElement.classList.add('slide-up');
        }
    }

    createPostElement(postData) {
        const post = document.createElement('article');
        post.className = 'post';
        post.dataset.postId = postData.id;
        
        const timeAgo = this.formatTimeAgo(new Date(postData.timestamp));
        const avatar = postData.avatar || this.generateAvatar(postData.author);
        
        post.innerHTML = `
            <div class="post-header">
                <div class="post-avatar">${avatar}</div>
                <div class="post-meta">
                    <div class="post-author">${postData.author}</div>
                    <div class="post-time">${timeAgo}</div>
                </div>
            </div>
            <div class="post-content">
                ${postData.content}
                ${postData.image ? `<img src="${postData.image}" alt="Post image" class="post-image">` : ''}
            </div>
            <div class="post-footer">
                <button class="post-action like-button" data-action="like">
                    ❤️ <span class="like-count">${postData.likes || 0}</span>
                </button>
                <button class="post-action comment-button" data-action="comment">
                    💬 <span class="comment-count">${postData.comments || 0}</span>
                </button>
            </div>
        `;
        
        return post;
    }

    // === CONNECTION STATUS UI ===
    showConnectionStatus(message, type = 'info') {
        let statusElement = document.querySelector('.connection-status');
        
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.className = 'connection-status';
            document.body.appendChild(statusElement);
        }
        
        statusElement.textContent = message;
        statusElement.className = `connection-status ${type}`;
        statusElement.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            z-index: 10001;
            transition: all 0.3s ease;
            pointer-events: none;
        `;
        
        // Styling podle typu
        switch (type) {
            case 'success':
                statusElement.style.background = '#22c55e';
                statusElement.style.color = 'white';
                break;
            case 'error':
                statusElement.style.background = '#ef4444';
                statusElement.style.color = 'white';
                break;
            case 'warning':
                statusElement.style.background = '#f59e0b';
                statusElement.style.color = 'white';
                break;
            default:
                statusElement.style.background = '#0ea5e9';
                statusElement.style.color = 'white';
        }
        
        statusElement.style.transform = 'translateY(0)';
        statusElement.style.opacity = '1';
    }

    hideConnectionStatus() {
        const statusElement = document.querySelector('.connection-status');
        if (statusElement) {
            setTimeout(() => {
                statusElement.style.transform = 'translateY(-100%)';
                statusElement.style.opacity = '0';
                setTimeout(() => statusElement.remove(), 300);
            }, 3000);
        }
    }

    // === NOTIFICATIONS ===
    showNotification(message, type = 'info', duration = 4000) {
        const notification = document.createElement('div');
        notification.className = `toast ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'toastSlideIn 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    // === EVENT SYSTEM ===
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Chyba v event listeneru ${event}:`, error);
                }
            });
        }
    }

    // === UTILITY METHODS ===
    setupEventListeners() {
        // Page visibility - pozastavit/obnovit při přepnutí tabů
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                if (!this.eventSource || this.eventSource.readyState !== EventSource.OPEN) {
                    this.connect();
                }
            }
        });

        // Před odchodem ze stránky
        window.addEventListener('beforeunload', () => {
            this.disconnect();
        });
    }

    setupVisibilityHandling() {
        let isVisible = true;
        
        document.addEventListener('visibilitychange', () => {
            const wasVisible = isVisible;
            isVisible = !document.hidden;
            
            if (!wasVisible && isVisible) {
                // Stránka se vrátila do fokus - zkontroluj spojení
                this.checkConnection();
            }
        });
    }

    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeat;
            
            // Pokud není heartbeat déle než 60 sekund, považuj spojení za mrtvé
            if (timeSinceLastHeartbeat > 60000) {
                console.warn('⚠️ Heartbeat timeout - reconnecting...');
                this.handleConnectionError();
            }
        }, 30000); // Kontroluj každých 30 sekund
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    checkConnection() {
        if (!this.eventSource || this.eventSource.readyState !== EventSource.OPEN) {
            console.log('🔄 Kontroluji spojení...');
            this.connect();
        }
    }

    generateAvatar(name) {
        const firstLetter = (name || 'U').charAt(0).toUpperCase();
        return firstLetter;
    }

    formatTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `před ${days} dny`;
        if (hours > 0) return `před ${hours} hodinami`;
        if (minutes > 0) return `před ${minutes} minutami`;
        return 'právě teď';
    }

    // === PUBLIC API ===
    sendComment(postId, content) {
        // V produkci by to poslalo požadavek na server
        console.log('📤 Odesílám komentář:', { postId, content });
        
        // Pro demo režim simuluj okamžitou odpověď
        if (this.demoInterval) {
            setTimeout(() => {
                this.handleNewComment({
                    id: Date.now(),
                    postId: postId,
                    author: 'Já',
                    content: content,
                    timestamp: new Date().toISOString(),
                    avatar: null
                });
            }, 500);
        }
    }

    sendLike(postId, liked) {
        console.log('📤 Odesílám like:', { postId, liked });
        
        // Pro demo režim simuluj odpověď
        if (this.demoInterval) {
            setTimeout(() => {
                this.handleLikeUpdate({
                    postId: postId,
                    liked: liked,
                    totalLikes: Math.floor(Math.random() * 50) + 1,
                    userId: 'current-user'
                });
            }, 200);
        }
    }

    destroy() {
        this.disconnect();
        
        if (this.demoInterval) {
            clearInterval(this.demoInterval);
        }
        
        this.listeners.clear();
        
        // Odstraň status element
        const statusElement = document.querySelector('.connection-status');
        if (statusElement) {
            statusElement.remove();
        }
    }
}

// === GLOBAL INSTANCE ===
let realTimeUpdates = null;

// Inicializace po načtení DOM
document.addEventListener('DOMContentLoaded', () => {
    realTimeUpdates = new RealTimeUpdates();
    
    // Přidej do globálního kontextu pro přístup z jiných skriptů
    window.realTimeUpdates = realTimeUpdates;
    
    console.log('🚀 Real-time aktualizace jsou aktivní');
});

// Export pro ES6 moduly
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealTimeUpdates;
} 