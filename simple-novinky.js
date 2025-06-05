// Jednoduché novinky podle náčrtu
let posts = [];
let currentUser = null;
let selectedPhoto = null;

document.addEventListener('DOMContentLoaded', function() {
    loadCurrentUser();
    loadPosts();
    renderApp();
});

function loadCurrentUser() {
    const userData = localStorage.getItem('currentUser');
    currentUser = userData ? JSON.parse(userData) : {
        username: 'Test User',
        fullName: 'Test Administrator', 
        role: 'Administrator'
    };
}

function loadPosts() {
    const savedPosts = localStorage.getItem('simple_posts');
    posts = savedPosts ? JSON.parse(savedPosts) : [];
    
    // Přidej kategorii do starých příspěvků pokud ji nemají
    posts.forEach(post => {
        if (!post.category) {
            post.category = 'Novinky';
        }
    });
}

function savePosts() {
    try {
        localStorage.setItem('simple_posts', JSON.stringify(posts));
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            alert('Chyba při ukládání: Nedostatek místa v localStorage. Kontaktujte administrátora pro vyčištění cache.');
            console.error('localStorage QuotaExceededError - nutno vyčistit cache');
        } else {
            console.error('Chyba při ukládání:', error);
            alert('Chyba při ukládání příspěvku.');
        }
    }
}

function renderApp() {
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
            .author-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 0.85rem; }
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
             .comment-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 0.7rem; flex-shrink: 0; }
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
    const file = event.target.files[0];
    if (file) {
        // Omezeí velikosti souboru (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
            alert('Fotka je příliš velká. Maximální velikost je 50MB.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            // Komprese a resize obrázku
            resizeAndCompressImage(e.target.result, (compressedImage) => {
                selectedPhoto = compressedImage;
                showImageCropper(compressedImage);
            });
        };
        reader.readAsDataURL(file);
    }
}

function resizeAndCompressImage(dataUrl, callback) {
    const img = new Image();
    img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Výpočet nových rozměrů (max 1200px na delší straně)
        const maxSize = 1200;
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
        
        // Kreslení s kompresí
        ctx.drawImage(img, 0, 0, width, height);
        
        // Komprese na 0.85 kvalitu
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        callback(compressedDataUrl);
    };
    img.src = dataUrl;
}

function showImageCropper(imageDataUrl) {
    const cropperContainer = document.getElementById('imageCropper');
    if (!cropperContainer) {
        // Vytvoř cropper kontejner
        const cropperHTML = `
            <div id="imageCropper" class="image-cropper">
                <div class="cropper-overlay">
                    <div class="cropper-content">
                        <h3>Upravit fotku</h3>
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

let cropData = { x: 0, y: 0, width: 400, height: 400 };

function initializeCropper() {
    const cropImage = document.getElementById('cropImage');
    const cropSelector = document.getElementById('cropSelector');
    
    cropImage.onload = function() {
        // Nastav výchozí crop na střed s fixním poměrem 1:1 (čtverec)
        const imgRect = cropImage.getBoundingClientRect();
        const aspectRatio = 1; // Poměr 1:1 (čtverec)
        
        // Vypočti maximální velikost zachovávající poměr stran
        let maxWidth = imgRect.width * 0.8;
        let maxHeight = imgRect.height * 0.8;
        
        if (maxWidth / maxHeight > aspectRatio) {
            // Omez podle výšky
            cropData.height = maxHeight;
            cropData.width = cropData.height * aspectRatio;
        } else {
            // Omez podle šířky
            cropData.width = maxWidth;
            cropData.height = cropData.width / aspectRatio;
        }
        
        cropData.x = (imgRect.width - cropData.width) / 2;
        cropData.y = (imgRect.height - cropData.height) / 2;
        
        updateCropSelector();
    };
    
    // Drag pro crop selector s fixním poměrem stran
    let isDragging = false;
    let startX = 0, startY = 0;
    let startCropX = 0, startCropY = 0;
    
    cropSelector.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startCropX = cropData.x;
        startCropY = cropData.y;
        e.preventDefault();
        e.stopPropagation();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const newX = startCropX + deltaX;
            const newY = startCropY + deltaY;
            
            const imgRect = cropImage.getBoundingClientRect();
            
            cropData.x = Math.max(0, Math.min(newX, imgRect.width - cropData.width));
            cropData.y = Math.max(0, Math.min(newY, imgRect.height - cropData.height));
            updateCropSelector();
        }
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

function updateCropSelector() {
    const cropSelector = document.getElementById('cropSelector');
    cropSelector.style.left = cropData.x + 'px';
    cropSelector.style.top = cropData.y + 'px';
    cropSelector.style.width = cropData.width + 'px';
    cropSelector.style.height = cropData.height + 'px';
}

async function applyCrop() {
    const cropImage = document.getElementById('cropImage');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Nastav canvas na jednotnou velikost (1:1 poměr - čtverec) - 4K kvalita
    canvas.width = 3840;
    canvas.height = 3840;
    
    // Vypočti poměr mezi obrázkem a jeho zobrazenou velikostí
    const img = new Image();
    img.onload = async function() {
        const displayedRect = cropImage.getBoundingClientRect();
        const scaleX = img.width / displayedRect.width;
        const scaleY = img.height / displayedRect.height;
        
        // Aplikuj crop
        ctx.drawImage(
            img,
            cropData.x * scaleX,
            cropData.y * scaleY,
            cropData.width * scaleX,
            cropData.height * scaleY,
            0, 0,
            canvas.width,
            canvas.height
        );
        
        // Převeď na base64
        const croppedImage = canvas.toDataURL('image/jpeg', 0.8);
        
        try {
            // Pošli fotku na server
            const response = await fetch('upload.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: croppedImage,
                    filename: 'cropped_image.jpg'
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Ulož URL místo base64
                selectedPhoto = result.url;
                
                // Zobraz náhled s URL
                document.getElementById('previewImage').src = selectedPhoto;
                document.getElementById('photoPreview').classList.remove('hidden');
                updateShareButton();
                closeCropper();
            } else {
                throw new Error(result.error || 'Chyba při uploadu');
            }
        } catch (error) {
            console.error('Chyba při uploadu fotky:', error);
            alert('Chyba při ukládání fotky na server: ' + error.message);
            closeCropper();
        }
    };
    img.src = cropImage.src;
}

function closeCropper() {
    const cropper = document.getElementById('imageCropper');
    if (cropper) {
        cropper.remove();
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
    event.target.classList.add('active');
    
    // Aktualizuj zobrazení příspěvků
    document.getElementById('postsFeed').innerHTML = renderPosts();
}

function createPost() {
    const text = document.getElementById('postText').value.trim();
    if (!text && !selectedPhoto && !selectedFile) return;

    posts.unshift({
        id: Date.now(),
        author: currentUser.fullName || currentUser.username,
        content: text,
        image: selectedPhoto,
        file: selectedFile,
        category: selectedCategory,
        timestamp: new Date().toISOString(),
        likes: [],
        comments: []
    });

    savePosts();
    document.getElementById('postText').value = '';
    removePhoto();
    removeFile();
    removeCategory(); // Reset kategorie a schováni preview
    updateShareButton();
    document.getElementById('postsFeed').innerHTML = renderPosts();
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
    const isLiked = post.likes.includes(currentUser.fullName || currentUser.username);
    const canDelete = currentUser.role === 'Administrator' || post.author === (currentUser.fullName || currentUser.username);
    
    return `
        <div class="post">
            <div class="post-header">
                <div class="post-author">
                    <div class="author-avatar">${getInitials(post.author)}</div>
                    <div class="author-info">
                        <h4>${post.author}</h4>
                        <span>${formatTime(post.timestamp)}</span>
                    </div>
                </div>
                                 ${canDelete ? `
                     <div class="post-menu" style="position: relative;">
                         <button class="menu-btn" onclick="togglePostMenu(${post.id})">
                             <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                 <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
                             </svg>
                         </button>
                         <div class="menu-dropdown hidden" id="postMenu-${post.id}">
                             <button class="menu-item" onclick="editPost(${post.id})" style="color: var(--text-primary);">Upravit</button>
                             <button class="menu-item" onclick="deletePost(${post.id})">Smazat</button>
                         </div>
                     </div>
                 ` : ''}
            </div>
                         <div id="editForm-${post.id}" class="edit-form hidden">
                 <textarea id="editText-${post.id}" class="edit-textarea">${post.content}</textarea>
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
                 ${post.content ? `<div class="post-content">${post.content}</div>` : ''}
                 ${post.image ? `<img src="${post.image}" class="post-image" onclick="openImageModal('${post.image}')">` : ''}
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
                 <button class="post-action ${isLiked ? 'liked' : ''}" onclick="toggleLike(${post.id})">
                     <svg viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                         <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                     </svg>
                     ${post.likes.length > 0 ? post.likes.length : ''}
                 </button>
                 
                 <button class="post-action" onclick="toggleComments(${post.id})">
                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                         <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
                     </svg>
                     ${post.comments.length > 0 ? post.comments.length : ''}
                 </button>
             </div>
             
             <div class="comments-section" id="comments-${post.id}">
                 <div class="comment-form">
                     <div class="comment-avatar">
                         ${getInitials(currentUser.fullName || currentUser.username)}
                     </div>
                     <div class="comment-input-wrapper">
                         <input 
                             type="text" 
                             id="commentInput-${post.id}"
                             class="comment-input" 
                             placeholder="Napsat komentář..." 
                             onkeypress="if(event.key==='Enter' && this.value.trim()) { addComment(${post.id}, this.value); this.value=''; }"
                             oninput="updateCommentSend(${post.id})"
                         >
                     </div>
                     <button 
                         class="comment-send" 
                         id="commentSend-${post.id}"
                         onclick="sendComment(${post.id})"
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
                             <div class="comment-avatar">
                                 ${getInitials(comment.author)}
                             </div>
                             <div class="comment-content">
                                 <div class="comment-author">${comment.author}</div>
                                 <div class="comment-text">${comment.content}</div>
                                 <div class="comment-time">${formatTime(comment.timestamp)}</div>
                             </div>
                             ${currentUser.role === 'Administrator' ? `
                                 <button class="comment-delete" onclick="deleteComment(${post.id}, ${comment.id})" title="Smazat komentář">
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

function toggleLike(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const userIdentifier = currentUser.fullName || currentUser.username;
    const index = post.likes.indexOf(userIdentifier);
    
    if (index > -1) {
        post.likes.splice(index, 1);
    } else {
        post.likes.push(userIdentifier);
    }

    savePosts();
    document.getElementById('postsFeed').innerHTML = renderPosts();
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

function saveEdit(postId) {
    const newContent = document.getElementById(`editText-${postId}`).value.trim();
    if (!newContent) return;
    
    const post = posts.find(p => p.id === postId);
    if (post) {
        post.content = newContent;
        savePosts();
        document.getElementById('postsFeed').innerHTML = renderPosts();
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
        document.getElementById(`editText-${postId}`).value = post.content;
    }
}

function deletePost(postId) {
    if (!confirm('Opravdu chcete smazat tento příspěvek?')) return;
    posts = posts.filter(p => p.id !== postId);
    savePosts();
    document.getElementById('postsFeed').innerHTML = renderPosts();
}

function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    commentsSection.classList.toggle('show');
}

function addComment(postId, content) {
    const post = posts.find(p => p.id === postId);
    if (!post || !content.trim()) return;

    const comment = {
        id: Date.now(),
        author: currentUser.fullName || currentUser.username,
        content: content.trim(),
        timestamp: new Date().toISOString()
    };

    post.comments.push(comment);
    savePosts();
    document.getElementById('postsFeed').innerHTML = renderPosts();
    
    // Zobraz komentáře
    setTimeout(() => {
        const commentsSection = document.getElementById(`comments-${postId}`);
        if (!commentsSection.classList.contains('show')) {
            commentsSection.classList.add('show');
        }
    }, 100);
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

function deleteComment(postId, commentId) {
    if (!confirm('Opravdu chcete smazat tento komentář?')) return;
    
    const post = posts.find(p => p.id === postId);
    if (post) {
        post.comments = post.comments.filter(c => c.id !== commentId);
        savePosts();
        document.getElementById('postsFeed').innerHTML = renderPosts();
        
        // Zobraz komentáře pokud byly vidět
        setTimeout(() => {
            const commentsSection = document.getElementById(`comments-${postId}`);
            commentsSection.classList.add('show');
        }, 100);
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