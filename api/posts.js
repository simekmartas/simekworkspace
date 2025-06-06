const fs = require('fs').promises;
const path = require('path');

// Cesta k datovému souboru - Netlify Functions můžou zapisovat jen do /tmp
const DATA_FILE = path.join('/tmp', 'posts.json');

// Zajistí, že adresář existuje
async function ensureDataDir() {
    const dir = path.dirname(DATA_FILE);
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
}

// Načte příspěvky ze souboru
async function loadPosts() {
    try {
        await ensureDataDir();
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Pokud soubor neexistuje, vrať prázdné pole
        return [];
    }
}

// Uloží příspěvky do souboru
async function savePosts(posts) {
    try {
        await ensureDataDir();
        await fs.writeFile(DATA_FILE, JSON.stringify(posts, null, 2));
        return true;
    } catch (error) {
        console.error('Chyba při ukládání:', error);
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

    try {
        const { httpMethod, body, queryStringParameters } = event;

        // GET - načti všechny příspěvky
        if (httpMethod === 'GET') {
            const posts = await loadPosts();
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
            const posts = await loadPosts();
            
            // Přidej timestamp a ID
            const newPost = {
                ...postData,
                id: Date.now().toString(),
                timestamp: Date.now(), // JavaScript timestamp v milisekundách
                likes: postData.likes || 0,
                liked: postData.liked || false,
                comments: postData.comments || []
            };
            
            posts.unshift(newPost); // Přidej na začátek
            
            const saved = await savePosts(posts);
            
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
            const posts = await loadPosts();
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
                if (key !== 'id') { // ID se nemění
                    posts[postIndex][key] = updateData[key];
                }
            });
            
            // Přidej timestamp poslední aktualizace
            posts[postIndex].lastUpdated = Date.now();
            
            const saved = await savePosts(posts);
            
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
            
            const posts = await loadPosts();
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
            
            const saved = await savePosts(filteredPosts);
            
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

        // Nepodporovaná metoda
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