<?php
// Zapni error reporting pro debug
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Pouze POST metoda je povolena']);
    exit;
}

try {
    // Načtení JSON dat
    $input = file_get_contents('php://input');
    
    if (empty($input)) {
        throw new Exception('Prázdná data');
    }
    
    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Neplatný JSON: ' . json_last_error_msg());
    }

    if (!$data || !isset($data['image'])) {
        throw new Exception('Chybí data obrázku');
    }

    // Vytvoření uploads složky pokud neexistuje
    $uploadsDir = __DIR__ . '/uploads';
    if (!is_dir($uploadsDir)) {
        if (!mkdir($uploadsDir, 0755, true)) {
            throw new Exception('Nelze vytvořit uploads složku');
        }
    }
    
    // Dekódování base64 obrázku
    $imageData = $data['image'];
    
    // Kontrola že máme data
    if (empty($imageData)) {
        throw new Exception('Prázdná data obrázku');
    }
    
    // Odstranění data URL prefixu pokud existuje (více robustní)
    if (preg_match('/^data:image\/[^;]+;base64,(.+)$/', $imageData, $matches)) {
        $imageData = $matches[1];
    } elseif (strpos($imageData, 'data:') === 0) {
        $commaPos = strpos($imageData, ',');
        if ($commaPos !== false) {
            $imageData = substr($imageData, $commaPos + 1);
        }
    }
    
    // Vyčistění base64 stringu (odstraň všechny neplatné znaky)
    $imageData = preg_replace('/[^A-Za-z0-9+\/=]/', '', $imageData);
    
    // Přidej padding pokud chybí
    $padding = strlen($imageData) % 4;
    if ($padding) {
        $imageData .= str_repeat('=', 4 - $padding);
    }
    
    // Dekódování base64 (bez strict mode pro větší toleranci)
    $decodedImage = base64_decode($imageData);
    if ($decodedImage === false || strlen($decodedImage) < 100) {
        throw new Exception('Chyba při dekódování base64 nebo příliš malý soubor');
    }
    
    // Jednodušší detekce typu souboru podle magic bytes
    $header = substr($decodedImage, 0, 12);
    $extension = 'jpg'; // default
    
    if (substr($header, 0, 3) === "\xFF\xD8\xFF") {
        $extension = 'jpg';
    } elseif (substr($header, 0, 8) === "\x89PNG\r\n\x1a\n") {
        $extension = 'png';
    } elseif (substr($header, 0, 6) === "GIF87a" || substr($header, 0, 6) === "GIF89a") {
        $extension = 'gif';
    } elseif (substr($header, 0, 4) === "RIFF" && substr($header, 8, 4) === "WEBP") {
        $extension = 'webp';
    }
    
    // Pokud není rozpoznán typ, zkus stejně jako JPEG
    if (!in_array($extension, ['jpg', 'png', 'gif', 'webp'])) {
        $extension = 'jpg';
    }
    
    // Generování jedinečného názvu souboru
    $filename = 'img_' . uniqid() . '_' . time() . '.' . $extension;
    $filepath = $uploadsDir . '/' . $filename;
    
    // Uložení souboru
    if (file_put_contents($filepath, $decodedImage) === false) {
        throw new Exception('Chyba při ukládání souboru');
    }
    
    // Nastavení správných oprávnění
    chmod($filepath, 0644);
    
    // Vrácení URL relativní k web root
    $url = 'uploads/' . $filename;
    
    // Log úspěchu
    error_log("✅ Upload úspěšný: $filename (" . strlen($decodedImage) . " bytes)");
    
    echo json_encode([
        'success' => true,
        'url' => $url,
        'filename' => $filename,
        'size' => strlen($decodedImage),
        'type' => $extension
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    
    // Detailní debug info
    $debug_info = [
        'error' => $e->getMessage(),
        'line' => $e->getLine(),
        'file' => basename($e->getFile())
    ];
    
    if (isset($imageData)) {
        $debug_info['image_data_length'] = strlen($imageData);
        $debug_info['starts_with'] = substr($imageData, 0, 50);
    }
    
    if (isset($decodedImage)) {
        $debug_info['decoded_size'] = strlen($decodedImage);
        $debug_info['magic_bytes'] = bin2hex(substr($decodedImage, 0, 12));
    }
    
    echo json_encode([
        'success' => false, 
        'error' => $e->getMessage(),
        'debug' => $debug_info
    ]);
    
    // Log chyby
    error_log('❌ Upload error: ' . $e->getMessage() . ' | Debug: ' . json_encode($debug_info));
}
?> 