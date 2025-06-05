const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Statické soubory
app.use(express.static('./'));
app.use('/uploads', express.static('uploads'));

// Vytvoř uploads složku pokud neexistuje
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads', { recursive: true });
}

// Konfigurace multer pro file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// Route pro upload base64 obrázků (pro fotky z cropperu)
app.post('/upload-image', (req, res) => {
    try {
        const { image, filename } = req.body;
        
        if (!image || !filename) {
            return res.status(400).json({ error: 'Chybí data obrázku' });
        }
        
        // Odstraň base64 prefix
        let base64Data;
        if (image.includes(',')) {
            base64Data = image.split(',')[1];
        } else {
            base64Data = image;
        }
        
        // Vytvoř unikátní název souboru
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileName = `img_${uniqueSuffix}.jpg`;
        const filePath = path.join('uploads', fileName);
        
        // Ulož soubor
        fs.writeFileSync(filePath, base64Data, 'base64');
        
        res.json({
            success: true,
            url: `/uploads/${fileName}`,
            filename: fileName
        });
        
    } catch (error) {
        console.error('Chyba při uploadu obrázku:', error);
        res.status(500).json({ error: 'Chyba při ukládání obrázku: ' + error.message });
    }
});

// Route pro upload souborů (drag&drop soubory)
app.post('/upload-file', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nebyl nahrán žádný soubor' });
        }
        
        res.json({
            success: true,
            url: `/uploads/${req.file.filename}`,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size
        });
        
    } catch (error) {
        console.error('Chyba při uploadu souboru:', error);
        res.status(500).json({ error: 'Chyba při ukládání souboru: ' + error.message });
    }
});

// Route pro stažení souborů
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ error: 'Soubor nenalezen' });
    }
});

// Hlavní stránka
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'novinky.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server běží na http://localhost:${PORT}`);
    console.log(`📁 Uploads složka: ${path.join(__dirname, 'uploads')}`);
    console.log(`🌐 Otevřete v prohlížeči: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Server se vypíná...');
    process.exit(0);
}); 