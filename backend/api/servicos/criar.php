<?php
require_once __DIR__ . '/../../config/database.php';
headers();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método não permitido']);
    exit;
}

autenticar();
$body = body();

$barbeariaId = trim($body['barbearia_id'] ?? '');
$nome        = trim($body['nome']         ?? '');

if (!$barbeariaId || !$nome) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Campos obrigatórios: barbearia_id, nome']);
    exit;
}

$descricao = $body['descricao'] ?? null;
$valor     = isset($body['valor']) ? (float) $body['valor'] : 0.00;
$duracao   = isset($body['duracao']) ? (int) $body['duracao'] : 30;
$status    = in_array($body['status'] ?? '', ['ativo', 'inativo']) ? $body['status'] : 'ativo';

try {
    $pdo = getDB();
    $id  = generateId();

    $pdo->prepare(
        "INSERT INTO servicos (id, barbearia_id, nome, descricao, valor, duracao, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    )->execute([$id, $barbeariaId, $nome, $descricao, $valor, $duracao, $status]);

    $stmt = $pdo->prepare("SELECT * FROM servicos WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true, 'data' => $stmt->fetch()]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro interno: ' . $e->getMessage()]);
}
