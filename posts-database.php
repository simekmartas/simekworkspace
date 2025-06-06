<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Cesta k databázovému souboru
$dbFile = __DIR__ . '/data/posts.json';
$uploadsDir = __DIR__ . '/uploads/';

// Ujistíme se, že adresáře existují
if (!file_exists(__DIR__ . '/data/')) {
    mkdir(__DIR__ . '/data/', 0755, true);
}
if (!file_exists($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
}

// Načtení všech příspěvků
function loadPosts() {
    global $dbFile;
    if (!file_exists($dbFile)) {
        return [];
    }
    $content = file_get_contents($dbFile);
    return json_decode($content, true) ?: [];
}

// Uložení všech příspěvků
function savePosts($posts) {
    global $dbFile;
    return file_put_contents($dbFile, json_encode($posts, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// Uložení obrázku na server
function saveImage($base64Data, $postId) {
    global $uploadsDir;
    
    // Odstranění data URL prefixu
    if (strpos($base64Data, 'data:image/') === 0) {
        $parts = explode(',', $base64Data, 2);
        if (count($parts) === 2) {
            $base64Data = $parts[1];
            $mimeType = $parts[0];
            
            // Určení přípony souboru
            if (strpos($mimeType, 'jpeg') !== false) {
                $extension = 'jpg';
            } elseif (strpos($mimeType, 'png') !== false) {
                $extension = 'png';
            } elseif (strpos($mimeType, 'gif') !== false) {
                $extension = 'gif';
            } else {
                $extension = 'jpg';
            }
        } else {
            return false;
        }
    } else {
        $extension = 'jpg';
    }
    
    // Dekódování base64
    $imageData = base64_decode($base64Data);
    if ($imageData === false) {
        return false;
    }
    
    // Název souboru
    $filename = 'post_' . $postId . '_' . time() . '.' . $extension;
    $filepath = $uploadsDir . $filename;
    
    // Uložení souboru
    if (file_put_contents($filepath, $imageData)) {
        return 'uploads/' . $filename; // Relativní cesta pro web
    }
    
    return false;
}

// Zpracování požadavků
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        // Načtení všech příspěvků
        $posts = loadPosts();
        echo json_encode(['success' => true, 'posts' => $posts]);
        break;
        
    case 'POST':
        // Vytvoření nového příspěvku
        if (!$input || !isset($input['text'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Chybí text příspěvku']);
            exit;
        }
        
        $posts = loadPosts();
        
        // Vytvoření nového příspěvku
        $postId = 'post_' . time() . '_' . rand(1000, 9999);
        $newPost = [
            'id' => $postId,
            'text' => trim($input['text']),
            'author' => isset($input['author']) ? $input['author'] : 'Anonymní uživatel',
            'timestamp' => time() * 1000, // JavaScript timestamp
            'likes' => 0,
            'liked' => false,
            'comments' => [],
            'category' => isset($input['category']) ? $input['category'] : 'Novinky'
        ];
        
        // Zpracování obrázku
        if (isset($input['photo']) && !empty($input['photo'])) {
            $imagePath = saveImage($input['photo'], $postId);
            if ($imagePath) {
                $newPost['photo'] = $imagePath;
            }
        }
        
        // Zpracování souboru
        if (isset($input['file']) && !empty($input['file'])) {
            $newPost['file'] = [
                'name' => $input['file']['name'],
                'data' => $input['file']['data'],
                'size' => $input['file']['size']
            ];
        }
        
        // Přidání na začátek pole (nejnovější první)
        array_unshift($posts, $newPost);
        
        // Uložení
        if (savePosts($posts)) {
            echo json_encode(['success' => true, 'post' => $newPost]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Chyba při ukládání']);
        }
        break;
        
    case 'PUT':
        // Aktualizace příspěvku (like, komentář, editace)
        if (!$input || !isset($input['postId'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Chybí ID příspěvku']);
            exit;
        }
        
        $posts = loadPosts();
        $postIndex = -1;
        
        // Najdeme příspěvek
        for ($i = 0; $i < count($posts); $i++) {
            if ($posts[$i]['id'] === $input['postId']) {
                $postIndex = $i;
                break;
            }
        }
        
        if ($postIndex === -1) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Příspěvek nenalezen']);
            exit;
        }
        
        // Zpracování akce
        if (isset($input['action'])) {
            switch ($input['action']) {
                case 'like':
                    $posts[$postIndex]['liked'] = !$posts[$postIndex]['liked'];
                    $posts[$postIndex]['likes'] += $posts[$postIndex]['liked'] ? 1 : -1;
                    $posts[$postIndex]['likes'] = max(0, $posts[$postIndex]['likes']);
                    break;
                    
                case 'comment':
                    if (!isset($input['comment']) || empty(trim($input['comment']))) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => 'Chybí text komentáře']);
                        exit;
                    }
                    
                    $commentId = 'comment_' . time() . '_' . rand(1000, 9999);
                    $newComment = [
                        'id' => $commentId,
                        'text' => trim($input['comment']),
                        'author' => isset($input['author']) ? $input['author'] : 'Anonymní uživatel',
                        'timestamp' => time() * 1000
                    ];
                    
                    $posts[$postIndex]['comments'][] = $newComment;
                    break;
                    
                case 'edit':
                    if (!isset($input['text'])) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => 'Chybí nový text']);
                        exit;
                    }
                    $posts[$postIndex]['text'] = trim($input['text']);
                    $posts[$postIndex]['edited'] = time() * 1000;
                    break;
            }
        }
        
        // Uložení změn
        if (savePosts($posts)) {
            echo json_encode(['success' => true, 'post' => $posts[$postIndex]]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Chyba při ukládání']);
        }
        break;
        
    case 'DELETE':
        // Smazání příspěvku
        if (!$input || !isset($input['postId'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Chybí ID příspěvku']);
            exit;
        }
        
        $posts = loadPosts();
        $newPosts = [];
        $found = false;
        
        foreach ($posts as $post) {
            if ($post['id'] !== $input['postId']) {
                $newPosts[] = $post;
            } else {
                $found = true;
                // Smazání obrázku ze serveru
                if (isset($post['photo']) && file_exists(__DIR__ . '/' . $post['photo'])) {
                    unlink(__DIR__ . '/' . $post['photo']);
                }
            }
        }
        
        if (!$found) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Příspěvek nenalezen']);
            exit;
        }
        
        if (savePosts($newPosts)) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Chyba při mazání']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Nepodporovaná metoda']);
        break;
}
?> 