// Novinky.js - Správa příspěvků inspirovaná HeroHero
class NovinkyManager {
    constructor() {
        console.log('🚀 Safari: Initializing NovinkyManager constructor...');
        
        try {
            this.posts = this.loadPosts();
            this.currentUser = this.getCurrentUser();
            this.currentFeeling = null;
            this.attachedFiles = [];
            
            console.log('✅ Safari: NovinkyManager data initialized:', {
                user: this.currentUser,
                postsCount: this.posts.length
            });
            
            // Safari-safe initialization with delay
            var self = this;
            setTimeout(function() {
                console.log('🔄 Safari: Starting init...');
                self.init();
            }, 50);
            
        } catch (error) {
            console.error('❌ Safari constructor error:', error);
            throw error;
        }
    }

    loadPosts() {
        try {
            var saved = localStorage.getItem('novinky_posts');
            if (saved) {
                var posts = JSON.parse(saved);
                
                // Clear old test posts - force clean start
                console.log('🧹 Clearing old test posts for fresh start');
                localStorage.removeItem('novinky_posts');
                return [];
                
                var needsUpdate = false;
                
                // Safari-safe: Oprava starších příspěvků - zajistit, že všechny pole jsou vždy arrays
                for (var i = 0; i < posts.length; i++) {
                    var post = posts[i];
                    
                    // Ensure all required properties exist and are arrays
                    if (!Array.isArray(post.customTags)) {
                        post.customTags = [];
                        needsUpdate = true;
                    }
                    if (!Array.isArray(post.likes)) {
                        post.likes = [];
                        needsUpdate = true;
                    }
                    if (!Array.isArray(post.dislikes)) {
                        post.dislikes = [];
                        needsUpdate = true;
                    }
                    if (!Array.isArray(post.comments)) {
                        post.comments = [];
                        needsUpdate = true;
                    }
                    if (!Array.isArray(post.attachments)) {
                        post.attachments = [];
                        needsUpdate = true;
                    }
                    
                    // Ensure other properties exist
                    if (!post.id) {
                        post.id = Date.now() + i;
                        needsUpdate = true;
                    }
                    if (!post.author) {
                        post.author = 'Neznámý';
                        needsUpdate = true;
                    }
                    if (!post.content) {
                        post.content = '';
                        needsUpdate = true;
                    }
                    if (!post.timestamp) {
                        post.timestamp = new Date().toISOString();
                        needsUpdate = true;
                    }
                }
                
                // If we fixed anything, save the corrected data
                if (needsUpdate) {
                    console.log('🔧 Safari: Updating posts structure...');
                    localStorage.setItem('novinky_posts', JSON.stringify(posts));
                }
                
                console.log('Posts loaded and sanitized for Safari:', posts.length);
                return posts;
            }
        } catch (e) {
            console.error('Error loading posts:', e);
            // Clear corrupted data
            localStorage.removeItem('novinky_posts');
        }
        return [];
    }

    getCurrentUser() {
        // Pokusit se načíst aktuálního uživatele z více zdrojů
        var user = null;
        
        try {
            // Zkusit currentUser z localStorage
            var currentUserStr = localStorage.getItem('currentUser');
            if (currentUserStr) {
                user = JSON.parse(currentUserStr);
                
                // Auto-fix pro staré role
                if (user.role === 'Prodejce' || !user.role) {
                    console.log('🔧 Auto-fixing user role from', user.role, 'to Administrator');
                    user.role = 'Administrator';
                    user.username = 'Test Administrátor';
                    user.fullName = 'Test Administrátor';
                    
                    // Uložit opraveného uživatele
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    localStorage.setItem('username', user.username);
                    localStorage.setItem('role', user.role);
                }
            }
        } catch (e) {
            console.warn('Error parsing currentUser:', e);
        }

        // Fallback na jednotlivé položky
        if (!user) {
            var username = localStorage.getItem('username') || 'Test Administrátor';
            var role = localStorage.getItem('role') || 'Administrator';
            
            user = {
                username: username,
                role: role,
                fullName: username
            };
            
            // Uložit fallback uživatele
            localStorage.setItem('currentUser', JSON.stringify(user));
        }

        // Ensure role is properly set
        if (!user.role || user.role === 'Prodejce') {
            user.role = 'Administrator';
            user.username = 'Test Administrátor';
            user.fullName = 'Test Administrátor';
            localStorage.setItem('currentUser', JSON.stringify(user));
        }

        console.log('Current user loaded:', user);
        return user;
    }

    init() {
        // Použít setTimeout pro Safari kompatibilitu
        var self = this;
        setTimeout(function() {
            self.initializeUserInfo();
            self.bindEvents();
            self.createSamplePostsIfNeeded();
            self.renderPosts();
            self.initializeAccessControl();
        }, 100);
    }

    initializeUserInfo() {
        var userInitials = this.getUserInitials(this.currentUser.fullName || this.currentUser.username);
        
        // Nastavení uživatelských informací - Safari kompatibilní způsob
        var userInitialsElements = document.querySelectorAll('#userInitials, #modalUserInitials');
        for (var i = 0; i < userInitialsElements.length; i++) {
            if (userInitialsElements[i]) {
                userInitialsElements[i].textContent = userInitials;
            }
        }

        var modalUserName = document.getElementById('modalUserName');
        if (modalUserName) {
            modalUserName.textContent = this.currentUser.fullName || this.currentUser.username;
        }

        // Přidání třídy role k body pro CSS styling
        var roleClass = 'user-role-' + this.currentUser.role.toLowerCase();
        
        // Odstranit staré role třídy
        var bodyClasses = document.body.className.split(' ');
        var filteredClasses = [];
        for (var i = 0; i < bodyClasses.length; i++) {
            if (bodyClasses[i] && bodyClasses[i].indexOf('user-role-') !== 0) {
                filteredClasses.push(bodyClasses[i]);
            }
        }
        
        // Přidat novou roli třídu
        filteredClasses.push(roleClass);
        document.body.className = filteredClasses.join(' ');
        
        console.log('User info initialized:', {
            initials: userInitials,
            name: this.currentUser.fullName || this.currentUser.username,
            role: this.currentUser.role,
            roleClass: roleClass
        });
    }

    initializeAccessControl() {
        var createPostSection = document.getElementById('createPostSection');
        if (createPostSection) {
            // Všichni přihlášení uživatelé mohou vytvářet příspěvky
            createPostSection.style.display = 'block';
        }
    }

    getUserInitials(name) {
        if (!name) return 'U';
        return name.split(' ')
                   .map(function(word) { return word.charAt(0).toUpperCase(); })
                   .join('')
                   .substring(0, 2);
    }

    // Safari-safe helper methods
    isLikedByUser(post) {
        if (!post || !post.likes || !Array.isArray(post.likes)) {
            return false;
        }
        var userIdentifier = this.currentUser.fullName || this.currentUser.username;
        return post.likes.indexOf(userIdentifier) > -1 || post.likes.indexOf(this.currentUser.username) > -1;
    }

    getLikesCount(post) {
        if (!post || !post.likes || !Array.isArray(post.likes)) {
            return 0;
        }
        return post.likes.length;
    }

    getCommentsCount(post) {
        if (!post || !post.comments || !Array.isArray(post.comments)) {
            return 0;
        }
        return post.comments.length;
    }

    bindEvents() {
        var self = this;
        
        // Quick post input - otevře modal
        var quickPostInput = document.getElementById('quickPostInput');
        if (quickPostInput) {
            quickPostInput.addEventListener('click', function() { self.openPostModal(); });
            quickPostInput.addEventListener('focus', function() { self.openPostModal(); });
        }

        // Action buttons
        var feelingBtn = document.getElementById('feelingBtn');
        var photoVideoBtn = document.getElementById('photoVideoBtn');

        if (feelingBtn) feelingBtn.addEventListener('click', function() { self.openFeelingModal(); });
        if (photoVideoBtn) photoVideoBtn.addEventListener('click', function() { self.openPostModalWithPhoto(); });

        // Modal controls
        var closeModalBtn = document.getElementById('closeModalBtn');
        var modalBackdrop = document.querySelector('.modal-backdrop');
        if (closeModalBtn) closeModalBtn.addEventListener('click', function() { self.closePostModal(); });
        if (modalBackdrop) modalBackdrop.addEventListener('click', function() { self.closePostModal(); });

        // Feeling modal
        var closeFeelingModal = document.getElementById('closeFeelingModal');
        var feelingBackdrop = document.querySelector('.feeling-modal .modal-backdrop');
        if (closeFeelingModal) closeFeelingModal.addEventListener('click', function() { self.closeFeelingModal(); });
        if (feelingBackdrop) feelingBackdrop.addEventListener('click', function() { self.closeFeelingModal(); });

        // Feeling options
        var feelingOptions = document.querySelectorAll('.feeling-option');
        for (var i = 0; i < feelingOptions.length; i++) {
            (function(option) {
                option.addEventListener('click', function() {
                    var feeling = option.getAttribute('data-feeling');
                    var emoji = option.getAttribute('data-emoji');
                    self.selectFeeling(feeling, emoji);
                });
            })(feelingOptions[i]);
        }

        // Form submission
        var postForm = document.getElementById('postForm');
        if (postForm) {
            postForm.addEventListener('submit', function(e) {
                e.preventDefault();
                self.createPost();
            });
        }

        // Post content textarea
        var postContent = document.getElementById('postContent');
        if (postContent) {
            postContent.addEventListener('input', function() { self.updateSubmitButton(); });
        }

        // File uploads - bind these first as they are always in DOM
        var photoUpload = document.getElementById('photoUpload');

        if (photoUpload) {
            console.log('📷 Safari Debug: Photo upload input found, binding event...');
            photoUpload.addEventListener('change', function(e) { 
                console.log('📷 Safari Debug: Photo upload change event triggered');
                self.handleFileUpload(e, 'photo'); 
            });
        } else {
            console.warn('⚠️ Safari Debug: Photo upload input NOT found!');
        }

        // Modal attachment buttons - use event delegation for better reliability
        document.addEventListener('click', function(e) {
            if (e.target && e.target.id === 'modalPhotoBtn') {
                console.log('📷 Safari Debug: Modal photo button clicked via delegation');
                e.preventDefault();
                self.triggerPhotoUpload();
            }
            if (e.target && e.target.id === 'modalFeelingBtn') {
                console.log('📷 Safari Debug: Modal feeling button clicked via delegation');
                e.preventDefault();
                self.openFeelingModal();
            }
        });

        // Remove feeling
        var removeFeelingBtn = document.getElementById('removeFeelingBtn');
        if (removeFeelingBtn) {
            removeFeelingBtn.addEventListener('click', function() { self.removeFeeling(); });
        }

        // Filter buttons - updated for minimal design
        var filterButtons = document.querySelectorAll('.filter-tab');
        for (var i = 0; i < filterButtons.length; i++) {
            (function(btn) {
                btn.addEventListener('click', function() {
                    var category = btn.getAttribute('data-category');
                    self.filterPosts(category);
                    
                    // Update active button
                    for (var j = 0; j < filterButtons.length; j++) {
                        filterButtons[j].classList.remove('active');
                    }
                    btn.classList.add('active');
                });
            })(filterButtons[i]);
        }
    }

    openPostModal() {
        var modal = document.getElementById('postModal');
        if (modal) {
            modal.style.display = 'flex';
            var self = this;
            setTimeout(function() {
                var postContent = document.getElementById('postContent');
                if (postContent) postContent.focus();
            }, 100);
        }
    }

    openPostModalWithPhoto() {
        this.openPostModal();
        var self = this;
        setTimeout(function() { self.triggerPhotoUpload(); }, 100);
    }



    closePostModal() {
        var modal = document.getElementById('postModal');
        if (modal) {
            modal.style.display = 'none';
            this.resetForm();
        }
    }

    openFeelingModal() {
        var feelingModal = document.getElementById('feelingModal');
        if (feelingModal) {
            feelingModal.style.display = 'flex';
        }
    }

    closeFeelingModal() {
        var feelingModal = document.getElementById('feelingModal');
        if (feelingModal) {
            feelingModal.style.display = 'none';
        }
    }

    selectFeeling(feeling, emoji) {
        this.currentFeeling = { feeling: feeling, emoji: emoji };
        
        var feelingIndicator = document.getElementById('feelingIndicator');
        var feelingText = document.getElementById('feelingText');
        
        if (feelingIndicator && feelingText) {
            feelingText.textContent = emoji + ' ' + (this.currentUser.fullName || this.currentUser.username) + ' se cítí ' + feeling;
            feelingIndicator.style.display = 'flex';
        }

        // Předvyplnění textu
        var postContent = document.getElementById('postContent');
        if (postContent && !postContent.value.trim()) {
            postContent.value = 'Cítím se ' + feeling + '! ' + emoji + ' ';
            postContent.focus();
            // Umístění kurzoru na konec - Safari kompatibilní
            if (postContent.setSelectionRange) {
                postContent.setSelectionRange(postContent.value.length, postContent.value.length);
            }
        }

        this.updateSubmitButton();
        this.closeFeelingModal();
        
        // Otevřít modal pokud není otevřený
        var modal = document.getElementById('postModal');
        if (modal && modal.style.display === 'none') {
            this.openPostModal();
        }
    }

    removeFeeling() {
        this.currentFeeling = null;
        var feelingIndicator = document.getElementById('feelingIndicator');
        if (feelingIndicator) {
            feelingIndicator.style.display = 'none';
        }
        this.updateSubmitButton();
    }

    triggerPhotoUpload() {
        console.log('📷 Safari Debug: triggerPhotoUpload() called');
        var photoUpload = document.getElementById('photoUpload');
        if (photoUpload) {
            console.log('📷 Safari Debug: Photo upload input found, triggering click...');
            photoUpload.click();
        } else {
            console.warn('⚠️ Safari Debug: Photo upload input NOT found in triggerPhotoUpload!');
        }
    }



    handleFileUpload(event, type) {
        console.log('📷 Safari Debug: handleFileUpload called with event:', event);
        var files = Array.prototype.slice.call(event.target.files);
        var self = this;
        
        console.log('📷 Safari Debug: Files selected:', files.length);
        
        if (files.length === 0) {
            console.log('📷 Safari Debug: No files selected, returning...');
            return;
        }
        
        console.log('📸 Starting file upload...', files.length, 'files');
        
        // Validate upload preview container
        var uploadPreview = document.getElementById('uploadPreview');
        if (!uploadPreview) {
            console.error('❌ Safari Debug: Upload preview container not found!');
            this.showToast('Chyba: Upload preview kontejner nebyl nalezen!', 'error');
            return;
        }
        
        // Show loading indicator
        console.log('📷 Safari Debug: Showing upload loading...');
        this.showUploadLoading(true);
        
        var processedFiles = 0;
        var totalFiles = files.length;
        
        files.forEach(function(file, index) {
            console.log('📷 Safari Debug: Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                console.warn('⚠️ Safari Debug: Unsupported file type:', file.type);
                processedFiles++;
                if (processedFiles === totalFiles) {
                    self.showUploadLoading(false);
                    self.showToast('Některé soubory nebyly podporované!', 'warning');
                }
                return;
            }
            
            // Simulate processing time for better UX
            setTimeout(function() {
                try {
                    var fileObj = {
                        file: file,
                        name: file.name,
                        size: self.formatFileSize(file.size),
                        type: type,
                        url: URL.createObjectURL(file)
                    };
                    
                    console.log('📷 Safari Debug: Created file object:', fileObj);
                    
                    self.attachedFiles.push(fileObj);
                    processedFiles++;
                    
                    console.log('📸 File processed:', processedFiles, '/', totalFiles);
                    
                    // Update progress
                    var progress = Math.round((processedFiles / totalFiles) * 100);
                    self.updateUploadProgress(progress);
                    
                    // When all files are processed
                    if (processedFiles === totalFiles) {
                        setTimeout(function() {
                            console.log('📷 Safari Debug: All files processed, hiding loading...');
                            self.showUploadLoading(false);
                            self.renderUploadPreview();
                            self.updateSubmitButton();
                            
                            // Show success notification
                            var message = totalFiles === 1 ? 'Obrázek byl nahrán!' : totalFiles + ' obrázků bylo nahráno!';
                            self.showToast(message, 'success');
                            
                            console.log('✅ Upload completed successfully');
                        }, 300);
                    }
                } catch (error) {
                    console.error('❌ Safari Debug: Error processing file:', error);
                    processedFiles++;
                    if (processedFiles === totalFiles) {
                        self.showUploadLoading(false);
                        self.showToast('Chyba při zpracování souborů!', 'error');
                    }
                }
            }, index * 200); // Stagger file processing
        });
        
        // Clear the input
        event.target.value = '';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        var k = 1024;
        var sizes = ['Bytes', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showUploadLoading(show) {
        var uploadPreview = document.getElementById('uploadPreview');
        if (!uploadPreview) return;
        
        if (show) {
            var loadingHTML = '<div class="upload-loading" id="uploadLoadingIndicator">' +
                '<div class="upload-loading-content">' +
                    '<div class="upload-spinner"></div>' +
                    '<div class="upload-progress-text">Nahrávám obrázky...</div>' +
                    '<div class="upload-progress-bar">' +
                        '<div class="upload-progress-fill" id="uploadProgressFill" style="width: 0%"></div>' +
                    '</div>' +
                '</div>' +
            '</div>';
            
            uploadPreview.innerHTML = loadingHTML;
        } else {
            var loading = document.getElementById('uploadLoadingIndicator');
            if (loading) {
                loading.remove();
            }
        }
    }

    updateUploadProgress(percentage) {
        var progressFill = document.getElementById('uploadProgressFill');
        var progressText = document.querySelector('.upload-progress-text');
        
        if (progressFill) {
            progressFill.style.width = percentage + '%';
        }
        
        if (progressText) {
            progressText.textContent = 'Nahrávám obrázky... ' + percentage + '%';
        }
    }

    renderUploadPreview() {
        var preview = document.getElementById('uploadPreview');
        if (!preview) return;

        preview.innerHTML = '';
        var self = this;
        
        this.attachedFiles.forEach(function(fileObj, index) {
            var previewItem = document.createElement('div');
            previewItem.className = 'upload-preview-item';
            previewItem.style.cssText = 'position: relative; border: 1px solid var(--border-color); border-radius: 12px; padding: 0; background: var(--bg-secondary); margin-bottom: 1rem; overflow: hidden;';

            if (fileObj.type === 'photo' && fileObj.file.type.indexOf('image/') === 0) {
                previewItem.innerHTML = '<img src="' + fileObj.url + '" alt="Náhled" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">' +
                    '<button type="button" class="remove-file-btn" data-index="' + index + '" style="position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(0,0,0,0.8); color: white; border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px;">✕</button>';
            } else {
                previewItem.innerHTML = '<div style="text-align: center;">' +
                    '<div style="font-size: 2rem; margin-bottom: 0.5rem;">📎</div>' +
                    '<div style="font-weight: 500; color: var(--text-primary); margin-bottom: 0.25rem;">' + fileObj.name + '</div>' +
                    '<div style="font-size: 0.875rem; color: var(--text-secondary);">' + fileObj.size + '</div>' +
                    '</div>' +
                    '<button type="button" class="remove-file-btn" data-index="' + index + '" style="position: absolute; top: 0.5rem; right: 0.5rem; background: var(--danger-color); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer;">✕</button>';
            }

            preview.appendChild(previewItem);
        });

        // Bind remove buttons
        var removeButtons = preview.querySelectorAll('.remove-file-btn');
        for (var i = 0; i < removeButtons.length; i++) {
            (function(btn) {
                btn.addEventListener('click', function() {
                    var index = parseInt(btn.getAttribute('data-index'));
                    self.attachedFiles.splice(index, 1);
                    self.renderUploadPreview();
                    self.updateSubmitButton();
                });
            })(removeButtons[i]);
        }
    }

    updateSubmitButton() {
        var submitBtn = document.querySelector('.minimal-submit-btn');
        var postContent = document.getElementById('postContent');
        
        if (submitBtn && postContent) {
            var hasContent = postContent.value.trim().length > 0;
            var hasFeeling = this.currentFeeling !== null;
            var hasFiles = this.attachedFiles.length > 0;
            
            submitBtn.disabled = !(hasContent || hasFeeling || hasFiles);
        }
    }

    createPost() {
        var postContent = document.getElementById('postContent');
        var postCategory = document.getElementById('postCategory');
        
        if (!postContent) return;

        var content = postContent.value.trim();
        if (!content && !this.currentFeeling && this.attachedFiles.length === 0) {
            this.showToast('Příspěvek musí obsahovat text, pocit nebo přílohu!', 'error');
            return;
        }

        var post = {
            id: Date.now(),
            author: this.currentUser.fullName || this.currentUser.username,
            authorRole: this.currentUser.role,
            content: content,
            feeling: this.currentFeeling,
            category: postCategory && postCategory.value ? postCategory.value : 'obecne',
            customTags: [], // Prázdné pole pro kompatibilitu
            attachments: JSON.parse(JSON.stringify(this.attachedFiles)), // Deep copy for Safari
            timestamp: new Date().toISOString(),
            likes: [],
            dislikes: [],
            comments: []
        };

        this.posts.unshift(post);
        this.savePosts();
        this.renderPosts();
        this.closePostModal();
        this.showToast('Příspěvek byl úspěšně vytvořen!', 'success');
    }

    resetForm() {
        var postForm = document.getElementById('postForm');
        if (postForm) postForm.reset();
        
        this.currentFeeling = null;
        this.attachedFiles = [];
        
        var feelingIndicator = document.getElementById('feelingIndicator');
        if (feelingIndicator) feelingIndicator.style.display = 'none';
        
        this.renderUploadPreview();
        this.updateSubmitButton();
    }

    renderPosts() {
        console.log('🎨 Safari: Starting renderPosts...');
        
        var container = document.getElementById('postsContainer');
        var loading = document.getElementById('postsLoading');
        
        if (!container) {
            console.error('❌ Safari: Posts container not found! Retrying...');
            var self = this;
            setTimeout(function() {
                console.log('🔄 Safari: Retry renderPosts...');
                self.renderPosts();
            }, 300);
            return;
        }

        console.log('✅ Safari: Container found, hiding loading...');
        if (loading) loading.style.display = 'none';

        console.log('📊 Safari: Rendering posts:', this.posts.length);

        if (this.posts.length === 0) {
            container.innerHTML = '<div class="no-posts">' +
                '<div class="no-posts-icon">📢</div>' +
                '<h3>Zatím žádné příspěvky</h3>' +
                '<p>Buďte první, kdo sdílí novinky s týmem!</p>' +
                '</div>';
            return;
        }

        var self = this;
        var postsHTML = this.posts.map(function(post) {
            return self.createPostHTML(post);
        }).join('');
        
        container.innerHTML = postsHTML;
        this.bindPostEvents();
        
        // Bind touch events after a short delay to ensure DOM is ready
        var self = this;
        setTimeout(function() {
            self.bindGalleryTouchEvents();
        }, 100);
        
        console.log('Posts rendered successfully with Threads styling');
    }

    createPostHTML(post) {
        var self = this;
        var isLiked = this.isLikedByUser(post);
        var likesCount = this.getLikesCount(post);
        var commentsCount = this.getCommentsCount(post);
        var timestamp = this.formatTimestamp(post.timestamp);
        var canDelete = this.canDeletePost(post);
        var userInitials = this.getUserInitials(post.author);
        
        // Create menu button if user can delete
        var menuHTML = '';
        if (canDelete) {
            menuHTML = '<button class="threads-menu-btn" onclick="novinkyManager.togglePostMenu(' + post.id + ')">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                '<circle cx="12" cy="12" r="1"/>' +
                '<circle cx="12" cy="5" r="1"/>' +
                '<circle cx="12" cy="19" r="1"/>' +
                '</svg>' +
                '</button>' +
                '<div id="postMenu-' + post.id + '" class="post-menu-dropdown" style="display: none; position: absolute; top: 40px; right: 0; background: var(--bg-primary); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.5rem; min-width: 140px; z-index: 100;">' +
                '<button class="menu-item-delete" onclick="novinkyManager.deletePost(' + post.id + ')" style="width: 100%; text-align: left; background: none; border: none; color: #ff4757; padding: 0.5rem; border-radius: 4px; cursor: pointer;">Smazat</button>' +
                '</div>';
        }
        
        // Create comments HTML
        var commentsHTML = '';
        if (post.comments && Array.isArray(post.comments) && post.comments.length > 0) {
            commentsHTML = post.comments.map(function(comment) {
                return self.createCommentHTML(comment, post.id);
            }).join('');
        }
        
        return '<div class="threads-post-card" data-post-id="' + post.id + '" data-category="' + post.category + '">' +
            '<div class="threads-post-header">' +
                '<div class="user-avatar-minimal">' +
                    '<div class="avatar-circle-minimal">' +
                        '<span>' + userInitials + '</span>' +
                    '</div>' +
                '</div>' +
                '<div class="threads-post-meta">' +
                    '<div class="threads-author-info">' +
                        '<span class="threads-author-name">' + post.author + '</span>' +
                        '<span class="threads-post-time">' + timestamp + '</span>' +
                    '</div>' +
                    (post.category && post.category !== 'obecne' ? 
                        '<div class="threads-category-badge">' + this.getCategoryLabel(post.category) + '</div>' : '') +
                '</div>' +
                menuHTML +
            '</div>' +
            
            (post.content ? '<div class="threads-post-content">' + post.content + '</div>' : '') +
            
            (post.feeling ? '<div class="threads-post-feeling">' + 
                post.feeling.emoji + ' ' + post.author + ' se cítí ' + post.feeling.feeling + 
            '</div>' : '') +
            
            this.createAttachmentsHTML(post.attachments) +
            
            '<div class="threads-post-actions">' +
                '<button class="threads-action-btn ' + (isLiked ? 'liked' : '') + '" onclick="novinkyManager.toggleLike(' + post.id + ')">' +
                    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
                        '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>' +
                    '</svg>' +
                    (likesCount > 0 ? '<span>' + likesCount + '</span>' : '') +
                '</button>' +
                '<button class="threads-action-btn" onclick="novinkyManager.toggleComments(' + post.id + ')">' +
                    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
                        '<path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path>' +
                    '</svg>' +
                    (commentsCount > 0 ? '<span>' + commentsCount + '</span>' : '') +
                '</button>' +
            '</div>' +
            
            '<div id="comments-' + post.id + '" class="threads-comments-section" style="display: none;">' +
                '<div class="threads-comment-form">' +
                    '<div class="user-avatar-minimal">' +
                        '<div class="avatar-circle-minimal" style="width: 32px; height: 32px; font-size: 0.75rem;">' +
                            '<span>' + this.getUserInitials(this.currentUser.fullName || this.currentUser.username) + '</span>' +
                        '</div>' +
                    '</div>' +
                    '<input type="text" class="threads-comment-input" placeholder="Odpovědět..." id="commentInput-' + post.id + '" onkeypress="if(event.key===\'Enter\' && this.value.trim()) { novinkyManager.addComment(' + post.id + ', this.value); this.value=\'\'; }">' +
                    '<button class="threads-comment-send" onclick="var input = document.getElementById(\'commentInput-' + post.id + '\'); if(input.value.trim()) { novinkyManager.addComment(' + post.id + ', input.value); input.value = \'\'; }">' +
                        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                            '<line x1="22" y1="2" x2="11" y2="13"></line>' +
                            '<polygon points="22,2 15,22 11,13 2,9"></polygon>' +
                        '</svg>' +
                    '</button>' +
                '</div>' +
                '<div class="threads-comments-list">' +
                    commentsHTML +
                '</div>' +
            '</div>' +
        '</div>';
    }

    createAttachmentsHTML(attachments) {
        if (!attachments || attachments.length === 0) return '';

        // Filtruj pouze fotky
        var photos = attachments.filter(function(attachment) {
            if (!attachment || !attachment.file) return false;
            var fileType = attachment.file.type || '';
            return attachment.type === 'photo' && fileType.indexOf('image/') === 0;
        });

        if (photos.length === 0) return '';

        var galleryId = 'gallery-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

        if (photos.length === 1) {
            // Jedna fotka
            return '<div class="threads-post-images">' +
                '<img src="' + photos[0].url + '" alt="Obrázek" onclick="novinkyManager.openImageModal(\'' + photos[0].url + '\')">' +
                '</div>';
        } else {
            // Více fotek - galerie
            var photosHTML = photos.map(function(photo, index) {
                return '<div class="gallery-slide ' + (index === 0 ? 'active' : '') + '">' +
                    '<img src="' + photo.url + '" alt="Obrázek ' + (index + 1) + '" onclick="novinkyManager.openImageModal(\'' + photo.url + '\')">' +
                    '</div>';
            }).join('');

            var indicatorsHTML = photos.map(function(photo, index) {
                return '<div class="gallery-indicator ' + (index === 0 ? 'active' : '') + '" onclick="novinkyManager.goToSlide(\'' + galleryId + '\', ' + index + ')"></div>';
            }).join('');

            return '<div class="threads-post-images">' +
                '<div class="post-photo-gallery" id="' + galleryId + '">' +
                    '<div class="gallery-container">' +
                        photosHTML +
                    '</div>' +
                    (photos.length > 1 ? '<div class="gallery-indicators">' + indicatorsHTML + '</div>' : '') +
                    (photos.length > 1 ? '<button class="gallery-nav gallery-prev" onclick="novinkyManager.prevSlide(\'' + galleryId + '\')">‹</button>' : '') +
                    (photos.length > 1 ? '<button class="gallery-nav gallery-next" onclick="novinkyManager.nextSlide(\'' + galleryId + '\')">›</button>' : '') +
                '</div>' +
                '</div>';
        }
    }

    createCommentHTML(comment, postId) {
        var timestamp = this.formatTimestamp(comment.timestamp);
        var canDelete = this.canDeleteComment(comment, postId);
        var userInitials = this.getUserInitials(comment.author);

        var deleteHTML = '';
        if (canDelete) {
            deleteHTML = '<button class="delete-btn comment-delete" onclick="novinkyManager.deleteComment(' + postId + ', ' + comment.id + ')" title="Smazat komentář" style="margin-left: auto; background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 0.75rem; padding: 0.25rem;">×</button>';
        }

        return '<div class="threads-comment" data-comment-id="' + comment.id + '">' +
            '<div class="user-avatar-minimal">' +
                '<div class="avatar-circle-minimal" style="width: 28px; height: 28px; font-size: 0.7rem;">' +
                    '<span>' + userInitials + '</span>' +
                '</div>' +
            '</div>' +
            '<div class="threads-comment-content">' +
                '<div class="threads-comment-header">' +
                    '<span class="threads-comment-author">' + comment.author + '</span>' +
                    '<span class="threads-comment-time">' + timestamp + '</span>' +
                    deleteHTML +
                '</div>' +
                '<div class="threads-comment-text">' + comment.content + '</div>' +
            '</div>' +
        '</div>';
    }

    formatTimestamp(timestamp) {
        var date = new Date(timestamp);
        var now = new Date();
        var diffMs = now - date;
        var diffMins = Math.floor(diffMs / 60000);
        var diffHours = Math.floor(diffMins / 60);
        var diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'právě teď';
        if (diffMins < 60) return 'před ' + diffMins + ' min';
        if (diffHours < 24) return 'před ' + diffHours + ' hod';
        if (diffDays < 7) return 'před ' + diffDays + ' dny';
        
        // Safari kompatibilní datum formátování
        try {
            return date.toLocaleDateString('cs-CZ', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            // Fallback pro starší Safari
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        }
    }

    canDeletePost(post) {
        if (this.currentUser.role === 'Administrator') return true;
        if (post.author === this.currentUser.username || post.author === this.currentUser.fullName) return true;
        return false;
    }

    canDeleteComment(comment, postId) {
        if (this.currentUser.role === 'Administrator') return true;
        
        var post = null;
        for (var i = 0; i < this.posts.length; i++) {
            if (this.posts[i].id === postId) {
                post = this.posts[i];
                break;
            }
        }
        
        if (post && (post.author === this.currentUser.username || post.author === this.currentUser.fullName)) return true;
        if (comment.author === this.currentUser.username || comment.author === this.currentUser.fullName) return true;
        
        return false;
    }

    toggleLike(postId) {
        var post = null;
        for (var i = 0; i < this.posts.length; i++) {
            if (this.posts[i].id === postId) {
                post = this.posts[i];
                break;
            }
        }
        if (!post) return;

        // Safari-safe: ensure likes is always an array
        if (!post.likes || !Array.isArray(post.likes)) {
            post.likes = [];
        }

        var userIdentifier = this.currentUser.fullName || this.currentUser.username;
        var likeIndex = post.likes.indexOf(userIdentifier);
        
        // Also check for username as fallback
        if (likeIndex === -1) {
            likeIndex = post.likes.indexOf(this.currentUser.username);
        }

        if (likeIndex > -1) {
            post.likes.splice(likeIndex, 1);
        } else {
            post.likes.push(userIdentifier);
        }

        this.savePosts();
        this.renderPosts();
    }



    toggleComments(postId) {
        var commentsSection = document.getElementById('comments-' + postId);
        if (commentsSection) {
            if (commentsSection.classList.contains('show')) {
                commentsSection.classList.remove('show');
                setTimeout(function() {
                    commentsSection.style.display = 'none';
                }, 300);
            } else {
                commentsSection.style.display = 'block';
                setTimeout(function() {
                    commentsSection.classList.add('show');
                }, 10);
            }
        }
    }

    addComment(postId, content) {
        if (!content.trim()) return;

        var post = null;
        for (var i = 0; i < this.posts.length; i++) {
            if (this.posts[i].id === postId) {
                post = this.posts[i];
                break;
            }
        }
        if (!post) return;

        // Safari-safe: ensure comments is always an array
        if (!post.comments || !Array.isArray(post.comments)) {
            post.comments = [];
        }

        var comment = {
            id: Date.now(),
            author: this.currentUser.fullName || this.currentUser.username,
            content: content.trim(),
            timestamp: new Date().toISOString()
        };

        post.comments.push(comment);
        this.savePosts();
        this.renderPosts();
        this.toggleComments(postId);
    }

    deletePost(postId) {
        if (!confirm('Opravdu chcete smazat tento příspěvek?')) return;

        this.posts = this.posts.filter(function(p) { return p.id !== postId; });
        this.savePosts();
        this.renderPosts();
        this.showToast('Příspěvek byl smazán', 'info');
    }

    deleteComment(postId, commentId) {
        if (!confirm('Opravdu chcete smazat tento komentář?')) return;

        var post = null;
        for (var i = 0; i < this.posts.length; i++) {
            if (this.posts[i].id === postId) {
                post = this.posts[i];
                break;
            }
        }
        if (!post) return;

        // Safari-safe: ensure comments is always an array
        if (!post.comments || !Array.isArray(post.comments)) {
            post.comments = [];
        }

        post.comments = post.comments.filter(function(c) { return c.id !== commentId; });
        this.savePosts();
        this.renderPosts();
        this.showToast('Komentář byl smazán', 'info');
    }

    filterPosts(category) {
        var posts = document.querySelectorAll('.threads-post-card');
        for (var i = 0; i < posts.length; i++) {
            var post = posts[i];
            if (category === 'all' || post.getAttribute('data-category') === category) {
                post.style.display = 'block';
            } else {
                post.style.display = 'none';
            }
        }
    }

    getCategoryLabel(category) {
        var categories = {
            'obecne': 'Obecné',
            'dulezite': 'Důležité',
            'skoleni': 'Školení',
            'akce': 'Akce',
            'technologie': 'Technologie',
            'produkty': 'Produkty',
            'novinky-web': 'Novinky na webu'
        };
        return categories[category] || category;
    }

    togglePostMenu(postId) {
        var menu = document.getElementById('postMenu-' + postId);
        if (!menu) return;
        
        // Zavři všechna ostatní menu
        var allMenus = document.querySelectorAll('.post-menu-dropdown');
        for (var i = 0; i < allMenus.length; i++) {
            if (allMenus[i].id !== 'postMenu-' + postId) {
                allMenus[i].style.display = 'none';
            }
        }
        
        // Toggle současné menu
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        
        // Zavři menu při kliknutí mimo
        var self = this;
        setTimeout(function() {
            document.addEventListener('click', function closeMenu(e) {
                if (!e.target.closest('.threads-menu-btn') && !e.target.closest('.post-menu-dropdown')) {
                    menu.style.display = 'none';
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 10);
    }

    bindPostEvents() {
        // Bind events for dynamically created elements are handled through onclick attributes
        // This method can be used for additional event binding if needed
    }

    openImageModal(imageSrc) {
        // Vytvoření modalu pro zobrazení obrázku
        var modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center; cursor: pointer;';
        
        modal.innerHTML = '<img src="' + imageSrc + '" style="max-width: 90%; max-height: 90%; object-fit: contain;">' +
            '<button style="position: absolute; top: 2rem; right: 2rem; background: rgba(255,255,255,0.2); border: none; color: white; font-size: 2rem; cursor: pointer; border-radius: 50%; width: 50px; height: 50px;">✕</button>';
        
        modal.addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        document.body.appendChild(modal);
    }

    // Gallery navigation methods
    goToSlide(galleryId, slideIndex) {
        var gallery = document.getElementById(galleryId);
        if (!gallery) return;

        var slides = gallery.querySelectorAll('.gallery-slide');
        var indicators = gallery.querySelectorAll('.gallery-indicator');

        // Remove active class from all slides and indicators
        for (var i = 0; i < slides.length; i++) {
            slides[i].classList.remove('active');
        }
        for (var i = 0; i < indicators.length; i++) {
            indicators[i].classList.remove('active');
        }

        // Add active class to current slide and indicator
        if (slides[slideIndex]) slides[slideIndex].classList.add('active');
        if (indicators[slideIndex]) indicators[slideIndex].classList.add('active');
    }

    nextSlide(galleryId) {
        var gallery = document.getElementById(galleryId);
        if (!gallery) return;

        var slides = gallery.querySelectorAll('.gallery-slide');
        var currentIndex = -1;

        for (var i = 0; i < slides.length; i++) {
            if (slides[i].classList.contains('active')) {
                currentIndex = i;
                break;
            }
        }

        var nextIndex = (currentIndex + 1) % slides.length;
        this.goToSlide(galleryId, nextIndex);
    }

    prevSlide(galleryId) {
        var gallery = document.getElementById(galleryId);
        if (!gallery) return;

        var slides = gallery.querySelectorAll('.gallery-slide');
        var currentIndex = -1;

        for (var i = 0; i < slides.length; i++) {
            if (slides[i].classList.contains('active')) {
                currentIndex = i;
                break;
            }
        }

        var prevIndex = currentIndex <= 0 ? slides.length - 1 : currentIndex - 1;
        this.goToSlide(galleryId, prevIndex);
    }

    // Touch support for gallery - Safari/iOS optimized
    bindGalleryTouchEvents() {
        var galleries = document.querySelectorAll('.post-photo-gallery');
        var self = this;
        
        for (var i = 0; i < galleries.length; i++) {
            (function(gallery) {
                var startX = 0;
                var endX = 0;
                var startY = 0;
                var endY = 0;
                var galleryId = gallery.id;
                var isScrolling = false;
                
                // Safari-safe touch events
                gallery.addEventListener('touchstart', function(e) {
                    startX = e.touches[0].clientX;
                    startY = e.touches[0].clientY;
                    isScrolling = false;
                }, { passive: true });
                
                gallery.addEventListener('touchmove', function(e) {
                    if (!startX || !startY) return;
                    
                    var currentX = e.touches[0].clientX;
                    var currentY = e.touches[0].clientY;
                    var diffX = Math.abs(currentX - startX);
                    var diffY = Math.abs(currentY - startY);
                    
                    // Detect if user is scrolling vertically
                    if (diffY > diffX) {
                        isScrolling = true;
                    }
                }, { passive: true });
                
                gallery.addEventListener('touchend', function(e) {
                    if (isScrolling) return; // Don't trigger gallery navigation if scrolling
                    
                    endX = e.changedTouches[0].clientX;
                    var diffX = startX - endX;
                    
                    if (Math.abs(diffX) > 50) { // Minimum swipe distance
                        if (diffX > 0) {
                            self.nextSlide(galleryId); // Swipe left = next
                        } else {
                            self.prevSlide(galleryId); // Swipe right = prev
                        }
                    }
                    
                    // Reset
                    startX = 0;
                    startY = 0;
                    endX = 0;
                    endY = 0;
                }, { passive: true });
            })(galleries[i]);
        }
    }

    showToast(message, type) {
        if (!type) type = 'info';
        var toast = document.createElement('div');
        var bgColor = type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3';
        toast.className = 'toast toast-' + type;
        toast.style.cssText = 'position: fixed; top: 2rem; right: 2rem; z-index: 10001; background: ' + bgColor + '; color: white; padding: 1rem 1.5rem; border-radius: 0.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.3); animation: slideIn 0.3s ease;';
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(function() {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(function() {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    savePosts() {
        try {
            // Safari-safe localStorage saving with quota check
            var data = JSON.stringify(this.posts);
            localStorage.setItem('novinky_posts', data);
            console.log('✅ Safari: Posts saved successfully');
        } catch (e) {
            console.error('❌ Safari: Error saving posts:', e);
            
            // Try to clear some space if quota exceeded
            if (e.name === 'QuotaExceededError') {
                console.warn('🔄 Safari: localStorage quota exceeded, trying to clean up...');
                try {
                    // Remove old data and retry
                    localStorage.removeItem('novinky_posts_backup');
                    localStorage.setItem('novinky_posts', JSON.stringify(this.posts));
                    console.log('✅ Safari: Posts saved after cleanup');
                } catch (e2) {
                    console.error('❌ Safari: Failed to save even after cleanup:', e2);
                    this.showToast('Nepodařilo se uložit data. Zkuste obnovit stránku.', 'error');
                }
            }
        }
    }

    createSamplePostsIfNeeded() {
        // Smazány všechny testovací posty - začínáme s čistým feedem
        if (this.posts.length === 0) {
            console.log('No sample posts created - starting with clean feed');
        }
    }
}

// Přidání CSS stylů pro minimalistický design - Safari kompatibilní
var style = document.createElement('style');
style.textContent = '' +
    '@keyframes slideIn {' +
        'from { transform: translateX(100%); opacity: 0; }' +
        'to { transform: translateX(0); opacity: 1; }' +
    '}' +
    '@keyframes slideOut {' +
        'from { transform: translateX(0); opacity: 1; }' +
        'to { transform: translateX(100%); opacity: 0; }' +
    '}' +
    '.post-card-threads {' +
        'background: var(--bg-primary);' +
        'border-bottom: 1px solid var(--border-color);' +
        'padding: 1rem;' +
        'margin-bottom: 0;' +
    '}' +
    '.post-header-threads {' +
        'display: flex;' +
        'align-items: flex-start;' +
        'margin-bottom: 0.75rem;' +
        'position: relative;' +
    '}' +
    '.post-author-avatar-threads {' +
        'width: 36px;' +
        'height: 36px;' +
        'border-radius: 50%;' +
        'background: linear-gradient(135deg, #1a1a1a, #333);' +
        'display: flex;' +
        'align-items: center;' +
        'justify-content: center;' +
        'color: white;' +
        'font-weight: 600;' +
        'font-size: 0.9rem;' +
        'margin-right: 0.75rem;' +
        'flex-shrink: 0;' +
    '}' +
    '.post-author-info-threads {' +
        'flex: 1;' +
        'min-width: 0;' +
    '}' +
    '.post-author-name-threads {' +
        'font-weight: 600;' +
        'color: var(--text-primary);' +
        'font-size: 0.95rem;' +
        'margin-bottom: 0.125rem;' +
        'line-height: 1.2;' +
    '}' +
    '.post-timestamp-threads {' +
        'color: var(--text-secondary);' +
        'font-size: 0.85rem;' +
    '}' +
    '.post-content-threads {' +
        'color: var(--text-primary);' +
        'line-height: 1.4;' +
        'margin-bottom: 0.75rem;' +
        'margin-left: 48px;' +
        'white-space: pre-wrap;' +
        'font-size: 0.95rem;' +
    '}' +
    '.post-menu-threads {' +
        'position: relative;' +
        'margin-left: auto;' +
    '}' +
    '.menu-btn-threads {' +
        'background: none;' +
        'border: none;' +
        'cursor: pointer;' +
        'padding: 0.25rem;' +
        'color: var(--text-secondary);' +
        'border-radius: 4px;' +
        'transition: background 0.2s;' +
    '}' +
    '.menu-btn-threads:hover {' +
        'background: var(--bg-secondary);' +
        'color: var(--text-primary);' +
    '}' +
    '.post-menu-dropdown {' +
        'position: absolute;' +
        'top: 100%;' +
        'right: 0;' +
        'background: var(--bg-primary);' +
        'border: 1px solid var(--border-color);' +
        'border-radius: 8px;' +
        'box-shadow: 0 4px 20px rgba(0,0,0,0.1);' +
        'min-width: 160px;' +
        'z-index: 1000;' +
        'overflow: hidden;' +
    '}' +
    '.menu-item-delete {' +
        'width: 100%;' +
        'padding: 0.75rem 1rem;' +
        'border: none;' +
        'background: none;' +
        'color: #ff4444;' +
        'cursor: pointer;' +
        'text-align: left;' +
        'font-size: 0.9rem;' +
        'transition: background 0.2s;' +
    '}' +
    '.menu-item-delete:hover {' +
        'background: rgba(255, 68, 68, 0.1);' +
    '}' +
    '.post-photo-single {' +
        'margin: 0.75rem 0 0.75rem 48px;' +
        'border-radius: 12px;' +
        'overflow: hidden;' +
    '}' +
    '.post-photo-single img {' +
        'width: 100%;' +
        'height: auto;' +
        'display: block;' +
        'cursor: pointer;' +
    '}' +
    '.post-photo-gallery {' +
        'position: relative;' +
        'margin: 0.75rem 0 0.75rem 48px;' +
        'border-radius: 12px;' +
        'overflow: hidden;' +
    '}' +
    '.gallery-container {' +
        'position: relative;' +
        'width: 100%;' +
        'aspect-ratio: 4/3;' +
    '}' +
    '.gallery-slide {' +
        'position: absolute;' +
        'top: 0;' +
        'left: 0;' +
        'width: 100%;' +
        'height: 100%;' +
        'opacity: 0;' +
        'transition: opacity 0.3s ease;' +
    '}' +
    '.gallery-slide.active {' +
        'opacity: 1;' +
    '}' +
    '.gallery-slide img {' +
        'width: 100%;' +
        'height: 100%;' +
        'object-fit: cover;' +
        'cursor: pointer;' +
    '}' +
    '.gallery-nav {' +
        'position: absolute;' +
        'top: 50%;' +
        'transform: translateY(-50%);' +
        'background: rgba(0,0,0,0.6);' +
        'color: white;' +
        'border: none;' +
        'border-radius: 50%;' +
        'width: 32px;' +
        'height: 32px;' +
        'font-size: 1.2rem;' +
        'cursor: pointer;' +
        'display: flex;' +
        'align-items: center;' +
        'justify-content: center;' +
        'transition: background 0.2s;' +
    '}' +
    '.gallery-nav:hover {' +
        'background: rgba(0,0,0,0.8);' +
    '}' +
    '.gallery-prev {' +
        'left: 8px;' +
    '}' +
    '.gallery-next {' +
        'right: 8px;' +
    '}' +
    '.gallery-indicators {' +
        'position: absolute;' +
        'bottom: 8px;' +
        'left: 50%;' +
        'transform: translateX(-50%);' +
        'display: flex;' +
        'gap: 6px;' +
    '}' +
    '.gallery-indicator {' +
        'width: 6px;' +
        'height: 6px;' +
        'border-radius: 50%;' +
        'background: rgba(255,255,255,0.5);' +
        'cursor: pointer;' +
        'transition: background 0.2s;' +
    '}' +
    '.gallery-indicator.active {' +
        'background: white;' +
    '}' +
    '.post-interactions-threads {' +
        'display: flex;' +
        'align-items: center;' +
        'gap: 1rem;' +
        'margin-left: 48px;' +
        'margin-top: 0.5rem;' +
        'padding-top: 0.25rem;' +
    '}' +
    '.threads-btn {' +
        'background: none;' +
        'border: none;' +
        'cursor: pointer;' +
        'display: flex;' +
        'align-items: center;' +
        'gap: 0.375rem;' +
        'color: var(--text-secondary);' +
        'font-size: 0.85rem;' +
        'transition: color 0.2s;' +
        'padding: 0.375rem;' +
        'border-radius: 6px;' +
        'margin: -0.375rem;' +
    '}' +
    '.threads-btn:hover {' +
        'color: var(--text-primary);' +
        'background: var(--bg-secondary);' +
    '}' +
    '.threads-btn.liked {' +
        'color: #ff3040;' +
    '}' +
    '.threads-btn.liked svg {' +
        'fill: #ff3040;' +
        'stroke: #ff3040;' +
    '}' +
    '.threads-btn svg {' +
        'transition: all 0.2s;' +
    '}' +
    '.category-select {' +
        'width: 100%;' +
        'padding: 0.75rem;' +
        'border: 1px solid var(--border-color);' +
        'border-radius: 8px;' +
        'background: var(--bg-primary);' +
        'color: var(--text-primary);' +
        'font-size: 0.9rem;' +
        'margin-bottom: 1rem;' +
    '}' +
    '.category-select:focus {' +
        'outline: none;' +
        'border-color: var(--primary-color);' +
        'box-shadow: 0 0 0 2px rgba(255, 20, 147, 0.1);' +
    '}' +
    '.attachment-buttons-minimal {' +
        'display: flex;' +
        'gap: 0.5rem;' +
    '}' +
    '.attachment-btn-minimal {' +
        'background: none;' +
        'border: none;' +
        'cursor: pointer;' +
        'color: var(--text-secondary);' +
        'transition: all 0.2s;' +
        'padding: 0.5rem;' +
        'border-radius: 8px;' +
        'display: flex;' +
        'align-items: center;' +
        'justify-content: center;' +
    '}' +
    '.attachment-btn-minimal:hover {' +
        'color: var(--primary-color);' +
        'background: var(--bg-secondary);' +
        'transform: scale(1.05);' +
    '}' +
    '.attachment-btn-minimal svg {' +
        'stroke: currentColor;' +
        'fill: none;' +
    '}' +
    '.post-feeling {' +
        'background: var(--bg-secondary);' +
        'border: 1px solid var(--border-color);' +
        'border-radius: 12px;' +
        'padding: 0.75rem 1rem;' +
        'margin: 0.75rem 0 0.75rem 48px;' +
        'font-weight: 500;' +
        'color: var(--text-primary);' +
        'font-size: 0.9rem;' +
    '}' +
    '.no-posts {' +
        'text-align: center;' +
        'padding: 4rem 2rem;' +
        'color: var(--text-secondary);' +
    '}' +
    '.no-posts-icon {' +
        'font-size: 4rem;' +
        'margin-bottom: 1rem;' +
    '}' +
    '.no-posts h3 {' +
        'color: var(--text-primary);' +
        'margin-bottom: 0.5rem;' +
    '}' +
    '.post-comments-threads {' +
        'margin-left: 48px;' +
        'margin-top: 1rem;' +
        'border-top: 1px solid var(--border-color);' +
        'padding-top: 1rem;' +
    '}' +
    '.comments-list-threads .comment {' +
        'display: flex;' +
        'gap: 0.75rem;' +
        'margin-bottom: 0.75rem;' +
        'padding-bottom: 0.75rem;' +
    '}' +
    '.comment-form-threads {' +
        'margin-top: 1rem;' +
    '}' +
    '.comment-input-container-threads {' +
        'display: flex;' +
        'align-items: center;' +
        'gap: 0.75rem;' +
        'padding: 0.75rem 1rem;' +
        'border: 1px solid var(--border-color);' +
        'border-radius: 20px;' +
        'background: var(--bg-secondary);' +
    '}' +
    '.comment-avatar-threads {' +
        'width: 28px;' +
        'height: 28px;' +
        'border-radius: 50%;' +
        'background: linear-gradient(135deg, #1a1a1a, #333);' +
        'display: flex;' +
        'align-items: center;' +
        'justify-content: center;' +
        'color: white;' +
        'font-weight: 600;' +
        'font-size: 0.8rem;' +
        'flex-shrink: 0;' +
    '}' +
    '.comment-input-threads {' +
        'flex: 1;' +
        'border: none;' +
        'background: none;' +
        'color: var(--text-primary);' +
        'font-size: 0.9rem;' +
        'outline: none;' +
    '}' +
    '.comment-input-threads::placeholder {' +
        'color: var(--text-secondary);' +
    '}' +
    '.comment-send-btn {' +
        'background: none;' +
        'border: none;' +
        'cursor: pointer;' +
        'color: var(--text-secondary);' +
        'padding: 0.25rem;' +
        'border-radius: 4px;' +
        'transition: color 0.2s;' +
    '}' +
    '.comment-send-btn:hover {' +
        'color: var(--primary-color);' +
    '}' +
    '.upload-loading {' +
        'background: var(--bg-secondary);' +
        'border: 1px solid var(--border-color);' +
        'border-radius: 12px;' +
        'padding: 2rem;' +
        'text-align: center;' +
        'margin-bottom: 1rem;' +
    '}' +
    '.upload-loading-content {' +
        'max-width: 300px;' +
        'margin: 0 auto;' +
    '}' +
    '.upload-spinner {' +
        'width: 40px;' +
        'height: 40px;' +
        'border: 3px solid var(--border-color);' +
        'border-top: 3px solid var(--primary-color);' +
        'border-radius: 50%;' +
        'animation: spin 1s linear infinite;' +
        'margin: 0 auto 1rem;' +
    '}' +
    '@keyframes spin {' +
        '0% { transform: rotate(0deg); }' +
        '100% { transform: rotate(360deg); }' +
    '}' +
    '.upload-progress-text {' +
        'color: var(--text-primary);' +
        'font-size: 0.9rem;' +
        'margin-bottom: 1rem;' +
        'font-weight: 500;' +
    '}' +
    '.upload-progress-bar {' +
        'width: 100%;' +
        'height: 8px;' +
        'background: var(--border-color);' +
        'border-radius: 4px;' +
        'overflow: hidden;' +
    '}' +
    '.upload-progress-fill {' +
        'height: 100%;' +
        'background: linear-gradient(90deg, var(--primary-color), var(--accent-blue));' +
        'border-radius: 4px;' +
        'transition: width 0.3s ease;' +
    '}' +
    '@supports (padding: max(0px)) {' +
        'body {' +
            'padding-left: max(12px, env(safe-area-inset-left));' +
            'padding-right: max(12px, env(safe-area-inset-right));' +
        '}' +
    '}' +
    '@media (max-width: 768px) {' +
        '.post-card-threads {' +
            'margin: 0 -1rem;' +
            'border-left: none;' +
            'border-right: none;' +
        '}' +
        '.post-content-threads {' +
            'margin-left: 42px;' +
        '}' +
        '.post-interactions-threads {' +
            'margin-left: 42px;' +
        '}' +
        '.post-photo-gallery, .post-photo-single {' +
            'margin-left: 42px;' +
            'margin-right: -1rem;' +
            'border-radius: 0;' +
        '}' +
        '.post-comments-threads {' +
            'margin-left: 42px;' +
        '}' +
    '}';
document.head.appendChild(style);

// Inicializace po načtení stránky - Safari kompatibilní
// Safari-compatible initialization with multiple fallbacks
var novinkyManager;

function initializeNovinkyManager() {
    console.log('🔄 Attempting to initialize NovinkyManager...');
    
    // Check if required elements exist
    var postsContainer = document.getElementById('postsContainer');
    var createPostSection = document.getElementById('createPostSection');
    
    if (!postsContainer) {
        console.warn('⚠️ postsContainer not found, retrying in 300ms...');
        setTimeout(initializeNovinkyManager, 300);
        return;
    }
    
    if (!createPostSection) {
        console.warn('⚠️ createPostSection not found, retrying in 300ms...');
        setTimeout(initializeNovinkyManager, 300);
        return;
    }
    
    try {
        novinkyManager = new NovinkyManager();
        console.log('✅ NovinkyManager successfully initialized for Safari');
        
        // Force immediate render for Safari
        setTimeout(function() {
            if (novinkyManager && novinkyManager.renderPosts) {
                console.log('🔄 Force re-render for Safari...');
                novinkyManager.renderPosts();
            }
        }, 200);
        
    } catch (error) {
        console.error('❌ Error initializing NovinkyManager:', error);
        
        // Multiple retry attempts for Safari
        setTimeout(function() {
            try {
                console.log('🔄 Retry attempt for Safari...');
                novinkyManager = new NovinkyManager();
                console.log('✅ NovinkyManager initialized on retry for Safari');
            } catch (retryError) {
                console.error('❌ Final retry failed for Safari:', retryError);
                
                // Last resort - show error message
                var container = document.getElementById('postsContainer');
                if (container) {
                    container.innerHTML = '<div style="text-align: center; padding: 2rem; color: red;">' +
                        '<h3>⚠️ Chyba načítání</h3>' +
                        '<p>Problém s kompatibilitou Safari. Zkuste obnovit stránku.</p>' +
                        '<button onclick="location.reload()" style="padding: 0.5rem 1rem; margin-top: 1rem;">🔄 Obnovit stránku</button>' +
                        '</div>';
                }
            }
        }, 800);
    }
}

// Safari-compatible DOM ready detection
function safariDOMReady(callback) {
    if (document.readyState === 'complete') {
        setTimeout(callback, 50);
    } else if (document.readyState === 'interactive') {
        setTimeout(callback, 100);
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(callback, 150);
        });
        
        // Backup for Safari
        window.addEventListener('load', function() {
            setTimeout(callback, 200);
        });
    }
}

// Initialize with Safari-friendly approach
safariDOMReady(initializeNovinkyManager); 