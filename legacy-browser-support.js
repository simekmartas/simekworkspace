/**
 * Legacy Browser Support - Polyfilly a fallbacky pro starší verze Chrome/IE
 * Autor: Mobil Maják
 * Datum: 2025
 */

// Polyfill pro Array.from
if (!Array.from) {
    Array.from = function(arrayLike, mapFn, thisArg) {
        var result = [];
        var length = parseInt(arrayLike.length) || 0;
        for (var i = 0; i < length; i++) {
            if (i in arrayLike) {
                if (mapFn) {
                    result[i] = mapFn.call(thisArg, arrayLike[i], i);
                } else {
                    result[i] = arrayLike[i];
                }
            }
        }
        return result;
    };
}

// Polyfill pro Array.includes
if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement, fromIndex) {
        if (this == null) {
            throw new TypeError('"this" is null or not defined');
        }
        var o = Object(this);
        var len = parseInt(o.length) || 0;
        if (len === 0) {
            return false;
        }
        var n = parseInt(fromIndex) || 0;
        var k;
        if (n >= 0) {
            k = n;
        } else {
            k = len + n;
            if (k < 0) {
                k = 0;
            }
        }
        for (; k < len; k++) {
            if (o[k] === searchElement) {
                return true;
            }
        }
        return false;
    };
}

// Polyfill pro Array.find
if (!Array.prototype.find) {
    Array.prototype.find = function(predicate) {
        if (this == null) {
            throw new TypeError('"this" is null or not defined');
        }
        var o = Object(this);
        var len = parseInt(o.length) || 0;
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var thisArg = arguments[1];
        var k = 0;
        while (k < len) {
            var kValue = o[k];
            if (predicate.call(thisArg, kValue, k, o)) {
                return kValue;
            }
            k++;
        }
        return undefined;
    };
}

// Polyfill pro Array.findIndex
if (!Array.prototype.findIndex) {
    Array.prototype.findIndex = function(predicate) {
        if (this == null) {
            throw new TypeError('"this" is null or not defined');
        }
        var o = Object(this);
        var len = parseInt(o.length) || 0;
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var thisArg = arguments[1];
        var k = 0;
        while (k < len) {
            var kValue = o[k];
            if (predicate.call(thisArg, kValue, k, o)) {
                return k;
            }
            k++;
        }
        return -1;
    };
}

// Polyfill pro String.includes
if (!String.prototype.includes) {
    String.prototype.includes = function(search, start) {
        if (typeof start !== 'number') {
            start = 0;
        }
        if (start + search.length > this.length) {
            return false;
        } else {
            return this.indexOf(search, start) !== -1;
        }
    };
}

// Polyfill pro String.startsWith
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position) {
        position = position || 0;
        return this.substr(position, searchString.length) === searchString;
    };
}

// Polyfill pro String.endsWith
if (!String.prototype.endsWith) {
    String.prototype.endsWith = function(searchString, length) {
        if (typeof length === 'undefined' || length > this.length) {
            length = this.length;
        }
        return this.substring(length - searchString.length, length) === searchString;
    };
}

// Polyfill pro Object.assign
if (typeof Object.assign !== 'function') {
    Object.assign = function(target) {
        if (target == null) {
            throw new TypeError('Cannot convert undefined or null to object');
        }
        var to = Object(target);
        for (var index = 1; index < arguments.length; index++) {
            var nextSource = arguments[index];
            if (nextSource != null) {
                for (var nextKey in nextSource) {
                    if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
        }
        return to;
    };
}

// Polyfill pro Object.keys
if (!Object.keys) {
    Object.keys = function(obj) {
        var keys = [];
        for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                keys.push(key);
            }
        }
        return keys;
    };
}

// Polyfill pro Object.values
if (!Object.values) {
    Object.values = function(obj) {
        var values = [];
        for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                values.push(obj[key]);
            }
        }
        return values;
    };
}

// Polyfill pro Object.entries
if (!Object.entries) {
    Object.entries = function(obj) {
        var entries = [];
        for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                entries.push([key, obj[key]]);
            }
        }
        return entries;
    };
}

// Polyfill pro Promise (zjednodušený)
if (typeof Promise === 'undefined') {
    window.Promise = function(executor) {
        var self = this;
        self.state = 'pending';
        self.value = undefined;
        self.onResolvedCallbacks = [];
        self.onRejectedCallbacks = [];

        function resolve(value) {
            if (self.state === 'pending') {
                self.state = 'resolved';
                self.value = value;
                self.onResolvedCallbacks.forEach(function(callback) {
                    callback(value);
                });
            }
        }

        function reject(reason) {
            if (self.state === 'pending') {
                self.state = 'rejected';
                self.value = reason;
                self.onRejectedCallbacks.forEach(function(callback) {
                    callback(reason);
                });
            }
        }

        try {
            executor(resolve, reject);
        } catch (error) {
            reject(error);
        }
    };

    Promise.prototype.then = function(onResolved, onRejected) {
        var self = this;
        return new Promise(function(resolve, reject) {
            if (self.state === 'resolved') {
                if (typeof onResolved === 'function') {
                    try {
                        var result = onResolved(self.value);
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    resolve(self.value);
                }
            } else if (self.state === 'rejected') {
                if (typeof onRejected === 'function') {
                    try {
                        var result = onRejected(self.value);
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    reject(self.value);
                }
            } else {
                self.onResolvedCallbacks.push(function(value) {
                    if (typeof onResolved === 'function') {
                        try {
                            var result = onResolved(value);
                            resolve(result);
                        } catch (error) {
                            reject(error);
                        }
                    } else {
                        resolve(value);
                    }
                });
                self.onRejectedCallbacks.push(function(reason) {
                    if (typeof onRejected === 'function') {
                        try {
                            var result = onRejected(reason);
                            resolve(result);
                        } catch (error) {
                            reject(error);
                        }
                    } else {
                        reject(reason);
                    }
                });
            }
        });
    };

    Promise.prototype.catch = function(onRejected) {
        return this.then(null, onRejected);
    };
}

// Polyfill pro fetch API (zjednodušený)
if (!window.fetch) {
    window.fetch = function(url, options) {
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            var method = (options && options.method) || 'GET';
            var headers = (options && options.headers) || {};
            var body = options && options.body;

            xhr.open(method, url, true);

            // Nastavit headers
            for (var key in headers) {
                xhr.setRequestHeader(key, headers[key]);
            }

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    var response = {
                        ok: xhr.status >= 200 && xhr.status < 300,
                        status: xhr.status,
                        statusText: xhr.statusText,
                        text: function() {
                            return Promise.resolve(xhr.responseText);
                        },
                        json: function() {
                            try {
                                return Promise.resolve(JSON.parse(xhr.responseText));
                            } catch (e) {
                                return Promise.reject(e);
                            }
                        }
                    };

                    if (response.ok) {
                        resolve(response);
                    } else {
                        reject(new Error('Network response was not ok'));
                    }
                }
            };

            xhr.onerror = function() {
                reject(new Error('Network request failed'));
            };

            xhr.send(body);
        });
    };
}

// Polyfill pro querySelectorAll (starší verze IE)
if (!document.querySelectorAll) {
    document.querySelectorAll = function(selector) {
        var doc = document;
        var head = doc.documentElement.firstChild;
        var styleTag = doc.createElement('STYLE');
        head.appendChild(styleTag);
        doc.__qsaels = [];

        styleTag.styleSheet.cssText = selector + '{x:expression(document.__qsaels.push(this))}';
        window.scrollBy(0, 0);

        var elements = [];
        for (var i = 0; i < doc.__qsaels.length; i++) {
            elements.push(doc.__qsaels[i]);
        }
        
        head.removeChild(styleTag);
        return elements;
    };
}

// Polyfill pro forEach na NodeList
if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = function(callback, thisArg) {
        thisArg = thisArg || window;
        for (var i = 0; i < this.length; i++) {
            callback.call(thisArg, this[i], i, this);
        }
    };
}

// Polyfill pro addEventListener (starší IE)
if (!Element.prototype.addEventListener) {
    Element.prototype.addEventListener = function(event, handler, useCapture) {
        this.attachEvent('on' + event, handler);
    };
}

// Polyfill pro removeEventListener (starší IE) 
if (!Element.prototype.removeEventListener) {
    Element.prototype.removeEventListener = function(event, handler, useCapture) {
        this.detachEvent('on' + event, handler);
    };
}

// Polyfill pro classList
if (!("classList" in document.documentElement)) {
    Object.defineProperty(Element.prototype, 'classList', {
        get: function() {
            var self = this;
            function update(fn) {
                return function(value) {
                    var classes = self.className.split(/\s+/);
                    var index = classes.indexOf(value);
                    fn(classes, index, value);
                    self.className = classes.join(" ");
                };
            }
            
            var ret = {
                add: update(function(classes, index, value) {
                    if (index < 0) classes.push(value);
                }),
                remove: update(function(classes, index) {
                    if (index >= 0) classes.splice(index, 1);
                }),
                toggle: update(function(classes, index, value) {
                    if (index >= 0) classes.splice(index, 1);
                    else classes.push(value);
                }),
                contains: function(value) {
                    return self.className.split(/\s+/).indexOf(value) >= 0;
                },
                item: function(i) {
                    return self.className.split(/\s+/)[i] || null;
                }
            };
            
            Object.defineProperty(ret, 'length', {
                get: function() {
                    return self.className.split(/\s+/).length;
                }
            });
            
            return ret;
        }
    });
}

// Polyfill pro CustomEvent
if (typeof window.CustomEvent !== 'function') {
    function CustomEvent(event, params) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    }
    
    CustomEvent.prototype = window.Event.prototype;
    window.CustomEvent = CustomEvent;
}

// Polyfill pro closest
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || 
                                Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
    Element.prototype.closest = function(selector) {
        var element = this;
        while (element && element.nodeType === 1) {
            if (element.matches(selector)) {
                return element;
            }
            element = element.parentNode;
        }
        return null;
    };
}

// Polyfill pro remove()
if (!Element.prototype.remove) {
    Element.prototype.remove = function() {
        if (this.parentNode) {
            this.parentNode.removeChild(this);
        }
    };
}

// Polyfill pro prepend
if (!Element.prototype.prepend) {
    Element.prototype.prepend = function() {
        for (var i = arguments.length - 1; i >= 0; i--) {
            var node = arguments[i];
            if (typeof node === 'string') {
                node = document.createTextNode(node);
            }
            this.insertBefore(node, this.firstChild);
        }
    };
}

// Polyfill pro append
if (!Element.prototype.append) {
    Element.prototype.append = function() {
        for (var i = 0; i < arguments.length; i++) {
            var node = arguments[i];
            if (typeof node === 'string') {
                node = document.createTextNode(node);
            }
            this.appendChild(node);
        }
    };
}

// Polyfill pro scrollIntoView s options
if (!Element.prototype.scrollIntoView.length) {
    var originalScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function(options) {
        if (typeof options === 'object' && options.behavior === 'smooth') {
            // Zjednodušený smooth scroll fallback
            var element = this;
            var targetPosition = element.offsetTop;
            var startPosition = window.pageYOffset;
            var distance = targetPosition - startPosition;
            var duration = 500;
            var start = null;
            
            function animation(currentTime) {
                if (start === null) start = currentTime;
                var timeElapsed = currentTime - start;
                var run = ease(timeElapsed, startPosition, distance, duration);
                window.scrollTo(0, run);
                if (timeElapsed < duration) requestAnimationFrame(animation);
            }
            
            function ease(t, b, c, d) {
                t /= d / 2;
                if (t < 1) return c / 2 * t * t + b;
                t--;
                return -c / 2 * (t * (t - 2) - 1) + b;
            }
            
            requestAnimationFrame(animation);
        } else {
            originalScrollIntoView.call(this, options);
        }
    };
}

// Polyfill pro requestAnimationFrame
(function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || 
                                     window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() {
                callback(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }
})();

// Console polyfill pro starší prohlížeče
if (!window.console) {
    window.console = {
        log: function() {},
        warn: function() {},
        error: function() {},
        info: function() {},
        debug: function() {}
    };
}

// Utility funkce pro detekci starších prohlížečů
window.LegacySupport = {
    isOldBrowser: function() {
        var ua = navigator.userAgent;
        var isOldChrome = /Chrome\/(\d+)/.test(ua) && parseInt(RegExp.$1) < 60;
        var isOldFirefox = /Firefox\/(\d+)/.test(ua) && parseInt(RegExp.$1) < 55;
        var isIE = /MSIE|Trident/.test(ua);
        return isOldChrome || isOldFirefox || isIE;
    },
    
    addFallbackStyles: function() {
        if (this.isOldBrowser()) {
            var style = document.createElement('style');
            style.textContent = `
                /* Fallback styly pro starší prohlížeče */
                .fallback-flex {
                    display: table;
                    width: 100%;
                }
                .fallback-flex > * {
                    display: table-cell;
                    vertical-align: top;
                }
                .fallback-grid {
                    display: table;
                    width: 100%;
                }
                .fallback-grid > * {
                    display: table-cell;
                    width: 50%;
                    vertical-align: top;
                }
            `;
            document.head.appendChild(style);
        }
    },
    
    initLegacySupport: function() {
        this.addFallbackStyles();
        
        // Přidat warning pro velmi staré prohlížeče
        if (this.isOldBrowser()) {
            var warningDiv = document.createElement('div');
            warningDiv.innerHTML = `
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; margin: 10px; border-radius: 5px; font-family: Arial, sans-serif;">
                    <strong>⚠️ Upozornění:</strong> Používáte starší verzi prohlížěče. 
                    Pro lepší zážitek doporučujeme aktualizovat na novější verzi.
                </div>
            `;
            document.body.insertBefore(warningDiv, document.body.firstChild);
        }
    }
};

// Inicializace při načtení stránky
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        window.LegacySupport.initLegacySupport();
    });
} else {
    window.LegacySupport.initLegacySupport();
}

console.log('Legacy Browser Support loaded successfully!'); 