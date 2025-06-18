// 🔒 ZABEZPEČENÝ AUTENTIFIKAČNÍ API ENDPOINT
// Server-side validace a ochrana před útoky

// Simple rate limiting in memory (v produkci použít Redis)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minut
const RATE_LIMIT_MAX_ATTEMPTS = 5;

// Povolené domény (v produkci načítat z environment variables)
const ALLOWED_ORIGINS = [
    'https://mobilmajak.netlify.app',
    'https://your-domain.netlify.app',
    'http://localhost:3000', // Pro development
];

function isValidOrigin(origin) {
    return ALLOWED_ORIGINS.includes(origin) || 
           (process.env.NODE_ENV === 'development' && origin?.includes('localhost'));
}

function checkRateLimit(identifier) {
    const now = Date.now();
    const key = `auth_${identifier}`;
    
    if (!rateLimitStore.has(key)) {
        rateLimitStore.set(key, []);
    }
    
    const attempts = rateLimitStore.get(key);
    
    // Vymaž staré pokusy
    const recentAttempts = attempts.filter(time => now - time < RATE_LIMIT_WINDOW);
    rateLimitStore.set(key, recentAttempts);
    
    if (recentAttempts.length >= RATE_LIMIT_MAX_ATTEMPTS) {
        const oldestAttempt = Math.min(...recentAttempts);
        const waitTime = Math.ceil((RATE_LIMIT_WINDOW - (now - oldestAttempt)) / 1000 / 60);
        throw new Error(`Rate limit exceeded. Try again in ${waitTime} minutes.`);
    }
    
    return true;
}

function recordAttempt(identifier, success = false) {
    const key = `auth_${identifier}`;
    
    if (!success) {
        const attempts = rateLimitStore.get(key) || [];
        attempts.push(Date.now());
        rateLimitStore.set(key, attempts);
    } else {
        // Úspěšné přihlášení - vymaž rate limit
        rateLimitStore.delete(key);
    }
}

function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input
        .trim()
        .replace(/[<>\"'&]/g, '') // Základní XSS ochrana
        .substring(0, 255); // Omezení délky
}

function validateCredentials(username, password) {
    // Základní validace
    if (!username || !password) {
        throw new Error('Username and password are required');
    }
    
    if (username.length < 3 || username.length > 50) {
        throw new Error('Invalid username format');
    }
    
    if (password.length < 6 || password.length > 255) {
        throw new Error('Invalid password format');
    }
    
    return true;
}

// Simulace databáze uživatelů (v produkci nahradit skutečnou databází)
async function authenticateUser(username, password) {
    // Simulace async databázového dotazu
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // POZOR: V produkci NIKDY neukládejte hesla v plain textu!
    // Použijte bcrypt nebo podobný hash algoritmus
    const users = [
        { 
            id: 1, 
            username: 'admin', 
            password: 'Admin123', // V produkci: hash hesla
            role: 'Administrator',
            active: true
        },
        { 
            id: 2, 
            username: 'prodejce', 
            password: 'prodejce123', // V produkci: hash hesla
            role: 'Prodejce',
            active: true
        }
    ];
    
    const user = users.find(u => 
        u.username === username && 
        u.password === password && 
        u.active
    );
    
    if (!user) {
        return null;
    }
    
    // Vrať uživatele BEZ hesla
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
}

function generateSecureSession(user) {
    return {
        sessionId: `sess_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        userId: user.id,
        username: user.username,
        role: user.role,
        createdAt: Date.now(),
        expiresAt: Date.now() + (8 * 60 * 60 * 1000) // 8 hodin
    };
}

exports.handler = async (event, context) => {
    console.log('🔒 Secure auth endpoint called');
    
    // CORS kontrola
    const origin = event.headers.origin || event.headers.Origin;
    
    const headers = {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
    
    // Nastavení CORS pouze pro povolené domény
    if (isValidOrigin(origin)) {
        headers['Access-Control-Allow-Origin'] = origin;
        headers['Access-Control-Allow-Credentials'] = 'true';
    }
    
    headers['Access-Control-Allow-Headers'] = 'Content-Type, X-Requested-With, X-Session-ID';
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    
    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }
    
    // Pouze POST metoda
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Method not allowed'
            })
        };
    }
    
    try {
        // Získej IP adresu pro rate limiting
        const clientIP = event.headers['x-forwarded-for'] || 
                        event.headers['x-real-ip'] || 
                        context.clientContext?.ip || 
                        'unknown';
        
        console.log('🔍 Auth attempt from IP:', clientIP);
        
        // Rate limiting kontrola
        try {
            checkRateLimit(clientIP);
        } catch (rateLimitError) {
            console.log('🔒 Rate limit hit for IP:', clientIP);
            recordAttempt(clientIP, false);
            
            return {
                statusCode: 429,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: rateLimitError.message,
                    type: 'RATE_LIMIT_EXCEEDED'
                })
            };
        }
        
        // Parsování a validace request body
        let requestData;
        try {
            requestData = JSON.parse(event.body || '{}');
        } catch (parseError) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Invalid JSON in request body'
                })
            };
        }
        
        // Sanitizace inputů
        const username = sanitizeInput(requestData.username);
        const password = sanitizeInput(requestData.password);
        
        console.log('🔍 Login attempt for username:', username);
        
        // Validace credentials
        try {
            validateCredentials(username, password);
        } catch (validationError) {
            recordAttempt(clientIP, false);
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: validationError.message,
                    type: 'VALIDATION_ERROR'
                })
            };
        }
        
        // Autentifikace uživatele
        const user = await authenticateUser(username, password);
        
        if (!user) {
            console.log('🔒 Authentication failed for:', username);
            recordAttempt(clientIP, false);
            
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Invalid credentials',
                    type: 'AUTH_FAILED'
                })
            };
        }
        
        console.log('✅ Authentication successful for:', username);
        recordAttempt(clientIP, true);
        
        // Vytvoř secure session
        const session = generateSecureSession(user);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                },
                session: {
                    sessionId: session.sessionId,
                    expiresAt: session.expiresAt
                },
                message: 'Authentication successful'
            })
        };
        
    } catch (error) {
        console.error('🔒 Auth endpoint error:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Internal server error',
                type: 'SERVER_ERROR'
            })
        };
    }
}; 