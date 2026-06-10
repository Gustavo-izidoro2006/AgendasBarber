<?php
require_once __DIR__ . '/../../config/database.php';
headers();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método não permitido']);
    exit;
}

$user = autenticar();

try {
    $pdo  = getDB();
    $stmt = $pdo->prepare("SELECT * FROM barbearias WHERE user_id = ? LIMIT 1");
    $stmt->execute([$user['id']]);
    $barbearia = $stmt->fetch() ?: null;

    echo json_encode(['success' => true, 'data' => $barbearia]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro interno: ' . $e->getMessage()]);
}
