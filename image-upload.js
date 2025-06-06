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
                cursor: pointer;
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
            <div class="preview-actions" style="
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(transparent, rgba(0,0,0,0.8));
                padding: 8px 4px 4px;
                display: flex;
                gap: 4px;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.2s ease;
            ">
                <button class="preview-crop" style="
                    background: var(--accent-color);
                    border: none;
                    border-radius: 4px;
                    color: white;
                    padding: 4px 8px;
                    font-size: 11px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                " title="Oříznout">✂️</button>
                <button class="preview-edit" style="
                    background: var(--success-color);
                    border: none;
                    border-radius: 4px;
                    color: white;
                    padding: 4px 8px;
                    font-size: 11px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                " title="Upravit">✏️</button>
                <button class="preview-delete" style="
                    background: var(--danger-color);
                    border: none;
                    border-radius: 4px;
                    color: white;
                    padding: 4px 8px;
                    font-size: 11px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                " title="Odstranit">🗑️</button>
            </div>
        `;
        
        // Action handlers
        const cropBtn = preview.querySelector('.preview-crop');
        const editBtn = preview.querySelector('.preview-edit');
        const deleteBtn = preview.querySelector('.preview-delete');
        const actionsDiv = preview.querySelector('.preview-actions');
        
        // Crop handler
        cropBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openImageCropper(image, preview);
        });
        
        // Edit handler
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openImageEditor(image, preview);
        });
        
        // Delete handler
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            preview.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => preview.remove(), 300);
        });
        
        // Show/hide actions on hover
        preview.addEventListener('mouseenter', () => {
            actionsDiv.style.opacity = '1';
        });
        
        preview.addEventListener('mouseleave', () => {
            actionsDiv.style.opacity = '0';
        });
        
        // Click to view full size
        const img = preview.querySelector('img');
        img.addEventListener('click', () => {
            this.openFullScreenViewer(image);
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

    // === IMAGE EDITING FUNCTIONS ===
    openImageCropper(image, previewElement) {
        const cropDialog = document.createElement('div');
        cropDialog.className = 'crop-dialog';
        cropDialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 10002;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        `;
        
        cropDialog.innerHTML = `
            <div class="crop-container" style="
                position: relative;
                max-width: 90vw;
                max-height: 90vh;
                background: var(--bg-primary);
                border-radius: 12px;
                overflow: hidden;
                box-shadow: var(--shadow-lg);
            ">
                <div class="crop-header" style="
                    padding: 1rem;
                    background: var(--bg-secondary);
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <h3 style="color: var(--text-primary); margin: 0;">Oříznout obrázek</h3>
                    <button class="crop-close" style="
                        background: none;
                        border: none;
                        font-size: 1.5rem;
                        cursor: pointer;
                        color: var(--text-secondary);
                        padding: 0;
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s ease;
                    ">×</button>
                </div>
                <div class="crop-workspace" style="
                    position: relative;
                    background: #000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 400px;
                    max-height: 60vh;
                    overflow: hidden;
                ">
                    <canvas class="crop-canvas" style="
                        max-width: 100%;
                        max-height: 100%;
                        cursor: crosshair;
                    "></canvas>
                    <div class="crop-overlay" style="
                        position: absolute;
                        border: 2px dashed #fff;
                        background: rgba(0,0,0,0.5);
                        pointer-events: none;
                        display: none;
                    "></div>
                </div>
                <div class="crop-controls" style="
                    padding: 1rem;
                    background: var(--bg-secondary);
                    display: flex;
                    gap: 1rem;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <div class="crop-presets" style="display: flex; gap: 0.5rem;">
                        <button class="preset-btn" data-ratio="1:1" style="
                            padding: 0.5rem;
                            border: 1px solid var(--border-color);
                            background: var(--bg-primary);
                            color: var(--text-primary);
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 0.8rem;
                        ">1:1</button>
                        <button class="preset-btn" data-ratio="4:3" style="
                            padding: 0.5rem;
                            border: 1px solid var(--border-color);
                            background: var(--bg-primary);
                            color: var(--text-primary);
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 0.8rem;
                        ">4:3</button>
                        <button class="preset-btn" data-ratio="16:9" style="
                            padding: 0.5rem;
                            border: 1px solid var(--border-color);
                            background: var(--bg-primary);
                            color: var(--text-primary);
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 0.8rem;
                        ">16:9</button>
                        <button class="preset-btn" data-ratio="free" style="
                            padding: 0.5rem;
                            border: 1px solid var(--border-color);
                            background: var(--bg-primary);
                            color: var(--text-primary);
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 0.8rem;
                        ">Volný</button>
                    </div>
                    <div class="crop-actions" style="display: flex; gap: 0.5rem;">
                        <button class="crop-cancel" style="
                            padding: 0.5rem 1rem;
                            border: 1px solid var(--border-color);
                            background: transparent;
                            color: var(--text-secondary);
                            border-radius: 6px;
                            cursor: pointer;
                        ">Zrušit</button>
                        <button class="crop-apply" style="
                            padding: 0.5rem 1rem;
                            border: none;
                            background: var(--accent-color);
                            color: white;
                            border-radius: 6px;
                            cursor: pointer;
                        ">Použít ořez</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(cropDialog);
        
        // Initialize cropper
        this.initializeCropper(cropDialog, image, previewElement);
    }
    
    initializeCropper(dialog, image, previewElement) {
        const canvas = dialog.querySelector('.crop-canvas');
        const ctx = canvas.getContext('2d');
        const overlay = dialog.querySelector('.crop-overlay');
        const workspace = dialog.querySelector('.crop-workspace');
        
        const img = new Image();
        img.onload = () => {
            // Set canvas size
            const maxWidth = 600;
            const maxHeight = 400;
            let { width, height } = img;
            
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width *= ratio;
                height *= ratio;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            // Crop selection state
            let cropData = {
                startX: 0, startY: 0,
                width: width * 0.8, height: height * 0.8,
                isSelecting: false,
                aspectRatio: null
            };
            
            // Center initial crop
            cropData.startX = (width - cropData.width) / 2;
            cropData.startY = (height - cropData.height) / 2;
            
            this.updateCropOverlay(overlay, cropData);
            
            // Mouse events for crop selection
            let mouseDown = false;
            let startX, startY;
            
            canvas.addEventListener('mousedown', (e) => {
                mouseDown = true;
                const rect = canvas.getBoundingClientRect();
                startX = e.clientX - rect.left;
                startY = e.clientY - rect.top;
                cropData.isSelecting = true;
            });
            
            canvas.addEventListener('mousemove', (e) => {
                if (!mouseDown || !cropData.isSelecting) return;
                
                const rect = canvas.getBoundingClientRect();
                const currentX = e.clientX - rect.left;
                const currentY = e.clientY - rect.top;
                
                cropData.startX = Math.min(startX, currentX);
                cropData.startY = Math.min(startY, currentY);
                cropData.width = Math.abs(currentX - startX);
                cropData.height = Math.abs(currentY - startY);
                
                // Apply aspect ratio if set
                if (cropData.aspectRatio) {
                    const targetHeight = cropData.width / cropData.aspectRatio;
                    if (targetHeight <= height - cropData.startY) {
                        cropData.height = targetHeight;
                    } else {
                        cropData.height = height - cropData.startY;
                        cropData.width = cropData.height * cropData.aspectRatio;
                    }
                }
                
                this.updateCropOverlay(overlay, cropData);
            });
            
            canvas.addEventListener('mouseup', () => {
                mouseDown = false;
                cropData.isSelecting = false;
            });
            
            // Preset buttons
            dialog.querySelectorAll('.preset-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const ratio = btn.dataset.ratio;
                    
                    // Remove active class from all buttons
                    dialog.querySelectorAll('.preset-btn').forEach(b => 
                        b.style.background = 'var(--bg-primary)');
                    
                    // Add active class to current button
                    btn.style.background = 'var(--accent-color)';
                    btn.style.color = 'white';
                    
                    if (ratio === 'free') {
                        cropData.aspectRatio = null;
                    } else {
                        const [w, h] = ratio.split(':').map(Number);
                        cropData.aspectRatio = w / h;
                        
                        // Adjust current crop to ratio
                        const newHeight = cropData.width / cropData.aspectRatio;
                        if (newHeight <= height - cropData.startY) {
                            cropData.height = newHeight;
                        } else {
                            cropData.height = height - cropData.startY;
                            cropData.width = cropData.height * cropData.aspectRatio;
                        }
                        
                        this.updateCropOverlay(overlay, cropData);
                    }
                });
            });
            
            // Action buttons
            dialog.querySelector('.crop-cancel').addEventListener('click', () => {
                this.closeCropDialog(dialog);
            });
            
            dialog.querySelector('.crop-close').addEventListener('click', () => {
                this.closeCropDialog(dialog);
            });
            
            dialog.querySelector('.crop-apply').addEventListener('click', () => {
                this.applyCrop(image, cropData, canvas, previewElement);
                this.closeCropDialog(dialog);
            });
            
            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) {
                    this.closeCropDialog(dialog);
                }
            });
        };
        
        img.src = image.url;
    }
    
    updateCropOverlay(overlay, cropData) {
        overlay.style.display = 'block';
        overlay.style.left = cropData.startX + 'px';
        overlay.style.top = cropData.startY + 'px';
        overlay.style.width = cropData.width + 'px';
        overlay.style.height = cropData.height + 'px';
    }
    
    applyCrop(originalImage, cropData, canvas, previewElement) {
        const cropCanvas = document.createElement('canvas');
        const cropCtx = cropCanvas.getContext('2d');
        
        // Set crop canvas size
        cropCanvas.width = cropData.width;
        cropCanvas.height = cropData.height;
        
        // Draw cropped portion
        const img = new Image();
        img.onload = () => {
            const scaleX = img.width / canvas.width;
            const scaleY = img.height / canvas.height;
            
            cropCtx.drawImage(
                img,
                cropData.startX * scaleX,
                cropData.startY * scaleY,
                cropData.width * scaleX,
                cropData.height * scaleY,
                0, 0,
                cropData.width,
                cropData.height
            );
            
            // Convert to blob and update preview
            cropCanvas.toBlob((blob) => {
                const croppedUrl = URL.createObjectURL(blob);
                
                // Update preview image
                const previewImg = previewElement.querySelector('img');
                previewImg.src = croppedUrl;
                
                // Update image data
                originalImage.url = croppedUrl;
                originalImage.size = blob.size;
                
                // Update size overlay
                const sizeOverlay = previewElement.querySelector('.preview-overlay');
                sizeOverlay.textContent = this.formatFileSize(blob.size);
                
                this.showNotification('✂️ Obrázek byl úspěšně oříznut!', 'success');
            }, 'image/jpeg', 0.9);
        };
        
        img.src = originalImage.url;
    }
    
    closeCropDialog(dialog) {
        dialog.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => dialog.remove(), 300);
    }
    
    openImageEditor(image, previewElement) {
        // TODO: Implement image editor with filters, brightness, etc.
        this.showNotification('🎨 Editor obrázků bude brzy dostupný!', 'info');
    }
    
    openFullScreenViewer(image) {
        const viewer = document.createElement('div');
        viewer.className = 'fullscreen-viewer';
        viewer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.95);
            z-index: 10003;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
            cursor: zoom-out;
        `;
        
        viewer.innerHTML = `
            <img src="${image.url}" alt="${image.name}" style="
                max-width: 95%;
                max-height: 95%;
                object-fit: contain;
                border-radius: 8px;
                box-shadow: 0 0 50px rgba(0,0,0,0.5);
            ">
            <button style="
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(0,0,0,0.7);
                border: none;
                color: white;
                font-size: 2rem;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            ">×</button>
        `;
        
        document.body.appendChild(viewer);
        
        viewer.addEventListener('click', () => {
            viewer.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => viewer.remove(), 300);
        });
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