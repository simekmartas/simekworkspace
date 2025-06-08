// Upload systém je nyní aktivní a funkcní

// Jednoduché novinky podle náčrtu
let posts = [];
let currentUser = null;
let selectedPhoto = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Neaktivuj simple-novinky na index.html
    if (window.location.pathname.endsWith('index.html') || 
        window.location.pathname === '/' || 
        window.location.pathname.endsWith('/')) {
        console.log('🚫 Simple Novinky zakázány na úvodní stránce');
        return;
    }
    
    loadCurrentUser();
    await loadPosts(); // Čekej na načtení příspěvků ze serveru
    renderApp();
    filterPosts('all'); // Zobraz všechny příspěvky po načtení
    
    // Sleduj změny v localStorage (při odhlášení/přihlášení v jiném tabu)
    window.addEventListener('storage', async function(e) {
        if (e.key === 'username' || e.key === 'role' || e.key === 'isLoggedIn') {
            console.log('Změna přihlášení detekována, znovu načítám...');
            loadCurrentUser();
            await loadPosts(); // Znovu načti příspěvky ze serveru
            
            // Vykresli celou aplikaci znovu
            const appContainer = document.getElementById('app');
            if (appContainer) {
                renderApp();
                filterPosts('all');
            }
        }
    });
});

function loadCurrentUser() {
    // Načti uživatele z přihlašovacích údajů
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    
    if (username && role) {
        currentUser = {
            username: username,
            fullName: username, // Nebo můžeme přidat mapování pro plná jména
            role: role
        };
    } else {
        // Fallback pokud nejsou přihlašovací údaje
        currentUser = {
            username: 'Test User',
            fullName: 'Test Administrator', 
            role: 'Administrator'
        };
    }
    
    console.log('Načten uživatel:', currentUser);
}

async function loadPosts() {
    // Nejdřív načti z localStorage (spolehlivé)
    try {
        const savedPosts = localStorage.getItem('simple_posts');
        if (savedPosts) {
            posts = JSON.parse(savedPosts);
            console.log('📦 Načteno ' + posts.length + ' příspěvků z localStorage');
        } else {
            posts = [];
        }
    } catch (error) {
        console.error('❌ Chyba při načítání z localStorage:', error);
        posts = [];
    }
    
    // Zkus načíst ze serveru na pozadí (ale nespoléhej na to)
    try {
        const response = await fetch('/api/posts-github', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && Array.isArray(data.posts)) {
                // Pokud server má novější data, použij je
                if (data.posts.length > 0) {
                    posts = data.posts;
                    localStorage.setItem('simple_posts', JSON.stringify(posts));
                    console.log('✅ Synchronizováno ' + posts.length + ' příspěvků ze serveru');
                }
            }
        } else {
            console.warn('⚠️ Server nedostupný, používám místní data');
        }
        
    } catch (error) {
        console.warn('⚠️ Server nedostupný, používám místní data:', error.message);
    }
    
    // Přidej kategorii do starých příspěvků pokud ji nemají a migrace likes systému
    posts.forEach(post => {
        if (!post.category) {
            post.category = 'Novinky';
        }
        
        // Migrace starého likes systému na nový (pole uživatelů)
        if (typeof post.likes === 'number') {
            post.likes = []; // Resetuj na prázdné pole - starý like systém byl nekonzistentní
        } else if (!Array.isArray(post.likes)) {
            post.likes = [];
        }
    });
}

async function savePosts() {
    try {
        // Ulož také do localStorage jako backup
        localStorage.setItem('simple_posts', JSON.stringify(posts));
        console.log('📦 Backup uložen do localStorage');
        return true;
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            console.error('localStorage QuotaExceededError - nutno vyčistit cache');
        } else {
            console.error('Chyba při backup ukládání:', error);
        }
        return false;
    }
}

function renderApp() {
    // Inicializuj animace pro liky
    addLikeAnimationStyles();
    
    document.getElementById('app').innerHTML = `
        <style>
            .simple-container { max-width: 600px; margin: 0 auto; padding: 2rem 1rem; }
            .simple-header { text-align: center; margin-bottom: 2rem; }
            .simple-header h1 { font-size: 2rem; color: var(--text-primary); margin: 0 0 0.5rem 0; font-weight: 600; }
            .simple-header p { color: var(--text-secondary); margin: 0; }
                         .post-creator { background: var(--bg-primary); border: 1px solid rgba(0,0,0,0.1); border-radius: 12px; padding: 1rem; margin-bottom: 2rem; }
            .post-textarea { width: 100%; min-height: 100px; background: none; border: none; color: var(--text-primary); font-size: 1rem; resize: none; outline: none; font-family: inherit; line-height: 1.5; }
            .post-textarea::placeholder { color: var(--text-secondary); }
            .post-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05); }
            .share-btn { background: var(--primary-color); color: white; border: none; border-radius: 20px; padding: 0.5rem 1.5rem; font-weight: 500; cursor: pointer; transition: all 0.2s ease; }
            .share-btn:disabled { background: rgba(255,255,255,0.1); color: var(--text-secondary); cursor: not-allowed; }
            .action-icons { display: flex; gap: 0.5rem; }
                         .action-icon { background: none; border: none; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem; border-radius: 4px; transition: all 0.2s ease; font-size: 0.85rem; }
             .action-icon:hover { color: var(--text-primary); background: rgba(255,255,255,0.05); }
            .posts-feed { display: flex; flex-direction: column; gap: 1rem; }
                         .post { background: var(--bg-primary); border: 1px solid rgba(0,0,0,0.1); border-radius: 12px; padding: 1rem; position: relative; }
            .post-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
            .post-author { display: flex; align-items: center; gap: 0.75rem; }
            .author-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 0.85rem; overflow: hidden; }
            .author-info h4 { margin: 0; color: var(--text-primary); font-size: 0.9rem; font-weight: 600; }
            .author-info span { color: var(--text-secondary); font-size: 0.8rem; }
                         .menu-btn { background: none; border: none; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem; border-radius: 4px; transition: all 0.2s ease; font-size: 0.85rem; }
             .menu-btn:hover { color: var(--text-primary); background: rgba(255,255,255,0.05); }
                         .menu-dropdown { position: absolute; top: 100%; right: 0; background: var(--bg-primary); border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; padding: 0.5rem; min-width: 120px; z-index: 100; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
            .menu-item { width: 100%; background: none; border: none; color: #ff4757; padding: 0.5rem; border-radius: 4px; cursor: pointer; font-size: 0.85rem; text-align: left; }
                         .post-content { color: var(--text-primary); line-height: 1.5; margin-bottom: 1rem; white-space: pre-wrap; }
             .post-image { width: 100%; border-radius: 8px; margin-bottom: 1rem; cursor: pointer; }
             .post-file { background: rgba(255,255,255,0.05); border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; padding: 1rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.75rem; }
             .file-download { background: var(--primary-color); color: white; border: none; border-radius: 6px; padding: 0.5rem; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; }
             .file-download:hover { background: var(--primary-dark); }
            .post-footer { display: flex; gap: 1rem; align-items: center; }
            .post-action { background: none; border: none; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem; border-radius: 4px; transition: all 0.2s ease; font-size: 0.85rem; }
            .post-action:hover { color: var(--text-primary); background: rgba(255,255,255,0.05); }
            .post-action.liked { color: #ff4757; }
            .post-action svg { width: 18px; height: 18px; }
            .hidden { display: none; }
            .empty-state { text-align: center; padding: 3rem 1rem; color: var(--text-secondary); }
                         .photo-preview { position: relative; margin-bottom: 1rem; }
             .photo-preview img { width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; }
             .file-preview { position: relative; margin-bottom: 1rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; padding: 1rem; display: flex; align-items: center; gap: 0.75rem; }
             .file-icon { width: 40px; height: 40px; border-radius: 8px; background: var(--primary-color); display: flex; align-items: center; justify-content: center; color: white; }
             .file-info { flex: 1; }
             .file-name { color: var(--text-primary); font-weight: 500; margin-bottom: 0.25rem; }
             .file-size { color: var(--text-secondary); font-size: 0.8rem; }
             .remove-file { position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(0,0,0,0.8); color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; transition: all 0.2s ease; opacity: 0.8; }
             .remove-file:hover { opacity: 1; background: rgba(0,0,0,0.9); transform: scale(1.1); }
                         .remove-photo { position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(0,0,0,0.8); color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; transition: all 0.2s ease; opacity: 0.8; }
             .remove-photo:hover { opacity: 1; background: rgba(0,0,0,0.9); transform: scale(1.1); }

             .comments-section { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05); display: none; }
             .comments-section.show { display: block; }
             .comment-form { display: flex; gap: 0.75rem; margin-bottom: 1rem; }
             .comment-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 0.7rem; flex-shrink: 0; overflow: hidden; }
             .comment-input-wrapper { flex: 1; }
             .comment-input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(0,0,0,0.1); border-radius: 20px; padding: 0.4rem 1rem; color: var(--text-primary); font-size: 0.8rem; outline: none; }
             .comment-input::placeholder { color: var(--text-secondary); }
             .comment-send { background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 0.5rem; margin-left: 0.5rem; flex-shrink: 0; }
             .comment-send:enabled { color: var(--primary-color); }
             .comment-send:disabled { opacity: 0.3; cursor: not-allowed; }
             .comment { display: flex; gap: 0.75rem; margin-bottom: 0.75rem; position: relative; }
             .comment-content { flex: 1; }
             .comment-author { font-weight: 600; color: var(--text-primary); font-size: 0.8rem; margin-bottom: 0.25rem; }
             .comment-text { color: var(--text-primary); font-size: 0.85rem; line-height: 1.4; }
             .comment-time { color: var(--text-secondary); font-size: 0.75rem; margin-top: 0.25rem; }
             .comment-delete { position: absolute; top: 0; right: 0; background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 0.25rem; border-radius: 4px; transition: all 0.2s ease; opacity: 0; }
             .comment:hover .comment-delete { opacity: 1; }
             .comment-delete:hover { color: #ff4757; background: rgba(255,71,87,0.1); }
             .edit-form { margin-bottom: 1rem; }
             .edit-textarea { width: 100%; min-height: 80px; background: rgba(255,255,255,0.05); border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; padding: 0.75rem; color: var(--text-primary); font-size: 0.9rem; resize: none; outline: none; font-family: inherit; line-height: 1.4; }
             .edit-actions { display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.5rem; }
             .edit-btn { background: var(--primary-color); color: white; border: none; border-radius: 6px; padding: 0.5rem 1rem; font-size: 0.8rem; cursor: pointer; transition: all 0.2s ease; }
             .edit-btn:hover { background: var(--primary-dark); }
             .cancel-btn { background: rgba(255,255,255,0.1); color: var(--text-secondary); border: none; border-radius: 6px; padding: 0.5rem 1rem; font-size: 0.8rem; cursor: pointer; transition: all 0.2s ease; }
             .cancel-btn:hover { background: rgba(255,255,255,0.15); color: var(--text-primary); }
             
             .image-cropper { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 2000; }
             .cropper-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; }
             .cropper-content { background: var(--bg-primary); border-radius: 12px; padding: 1.5rem; max-width: 500px; width: 90%; max-height: 80vh; overflow: auto; }
             .cropper-content h3 { margin: 0 0 1rem 0; color: var(--text-primary); text-align: center; }
             .crop-container { margin-bottom: 1rem; }
             .crop-frame { position: relative; max-width: 100%; margin: 0 auto; border: 2px solid var(--primary-color); border-radius: 8px; overflow: hidden; }
             .crop-frame img { width: 100%; height: auto; display: block; }
             .crop-selector { position: absolute; border: 2px solid var(--primary-color); background: rgba(255,255,255,0.2); cursor: move; }
             .crop-selector::before { content: ''; position: absolute; top: -2px; left: -2px; right: -2px; bottom: -2px; border: 2px dashed var(--primary-color); }
             .cropper-actions { display: flex; gap: 1rem; justify-content: center; }
             .crop-cancel, .crop-confirm { padding: 0.75rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem; transition: all 0.2s ease; }
             .crop-cancel { background: rgba(255,255,255,0.1); color: var(--text-secondary); }
             .crop-cancel:hover { background: rgba(255,255,255,0.15); color: var(--text-primary); }
             .crop-confirm { background: var(--primary-color); color: white; }
             .crop-confirm:hover { background: var(--primary-dark); }
             
             .category-dropdown { position: absolute; top: 100%; right: 0; background: var(--bg-primary); border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; padding: 0.5rem; min-width: 150px; z-index: 100; box-shadow: 0 4px 20px rgba(0,0,0,0.3); margin-top: 0.5rem; }
             .category-option { width: 100%; background: none; border: none; color: var(--text-primary); padding: 0.75rem; border-radius: 4px; cursor: pointer; font-size: 0.85rem; text-align: left; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s ease; }
             .category-option:hover { background: rgba(255,255,255,0.05); }
             .category-indicator { width: 8px; height: 8px; border-radius: 50%; }
             .category-indicator.important { background: #ff4757; }
             .category-indicator.news { background: #5352ed; }
             .category-indicator.life { background: #2ed573; }
             
             .filter-section { margin: 2rem 0; padding: 1rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
             .filter-buttons { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
             .filter-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(0,0,0,0.1); color: var(--text-secondary); padding: 0.5rem 1rem; border-radius: 20px; cursor: pointer; font-size: 0.8rem; font-weight: 500; transition: all 0.2s ease; }
             .filter-btn:hover { background: rgba(255,255,255,0.1); color: var(--text-primary); }
             .filter-btn.active { background: var(--primary-color); color: white; border-color: var(--primary-color); }
             
             .category-badge { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.7rem; font-weight: 500; margin-bottom: 0.5rem; }
             .category-badge.important { background: rgba(255,71,87,0.2); color: #ff4757; }
             .category-badge.news { background: rgba(83,82,237,0.2); color: #5352ed; }
             .category-badge.life { background: rgba(46,213,115,0.2); color: #2ed573; }
             
             .category-preview { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 1rem; position: relative; }
             .category-preview-content { display: flex; align-items: center; gap: 0.75rem; }
             .category-preview-text { color: var(--text-secondary); font-size: 0.85rem; }
             .category-badge-preview { display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 500; }
             .category-badge-preview.important { background: rgba(255,71,87,0.2); color: #ff4757; }
             .category-badge-preview.news { background: rgba(83,82,237,0.2); color: #5352ed; }
             .category-badge-preview.life { background: rgba(46,213,115,0.2); color: #2ed573; }
             .remove-category { background: rgba(0,0,0,0.8); color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; transition: all 0.2s ease; opacity: 0.8; }
             .remove-category:hover { opacity: 1; background: rgba(0,0,0,0.9); transform: scale(1.1); }
        </style>
        
        <div class="simple-container">
            <div class="simple-header">
                <h1>Novinky</h1>
                <p>Aktuální dění ve firmě</p>
            </div>

            <div class="post-creator">
                <textarea id="postText" class="post-textarea" placeholder="Co se děje?" oninput="updateShareButton()"></textarea>
                
                <div id="photoPreview" class="photo-preview hidden">
                    <img id="previewImage">
                    <button class="remove-photo" onclick="removePhoto()">×</button>
                </div>
                
                <div id="filePreview" class="file-preview hidden" style="display: none;">
                    <div class="file-icon">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                        </svg>
                    </div>
                    <div class="file-info">
                        <div class="file-name" id="fileName"></div>
                        <div class="file-size" id="fileSize"></div>
                    </div>
                    <button class="remove-file" onclick="removeFile()">×</button>
                </div>
                
                <div id="categoryPreview" class="category-preview hidden">
                    <div class="category-preview-content">
                        <span class="category-preview-text">Kategorie:</span>
                        <div class="category-badge-preview" id="categoryBadgePreview">
                            <span class="category-indicator" id="categoryIndicator"></span>
                            <span id="categoryName">Novinky</span>
                        </div>
                    </div>
                    <button class="remove-category" onclick="removeCategory()">×</button>
                </div>
                
                <div class="post-actions">
                    <button class="share-btn" id="shareBtn" onclick="createPost()" disabled>Sdílet</button>
                    
                    <div class="action-icons">
                                                 <button class="action-icon" onclick="triggerPhotoUpload()">
                             <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                                 <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                 <circle cx="9" cy="9" r="2"/>
                                 <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                             </svg>
                         </button>
                         
                         <button class="action-icon" onclick="triggerFileUpload()">
                             <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                                 <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                 <polyline points="14,2 14,8 20,8"/>
                                 <line x1="16" y1="13" x2="8" y2="13"/>
                                 <line x1="16" y1="17" x2="8" y2="17"/>
                                 <polyline points="10,9 9,9 8,9"/>
                             </svg>
                         </button>
                         
                         <div style="position: relative; display: inline-block;">
                             <button class="action-icon" onclick="toggleCategoryDropdown()">
                                 <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                                     <rect x="3" y="3" width="7" height="7"/>
                                     <rect x="14" y="3" width="7" height="7"/>
                                     <rect x="14" y="14" width="7" height="7"/>
                                     <rect x="3" y="14" width="7" height="7"/>
                                 </svg>
                             </button>
                             
                             <div id="categoryDropdown" class="category-dropdown hidden">
                                 <button class="category-option" onclick="selectCategory('Důležité')">
                                     <span class="category-indicator important"></span>
                                     Důležité
                                 </button>
                                 <button class="category-option" onclick="selectCategory('Novinky')">
                                     <span class="category-indicator news"></span>
                                     Novinky
                                 </button>
                                 <button class="category-option" onclick="selectCategory('Ze života')">
                                     <span class="category-indicator life"></span>
                                     Ze života
                                 </button>
                             </div>
                         </div>
                    </div>
                </div>
            </div>

                     <input type="file" id="photoInput" accept="image/*" class="hidden" onchange="handlePhotoUpload(event)">
                     <input type="file" id="fileInput" class="hidden" onchange="handleFileUpload(event)">

                     <div class="filter-section">
                         <div class="filter-buttons">
                             <button class="filter-btn active" onclick="filterPosts('all')">VŠE</button>
                             <button class="filter-btn" onclick="filterPosts('Novinky')">NOVINKY</button>
                             <button class="filter-btn" onclick="filterPosts('Důležité')">DŮLEŽITÉ</button>
                             <button class="filter-btn" onclick="filterPosts('Ze života')">ZE ŽIVOTA</button>
                         </div>
                     </div>

                     <div class="posts-feed" id="postsFeed">${renderPosts()}</div>
                 </div>
             `;
         }

function updateShareButton() {
    const text = document.getElementById('postText').value.trim();
    document.getElementById('shareBtn').disabled = !text && !selectedPhoto && !selectedFile;
}

function triggerPhotoUpload() {
    document.getElementById('photoInput').click();
}

function handlePhotoUpload(event) {
    console.log('📸 handlePhotoUpload spuštěno');
    const file = event.target.files[0];
    if (file) {
        console.log('📸 Soubor vybrán:', file.name, file.size, 'bytes');
        
        // Omezeí velikosti souboru (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
            alert('Fotka je příliš velká. Maximální velikost je 50MB.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            console.log('📸 Soubor načten, spouštím kompresi...');
            // Komprese a resize obrázku
            resizeAndCompressImage(e.target.result, (compressedImage) => {
                console.log('📸 Komprese dokončena, zobrazujem cropper...');
                selectedPhoto = compressedImage;
                showImageCropper(compressedImage);
            });
        };
        reader.readAsDataURL(file);
    } else {
        console.log('📸 Žádný soubor nevybrán');
    }
}

function resizeAndCompressImage(dataUrl, callback) {
    const img = new Image();
    img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Vysoké rozlišení - max 1920px na delší straně
        const maxSize = 1920;
        let { width, height } = img;
        
        if (width > height) {
            if (width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
            }
        } else {
            if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
            }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Vylepšené renderování pro ostrost
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Anti-aliasing pro lepší kvalitu
        ctx.translate(0.5, 0.5);
        ctx.drawImage(img, 0, 0, width, height);
        ctx.translate(-0.5, -0.5);
        
        // Vysoká kvalita komprese
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
        callback(compressedDataUrl);
    };
    img.src = dataUrl;
}

function showImageCropper(imageDataUrl) {
    console.log('🖼️ showImageCropper spuštěno');
    
    const cropperContainer = document.getElementById('imageCropper');
    if (!cropperContainer) {
        // Vytvoř cropper kontejner
        const cropperHTML = `
            <div id="imageCropper" class="image-cropper">
                <div class="cropper-overlay">
                    <div class="cropper-content">
                        <h3>Upravit fotku</h3>
                        
                        <div class="crop-presets" style="margin-bottom: 1rem; display: flex; gap: 0.5rem; justify-content: center;">
                            <button onclick="setCropRatio('square')" style="padding: 0.25rem 0.75rem; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary); border-radius: 4px; font-size: 0.8rem;">Čtverec</button>
                            <button onclick="setCropRatio('original')" style="padding: 0.25rem 0.75rem; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary); border-radius: 4px; font-size: 0.8rem;">Celá fotka</button>
                            <button onclick="setCropRatio('4:3')" style="padding: 0.25rem 0.75rem; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary); border-radius: 4px; font-size: 0.8rem;">4:3</button>
                            <button onclick="setCropRatio('16:9')" style="padding: 0.25rem 0.75rem; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary); border-radius: 4px; font-size: 0.8rem;">16:9</button>
                        </div>
                        
                        <div class="crop-container">
                            <div class="crop-frame">
                                <img id="cropImage" src="${imageDataUrl}">
                                <div class="crop-selector" id="cropSelector"></div>
                            </div>
                        </div>
                        <div class="cropper-actions">
                            <button class="crop-cancel" onclick="closeCropper()">Zrušit</button>
                            <button class="crop-confirm" onclick="applyCrop()">Použít</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', cropperHTML);
    } else {
        document.getElementById('cropImage').src = imageDataUrl;
        cropperContainer.classList.remove('hidden');
    }
    
    initializeCropper();
}

let isDraggingCrop = false;
let cropStartX, cropStartY;

function initializeCropper() {
    const cropImage = document.getElementById('cropImage');
    const selector = document.getElementById('cropSelector');
    
    if (!cropImage || !selector) return;
    
    // Počkej až se obrázek načte
    cropImage.onload = function() {
        // Nastav výchozí crop na CELOU fotku
        setCropRatio('original');
        console.log('✂️ Crop nastaven na celou fotku (můžete změnit pomocí tlačítek)');
    };
    
    // Trigger onload pokud je obrázek už načtený
    if (cropImage.complete) {
        cropImage.onload();
    }
    
    // Přidej event listenery pro dragging
    selector.addEventListener('mousedown', startDragCrop);
    document.addEventListener('mousemove', dragCrop);
    document.addEventListener('mouseup', stopDragCrop);
}

function startDragCrop(e) {
    isDraggingCrop = true;
    cropStartX = e.clientX;
    cropStartY = e.clientY;
    e.preventDefault();
}

function dragCrop(e) {
    if (!isDraggingCrop) return;
    
    const selector = document.getElementById('cropSelector');
    const deltaX = e.clientX - cropStartX;
    const deltaY = e.clientY - cropStartY;
    
    const currentLeft = parseInt(selector.style.left) || 0;
    const currentTop = parseInt(selector.style.top) || 0;
    
    selector.style.left = (currentLeft + deltaX) + 'px';
    selector.style.top = (currentTop + deltaY) + 'px';
    
    cropStartX = e.clientX;
    cropStartY = e.clientY;
}

function stopDragCrop() {
    isDraggingCrop = false;
}

function setCropRatio(ratio) {
    const cropImage = document.getElementById('cropImage');
    const selector = document.getElementById('cropSelector');
    
    if (!cropImage || !selector) return;
    
    const imageRect = cropImage.getBoundingClientRect();
    let width, height;
    
    switch(ratio) {
        case 'original':
            // Celá fotka
            width = imageRect.width - 4; // -4px pro border
            height = imageRect.height - 4;
            selector.style.left = '2px';
            selector.style.top = '2px';
            break;
            
        case 'square':
            // Čtverec (default)
            const minSide = Math.min(imageRect.width, imageRect.height) - 4;
            width = minSide;
            height = minSide;
            selector.style.left = ((imageRect.width - minSide) / 2) + 'px';
            selector.style.top = ((imageRect.height - minSide) / 2) + 'px';
            break;
            
        case '4:3':
            // Poměr 4:3
            if (imageRect.width > imageRect.height) {
                height = imageRect.height - 4;
                width = (height * 4 / 3);
                if (width > imageRect.width - 4) {
                    width = imageRect.width - 4;
                    height = (width * 3 / 4);
                }
            } else {
                width = imageRect.width - 4;
                height = (width * 3 / 4);
            }
            selector.style.left = ((imageRect.width - width) / 2) + 'px';
            selector.style.top = ((imageRect.height - height) / 2) + 'px';
            break;
            
        case '16:9':
            // Poměr 16:9
            if (imageRect.width > imageRect.height) {
                height = imageRect.height - 4;
                width = (height * 16 / 9);
                if (width > imageRect.width - 4) {
                    width = imageRect.width - 4;
                    height = (width * 9 / 16);
                }
            } else {
                width = imageRect.width - 4;
                height = (width * 9 / 16);
            }
            selector.style.left = ((imageRect.width - width) / 2) + 'px';
            selector.style.top = ((imageRect.height - height) / 2) + 'px';
            break;
    }
    
    selector.style.width = width + 'px';
    selector.style.height = height + 'px';
    
    console.log(`✂️ Crop nastaven na ${ratio}: ${Math.round(width)}x${Math.round(height)}px`);
}

async function applyCrop() {
    console.log('✂️ applyCrop spuštěno - upload na server');
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const cropImage = document.getElementById('cropImage');
    const selector = document.getElementById('cropSelector');
    
    if (!cropImage || !selector) {
        console.error('❌ Chybí crop prvky');
        return;
    }
    
    const rect = selector.getBoundingClientRect();
    const imgRect = cropImage.getBoundingClientRect();
    
    // Výpočet crop oblastí
    const scaleX = cropImage.naturalWidth / imgRect.width;
    const scaleY = cropImage.naturalHeight / imgRect.height;
    
    const cropX = Math.max(0, (rect.left - imgRect.left) * scaleX);
    const cropY = Math.max(0, (rect.top - imgRect.top) * scaleY);
    const cropWidth = Math.min(rect.width * scaleX, cropImage.naturalWidth - cropX);
    const cropHeight = Math.min(rect.height * scaleY, cropImage.naturalHeight - cropY);
    
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    
    ctx.drawImage(
        cropImage,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
    );
    
    const croppedImageData = canvas.toDataURL('image/jpeg', 0.95);
    
    // Upload na server
    try {
        console.log('🚀 Nahrávám fotku na server...');
        
        const response = await fetch('upload.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: croppedImageData
            })
        });
        
        const result = await response.json();
        console.log('📤 Server odpověď:', result);
        
        if (result.success) {
            selectedPhoto = result.url; // Použij URL ze serveru
            console.log('✅ Fotka úspěšně nahrána:', selectedPhoto);
            
            // Zobraz náhled
            document.getElementById('previewImage').src = selectedPhoto;
            document.getElementById('photoPreview').classList.remove('hidden');
            
            // Zavři cropper
            closeCropper();
            updateShareButton();
            
            alert('✅ Fotka úspěšně nahrána na server!');
        } else {
            throw new Error(result.error || 'Neznámá chyba');
        }
        
    } catch (error) {
        console.log('⚠️ Server upload se nezdařil, používám lokální uložení:', error.message);
        
        // Fallback - ulož lokálně (funguje pro zobrazení v příspěvku)
        selectedPhoto = croppedImageData;
        document.getElementById('previewImage').src = selectedPhoto;
        document.getElementById('photoPreview').classList.remove('hidden');
        closeCropper();
        updateShareButton();
        
        // Tichá notifikace místo alertu
        console.log('✅ Fotka uložena lokálně a připravena k publikaci');
    }
}

function closeCropper() {
    const cropper = document.getElementById('imageCropper');
    if (cropper) {
        cropper.classList.add('hidden');
    }
}

let selectedFile = null;
let selectedCategory = 'Novinky';
let currentFilter = 'all';

function removePhoto() {
    selectedPhoto = null;
    document.getElementById('photoPreview').classList.add('hidden');
    document.getElementById('photoInput').value = '';
    updateShareButton();
}

function triggerFileUpload() {
    document.getElementById('fileInput').click();
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        // Limit velikosti souboru (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
            alert('Soubor je příliš velký. Maximální velikost je 50MB.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            selectedFile = {
                name: file.name,
                size: formatFileSize(file.size),
                data: e.target.result,
                type: file.type
            };
            
            document.getElementById('fileName').textContent = selectedFile.name;
            document.getElementById('fileSize').textContent = selectedFile.size;
            const preview = document.getElementById('filePreview');
            preview.classList.remove('hidden');
            preview.style.display = 'flex';
            updateShareButton();
        };
        reader.readAsDataURL(file);
    }
}

function removeFile() {
    selectedFile = null;
    const preview = document.getElementById('filePreview');
    preview.classList.add('hidden');
    preview.style.display = 'none';
    document.getElementById('fileInput').value = '';
    updateShareButton();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function toggleCategoryDropdown() {
    const dropdown = document.getElementById('categoryDropdown');
    dropdown.classList.toggle('hidden');
    
    if (!dropdown.classList.contains('hidden')) {
        setTimeout(() => {
            document.addEventListener('click', function closeDropdown(e) {
                if (!e.target.closest('#categoryDropdown') && !e.target.closest('.action-icon') && !e.target.closest('svg')) {
                    dropdown.classList.add('hidden');
                    document.removeEventListener('click', closeDropdown);
                }
            });
        }, 10);
    }
}

function selectCategory(category) {
    selectedCategory = category;
    document.getElementById('categoryDropdown').classList.add('hidden');
    
    // Zobraz preview
    const preview = document.getElementById('categoryPreview');
    const badge = document.getElementById('categoryBadgePreview');
    const indicator = document.getElementById('categoryIndicator');
    const name = document.getElementById('categoryName');
    
    // Aktualizuj obsah
    name.textContent = category;
    
    // Odstraň staré třídy
    badge.classList.remove('important', 'news', 'life');
    indicator.classList.remove('important', 'news', 'life');
    
    // Přidej nové třídy podle kategorie
    const cssClass = getCategoryClass(category);
    badge.classList.add(cssClass);
    indicator.classList.add(cssClass);
    
    preview.classList.remove('hidden');
}

function removeCategory() {
    selectedCategory = 'Novinky'; // Reset na default
    document.getElementById('categoryPreview').classList.add('hidden');
}

function filterPosts(filter) {
    currentFilter = filter;
    
    // Aktualizuj aktivní tlačítko
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // Aktualizuj zobrazení příspěvků
    document.getElementById('postsFeed').innerHTML = renderPosts();
}

async function createPost() {
    const text = document.getElementById('postText').value.trim();
    if (!text && !selectedPhoto && !selectedFile) return;

    const shareBtn = document.getElementById('shareBtn');
    const originalText = shareBtn.textContent;
    shareBtn.textContent = 'Ukládám na server...';
    shareBtn.disabled = true;
    
    // Vytvoř příspěvek lokálně (spolehlivé)
    const newPost = {
        id: 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        text: text,
        author: `${currentUser.role}:${currentUser.username}`,
        photo: selectedPhoto || null,
        file: selectedFile || null,
        category: selectedCategory || 'Novinky',
        timestamp: Date.now(),
        likes: [], // Pole uživatelů, kteří dali like
        comments: []
    };
    
    // Okamžitě přidej do UI a localStorage
    posts.unshift(newPost);
    localStorage.setItem('simple_posts', JSON.stringify(posts));
    
    // Vyčisti formulář
    document.getElementById('postText').value = '';
    removePhoto();
    removeFile();
    removeCategory();
    updateShareButton();
    
    // Znovu vykresli příspěvky
    document.getElementById('postsFeed').innerHTML = renderPosts();
    
    console.log('✅ Příspěvek úspěšně vytvořen lokálně');
    
    // Zkus uložit na server na pozadí (ale nespoléhej na to)
    try {
        shareBtn.textContent = 'Synchronizuji...';
        
        const response = await fetch('/api/posts-github', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newPost)
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                // Aktualizuj ID z serveru
                const postIndex = posts.findIndex(p => p.id === newPost.id);
                if (postIndex !== -1) {
                    posts[postIndex].id = data.post.id;
                    localStorage.setItem('simple_posts', JSON.stringify(posts));
                }
                console.log('✅ Příspěvek synchronizován se serverem');
                shareBtn.textContent = 'Synchronizováno ✓';
            }
        } else {
            console.warn('⚠️ Server nedostupný, příspěvek uložen pouze lokálně');
            shareBtn.textContent = 'Uloženo lokálně ⚠️';
        }
        
    } catch (error) {
        console.warn('⚠️ Server nedostupný, příspěvek uložen pouze lokálně:', error.message);
        shareBtn.textContent = 'Uloženo lokálně ⚠️';
    } finally {
        // Reset tlačítka po 2 sekundách
        setTimeout(() => {
            shareBtn.textContent = originalText;
            shareBtn.disabled = false;
            updateShareButton();
        }, 2000);
    }
}

function renderPosts() {
    let filteredPosts = posts;
    
    if (currentFilter !== 'all') {
        filteredPosts = posts.filter(post => post.category === currentFilter);
    }
    
    if (filteredPosts.length === 0) {
        return '<div class="empty-state"><h3>Zatím žádné příspěvky</h3><p>Buďte první, kdo sdílí novinky!</p></div>';
    }
    
    return filteredPosts.map(post => createPostHTML(post)).join('');
}

function createPostHTML(post) {
    // Jednoduchý a spolehlivý like systém
    const currentUserIdentifier = `${currentUser.role}:${currentUser.username}`;
    
    // Zajisti, že likes je vždy pole
    if (!Array.isArray(post.likes)) {
        post.likes = [];
    }
    
    // Kontrola, jestli aktuální uživatel dal like
    const isLiked = post.likes.includes(currentUserIdentifier);
    const likesCount = post.likes.length;
    const canDelete = currentUser.role === 'Administrator' || post.author === currentUserIdentifier;
    
    return `
        <div class="post">
            <div class="post-header">
                <div class="post-author">
                    ${createAvatarHTML(post.author)}
                    <div class="author-info">
                        <h4>${formatDisplayName(post.author)}</h4>
                        <span>${formatTime(post.timestamp)}</span>
                    </div>
                </div>
                                 ${canDelete ? `
                     <div class="post-menu" style="position: relative;">
                         <button class="menu-btn" onclick="togglePostMenu('${post.id}')">
                             <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                 <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
                             </svg>
                         </button>
                         <div class="menu-dropdown hidden" id="postMenu-${post.id}">
                             <button class="menu-item" onclick="editPost('${post.id}')" style="color: var(--text-primary);">Upravit</button>
                             <button class="menu-item" onclick="deletePost('${post.id}')">Smazat</button>
                         </div>
                     </div>
                 ` : ''}
            </div>
                         <div id="editForm-${post.id}" class="edit-form hidden">
                 <textarea id="editText-${post.id}" class="edit-textarea">${post.text || ''}</textarea>
                 <div class="edit-actions">
                     <button class="edit-btn" onclick="saveEdit(${post.id})">Uložit</button>
                     <button class="cancel-btn" onclick="cancelEdit(${post.id})">Zrušit</button>
                 </div>
             </div>
             
             <div id="postContent-${post.id}">
                 ${post.category ? `<div class="category-badge ${getCategoryClass(post.category)}">
                     <span class="category-indicator ${getCategoryClass(post.category)}"></span>
                     ${post.category}
                 </div>` : ''}
                 ${post.text ? `<div class="post-content">${post.text}</div>` : ''}
                 ${post.photo ? `<img src="${post.photo}" class="post-image" onclick="openImageModal('${post.photo}')">` : ''}
                 ${post.file ? `
                     <div class="post-file">
                         <div class="file-icon">
                             <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                 <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                 <polyline points="14,2 14,8 20,8"/>
                             </svg>
                         </div>
                         <div class="file-info">
                             <div class="file-name">${post.file.name}</div>
                             <div class="file-size">${post.file.size}</div>
                         </div>
                         <button class="file-download" onclick="downloadFile('${post.file.data}', '${post.file.name}')">
                             <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                 <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                 <polyline points="7,10 12,15 17,10"/>
                                 <line x1="12" y1="15" x2="12" y2="3"/>
                             </svg>
                         </button>
                     </div>
                 ` : ''}
             </div>
             
             <div class="post-footer">
                 <button class="post-action ${isLiked ? 'liked' : ''}" onclick="toggleLike('${post.id}')">
                     <svg viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                         <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                     </svg>
                     ${likesCount > 0 ? likesCount : ''}
                 </button>
                 
                 <button class="post-action" onclick="toggleComments('${post.id}')">
                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                         <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
                     </svg>
                     ${post.comments && post.comments.length > 0 ? post.comments.length : ''}
                 </button>
             </div>
             
             <div class="comments-section" id="comments-${post.id}">
                 <div class="comment-form">
                     ${createAvatarHTML(currentUser.username, 'comment-avatar')}
                     <div class="comment-input-wrapper">
                         <input 
                             type="text" 
                             id="commentInput-${post.id}"
                             class="comment-input" 
                             placeholder="Napsat komentář..." 
                             onkeypress="if(event.key==='Enter' && this.value.trim()) { addComment('${post.id}', this.value); this.value=''; }"
                             oninput="updateCommentSend('${post.id}')"
                         >
                     </div>
                     <button 
                         class="comment-send" 
                         id="commentSend-${post.id}"
                         onclick="sendComment('${post.id}')"
                         disabled
                         title="Odeslat komentář"
                     >
                         <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                             <line x1="22" y1="2" x2="11" y2="13"/>
                             <polygon points="22,2 15,22 11,13 2,9"/>
                         </svg>
                     </button>
                 </div>
                 
                 <div class="comments-list">
                     ${post.comments.map(comment => `
                         <div class="comment">
                             ${createAvatarHTML(comment.author, 'comment-avatar')}
                             <div class="comment-content">
                                 <div class="comment-author">${formatDisplayName(comment.author)}</div>
                                 <div class="comment-text">${comment.text || comment.content}</div>
                                 <div class="comment-time">${formatTime(comment.timestamp)}</div>
                             </div>
                             ${currentUser.role === 'Administrator' ? `
                                 <button class="comment-delete" onclick="deleteComment('${post.id}', '${comment.id}')" title="Smazat komentář">
                                     <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                         <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6"/>
                                     </svg>
                                 </button>
                             ` : ''}
                         </div>
                     `).join('')}
                 </div>
             </div>
        </div>
    `;
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getUserProfileImage(authorIdentifier) {
    // Získej userId z autora
    // Formát může být buď "role:username" nebo jen "username"
    let username;
    if (authorIdentifier.includes(':')) {
        const [role, user] = authorIdentifier.split(':');
        username = user;
    } else {
        username = authorIdentifier;
    }
    
    // Najdi userId podle username ve stored users
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Různé způsoby hledání uživatele
        let user = users.find(u => u.username === username);
        if (!user) {
            user = users.find(u => `${u.firstName} ${u.lastName}` === username);
        }
        if (!user) {
            // Pokud je username ve formátu "Jméno Příjmení", zkus najít podle firstName a lastName
            const nameParts = username.split(' ');
            if (nameParts.length >= 2) {
                user = users.find(u => u.firstName === nameParts[0] && u.lastName === nameParts[1]);
            }
        }
        if (!user) {
            // Pro aktuálního uživatele zkusit getCurrentUserId
            if (username === currentUser.username) {
                const currentUserId = localStorage.getItem('userId');
                if (currentUserId) {
                    const profileImage = localStorage.getItem(`profileImage_${currentUserId}`);
                    return profileImage;
                }
            }
        }
        
        if (user && user.id) {
            const profileImage = localStorage.getItem(`profileImage_${user.id}`);
            return profileImage;
        }
    } catch (error) {
        console.log('Chyba při načítání profilové fotky:', error);
    }
    
    return null;
}

function createAvatarHTML(authorIdentifier, avatarClass = 'author-avatar') {
    const profileImage = getUserProfileImage(authorIdentifier);
    
    if (profileImage) {
        return `<div class="${avatarClass}" style="background-image: url(${profileImage}); background-size: cover; background-position: center; background-repeat: no-repeat;"></div>`;
    } else {
        return `<div class="${avatarClass}">${getInitials(authorIdentifier)}</div>`;
    }
}

function formatDisplayName(authorIdentifier) {
    // Pokud je to starý formát (bez dvojtečky), vrať jak je
    if (!authorIdentifier.includes(':')) {
        return authorIdentifier;
    }
    
    // Nový formát "role:username" - zobraz jen roli
    const [role, username] = authorIdentifier.split(':');
    
    // Mapování rolí na hezká jména
    const roleNames = {
        'Administrator': 'Admin',
        'Prodejce': 'Prodejce',
        'Servis': 'Servis'
    };
    
    return roleNames[role] || role;
}

function getCategoryClass(category) {
    switch(category) {
        case 'Důležité': return 'important';
        case 'Novinky': return 'news';
        case 'Ze života': return 'life';
        default: return 'news';
    }
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMins = Math.floor((now - date) / 60000);
    
    if (diffMins < 1) return 'právě teď';
    if (diffMins < 60) return `před ${diffMins} min`;
    if (diffMins < 1440) return `před ${Math.floor(diffMins / 60)} hod`;
    return date.toLocaleDateString('cs-CZ');
}

async function toggleLike(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const currentUserIdentifier = `${currentUser.role}:${currentUser.username}`;
    
    // Zajisti, že likes je pole
    if (!Array.isArray(post.likes)) {
        post.likes = [];
    }
    
    const wasLiked = post.likes.includes(currentUserIdentifier);
    
    // Najdi like tlačítko pro animaci
    const likeButton = document.querySelector(`button[onclick="toggleLike('${postId}')"]`);
    
    // Spusť animaci PŘED změnou stavu
    if (wasLiked) {
        // Animace pro odebrání like (smutné smajlíky)
        createUnlikeAnimation(likeButton);
    } else {
        // Animace pro přidání like (srdíčka)
        createLikeAnimation(likeButton);
    }
    
    // Přidej pulsující efekt k tlačítku
    if (likeButton) {
        likeButton.classList.add('like-button-pulse');
        setTimeout(() => {
            likeButton.classList.remove('like-button-pulse');
        }, 300);
    }
    
    // Okamžitě aktualizuj UI (optimistic update)
    if (wasLiked) {
        // Odstraň like
        const index = post.likes.indexOf(currentUserIdentifier);
        if (index > -1) {
            post.likes.splice(index, 1);
        }
    } else {
        // Přidej like (pouze pokud tam ještě není)
        if (!post.likes.includes(currentUserIdentifier)) {
            post.likes.push(currentUserIdentifier);
        }
    }

    // Znovu vykresli
    document.getElementById('postsFeed').innerHTML = renderPosts();

    // Okamžitě ulož do localStorage (spolehlivý backup)
    savePosts();
    
    // Zkus uložit na server (ale nespoléhej na to)
    try {
        const response = await fetch('/api/posts-github', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: postId,
                likes: post.likes
            })
        });

        if (response.ok) {
            console.log('✅ Like uložen na server');
        } else {
            console.warn('⚠️ Server nedostupný, like uložen pouze lokálně');
        }
        
    } catch (error) {
        console.warn('⚠️ Server nedostupný, like uložen pouze lokálně:', error.message);
        // Nekraj aplikaci - localStorage backup už je uložen
    }
}

function togglePostMenu(postId) {
    const menu = document.getElementById(`postMenu-${postId}`);
    
    // Zavři všechna ostatní menu
    document.querySelectorAll('.menu-dropdown').forEach(dropdown => {
        if (dropdown.id !== `postMenu-${postId}`) {
            dropdown.classList.add('hidden');
        }
    });
    
    menu.classList.toggle('hidden');
    
    // Zavři menu při kliknutí mimo
    if (!menu.classList.contains('hidden')) {
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!e.target.closest('.post-menu')) {
                    menu.classList.add('hidden');
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 10);
    }
}

function editPost(postId) {
    const editForm = document.getElementById(`editForm-${postId}`);
    const postContent = document.getElementById(`postContent-${postId}`);
    const menu = document.getElementById(`postMenu-${postId}`);
    
    editForm.classList.remove('hidden');
    postContent.classList.add('hidden');
    menu.classList.add('hidden');
    
    // Focus na textarea
    document.getElementById(`editText-${postId}`).focus();
}

async function saveEdit(postId) {
    const newText = document.getElementById(`editText-${postId}`).value.trim();
    if (!newText) return;
    
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const originalText = post.text;
    
    // Optimisticky aktualizuj
    post.text = newText;
    post.edited = Date.now();
    
    document.getElementById('postsFeed').innerHTML = renderPosts();

    try {
        // Pošli na server
        const response = await fetch('/api/posts-github', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: postId,
                text: newText,
                edited: post.edited
            })
        });

        if (!response.ok) {
            throw new Error('Chyba při ukládání úpravy na server');
        }

        console.log('✅ Úprava uložena na server');
        
        // Backup do localStorage
        savePosts();
        
    } catch (error) {
        console.error('❌ Chyba při ukládání úpravy:', error);
        
        // Rollback při chybě
        post.text = originalText;
        delete post.edited;
        
        document.getElementById('postsFeed').innerHTML = renderPosts();
        alert('Chyba při ukládání úpravy: ' + error.message);
        
        // Backup do localStorage
        savePosts();
    }
}

function cancelEdit(postId) {
    const editForm = document.getElementById(`editForm-${postId}`);
    const postContent = document.getElementById(`postContent-${postId}`);
    
    editForm.classList.add('hidden');
    postContent.classList.remove('hidden');
    
    // Resetuj text na původní
    const post = posts.find(p => p.id === postId);
    if (post) {
        document.getElementById(`editText-${postId}`).value = post.text || '';
    }
}

async function deletePost(postId) {
    if (!confirm('Opravdu chcete smazat tento příspěvek?')) return;
    
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;
    
    const deletedPost = posts[postIndex];
    
    // Optimisticky odstraň z UI
    posts.splice(postIndex, 1);
    document.getElementById('postsFeed').innerHTML = renderPosts();

    try {
        // Pošli na server
        const response = await fetch(`/api/posts-github?id=${postId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Chyba při mazání příspěvku na serveru');
        }

        console.log('✅ Příspěvek smazán na serveru');
        
        // Backup do localStorage
        savePosts();
        
    } catch (error) {
        console.error('❌ Chyba při mazání příspěvku:', error);
        
        // Rollback při chybě
        posts.splice(postIndex, 0, deletedPost);
        document.getElementById('postsFeed').innerHTML = renderPosts();
        alert('Chyba při mazání příspěvku: ' + error.message);
        
        // Backup do localStorage
        savePosts();
    }
}

function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    commentsSection.classList.toggle('show');
}

async function addComment(postId, content) {
    const post = posts.find(p => p.id === postId);
    if (!post || !content.trim()) return;

    const comment = {
        id: Date.now().toString(),
        author: `${currentUser.role}:${currentUser.username}`,
        text: content.trim(),
        timestamp: Date.now()
    };

    // Optimisticky přidej komentář
    if (!post.comments) post.comments = [];
    post.comments.push(comment);
    
    document.getElementById('postsFeed').innerHTML = renderPosts();
    
    // Zobraz komentáře
    setTimeout(() => {
        const commentsSection = document.getElementById(`comments-${postId}`);
        if (!commentsSection.classList.contains('show')) {
            commentsSection.classList.add('show');
        }
    }, 100);

    try {
        // Pošli na server
        const response = await fetch('/api/posts-github', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: postId,
                comments: post.comments
            })
        });

        if (!response.ok) {
            throw new Error('Chyba při ukládání komentáře na server');
        }

        console.log('✅ Komentář uložen na server');
        
        // Backup do localStorage
        savePosts();
        
    } catch (error) {
        console.error('❌ Chyba při ukládání komentáře:', error);
        
        // Rollback při chybě
        const commentIndex = post.comments.findIndex(c => c.id === comment.id);
        if (commentIndex > -1) {
            post.comments.splice(commentIndex, 1);
        }
        
        document.getElementById('postsFeed').innerHTML = renderPosts();
        alert('Chyba při ukládání komentáře: ' + error.message);
        
        // Backup do localStorage
        savePosts();
    }
}

function sendComment(postId) {
    const input = document.getElementById(`commentInput-${postId}`);
    if (input && input.value.trim()) {
        addComment(postId, input.value);
        input.value = '';
        updateCommentSend(postId);
    }
}

function updateCommentSend(postId) {
    const input = document.getElementById(`commentInput-${postId}`);
    const button = document.getElementById(`commentSend-${postId}`);
    if (input && button) {
        button.disabled = !input.value.trim();
    }
}

async function deleteComment(postId, commentId) {
    if (!confirm('Opravdu chcete smazat tento komentář?')) return;
    
    const post = posts.find(p => p.id === postId);
    if (!post || !post.comments) return;
    
    const commentIndex = post.comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) return;
    
    const deletedComment = post.comments[commentIndex];
    
    // Optimisticky odstraň z UI
    post.comments.splice(commentIndex, 1);
    document.getElementById('postsFeed').innerHTML = renderPosts();
    
    // Zobraz komentáře pokud byly vidět
    setTimeout(() => {
        const commentsSection = document.getElementById(`comments-${postId}`);
        commentsSection.classList.add('show');
    }, 100);

    try {
        // Pošli na server
        const response = await fetch('/api/posts-github', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: postId,
                comments: post.comments
            })
        });

        if (!response.ok) {
            throw new Error('Chyba při mazání komentáře na serveru');
        }

        console.log('✅ Komentář smazán na serveru');
        
        // Backup do localStorage
        savePosts();
        
    } catch (error) {
        console.error('❌ Chyba při mazání komentáře:', error);
        
        // Rollback při chybě
        post.comments.splice(commentIndex, 0, deletedComment);
        document.getElementById('postsFeed').innerHTML = renderPosts();
        
        setTimeout(() => {
            const commentsSection = document.getElementById(`comments-${postId}`);
            commentsSection.classList.add('show');
        }, 100);
        
        alert('Chyba při mazání komentáře: ' + error.message);
        
        // Backup do localStorage
        savePosts();
    }
}

function openImageModal(imageSrc) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:10000;display:flex;align-items:center;justify-content:center;cursor:pointer;';
    modal.innerHTML = `<img src="${imageSrc}" style="max-width:90%;max-height:90%;object-fit:contain;"><button style="position:absolute;top:2rem;right:2rem;background:rgba(255,255,255,0.2);border:none;color:white;font-size:2rem;cursor:pointer;border-radius:50%;width:50px;height:50px;">×</button>`;
    modal.addEventListener('click', () => document.body.removeChild(modal));
    document.body.appendChild(modal);
}

function downloadFile(dataUrl, fileName) {
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 💖 Animace pro like systém 💖
function createLikeAnimation(button) {
    if (!button) return;
    
    const hearts = ['💖', '❤️', '💕', '💗', '💝'];
    const buttonRect = button.getBoundingClientRect();
    
    // Vytvoř 5-8 srdíček
    const heartCount = 5 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < heartCount; i++) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
            heart.style.cssText = `
                position: fixed;
                left: ${buttonRect.left + buttonRect.width / 2}px;
                top: ${buttonRect.top + buttonRect.height / 2}px;
                font-size: 20px;
                pointer-events: none;
                z-index: 10000;
                animation: heartFloat 2s ease-out forwards;
                transform-origin: center;
            `;
            
            // Přidej unikátní směr pro každé srdíčko
            const angle = (i / heartCount) * 360;
            const distance = 60 + Math.random() * 40;
            heart.style.setProperty('--angle', angle + 'deg');
            heart.style.setProperty('--distance', distance + 'px');
            
            document.body.appendChild(heart);
            
            // Odstraň po animaci
            setTimeout(() => {
                if (heart.parentNode) {
                    heart.parentNode.removeChild(heart);
                }
            }, 2000);
        }, i * 100); // Postupné objevování
    }
}

function createUnlikeAnimation(button) {
    if (!button) return;
    
    const sadEmojis = ['😢', '😭', '💔', '😞', '😔'];
    const buttonRect = button.getBoundingClientRect();
    
    // Vytvoř 3-5 smutných smajlíků
    const emojiCount = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < emojiCount; i++) {
        setTimeout(() => {
            const emoji = document.createElement('div');
            emoji.textContent = sadEmojis[Math.floor(Math.random() * sadEmojis.length)];
            emoji.style.cssText = `
                position: fixed;
                left: ${buttonRect.left + buttonRect.width / 2}px;
                top: ${buttonRect.top + buttonRect.height / 2}px;
                font-size: 18px;
                pointer-events: none;
                z-index: 10000;
                animation: sadFloat 2.5s ease-out forwards;
                transform-origin: center;
            `;
            
            // Přidej unikátní směr pro každý smajlík (dolů a do stran)
            const angle = -90 + (i - emojiCount/2) * 30; // Směr dolů s rozptylem
            const distance = 40 + Math.random() * 30;
            emoji.style.setProperty('--angle', angle + 'deg');
            emoji.style.setProperty('--distance', distance + 'px');
            
            document.body.appendChild(emoji);
            
            // Odstraň po animaci
            setTimeout(() => {
                if (emoji.parentNode) {
                    emoji.parentNode.removeChild(emoji);
                }
            }, 2500);
        }, i * 150); // Postupné objevování
    }
}

// Přidej CSS animace do head
function addLikeAnimationStyles() {
    if (document.getElementById('like-animations-css')) return; // Už je přidané
    
    const style = document.createElement('style');
    style.id = 'like-animations-css';
    style.textContent = `
        @keyframes heartFloat {
            0% {
                opacity: 0;
                transform: scale(0.5) rotate(0deg) translateY(0px);
            }
            20% {
                opacity: 1;
                transform: scale(1.2) rotate(15deg) translateY(-10px);
            }
            100% {
                opacity: 0;
                transform: scale(0.8) rotate(var(--angle, 45deg)) 
                          translateY(-50px) 
                          translateX(calc(cos(var(--angle, 45deg)) * var(--distance, 60px)));
            }
        }
        
        @keyframes sadFloat {
            0% {
                opacity: 0;
                transform: scale(0.5) translateY(0px);
            }
            20% {
                opacity: 1;
                transform: scale(1.1) translateY(-5px);
            }
            100% {
                opacity: 0;
                transform: scale(0.7) 
                          translateY(var(--distance, 40px)) 
                          translateX(calc(sin(var(--angle, -90deg)) * 20px));
            }
        }
        
        /* Pulsující efekt pro like tlačítko */
        .like-button-pulse {
            animation: likePulse 0.3s ease-in-out;
        }
        
        @keyframes likePulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }
    `;
    
    document.head.appendChild(style);
}

// Animace se načtou automaticky při spuštění renderApp() 