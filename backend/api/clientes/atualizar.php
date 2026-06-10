<?php
require_once __DIR__ . '/../../config/database.php';
headers();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método não permitido']);
    exit;
}

autenticar();
$body = body();
$id   = trim($body['id'] ?? '');

if (!$id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Campo id obrigatório']);
    exit;
}

$permitidos = ['nome', 'telefone', 'email', 'observacoes'];
$sets       = [];
$valores    = [];

foreach ($permitidos as $campo) {
    if (array_key_exists($campo, $body)) {
        if ($campo === 'email' && $body[$campo] && !filter_var($body[$campo], FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'E-mail inválido']);
            exit;
        }
        $sets[]    = "$campo = ?";
        $valores[] = $body[$campo] !== '' ? $body[$campo] : null;
    }
}

if (empty($sets)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Nenhum campo para atualizar']);
    exit;
}

try {
    $pdo       = getDB();
    $valores[] = $id;
    $pdo->prepare("UPDATE clientes_barbearia SET " . implode(', ', $sets) . " WHERE id = ?")
        ->execute($valores);

    $stmt = $pdo->prepare("SELECT * FROM clientes_barbearia WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true, 'data' => $stmt->fetch()]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro interno: ' . $e->getMessage()]);
}
