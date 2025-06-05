<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Kontrola metody
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Pouze POST metoda je povolena']);
    exit;
}

// Načtení JSON dat
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['image'])) {
    echo json_encode(['success' => false, 'error' => 'Chybí data obrázku']);
    exit;
}

try {
    // Vytvoření uploads složky pokud neexistuje
    $uploadsDir = __DIR__ . '/uploads';
    if (!is_dir($uploadsDir)) {
        if (!mkdir($uploadsDir, 0755, true)) {
            throw new Exception('Nelze vytvořit uploads složku');
        }
    }
    
    // Dekódování base64 obrázku
    $imageData = $data['image'];
    if (strpos($imageData, 'data:image/') === 0) {
        $imageData = substr($imageData, strpos($imageData, ',') + 1);
    }
    
    $decodedImage = base64_decode($imageData);
    if ($decodedImage === false) {
        throw new Exception('Chyba při dekódování obrázku');
    }
    
    // Generování jedinečného názvu souboru
    $filename = 'img_' . uniqid() . '_' . time() . '.jpg';
    $filepath = $uploadsDir . '/' . $filename;
    
    // Uložení souboru
    if (file_put_contents($filepath, $decodedImage) === false) {
        throw new Exception('Chyba při ukládání souboru');
    }
    
    // Vrácení URL
    $url = 'uploads/' . $filename;
    echo json_encode([
        'success' => true,
        'url' => $url,
        'filename' => $filename
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false, 
        'error' => $e->getMessage()
    ]);
}
?> 