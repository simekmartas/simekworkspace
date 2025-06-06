// Enhanced Comments System s offline podporou
class EnhancedComments {
  constructor(options = {}) {
    this.options = {
      maxLength: 1000,
      autoSave: true,
      offlineSupport: true,
      realTimeUpdates: true,
      moderationEnabled: true,
      ...options
    };
    
    this.db = null;
    this.eventSource = null;
    this.drafts = new Map();
    this.pendingComments = new Set();
    
    this.init();
  }

  async init() {
    // Neaktivuj komentáře na index.html
    if (window.location.pathname.endsWith('index.html') || 
        window.location.pathname === '/' || 
        window.location.pathname.endsWith('/')) {
      console.log('🚫 Enhanced Comments zakázány na úvodní stránce');
      return;
    }
    
    await this.setupOfflineDB();
    this.setupEventListeners();
    this.setupRealTimeUpdates();
    this.setupFormValidation();
    this.loadDrafts();
    this.syncPendingComments();
  }

  async setupOfflineDB() {
    if (!this.options.offlineSupport || !('indexedDB' in window)) return;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CommentsDB', 1);
      
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        
        // Store pro offline komentáře
        if (!db.objectStoreNames.contains('pendingComments')) {
          const store = db.createObjectStore('pendingComments', { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('postId', 'postId');
        }
        
        // Store pro koncepty
        if (!db.objectStoreNames.contains('drafts')) {
          const draftStore = db.createObjectStore('drafts', { keyPath: 'id' });
          draftStore.createIndex('postId', 'postId');
        }
      };
      
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve();
      };
      
      request.onerror = reject;
    });
  }

  setupEventListeners() {
    // Formulář pro nové komentáře
    document.addEventListener('submit', (e) => {
      if (e.target.matches('.comment-form')) {
        e.preventDefault();
        this.handleCommentSubmit(e.target);
      }
    });

    // Auto-save konceptů
    document.addEventListener('input', (e) => {
      if (e.target.matches('.comment-textarea')) {
        this.saveDraft(e.target);
      }
    });

    // Reakce na komentáře
    document.addEventListener('click', (e) => {
      if (e.target.matches('.comment-reaction')) {
        this.handleReaction(e.target);
      }
      
      if (e.target.matches('.comment-reply')) {
        this.showReplyForm(e.target);
      }
      
      if (e.target.matches('.comment-edit')) {
        this.editComment(e.target);
      }
    });

    // Nekonečné scrollování
    window.addEventListener('scroll', () => {
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 1000) {
        this.loadMoreComments();
      }
    });

    // Online/offline events
    window.addEventListener('online', () => this.syncPendingComments());
    window.addEventListener('offline', () => this.showOfflineMessage());
  }

  setupRealTimeUpdates() {
    if (!this.options.realTimeUpdates) return;
    
    if ('EventSource' in window) {
      this.eventSource = new EventSource('/api/comments/stream');
      
      this.eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleRealTimeUpdate(data);
      };
      
      this.eventSource.onerror = () => {
        console.log('SSE připojení ztraceno, pokus o obnovení...');
        setTimeout(() => this.setupRealTimeUpdates(), 5000);
      };
    }
  }

  setupFormValidation() {
    const style = document.createElement('style');
    style.textContent = `
      .comment-form {
        max-width: 100%;
        margin: 20px 0;
        padding: 20px;
        background: var(--secondary-bg);
        border-radius: 12px;
        border: 1px solid var(--border-color);
        transition: var(--transition);
      }
      
      .comment-form:focus-within {
        border-color: var(--accent-color);
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
      }
      
      .comment-textarea {
        width: 100%;
        min-height: 100px;
        max-height: 300px;
        padding: 12px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        font-family: inherit;
        font-size: 14px;
        line-height: 1.5;
        resize: vertical;
        background: var(--primary-bg);
        color: var(--text-primary);
        transition: var(--transition);
      }
      
      .comment-textarea:focus {
        outline: none;
        border-color: var(--accent-color);
      }
      
      .comment-textarea.error {
        border-color: #dc3545;
      }
      
      .comment-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 12px;
        font-size: 12px;
        color: var(--text-secondary);
      }
      
      .comment-actions {
        display: flex;
        gap: 8px;
      }
      
      .comment-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: var(--transition);
      }
      
      .comment-btn-primary {
        background: var(--accent-color);
        color: white;
      }
      
      .comment-btn-primary:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
      }
      
      .comment-btn-secondary {
        background: transparent;
        color: var(--text-secondary);
        border: 1px solid var(--border-color);
      }
      
      .comment-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      .comment-item {
        padding: 16px;
        border-bottom: 1px solid var(--border-color);
        background: var(--primary-bg);
        transition: var(--transition);
      }
      
      .comment-item:hover {
        background: var(--secondary-bg);
      }
      
      .comment-item.pending {
        opacity: 0.7;
        border-left: 3px solid orange;
      }
      
      .comment-item.new {
        animation: highlightNew 2s ease-out;
      }
      
      @keyframes highlightNew {
        0% { background: rgba(0, 123, 255, 0.1); }
        100% { background: transparent; }
      }
      
      .comment-reactions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }
      
      .comment-reaction {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        border: 1px solid var(--border-color);
        border-radius: 16px;
        background: var(--secondary-bg);
        cursor: pointer;
        font-size: 12px;
        transition: var(--transition);
      }
      
      .comment-reaction:hover {
        background: var(--accent-color);
        color: white;
      }
      
      .comment-reaction.active {
        background: var(--accent-color);
        color: white;
      }
      
      .offline-message {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 16px;
        background: #f39c12;
        color: white;
        border-radius: 8px;
        font-size: 14px;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
      }
      
      @keyframes slideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
    `;
    
    document.head.appendChild(style);
  }

  async handleCommentSubmit(form) {
    const textarea = form.querySelector('.comment-textarea');
    const content = textarea.value.trim();
    const postId = form.dataset.postId;
    
    if (!this.validateComment(content, textarea)) return;
    
    const commentData = {
      content,
      postId,
      timestamp: Date.now(),
      author: this.getCurrentUser()
    };
    
    // Pokud jsme online, pošleme rovnou
    if (navigator.onLine) {
      try {
        await this.submitComment(commentData);
        this.clearForm(form);
        this.clearDraft(postId);
      } catch (error) {
        console.error('Chyba při odesílání komentáře:', error);
        await this.saveOfflineComment(commentData);
        this.showPendingComment(commentData);
      }
    } else {
      // Offline - uložíme pro pozdější synchronizaci
      await this.saveOfflineComment(commentData);
      this.showPendingComment(commentData);
    }
  }

  validateComment(content, textarea) {
    if (!content) {
      this.showError(textarea, 'Komentář nemůže být prázdný');
      return false;
    }
    
    if (content.length > this.options.maxLength) {
      this.showError(textarea, `Komentář je příliš dlouhý (max ${this.options.maxLength} znaků)`);
      return false;
    }
    
    // Kontrola spamu (základní)
    if (this.isSpam(content)) {
      this.showError(textarea, 'Komentář byl označen jako spam');
      return false;
    }
    
    this.clearError(textarea);
    return true;
  }

  isSpam(content) {
    const spamPatterns = [
      /(.)\1{10,}/g, // Opakující se znaky
      /https?:\/\/[^\s]+/gi, // Více než 2 odkazy
    ];
    
    return spamPatterns.some(pattern => pattern.test(content));
  }

  showError(textarea, message) {
    textarea.classList.add('error');
    
    let errorDiv = textarea.parentNode.querySelector('.error-message');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      textarea.parentNode.appendChild(errorDiv);
    }
    
    errorDiv.textContent = message;
    errorDiv.style.color = '#dc3545';
    errorDiv.style.fontSize = '12px';
    errorDiv.style.marginTop = '4px';
  }

  clearError(textarea) {
    textarea.classList.remove('error');
    const errorDiv = textarea.parentNode.querySelector('.error-message');
    if (errorDiv) {
      errorDiv.remove();
    }
  }

  async submitComment(commentData) {
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commentData)
    });
    
    if (!response.ok) {
      throw new Error('Chyba při odesílání komentáře');
    }
    
    return response.json();
  }

  async saveOfflineComment(commentData) {
    if (!this.db) return;
    
    const transaction = this.db.transaction(['pendingComments'], 'readwrite');
    const store = transaction.objectStore('pendingComments');
    
    await store.add({
      ...commentData,
      offline: true,
      id: `offline_${Date.now()}_${Math.random()}`
    });
  }

  showPendingComment(commentData) {
    const commentsContainer = document.querySelector('.comments-list');
    if (!commentsContainer) return;
    
    const commentElement = this.createCommentElement({
      ...commentData,
      pending: true
    });
    
    commentsContainer.insertBefore(commentElement, commentsContainer.firstChild);
  }

  createCommentElement(comment) {
    const div = document.createElement('div');
    div.className = `comment-item ${comment.pending ? 'pending' : ''}`;
    div.innerHTML = `
      <div class="comment-header">
        <strong>${comment.author?.name || 'Anonymní'}</strong>
        <span class="comment-date">${this.formatDate(comment.timestamp)}</span>
        ${comment.pending ? '<span class="pending-badge">Čeká na odeslání</span>' : ''}
      </div>
      <div class="comment-content">${this.escapeHtml(comment.content)}</div>
      <div class="comment-reactions">
        <button class="comment-reaction" data-type="like">
          👍 <span>${comment.likes || 0}</span>
        </button>
        <button class="comment-reaction" data-type="dislike">
          👎 <span>${comment.dislikes || 0}</span>
        </button>
        <button class="comment-reply">Odpovědět</button>
      </div>
    `;
    
    return div;
  }

  async syncPendingComments() {
    if (!this.db || !navigator.onLine) return;
    
    const transaction = this.db.transaction(['pendingComments'], 'readwrite');
    const store = transaction.objectStore('pendingComments');
    const request = store.getAll();
    
    request.onsuccess = async () => {
      const pendingComments = request.result;
      
      for (const comment of pendingComments) {
        try {
          await this.submitComment(comment);
          await store.delete(comment.id);
          this.removePendingComment(comment.id);
        } catch (error) {
          console.error('Chyba při synchronizaci komentáře:', error);
        }
      }
    };
  }

  saveDraft(textarea) {
    if (!this.options.autoSave) return;
    
    const postId = textarea.closest('.comment-form').dataset.postId;
    const content = textarea.value;
    
    if (content.trim()) {
      this.drafts.set(postId, content);
      localStorage.setItem(`comment_draft_${postId}`, content);
    } else {
      this.drafts.delete(postId);
      localStorage.removeItem(`comment_draft_${postId}`);
    }
  }

  loadDrafts() {
    document.querySelectorAll('.comment-form').forEach(form => {
      const postId = form.dataset.postId;
      const textarea = form.querySelector('.comment-textarea');
      const draft = localStorage.getItem(`comment_draft_${postId}`);
      
      if (draft && textarea) {
        textarea.value = draft;
        this.drafts.set(postId, draft);
      }
    });
  }

  clearDraft(postId) {
    this.drafts.delete(postId);
    localStorage.removeItem(`comment_draft_${postId}`);
  }

  clearForm(form) {
    const textarea = form.querySelector('.comment-textarea');
    if (textarea) {
      textarea.value = '';
    }
  }

  getCurrentUser() {
    // Toto by mělo být propojeno s autentifikačním systémem
    return {
      id: localStorage.getItem('userId') || 'anonymous',
      name: localStorage.getItem('userName') || 'Anonymní uživatel'
    };
  }

  formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('cs-CZ');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showOfflineMessage() {
    const existing = document.querySelector('.offline-message');
    if (existing) return;
    
    const message = document.createElement('div');
    message.className = 'offline-message';
    message.textContent = 'Jste offline. Komentáře budou odeslány po obnovení připojení.';
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.remove();
    }, 5000);
  }

  handleRealTimeUpdate(data) {
    if (data.type === 'new_comment') {
      this.addNewComment(data.comment);
    } else if (data.type === 'comment_updated') {
      this.updateComment(data.comment);
    }
  }

  addNewComment(comment) {
    const commentsContainer = document.querySelector('.comments-list');
    if (!commentsContainer) return;
    
    const commentElement = this.createCommentElement(comment);
    commentElement.classList.add('new');
    
    commentsContainer.insertBefore(commentElement, commentsContainer.firstChild);
  }

  // Cleanup při vypnutí stránky
  cleanup() {
    if (this.eventSource) {
      this.eventSource.close();
    }
    
    if (this.db) {
      this.db.close();
    }
  }
}

// Inicializace
document.addEventListener('DOMContentLoaded', () => {
  window.enhancedComments = new EnhancedComments();
});

window.addEventListener('beforeunload', () => {
  if (window.enhancedComments) {
    window.enhancedComments.cleanup();
  }
});

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedComments;
} 