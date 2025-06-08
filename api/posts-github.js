// GitHub API pro ukládání příspěvků
const GITHUB_TOKEN = process.env.github_token; // Nastavíš v Netlify Environment Variables
const GITHUB_OWNER = 'simekmartas'; // Tvoje GitHub username
const GITHUB_REPO = 'mobilmajakdata'; // Název repository pro data
const GITHUB_FILE_PATH = 'posts.json';

async function getPostsFromGitHub() {
    try {
        console.log('🔍 GitHub API debug:');
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
            console.log('📁 File not found, returning empty array');
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
        console.error('❌ Chyba při načítání z GitHub:', error);
        return [];
    }
}

async function savePostsToGitHub(posts) {
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
        const content = Buffer.from(JSON.stringify(posts, null, 2)).toString('base64');
        
        const payload = {
            message: `Update posts - ${new Date().toISOString()}`,
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
        console.error('Chyba při ukládání do GitHub:', error);
        return false;
    }
}

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

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

        // GET - načti všechny příspěvky
        if (httpMethod === 'GET') {
            const posts = await getPostsFromGitHub();
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    posts: posts
                })
            };
        }

        // POST - vytvoř nový příspěvek
        if (httpMethod === 'POST') {
            const postData = JSON.parse(body);
            const posts = await getPostsFromGitHub();
            
            // Přidej timestamp a ID
            const newPost = {
                ...postData,
                id: Date.now().toString(),
                timestamp: Date.now(),
                likes: Array.isArray(postData.likes) ? postData.likes : [],
                comments: postData.comments || []
            };
            
            posts.unshift(newPost); // Přidej na začátek
            
            const saved = await savePostsToGitHub(posts);
            
            if (saved) {
                return {
                    statusCode: 201,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        post: newPost
                    })
                };
            } else {
                throw new Error('Nepodařilo se uložit příspěvek');
            }
        }

        // PUT - aktualizuj příspěvek
        if (httpMethod === 'PUT') {
            const updateData = JSON.parse(body);
            const posts = await getPostsFromGitHub();
            const postIndex = posts.findIndex(p => p.id === updateData.id);
            
            if (postIndex === -1) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: 'Příspěvek nenalezen'
                    })
                };
            }
            
            // Aktualizuj pouze předané vlastnosti
            Object.keys(updateData).forEach(key => {
                if (key !== 'id') {
                    posts[postIndex][key] = updateData[key];
                }
            });
            
            posts[postIndex].lastUpdated = Date.now();
            
            const saved = await savePostsToGitHub(posts);
            
            if (saved) {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        post: posts[postIndex]
                    })
                };
            } else {
                throw new Error('Nepodařilo se aktualizovat příspěvek');
            }
        }

        // DELETE - smaž příspěvek
        if (httpMethod === 'DELETE') {
            const postId = queryStringParameters?.id;
            
            if (!postId) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: 'ID příspěvku je povinné'
                    })
                };
            }
            
            const posts = await getPostsFromGitHub();
            const filteredPosts = posts.filter(p => p.id !== postId);
            
            if (filteredPosts.length === posts.length) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: 'Příspěvek nenalezen'
                    })
                };
            }
            
            const saved = await savePostsToGitHub(filteredPosts);
            
            if (saved) {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        message: 'Příspěvek byl smazán'
                    })
                };
            } else {
                throw new Error('Nepodařilo se smazat příspěvek');
            }
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Nepodporovaná HTTP metoda'
            })
        };

    } catch (error) {
        console.error('Chyba v API:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Interní chyba serveru: ' + error.message
            })
        };
    }
}; 