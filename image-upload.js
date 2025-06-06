// === DRAG & DROP IMAGE UPLOAD SYSTÉM ===

class ImageUploadManager {
    constructor() {
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        this.uploadQueue = [];
        this.isUploading = false;
        this.compressionQuality = 0.8;
        
        this.init();
    }

    init() {
        this.createUploadAreas();
        this.setupGlobalDragDrop();
        this.setupPasteHandler();
        console.log('📸 Image Upload Manager inicializován');
    }

    // === UPLOAD AREAS CREATION ===
    createUploadAreas() {
        // Najdi všechny posty a přidej upload area
        const posts = document.querySelectorAll('.post');
        posts.forEach(post => {
            this.addUploadAreaToPost(post);
        });

        // Vytvoř obecnou upload area pro nové příspěvky
        this.createMainUploadArea();
    }

    addUploadAreaToPost(postElement) {
        const commentsSection = postElement.querySelector('.comments-section');
        if (commentsSection && !postElement.querySelector('.upload-area')) {
            const uploadArea = this.createUploadArea(postElement.dataset.postId || 'default');
            commentsSection.insertBefore(uploadArea, commentsSection.firstChild);
        }
    }

    createMainUploadArea() {
        const container = document.querySelector('.container');
        if (container && !container.querySelector('.main-upload-area')) {
            const uploadArea = this.createUploadArea('new-post', true);
            uploadArea.className += ' main-upload-area';
            uploadArea.style.marginBottom = '2rem';
            
            // Přidej na začátek containeru
            const firstPost = container.querySelector('.post');
            if (firstPost) {
                container.insertBefore(uploadArea, firstPost);
            } else {
                container.appendChild(uploadArea);
            }
        }
    }

    createUploadArea(postId, isMain = false) {
        const uploadArea = document.createElement('div');
        uploadArea.className = 'upload-area';
        uploadArea.dataset.postId = postId;
        
        uploadArea.innerHTML = `
            <div class="upload-content">
                <div class="upload-icon">📷</div>
                <div class="upload-text">
                    ${isMain ? 'Přetáhni obrázky sem pro nový příspěvek' : 'Přetáhni obrázky sem'}
                </div>
                <div class="upload-hint">
                    nebo klikni pro výběr souborů<br>
                    <small>Podporované formáty: JPEG, PNG, GIF, WebP (max 5MB)</small>
                </div>
                <input type="file" class="upload-input" multiple accept="image/*" style="display: none;">
            </div>
            <div class="upload-progress" style="display: none;">
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <div class="progress-text">Nahrávání...</div>
            </div>
            <div class="upload-preview" style="display: none;"></div>
        `;

        this.setupUploadAreaEvents(uploadArea);
        return uploadArea;
    }

    // === EVENT HANDLERS ===
    setupUploadAreaEvents(uploadArea) {
        const fileInput = uploadArea.querySelector('.upload-input');
        const uploadContent = uploadArea.querySelector('.upload-content');

        // Click pro otevření file dialogu
        uploadContent.addEventListener('click', () => {
            fileInput.click();
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(Array.from(e.target.files), uploadArea);
        });

        // Drag & Drop events
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            if (!uploadArea.contains(e.relatedTarget)) {
                uploadArea.classList.remove('dragover');
            }
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files).filter(file => 
                file.type.startsWith('image/'));
            
            if (files.length > 0) {
                this.handleFileSelection(files, uploadArea);
            }
        });
    }

    setupGlobalDragDrop() {
        // Globální drag & drop pre celou stránku
        let dragCounter = 0;

        document.addEventListener('dragenter', (e) => {
            e.preventDefault();
            dragCounter++;
            
            if (this.hasImageFiles(e.dataTransfer)) {
                this.showGlobalDropZone();
            }
        });

        document.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dragCounter--;
            
            if (dragCounter === 0) {
                this.hideGlobalDropZone();
            }
        });

        document.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            dragCounter = 0;
            this.hideGlobalDropZone();
            
            // Pokud drop není na upload area, vytvoř nový příspěvek
            if (!e.target.closest('.upload-area') && this.hasImageFiles(e.dataTransfer)) {
                const files = Array.from(e.dataTransfer.files).filter(file => 
                    file.type.startsWith('image/'));
                
                if (files.length > 0) {
                    this.createNewPostWithImages(files);
                }
            }
        });
    }

    setupPasteHandler() {
        document.addEventListener('paste', (e) => {
            const items = Array.from(e.clipboardData.items);
            const imageItems = items.filter(item => item.type.startsWith('image/'));
            
            if (imageItems.length > 0) {
                e.preventDefault();
                
                const files = imageItems.map(item => item.getAsFile()).filter(Boolean);
                
                // Najdi nejbližší upload area nebo vytvoř nový příspěvek
                const activeUploadArea = document.querySelector('.upload-area.active') ||
                                        document.querySelector('.main-upload-area');
                
                if (activeUploadArea) {
                    this.handleFileSelection(files, activeUploadArea);
                } else {
                    this.createNewPostWithImages(files);
                }
                
                this.showNotification('📋 Obrázek vložen ze schránky!', 'success');
            }
        });
    }

    // === FILE HANDLING ===
    handleFileSelection(files, uploadArea) {
        const validFiles = this.validateFiles(files);
        
        if (validFiles.length === 0) {
            this.showNotification('❌ Žádné platné obrázky nebyly vybrány', 'error');
            return;
        }

        if (validFiles.length !== files.length) {
            this.showNotification(
                `⚠️ ${files.length - validFiles.length} souborů bylo odmítnuto (neplatný formát/velikost)`, 
                'warning'
            );
        }

        this.processFiles(validFiles, uploadArea);
    }

    validateFiles(files) {
        return files.filter(file => {
            // Kontrola typu
            if (!this.allowedTypes.includes(file.type)) {
                console.warn(`Nepodporovaný typ souboru: ${file.type}`);
                return false;
            }

            // Kontrola velikosti
            if (file.size > this.maxFileSize) {
                console.warn(`Soubor je příliš velký: ${file.size} bytes`);
                return false;
            }

            return true;
        });
    }

    async processFiles(files, uploadArea) {
        this.showUploadProgress(uploadArea, 0);
        
        const postId = uploadArea.dataset.postId;
        const processedImages = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const progress = ((i + 1) / files.length) * 100;
            
            try {
                // Komprese obrázku
                const compressedFile = await this.compressImage(file);
                
                // Vytvoř preview
                const preview = await this.createImagePreview(compressedFile, file.name);
                processedImages.push(preview);
                
                // Simulace uploadu (v produkci by to šlo na server)
                await this.simulateUpload(compressedFile, postId);
                
                this.updateUploadProgress(uploadArea, progress, `Nahrávání ${i + 1}/${files.length}...`);
                
            } catch (error) {
                console.error('Chyba při zpracování souboru:', error);
                this.showNotification(`❌ Chyba při zpracování ${file.name}`, 'error');
            }
        }

        // Zobraz preview
        this.showImagePreviews(uploadArea, processedImages);
        this.hideUploadProgress(uploadArea);
        
        this.showNotification(
            `✅ ${processedImages.length} obrázků úspěšně nahráno!`, 
            'success'
        );
    }

    async compressImage(file) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Vypočítej nové rozměry (max 1920px na delší straně)
                const maxDimension = 1920;
                let { width, height } = img;
                
                if (width > height && width > maxDimension) {
                    height = (height * maxDimension) / width;
                    width = maxDimension;
                } else if (height > maxDimension) {
                    width = (width * maxDimension) / height;
                    height = maxDimension;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Nakresli a komprimuj
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, {
                        type: file.type,
                        lastModified: Date.now()
                    }));
                }, file.type, this.compressionQuality);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    async createImagePreview(file, originalName) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                resolve({
                    name: originalName,
                    url: e.target.result,
                    size: file.size,
                    type: file.type,
                    file: file
                });
            };
            
            reader.readAsDataURL(file);
        });
    }

    async simulateUpload(file, postId) {
        // Simulace upload delay
        return new Promise(resolve => {
            setTimeout(resolve, Math.random() * 1000 + 500);
        });
    }

    // === UI UPDATES ===
    showUploadProgress(uploadArea, progress) {
        const progressElement = uploadArea.querySelector('.upload-progress');
        const uploadContent = uploadArea.querySelector('.upload-content');
        
        uploadContent.style.display = 'none';
        progressElement.style.display = 'block';
        
        this.updateUploadProgress(uploadArea, progress);
    }

    updateUploadProgress(uploadArea, progress, text = 'Nahrávání...') {
        const progressFill = uploadArea.querySelector('.progress-fill');
        const progressText = uploadArea.querySelector('.progress-text');
        
        if (progressFill) progressFill.style.width = `${progress}%`;
        if (progressText) progressText.textContent = text;
    }

    hideUploadProgress(uploadArea) {
        const progressElement = uploadArea.querySelector('.upload-progress');
        const uploadContent = uploadArea.querySelector('.upload-content');
        
        setTimeout(() => {
            progressElement.style.display = 'none';
            uploadContent.style.display = 'block';
        }, 1000);
    }

    showImagePreviews(uploadArea, images) {
        const previewContainer = uploadArea.querySelector('.upload-preview');
        previewContainer.innerHTML = '';
        previewContainer.style.display = 'block';
        
        images.forEach((image, index) => {
            const previewElement = this.createPreviewElement(image, index);
            previewContainer.appendChild(previewElement);
        });
    }

    createPreviewElement(image, index) {
        const preview = document.createElement('div');
        preview.className = 'image-preview';
        preview.style.cssText = `
            position: relative;
            display: inline-block;
            margin: 0.5rem;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            animation: fadeIn 0.3s ease;
            animation-delay: ${index * 0.1}s;
            animation-fill-mode: both;
        `;
        
        preview.innerHTML = `
            <img src="${image.url}" alt="${image.name}" style="
                width: 120px;
                height: 120px;
                object-fit: cover;
                display: block;
            ">
            <div class="preview-overlay" style="
                position: absolute;
                top: 0;
                right: 0;
                background: rgba(0,0,0,0.7);
                color: white;
                padding: 4px 8px;
                font-size: 12px;
                border-radius: 0 0 0 8px;
            ">
                ${this.formatFileSize(image.size)}
            </div>
            <button class="preview-delete" style="
                position: absolute;
                top: 4px;
                left: 4px;
                background: rgba(255,255,255,0.9);
                border: none;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                transition: all 0.2s ease;
            " title="Odstranit">×</button>
        `;
        
        // Delete handler
        const deleteBtn = preview.querySelector('.preview-delete');
        deleteBtn.addEventListener('click', () => {
            preview.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => preview.remove(), 300);
        });
        
        // Hover efekty
        const deleteButton = preview.querySelector('.preview-delete');
        preview.addEventListener('mouseenter', () => {
            deleteButton.style.background = '#ef4444';
            deleteButton.style.color = 'white';
        });
        
        preview.addEventListener('mouseleave', () => {
            deleteButton.style.background = 'rgba(255,255,255,0.9)';
            deleteButton.style.color = 'black';
        });
        
        return preview;
    }

    // === GLOBAL DROP ZONE ===
    showGlobalDropZone() {
        let dropZone = document.querySelector('.global-drop-zone');
        
        if (!dropZone) {
            dropZone = document.createElement('div');
            dropZone.className = 'global-drop-zone';
            dropZone.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 123, 255, 0.1);
                border: 4px dashed var(--accent-color);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2rem;
                color: var(--accent-color);
                font-weight: bold;
                pointer-events: none;
                animation: fadeIn 0.3s ease;
            `;
            
            dropZone.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">📸</div>
                    <div>Přetáhni obrázky pro vytvoření nového příspěvku</div>
                </div>
            `;
            
            document.body.appendChild(dropZone);
        }
    }

    hideGlobalDropZone() {
        const dropZone = document.querySelector('.global-drop-zone');
        if (dropZone) {
            dropZone.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => dropZone.remove(), 300);
        }
    }

    // === POST CREATION ===
    createNewPostWithImages(files) {
        console.log('📝 Vytváření nového příspěvku s obrázky:', files);
        
        // Vytvoř popup pro nový příspěvek
        this.showNewPostDialog(files);
    }

    showNewPostDialog(files) {
        const dialog = document.createElement('div');
        dialog.className = 'new-post-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        `;
        
        dialog.innerHTML = `
            <div class="dialog-content" style="
                background: var(--bg-primary);
                border-radius: 16px;
                padding: 2rem;
                width: 90%;
                max-width: 500px;
                box-shadow: var(--shadow-lg);
                animation: slideUp 0.3s ease;
            ">
                <h3 style="margin-bottom: 1rem; color: var(--text-primary);">Nový příspěvek</h3>
                <textarea placeholder="O čem přemýšlíš?" style="
                    width: 100%;
                    min-height: 100px;
                    border: 2px solid var(--border-color);
                    border-radius: 8px;
                    padding: 1rem;
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    resize: vertical;
                    outline: none;
                    margin-bottom: 1rem;
                "></textarea>
                <div class="dialog-images" style="
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                    margin-bottom: 1rem;
                "></div>
                <div class="dialog-actions" style="
                    display: flex;
                    gap: 1rem;
                    justify-content: flex-end;
                ">
                    <button class="btn-cancel" style="
                        padding: 0.5rem 1rem;
                        border: 2px solid var(--border-color);
                        background: transparent;
                        color: var(--text-secondary);
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    ">Zrušit</button>
                    <button class="btn-publish" style="
                        padding: 0.5rem 1rem;
                        border: none;
                        background: var(--accent-color);
                        color: white;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    ">Publikovat</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Zpracuj obrázky
        this.processFilesForDialog(files, dialog);
        
        // Event handlers
        const closeDialog = () => {
            dialog.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => dialog.remove(), 300);
        };
        
        dialog.querySelector('.btn-cancel').addEventListener('click', closeDialog);
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) closeDialog();
        });
        
        dialog.querySelector('.btn-publish').addEventListener('click', () => {
            const content = dialog.querySelector('textarea').value.trim();
            if (content || files.length > 0) {
                this.publishNewPost(content, files);
                closeDialog();
            }
        });
        
        // Focus textarea
        dialog.querySelector('textarea').focus();
    }

    async processFilesForDialog(files, dialog) {
        const imagesContainer = dialog.querySelector('.dialog-images');
        
        for (const file of files) {
            try {
                const preview = await this.createImagePreview(file, file.name);
                const previewElement = this.createPreviewElement(preview, 0);
                previewElement.style.margin = '0';
                imagesContainer.appendChild(previewElement);
            } catch (error) {
                console.error('Chyba při vytváření preview:', error);
            }
        }
    }

    publishNewPost(content, images) {
        console.log('📤 Publikuji nový příspěvek:', { content, images: images.length });
        
        // V produkci by to šlo na server
        this.showNotification(
            `✅ Příspěvek publikován s ${images.length} obrázky!`, 
            'success'
        );
        
        // Pokud máme real-time updates, oznám to
        if (window.realTimeUpdates) {
            window.realTimeUpdates.emit('newPost', {
                id: Date.now(),
                content: content,
                images: images.length,
                author: 'Já',
                timestamp: new Date().toISOString()
            });
        }
    }

    // === UTILITY METHODS ===
    hasImageFiles(dataTransfer) {
        if (!dataTransfer || !dataTransfer.types) return false;
        return Array.from(dataTransfer.types).some(type => type === 'Files');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

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

    // === PUBLIC API ===
    addUploadAreaToElement(element, postId = 'default') {
        const uploadArea = this.createUploadArea(postId);
        element.appendChild(uploadArea);
        return uploadArea;
    }

    destroy() {
        // Cleanup event listeners a elementy
        const globalDropZone = document.querySelector('.global-drop-zone');
        if (globalDropZone) globalDropZone.remove();
        
        const dialog = document.querySelector('.new-post-dialog');
        if (dialog) dialog.remove();
        
        console.log('🗑️ Image Upload Manager byl zničen');
    }
}

// === GLOBAL INSTANCE ===
let imageUploadManager = null;

// Inicializace po načtení DOM
document.addEventListener('DOMContentLoaded', () => {
    imageUploadManager = new ImageUploadManager();
    
    // Přidej do globálního kontextu
    window.imageUploadManager = imageUploadManager;
    
    console.log('🚀 Image Upload Manager je aktivní');
});

// Export pro ES6 moduly
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageUploadManager;
} 