<?php
require_once __DIR__ . '/../../config/database.php';
headers();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método não permitido']);
    exit;
}

$barbeariaId = trim($_GET['barbearia_id'] ?? '');

if (!$barbeariaId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Parâmetro barbearia_id obrigatório']);
    exit;
}

try {
    $pdo  = getDB();
    $stmt = $pdo->prepare(
        "SELECT * FROM horarios_atendimento WHERE barbearia_id = ? ORDER BY dia_semana"
    );
    $stmt->execute([$barbeariaId]);
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro interno: ' . $e->getMessage()]);
}
