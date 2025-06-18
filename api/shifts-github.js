// GitHub API pro ukládání směn
const GITHUB_TOKEN = process.env.github_token; // Nastavíš v Netlify Environment Variables
const GITHUB_OWNER = 'simekmartas'; // Tvoje GitHub username
const GITHUB_REPO = 'mobilmajakdata'; // Název repository pro data
const GITHUB_FILE_PATH = 'shifts.json';

async function getShiftsFromGitHub() {
    try {
        console.log('🔍 GitHub API debug (shifts):');
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
            console.log('📁 Shifts file not found, returning empty array');
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
        console.error('❌ Chyba při načítání směn z GitHub:', error);
        return [];
    }
}

async function saveShiftsToGitHub(shifts) {
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
        const content = Buffer.from(JSON.stringify(shifts, null, 2)).toString('base64');
        
        const payload = {
            message: `Update shifts - ${new Date().toISOString()}`,
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
        console.error('Chyba při ukládání směn do GitHub:', error);
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

        // GET - načti všechny směny
        if (httpMethod === 'GET') {
            const shifts = await getShiftsFromGitHub();
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    shifts: shifts
                })
            };
        }

        // POST - ulož směnu nebo synchronizuj všechny směny
        if (httpMethod === 'POST') {
            const requestData = JSON.parse(body);
            
            // Pokud je posláno pole směn, ulož všechny najednou (synchronizace)
            if (requestData.shifts && Array.isArray(requestData.shifts)) {
                const saved = await saveShiftsToGitHub(requestData.shifts);
                
                if (saved) {
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({
                            success: true,
                            message: 'Směny úspěšně synchronizovány',
                            count: requestData.shifts.length
                        })
                    };
                } else {
                    throw new Error('Nepodařilo se uložit směny');
                }
            }
            
            // Jinak se jedná o jednu směnu - přidej ji k existujícím
            else {
                // Načti aktuální směny
                const existingShifts = await getShiftsFromGitHub();
                
                // Přidej nebo aktualizuj směnu
                let shifts = [...existingShifts];
                const shiftIndex = shifts.findIndex(s => s.id === requestData.id);
                
                if (shiftIndex !== -1) {
                    // Aktualizuj existující směnu
                    shifts[shiftIndex] = requestData;
                } else {
                    // Přidej novou směnu
                    shifts.push(requestData);
                }
                
                const saved = await saveShiftsToGitHub(shifts);
                
                if (saved) {
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({
                            success: true,
                            message: 'Směna úspěšně uložena',
                            shift: requestData
                        })
                    };
                } else {
                    throw new Error('Nepodařilo se uložit směnu');
                }
            }
        }

        // DELETE - smaž směnu podle ID
        if (httpMethod === 'DELETE') {
            const pathSegments = event.path.split('/');
            const shiftId = pathSegments[pathSegments.length - 1];
            
            if (!shiftId) {
                throw new Error('ID směny není specifikováno');
            }
            
            // Načti aktuální směny
            const existingShifts = await getShiftsFromGitHub();
            
            // Odfiltruj směnu podle ID
            const filteredShifts = existingShifts.filter(s => s.id !== shiftId);
            
            if (filteredShifts.length === existingShifts.length) {
                throw new Error('Směna nebyla nalezena');
            }
            
            const saved = await saveShiftsToGitHub(filteredShifts);
            
            if (saved) {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        message: 'Směna úspěšně smazána',
                        deletedId: shiftId
                    })
                };
            } else {
                throw new Error('Nepodařilo se smazat směnu');
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