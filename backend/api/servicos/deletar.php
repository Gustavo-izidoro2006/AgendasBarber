<?php
require_once __DIR__ . '/../../config/database.php';
headers();

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método não permitido']);
    exit;
}

autenticar();
$id = trim($_GET['id'] ?? '');

if (!$id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Parâmetro id obrigatório']);
    exit;
}

try {
    $pdo = getDB();
    $pdo->prepare("DELETE FROM servicos WHERE id = ?")->execute([$id]);
    echo json_encode(['success' => true, 'data' => null]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro interno: ' . $e->getMessage()]);
}
