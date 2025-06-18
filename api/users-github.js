// GitHub API pro ukládání uživatelů
const GITHUB_TOKEN = process.env.github_token; // Nastavíš v Netlify Environment Variables
const GITHUB_OWNER = 'simekmartas'; // Tvoje GitHub username
const GITHUB_REPO = 'mobilmajakdata'; // Název repository pro data
const GITHUB_FILE_PATH = 'users.json';

async function getUsersFromGitHub() {
    try {
        console.log('🔍 GitHub API debug (users):');
        console.log('- Owner:', GITHUB_OWNER);
        console.log('- Repo:', GITHUB_REPO);
        console.log('- Token available:', !!GITHUB_TOKEN);
        console.log('- Token format:', GITHUB_TOKEN ? GITHUB_TOKEN.substring(0, 10) + '...' : 'none');

        const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;
        console.log('- API URL:', url);

        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'mobilmajak-netlify-function'
            }
        });

        console.log('- Response status:', response.status);
        console.log('- Response statusText:', response.statusText);

        if (response.status === 404) {
            console.log('📁 Users file not found, returning empty array');
            return [];
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ GitHub API error:', errorText);
            throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const content = Buffer.from(data.content, 'base64').toString('utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error('❌ Chyba při načítání uživatelů z GitHub:', error);
        return [];
    }
}

async function saveUsersToGitHub(users) {
    try {
        // Nejdřív získej aktuální SHA souboru (potřebné pro update)
        let sha = null;
        try {
            const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`, {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                sha = data.sha;
            }
        } catch (e) {
            // Soubor neexistuje, vytvoří se nový
        }

        // Ulož data
        const content = Buffer.from(JSON.stringify(users, null, 2)).toString('base64');
        
        const payload = {
            message: `Update users - ${new Date().toISOString()}`,
            content: content,
            ...(sha && { sha })
        };

        const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'mobilmajak-netlify-function'
            },
            body: JSON.stringify(payload)
        });

        return response.ok;
    } catch (error) {
        console.error('Chyba při ukládání uživatelů do GitHub:', error);
        return false;
    }
}

exports.handler = async (event, context) => {
    // Bezpečnostní CORS headers
    const origin = event.headers.origin || event.headers.Origin;
    const allowedOrigins = [
        'https://mobilmajak.netlify.app',
        'https://your-domain.netlify.app',
        'http://localhost:3000' // Pro development
    ];
    
    const headers = {
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Session-ID',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Robots-Tag': 'noindex, nofollow'
    };
    
    // Nastavení CORS pouze pro povolené domény
    if (allowedOrigins.includes(origin) || (process.env.NODE_ENV === 'development' && origin?.includes('localhost'))) {
        headers['Access-Control-Allow-Origin'] = origin;
        headers['Access-Control-Allow-Credentials'] = 'true';
    }

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Kontrola GitHub tokenu
    if (!GITHUB_TOKEN) {
        console.error('❌ GITHUB_TOKEN není nastaven v environment variables');
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'GitHub token není nastaven - zkontrolujte environment variables'
            })
        };
    }
    
    console.log('✅ GitHub token je dostupný');

    try {
        const { httpMethod, body, queryStringParameters } = event;

        // GET - načti všechny uživatele
        if (httpMethod === 'GET') {
            const users = await getUsersFromGitHub();
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    users: users
                })
            };
        }

        // POST - ulož aktuální stav uživatelů (přepíše celý soubor)
        if (httpMethod === 'POST') {
            const requestData = JSON.parse(body);
            const users = requestData.users || [];
            
            // Ulož všechny uživatele najednou
            const saved = await saveUsersToGitHub(users);
            
            if (saved) {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        message: 'Uživatelé úspěšně synchronizováni',
                        count: users.length
                    })
                };
            } else {
                throw new Error('Nepodařilo se uložit uživatele');
            }
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Method not allowed'
            })
        };

    } catch (error) {
        console.error('❌ API chyba:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
}; 