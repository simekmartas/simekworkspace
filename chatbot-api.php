<?php
// === BEZPEČNÝ BACKEND ENDPOINT PRO OPENAI API ===

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle OPTIONS preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Bezpečný API klíč (uložte v environment variables nebo config souboru)
$OPENAI_API_KEY = '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';

// V produkci použijte:
// $OPENAI_API_KEY = $_ENV['OPENAI_API_KEY'] ?? getenv('OPENAI_API_KEY');

try {
    // Validate input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['message'])) {
        throw new Exception('Missing message parameter');
    }
    
    $message = trim($input['message']);
    $conversation_history = $input['history'] ?? [];
    
    if (empty($message)) {
        throw new Exception('Message cannot be empty');
    }
    
    if (strlen($message) > 1000) {
        throw new Exception('Message too long (max 1000 characters)');
    }
    
    // Rate limiting (simple implementation)
    session_start();
    $now = time();
    $last_request = $_SESSION['last_chatbot_request'] ?? 0;
    
    if ($now - $last_request < 2) { // 2 second cooldown
        throw new Exception('Rate limit exceeded. Please wait before sending another message.');
    }
    
    $_SESSION['last_chatbot_request'] = $now;
    
    // Prepare OpenAI request
    $system_prompt = "Jsi pomocný AI asistent pro systém Mobil Maják - systém pro správu prodejních dat mobilních operátorů. 

Můžeš pomoci s:
- Vysvětlením funkcí systému
- Analýzou prodejních dat  
- Tipy pro optimalizaci prodeje
- Odpovědi na otázky o statistikách
- Obecné dotazy související s prodejem mobilních služeb

Odpovídej v češtině, buď přátelský a profesionální. Pokud nevíš odpověď, přiznej to a navrhni alternativní řešení.";

    $messages = [
        ['role' => 'system', 'content' => $system_prompt]
    ];
    
    // Add conversation history (last 10 messages)
    $history = array_slice($conversation_history, -10);
    foreach ($history as $msg) {
        if (isset($msg['role']) && isset($msg['content'])) {
            $messages[] = [
                'role' => $msg['role'],
                'content' => $msg['content']
            ];
        }
    }
    
    // Add current message
    $messages[] = [
        'role' => 'user',
        'content' => $message
    ];
    
    // OpenAI API request
    $data = [
        'model' => 'gpt-3.5-turbo',
        'messages' => $messages,
        'max_tokens' => 1000,
        'temperature' => 0.7,
        'stream' => false
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.openai.com/v1/chat/completions');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $OPENAI_API_KEY
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);
    
    if ($curl_error) {
        throw new Exception('Network error: ' . $curl_error);
    }
    
    if ($http_code !== 200) {
        $error_response = json_decode($response, true);
        $error_message = $error_response['error']['message'] ?? 'OpenAI API error';
        throw new Exception('OpenAI API error: ' . $error_message);
    }
    
    $openai_response = json_decode($response, true);
    
    if (!$openai_response || !isset($openai_response['choices'][0]['message']['content'])) {
        throw new Exception('Invalid response from OpenAI');
    }
    
    $ai_message = $openai_response['choices'][0]['message']['content'];
    
    // Log successful request (optional)
    error_log('Chatbot request successful: ' . strlen($message) . ' chars input, ' . strlen($ai_message) . ' chars output');
    
    // Return response
    echo json_encode([
        'success' => true,
        'message' => $ai_message,
        'timestamp' => date('c')
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'timestamp' => date('c')
    ]);
    
    // Log error
    error_log('Chatbot error: ' . $e->getMessage());
}
?> 