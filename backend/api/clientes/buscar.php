<?php
require_once __DIR__ . '/../../config/database.php';
headers();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método não permitido']);
    exit;
}

$barbeariaId = trim($_GET['barbearia_id'] ?? '');
$telefone    = trim($_GET['telefone']     ?? '');

if (!$barbeariaId || !$telefone) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'barbearia_id e telefone obrigatórios']);
    exit;
}

try {
    $pdo  = getDB();
    $stmt = $pdo->prepare(
        "SELECT * FROM clientes_barbearia WHERE barbearia_id = ? AND telefone = ? LIMIT 1"
    );
    $stmt->execute([$barbeariaId, $telefone]);
    $cliente = $stmt->fetch() ?: null;

    echo json_encode(['success' => true, 'data' => $cliente]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro interno: ' . $e->getMessage()]);
}
