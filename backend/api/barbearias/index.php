<?php
require_once __DIR__ . '/../../config/database.php';
headers();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método não permitido']);
    exit;
}

$slug = trim($_GET['slug'] ?? '');

if (!$slug) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Parâmetro slug obrigatório']);
    exit;
}

try {
    $pdo  = getDB();
    $stmt = $pdo->prepare("SELECT * FROM barbearias WHERE slug = ? AND status = 'ativo' LIMIT 1");
    $stmt->execute([$slug]);
    $barbearia = $stmt->fetch();

    if (!$barbearia) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Barbearia não encontrada']);
        exit;
    }

    echo json_encode(['success' => true, 'data' => $barbearia]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro interno: ' . $e->getMessage()]);
}
