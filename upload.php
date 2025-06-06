<?php
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
    $data = json_decode($input, true);

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
    
    // Odstranění data URL prefixu pokud existuje
    if (strpos($imageData, 'data:image/') === 0) {
        $imageData = substr($imageData, strpos($imageData, ',') + 1);
    }
    
    // Dekódování base64
    $decodedImage = base64_decode($imageData);
    if ($decodedImage === false) {
        throw new Exception('Chyba při dekódování obrázku');
    }
    
    // Ověření, že se jedná o platný obrázek
    $imageInfo = getimagesizefromstring($decodedImage);
    if ($imageInfo === false) {
        throw new Exception('Neplatný formát obrázku');
    }
    
    // Generování jedinečného názvu souboru
    $extension = 'jpg'; // Default
    if ($imageInfo['mime'] === 'image/png') $extension = 'png';
    elseif ($imageInfo['mime'] === 'image/gif') $extension = 'gif';
    elseif ($imageInfo['mime'] === 'image/webp') $extension = 'webp';
    
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
    
    echo json_encode([
        'success' => true,
        'url' => $url,
        'filename' => $filename,
        'size' => strlen($decodedImage)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'error' => $e->getMessage()
    ]);
    
    // Log chyby
    error_log('Upload error: ' . $e->getMessage());
}
?> 