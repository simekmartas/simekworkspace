// === PERFORMANCE OPTIMIZATION SYSTÉM ===

class PerformanceOptimizer {
    constructor() {
        this.imageObserver = null;
        this.scrollObserver = null;
        this.intersectionThreshold = 0.1;
        this.rootMargin = '50px';
        this.scrollThreshold = 200; // px od konce pro načtení dalších příspěvků
        this.isLoadingMore = false;
        this.hasMoreContent = true;
        this.currentPage = 1;
        this.postsPerPage = 5;
        
        // Performance metrics
        this.metrics = {
            imagesLoaded: 0,
            totalImages: 0,
            loadTimes: [],
            scrollEvents: 0,
            lastScrollTime: 0
        };
        
        this.init();
    }

    init() {
        this.setupImageLazyLoading();
        this.setupInfiniteScroll();
        this.setupImagePreloading();
        this.setupPerformanceMonitoring();
        this.optimizeExistingImages();
        console.log('⚡ Performance Optimizer inicializován');
    }

    // === IMAGE LAZY LOADING ===
    setupImageLazyLoading() {
        // Kontrola podpory Intersection Observer
        if (!('IntersectionObserver' in window)) {
            console.warn('Intersection Observer není podporován - fallback na okamžité načítání');
            this.loadAllImagesImmediately();
            return;
        }

        this.imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.imageObserver.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: this.rootMargin,
            threshold: this.intersectionThreshold
        });

        // Observuj všechny obrázky s lazy loading
        this.observeImages();
    }

    observeImages() {
        const lazyImages = document.querySelectorAll('img[data-src], img[loading="lazy"]');
        lazyImages.forEach(img => {
            this.prepareImageForLazyLoading(img);
            this.imageObserver.observe(img);
        });
        
        this.metrics.totalImages = lazyImages.length;
        console.log(`📸 Sleduji ${lazyImages.length} obrázků pro lazy loading`);
    }

    prepareImageForLazyLoading(img) {
        // Pokud nemá data-src, přesuň src do data-src
        if (!img.dataset.src && img.src) {
            img.dataset.src = img.src;
            img.removeAttribute('src');
        }

        // Přidej loading state
        img.classList.add('lazy-loading');
        
        // Placeholder gradient
        if (!img.style.background) {
            img.style.background = 'linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%)';
            img.style.backgroundSize = '200% 100%';
            img.style.animation = 'shimmer 1.5s infinite';
        }

        // Zachovej aspect ratio
        if (!img.style.aspectRatio && img.dataset.aspectRatio) {
            img.style.aspectRatio = img.dataset.aspectRatio;
        }
    }

    async loadImage(img) {
        const startTime = performance.now();
        
        return new Promise((resolve, reject) => {
            const imageUrl = img.dataset.src;
            if (!imageUrl) {
                reject(new Error('Žádná URL pro načtení'));
                return;
            }

            // Vytvoř nový Image objekt pro preloading
            const imageLoader = new Image();
            
            imageLoader.onload = () => {
                // Nastavit skutečný src
                img.src = imageUrl;
                img.classList.remove('lazy-loading');
                img.classList.add('lazy-loaded');
                
                // Odstraň placeholder styles
                img.style.background = '';
                img.style.backgroundSize = '';
                img.style.animation = '';
                
                // Fade-in animace
                img.style.opacity = '0';
                img.style.transition = 'opacity 0.3s ease';
                
                requestAnimationFrame(() => {
                    img.style.opacity = '1';
                });

                // Metriky
                const loadTime = performance.now() - startTime;
                this.metrics.imagesLoaded++;
                this.metrics.loadTimes.push(loadTime);
                
                console.log(`📸 Obrázek načten za ${loadTime.toFixed(2)}ms`);
                resolve();
            };

            imageLoader.onerror = () => {
                img.classList.remove('lazy-loading');
                img.classList.add('lazy-error');
                img.alt = 'Chyba při načítání obrázku';
                
                // Error placeholder
                img.style.background = 'var(--bg-tertiary)';
                img.style.display = 'flex';
                img.style.alignItems = 'center';
                img.style.justifyContent = 'center';
                img.innerHTML = '🖼️ Obrázek se nepodařilo načíst';
                
                console.error('Chyba při načítání obrázku:', imageUrl);
                reject(new Error('Nepodařilo se načíst obrázek'));
            };

            // Spustit loading
            imageLoader.src = imageUrl;
        });
    }

    optimizeExistingImages() {
        // Optimalizuj obrázky, které už jsou na stránce
        const existingImages = document.querySelectorAll('img:not([data-src]):not([loading="lazy"])');
        
        existingImages.forEach(img => {
            if (img.src && !img.complete) {
                // Přehoď na lazy loading pokud není načtený
                img.dataset.src = img.src;
                img.removeAttribute('src');
                this.prepareImageForLazyLoading(img);
                this.imageObserver.observe(img);
            }
        });
    }

    // === INFINITE SCROLL ===
    setupInfiniteScroll() {
        // Vytvoř sentinel element na konci stránky
        this.createScrollSentinel();
        
        // Observe sentinel
        this.scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isLoadingMore && this.hasMoreContent) {
                    this.loadMoreContent();
                }
            });
        }, {
            rootMargin: `${this.scrollThreshold}px`,
            threshold: 0.1
        });

        const sentinel = document.querySelector('#scroll-sentinel');
        if (sentinel) {
            this.scrollObserver.observe(sentinel);
        }
    }

    createScrollSentinel() {
        // Odstranit existující sentinel
        const existingSentinel = document.querySelector('#scroll-sentinel');
        if (existingSentinel) {
            existingSentinel.remove();
        }

        const sentinel = document.createElement('div');
        sentinel.id = 'scroll-sentinel';
        sentinel.style.cssText = `
            height: 20px;
            margin: 2rem 0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-muted);
            font-size: 0.875rem;
        `;
        
        // Přidej na konec container
        const container = document.querySelector('.container');
        if (container) {
            container.appendChild(sentinel);
        }
    }

    async loadMoreContent() {
        if (this.isLoadingMore || !this.hasMoreContent) return;
        
        this.isLoadingMore = true;
        this.showLoadingSpinner();
        
        try {
            console.log(`📜 Načítám další obsah (stránka ${this.currentPage + 1})`);
            
            // Simulace API volání
            const newPosts = await this.fetchMorePosts(this.currentPage + 1);
            
            if (newPosts && newPosts.length > 0) {
                this.appendNewPosts(newPosts);
                this.currentPage++;
                
                // Sleduj nové obrázky
                this.observeImages();
                
                console.log(`✅ Načteno ${newPosts.length} nových příspěvků`);
            } else {
                this.hasMoreContent = false;
                this.showEndMessage();
                console.log('📋 Všechny příspěvky načteny');
            }
            
        } catch (error) {
            console.error('Chyba při načítání obsahu:', error);
            this.showErrorMessage();
        } finally {
            this.isLoadingMore = false;
            this.hideLoadingSpinner();
        }
    }

    async fetchMorePosts(page) {
        // Simulace API volání s realistic delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
        
        // Demo data - v produkci by to volalo skutečné API
        if (page > 5) {
            return []; // Konec obsahu po 5 stránkách
        }
        
        return this.generateDemoPosts(this.postsPerPage);
    }

    generateDemoPosts(count) {
        const posts = [];
        const demoContent = [
            "Dnes jsem objevil skvělou knihu o programování! 📚",
            "Krásná procházka parkem. Podzim má své kouzlo 🍂",
            "Nová káva, kterou jsem vyzkoušel - doporučuji! ☕",
            "Úžasný výhled z hory. Stálo to za ten výstup! 🏔️",
            "Právě dokončuji nový projekt. Jsem na sebe pyšný 💪",
            "Skvělý den s přáteli. Takové chvíle jsou k nezaplacení 👥",
            "Nové poznatky z konference. Inspirativní prezentace! 🎯",
            "Domácí pizza se povedla lépe než očekávání 🍕"
        ];
        
        const authors = ['Jan Novák', 'Marie Svobodová', 'Petr Dvořák', 'Anna Nováková', 'Tomáš Černý'];
        
        for (let i = 0; i < count; i++) {
            posts.push({
                id: `post-${Date.now()}-${i}`,
                author: authors[Math.floor(Math.random() * authors.length)],
                content: demoContent[Math.floor(Math.random() * demoContent.length)],
                timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                likes: Math.floor(Math.random() * 50),
                comments: Math.floor(Math.random() * 10),
                image: Math.random() > 0.6 ? this.generateDemoImageUrl() : null
            });
        }
        
        return posts;
    }

    generateDemoImageUrl() {
        const categories = ['nature', 'city', 'food', 'tech', 'people'];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const size = '800x600';
        return `https://picsum.photos/${size}?category=${category}&random=${Math.random()}`;
    }

    appendNewPosts(posts) {
        const container = document.querySelector('.container');
        const sentinel = document.querySelector('#scroll-sentinel');
        
        if (!container) return;
        
        posts.forEach((postData, index) => {
            const postElement = this.createPostElement(postData);
            
            // Animace s delay
            postElement.style.opacity = '0';
            postElement.style.transform = 'translateY(20px)';
            postElement.style.transition = 'all 0.5s ease';
            
            // Vlož před sentinel
            if (sentinel) {
                container.insertBefore(postElement, sentinel);
            } else {
                container.appendChild(postElement);
            }
            
            // Animace appear
            setTimeout(() => {
                postElement.style.opacity = '1';
                postElement.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    createPostElement(postData) {
        const post = document.createElement('article');
        post.className = 'post';
        post.dataset.postId = postData.id;
        
        const timeAgo = this.formatTimeAgo(new Date(postData.timestamp));
        const avatar = postData.author.charAt(0).toUpperCase();
        
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
                ${postData.image ? `
                    <img 
                        data-src="${postData.image}" 
                        alt="Post image" 
                        class="post-image"
                        loading="lazy"
                        style="aspect-ratio: 4/3;"
                    >
                ` : ''}
            </div>
            <div class="post-footer">
                <button class="post-action like-button" data-action="like">
                    ❤️ <span class="like-count">${postData.likes}</span>
                </button>
                <button class="post-action comment-button" data-action="comment">
                    💬 <span class="comment-count">${postData.comments}</span>
                </button>
            </div>
        `;
        
        return post;
    }

    // === UI FEEDBACK ===
    showLoadingSpinner() {
        const sentinel = document.querySelector('#scroll-sentinel');
        if (sentinel) {
            sentinel.innerHTML = `
                <div class="loading-spinner"></div>
                <span style="margin-left: 0.5rem;">Načítám další příspěvky...</span>
            `;
        }
    }

    hideLoadingSpinner() {
        const sentinel = document.querySelector('#scroll-sentinel');
        if (sentinel) {
            sentinel.innerHTML = '';
        }
    }

    showEndMessage() {
        const sentinel = document.querySelector('#scroll-sentinel');
        if (sentinel) {
            sentinel.innerHTML = `
                <div style="text-align: center; color: var(--text-muted);">
                    🎉 Všechny příspěvky načteny!
                </div>
            `;
            sentinel.style.padding = '2rem';
        }
    }

    showErrorMessage() {
        const sentinel = document.querySelector('#scroll-sentinel');
        if (sentinel) {
            sentinel.innerHTML = `
                <div style="text-align: center; color: var(--danger-color);">
                    ❌ Chyba při načítání. 
                    <button onclick="window.performanceOptimizer.loadMoreContent()" style="
                        background: none;
                        border: none;
                        color: var(--accent-color);
                        cursor: pointer;
                        text-decoration: underline;
                        margin-left: 0.5rem;
                    ">Zkusit znovu</button>
                </div>
            `;
        }
    }

    // === IMAGE PRELOADING ===
    setupImagePreloading() {
        // Preload obrázky v blízkosti viewport
        this.preloadNearbyImages();
        
        // Preload při scroll
        let scrollTimeout;
        document.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.preloadNearbyImages();
            }, 150);
        });
    }

    preloadNearbyImages() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        const viewportHeight = window.innerHeight;
        const scrollTop = window.pageYOffset;
        const preloadMargin = viewportHeight * 0.5; // Preload 0.5 viewport ahead
        
        lazyImages.forEach(img => {
            const rect = img.getBoundingClientRect();
            const imgTop = rect.top + scrollTop;
            
            // Pokud je obrázek blízko viewport, začni ho načítat
            if (imgTop < scrollTop + viewportHeight + preloadMargin && 
                imgTop > scrollTop - preloadMargin) {
                
                if (!img.classList.contains('preloading')) {
                    img.classList.add('preloading');
                    this.preloadImage(img.dataset.src);
                }
            }
        });
    }

    preloadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = reject;
            img.src = src;
        });
    }

    // === PERFORMANCE MONITORING ===
    setupPerformanceMonitoring() {
        // Monitor scroll performance
        let isScrolling = false;
        
        document.addEventListener('scroll', () => {
            this.metrics.scrollEvents++;
            this.metrics.lastScrollTime = Date.now();
            
            if (!isScrolling) {
                isScrolling = true;
                this.measureScrollPerformance();
            }
        });

        // Performance observer pro long tasks
        if ('PerformanceObserver' in window) {
            try {
                const perfObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        if (entry.duration > 50) {
                            console.warn(`⚠️ Dlouhá úloha: ${entry.duration.toFixed(2)}ms`);
                        }
                    });
                });
                
                perfObserver.observe({ entryTypes: ['longtask'] });
            } catch (error) {
                console.log('PerformanceObserver nepodporován pro longtask');
            }
        }

        // Report stavu každých 30 sekund
        setInterval(() => {
            this.reportPerformanceMetrics();
        }, 30000);
    }

    measureScrollPerformance() {
        const startTime = performance.now();
        
        requestAnimationFrame(() => {
            const endTime = performance.now();
            const scrollDuration = endTime - startTime;
            
            if (scrollDuration > 16) { // Více než 1 frame (60fps)
                console.warn(`⚠️ Pomalý scroll: ${scrollDuration.toFixed(2)}ms`);
            }
        });
    }

    reportPerformanceMetrics() {
        const avgLoadTime = this.metrics.loadTimes.length > 0 
            ? this.metrics.loadTimes.reduce((a, b) => a + b) / this.metrics.loadTimes.length 
            : 0;
        
        console.log('📊 Performance metriky:', {
            načtené_obrázky: `${this.metrics.imagesLoaded}/${this.metrics.totalImages}`,
            průměrný_čas_načtení: `${avgLoadTime.toFixed(2)}ms`,
            scroll_události: this.metrics.scrollEvents,
            aktuální_stránka: this.currentPage,
            má_další_obsah: this.hasMoreContent
        });
    }

    // === UTILITY METHODS ===
    loadAllImagesImmediately() {
        // Fallback pro prohlížeče bez Intersection Observer
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        });
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
    refreshObservers() {
        // Znovu observe obrázky (po změnách DOM)
        this.observeImages();
    }

    setInfiniteScrollEnabled(enabled) {
        this.hasMoreContent = enabled;
        
        const sentinel = document.querySelector('#scroll-sentinel');
        if (sentinel) {
            sentinel.style.display = enabled ? 'flex' : 'none';
        }
    }

    preloadNextPage() {
        // Manuální preload další stránky
        if (!this.isLoadingMore && this.hasMoreContent) {
            this.loadMoreContent();
        }
    }

    getMetrics() {
        return { ...this.metrics };
    }

    destroy() {
        if (this.imageObserver) {
            this.imageObserver.disconnect();
        }
        
        if (this.scrollObserver) {
            this.scrollObserver.disconnect();
        }
        
        const sentinel = document.querySelector('#scroll-sentinel');
        if (sentinel) {
            sentinel.remove();
        }
        
        console.log('🗑️ Performance Optimizer byl zničen');
    }
}

// === GLOBAL INSTANCE ===
let performanceOptimizer = null;

// Inicializace po načtení DOM
document.addEventListener('DOMContentLoaded', () => {
    performanceOptimizer = new PerformanceOptimizer();
    
    // Přidej do globálního kontextu
    window.performanceOptimizer = performanceOptimizer;
    
    console.log('🚀 Performance Optimizer je aktivní');
});

// Export pro ES6 moduly
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceOptimizer;
} 