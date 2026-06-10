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

$permitidos = ['nome', 'descricao', 'valor', 'duracao', 'status'];
$sets       = [];
$valores    = [];

foreach ($permitidos as $campo) {
    if (array_key_exists($campo, $body)) {
        $sets[]    = "$campo = ?";
        $val = $body[$campo];
        if ($campo === 'valor')   $val = (float) $val;
        if ($campo === 'duracao') $val = (int)   $val;
        if ($campo === 'status' && !in_array($val, ['ativo', 'inativo'])) continue;
        $valores[] = $val;
    }
}

if (empty($sets)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Nenhum campo para atualizar']);
    exit;
}

try {
    $pdo = getDB();
    $valores[] = $id;
    $pdo->prepare("UPDATE servicos SET " . implode(', ', $sets) . " WHERE id = ?")
        ->execute($valores);

    $stmt = $pdo->prepare("SELECT * FROM servicos WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true, 'data' => $stmt->fetch()]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro interno: ' . $e->getMessage()]);
}
