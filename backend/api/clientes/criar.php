<?php
require_once __DIR__ . '/../../config/database.php';
headers();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método não permitido']);
    exit;
}

$body = body();

$barbeariaId = trim($body['barbearia_id'] ?? '');
$nome        = trim($body['nome']         ?? '');

if (!$barbeariaId || !$nome) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Campos obrigatórios: barbearia_id, nome']);
    exit;
}

$telefone   = trim($body['telefone']   ?? '') ?: null;
$email      = trim($body['email']      ?? '') ?: null;
$observacoes= $body['observacoes']     ?? null;

if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'E-mail inválido']);
    exit;
}

try {
    $pdo = getDB();
    $id  = generateId();

    $pdo->prepare(
        "INSERT INTO clientes_barbearia (id, barbearia_id, nome, telefone, email, observacoes)
         VALUES (?, ?, ?, ?, ?, ?)"
    )->execute([$id, $barbeariaId, $nome, $telefone, $email, $observacoes]);

    $stmt = $pdo->prepare("SELECT * FROM clientes_barbearia WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true, 'data' => $stmt->fetch()]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro interno: ' . $e->getMessage()]);
}
