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

$statusValidos = ['ativo', 'pendente', 'cancelado', 'concluido'];
$permitidos    = ['status', 'observacoes', 'horario', 'data_agendamento'];
$sets          = [];
$valores       = [];

foreach ($permitidos as $campo) {
    if (array_key_exists($campo, $body)) {
        if ($campo === 'status' && !in_array($body[$campo], $statusValidos)) continue;
        $sets[]    = "$campo = ?";
        $valores[] = $body[$campo];
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
    $pdo->prepare("UPDATE agendamentos SET " . implode(', ', $sets) . " WHERE id = ?")
        ->execute($valores);

    $stmt = $pdo->prepare("SELECT * FROM agendamentos WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true, 'data' => $stmt->fetch()]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro interno: ' . $e->getMessage()]);
}
