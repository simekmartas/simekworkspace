<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // Debug raw data
    file_put_contents('debug.log', "=== UPLOAD DEBUG ===\n", FILE_APPEND);
    file_put_contents('debug.log', "Input length: " . strlen($input) . "\n", FILE_APPEND);
    file_put_contents('debug.log', "JSON decode success: " . ($data ? 'YES' : 'NO') . "\n", FILE_APPEND);
    
    if ($data && isset($data['image'])) {
        $imageData = $data['image'];
        file_put_contents('debug.log', "Image data length: " . strlen($imageData) . "\n", FILE_APPEND);
        file_put_contents('debug.log', "Image starts: " . substr($imageData, 0, 50) . "\n", FILE_APPEND);
        
        // Test simple base64
        $testData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/4J//2Q==';
        
        // Remove data URL prefix
        if (strpos($testData, 'data:') === 0) {
            $commaPos = strpos($testData, ',');
            if ($commaPos !== false) {
                $testData = substr($testData, $commaPos + 1);
            }
        }
        
        $decoded = base64_decode($testData, true);
        file_put_contents('debug.log', "Test decode success: " . ($decoded ? 'YES' : 'NO') . "\n", FILE_APPEND);
        
        echo json_encode([
            'success' => true, 
            'debug' => [
                'received_length' => strlen($imageData),
                'starts_with' => substr($imageData, 0, 50),
                'test_decode' => $decoded !== false
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'No image data']);
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?> 