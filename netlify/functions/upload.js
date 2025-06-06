const fs = require('fs').promises;
const path = require('path');

// Adresář pro uploads
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Zajistí, že upload adresář existuje
async function ensureUploadsDir() {
    try {
        await fs.access(UPLOADS_DIR);
    } catch {
        await fs.mkdir(UPLOADS_DIR, { recursive: true });
    }
}

// Dekóduje base64 a detekuje typ souboru
function decodeBase64Image(dataString) {
    const matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
        throw new Error('Neplatný formát base64');
    }

    const mimeType = matches[1];
    const data = matches[2];
    
    // Kontrola podporovaných formátů
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(mimeType)) {
        throw new Error('Nepodporovaný formát obrázku');
    }
    
    // Určení přípony souboru
    const extensions = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg', 
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp'
    };
    
    return {
        data: Buffer.from(data, 'base64'),
        extension: extensions[mimeType],
        mimeType: mimeType
    };
}

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Pouze POST metoda je podporována'
            })
        };
    }

    try {
        const requestBody = JSON.parse(event.body);
        const { image, filename } = requestBody;

        if (!image) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Chybí data obrázku'
                })
            };
        }

        // Dekóduj base64 obrázek
        const imageData = decodeBase64Image(image);
        
        // Vytvoř unikátní název souboru
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const finalFilename = filename ? 
            `${timestamp}_${randomSuffix}_${filename}` : 
            `${timestamp}_${randomSuffix}.${imageData.extension}`;

        // Zajisti, že uploads adresář existuje
        await ensureUploadsDir();

        // Ulož soubor
        const filePath = path.join(UPLOADS_DIR, finalFilename);
        await fs.writeFile(filePath, imageData.data);

        // Vytvoř URL pro přístup k souboru
        const fileUrl = `/uploads/${finalFilename}`;

        console.log(`Obrázek uložen: ${finalFilename} (${imageData.data.length} bytes)`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                filename: finalFilename,
                url: fileUrl,
                size: imageData.data.length,
                type: imageData.mimeType
            })
        };

    } catch (error) {
        console.error('Chyba při uploadu:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message || 'Chyba při ukládání obrázku'
            })
        };
    }
}; 