// GitHub API pro ukládání prodejních dat (sales sessions)
const GITHUB_TOKEN = process.env.github_token; // Nastavíš v Netlify Environment Variables
const GITHUB_OWNER = 'simekmartas'; // Tvoje GitHub username
const GITHUB_REPO = 'mobilmajakdata'; // Název repository pro data
const GITHUB_FILE_PATH = 'sales-data.json';

async function getSalesDataFromGitHub() {
    try {
        console.log('🔍 Sales Data GitHub API debug:');
        console.log('- Owner:', GITHUB_OWNER);
        console.log('- Repo:', GITHUB_REPO);
        console.log('- Token available:', !!GITHUB_TOKEN);

        const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;
        console.log('- API URL:', url);

        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'mobilmajak-sales-netlify-function'
            }
        });

        console.log('- Response status:', response.status);
        console.log('- Response statusText:', response.statusText);

        if (response.status === 404) {
            console.log('📁 Sales data file not found, returning empty array');
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
        console.error('❌ Chyba při načítání sales data z GitHub:', error);
        return [];
    }
}

async function saveSalesDataToGitHub(salesData) {
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
        const content = Buffer.from(JSON.stringify(salesData, null, 2)).toString('base64');
        
        const payload = {
            message: `Update sales data - ${new Date().toISOString()}`,
            content: content,
            ...(sha && { sha })
        };

        const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'mobilmajak-sales-netlify-function'
            },
            body: JSON.stringify(payload)
        });

        return response.ok;
    } catch (error) {
        console.error('Chyba při ukládání sales data do GitHub:', error);
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
    
    console.log('✅ GitHub token je dostupný pro sales data');

    try {
        const { httpMethod, body, queryStringParameters } = event;

        // GET - načti všechna prodejní data
        if (httpMethod === 'GET') {
            const salesData = await getSalesDataFromGitHub();
            
            // Pokud jsou dotazy na statistiky
            if (queryStringParameters?.type === 'stats') {
                const stats = generateSalesStats(salesData);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        stats: stats
                    })
                };
            }
            
            // Pokud jsou dotazy na data konkrétního prodejce
            if (queryStringParameters?.seller) {
                const sellerData = salesData.filter(session => 
                    session.seller === queryStringParameters.seller || 
                    session.sellerId === queryStringParameters.seller
                );
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        salesData: sellerData
                    })
                };
            }
            
            // Vrať všechna data
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    salesData: salesData
                })
            };
        }

        // POST - vytvoř novou sales session
        if (httpMethod === 'POST') {
            const sessionData = JSON.parse(body);
            const existingSalesData = await getSalesDataFromGitHub();
            
            // Přidej timestamp a ověř ID
            const newSession = {
                ...sessionData,
                id: sessionData.id || Date.now().toString(),
                timestamp: sessionData.timestamp || Date.now(),
                savedAt: Date.now()
            };
            
            existingSalesData.push(newSession);
            
            const saved = await saveSalesDataToGitHub(existingSalesData);
            
            if (saved) {
                console.log('✅ Sales session úspěšně uložena:', newSession.id);
                return {
                    statusCode: 201,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        session: newSession,
                        message: 'Sales session byla úspěšně uložena'
                    })
                };
            } else {
                throw new Error('Nepodařilo se uložit sales session');
            }
        }

        // DELETE - smaž sales session (pro admin)
        if (httpMethod === 'DELETE') {
            const sessionId = queryStringParameters?.id;
            
            if (!sessionId) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: 'ID session je povinné'
                    })
                };
            }
            
            const salesData = await getSalesDataFromGitHub();
            const filteredData = salesData.filter(session => session.id !== sessionId);
            
            if (filteredData.length === salesData.length) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: 'Sales session nenalezena'
                    })
                };
            }
            
            const saved = await saveSalesDataToGitHub(filteredData);
            
            if (saved) {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        message: 'Sales session byla smazána'
                    })
                };
            } else {
                throw new Error('Nepodařilo se smazat sales session');
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
        console.error('Chyba v Sales API:', error);
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

// Generování statistik z prodejních dat
function generateSalesStats(salesData) {
    const stats = {
        totalSessions: salesData.length,
        successfulSales: 0,
        unsuccessfulSales: 0,
        conversionRate: 0,
        topSellers: {},
        popularItems: {},
        discountUsage: { used: 0, notUsed: 0 },
        scenarioStats: {},
        storeStats: {},
        dailyStats: {},
        monthlyTrends: {},
        totalSessionTime: 0,
        sessionsWithTime: 0,
        averageSessionTime: 0
    };
    
    // Počítej základní statistiky
    salesData.forEach(session => {
        // Úspěšnost prodeje
        if (session.result === 'sold') {
            stats.successfulSales++;
            
            // Populární položky
            if (session.soldItems) {
                session.soldItems.forEach(item => {
                    stats.popularItems[item] = (stats.popularItems[item] || 0) + 1;
                });
            }
            
            // Používání slevy
            if (session.discountUsed === true) {
                stats.discountUsage.used++;
            } else if (session.discountUsed === false) {
                stats.discountUsage.notUsed++;
            }
        } else {
            stats.unsuccessfulSales++;
        }
        
        // Časové statistiky
        if (session.sessionDurationMinutes && session.sessionDurationMinutes > 0) {
            stats.totalSessionTime += session.sessionDurationMinutes;
            stats.sessionsWithTime++;
        }
        
        // Top prodejci
        const seller = session.seller || session.sellerId || 'Unknown';
        if (!stats.topSellers[seller]) {
            stats.topSellers[seller] = { total: 0, sold: 0, notSold: 0, totalTime: 0, avgTime: 0 };
        }
        stats.topSellers[seller].total++;
        if (session.result === 'sold') {
            stats.topSellers[seller].sold++;
        } else {
            stats.topSellers[seller].notSold++;
        }
        
        // Čas pro prodejce
        if (session.sessionDurationMinutes && session.sessionDurationMinutes > 0) {
            stats.topSellers[seller].totalTime += session.sessionDurationMinutes;
        }
        
        // Statistiky scénářů
        const scenario = session.scenario || 'unknown';
        if (!stats.scenarioStats[scenario]) {
            stats.scenarioStats[scenario] = { total: 0, sold: 0, notSold: 0 };
        }
        stats.scenarioStats[scenario].total++;
        if (session.result === 'sold') {
            stats.scenarioStats[scenario].sold++;
        } else {
            stats.scenarioStats[scenario].notSold++;
        }
        
        // Statistiky prodejen
        const store = session.store || 'Unknown';
        if (!stats.storeStats[store]) {
            stats.storeStats[store] = { total: 0, sold: 0, notSold: 0 };
        }
        stats.storeStats[store].total++;
        if (session.result === 'sold') {
            stats.storeStats[store].sold++;
        } else {
            stats.storeStats[store].notSold++;
        }
        
        // Denní statistiky
        const date = new Date(session.timestamp).toDateString();
        if (!stats.dailyStats[date]) {
            stats.dailyStats[date] = { total: 0, sold: 0, notSold: 0 };
        }
        stats.dailyStats[date].total++;
        if (session.result === 'sold') {
            stats.dailyStats[date].sold++;
        } else {
            stats.dailyStats[date].notSold++;
        }
    });
    
    // Spočítej conversion rate
    if (stats.totalSessions > 0) {
        stats.conversionRate = ((stats.successfulSales / stats.totalSessions) * 100).toFixed(1);
    }
    
    // Spočítej průměrný čas session
    if (stats.sessionsWithTime > 0) {
        stats.averageSessionTime = (stats.totalSessionTime / stats.sessionsWithTime).toFixed(1);
    }
    
    // Spočítej průměrný čas pro každého prodejce
    Object.keys(stats.topSellers).forEach(seller => {
        if (stats.topSellers[seller].total > 0) {
            stats.topSellers[seller].avgTime = (stats.topSellers[seller].totalTime / stats.topSellers[seller].total).toFixed(1);
        }
    });
    
    return stats;
} 