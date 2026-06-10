<?php
require_once __DIR__ . '/../../config/database.php';
headers();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método não permitido']);
    exit;
}

autenticar();

$barbeariaId = trim($_GET['barbearia_id'] ?? '');
$id          = trim($_GET['id']           ?? '');

try {
    $pdo = getDB();

    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM clientes_barbearia WHERE id = ?");
        $stmt->execute([$id]);
        $c = $stmt->fetch();
        if (!$c) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Cliente não encontrado']);
            exit;
        }
        echo json_encode(['success' => true, 'data' => $c]);
        exit;
    }

    if (!$barbeariaId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Parâmetro barbearia_id obrigatório']);
        exit;
    }

    $stmt = $pdo->prepare(
        "SELECT * FROM clientes_barbearia WHERE barbearia_id = ? ORDER BY nome"
    );
    $stmt->execute([$barbeariaId]);
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro interno: ' . $e->getMessage()]);
}
