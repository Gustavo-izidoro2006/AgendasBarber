<?php
require_once __DIR__ . '/../../config/database.php';
headers();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método não permitido']);
    exit;
}

$user = autenticar();
$body = body();

$campos  = ['nome', 'email', 'telefone', 'endereco', 'descricao', 'imagem', 'instagram', 'whatsapp'];
$sets    = [];
$valores = [];

foreach ($campos as $campo) {
    if (array_key_exists($campo, $body)) {
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
    $pdo = getDB();

    // Busca barbearia do usuário
    $stmt = $pdo->prepare("SELECT id FROM barbearias WHERE user_id = ? LIMIT 1");
    $stmt->execute([$user['id']]);
    $barb = $stmt->fetch();

    if (!$barb) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Barbearia não encontrada']);
        exit;
    }

    $valores[] = $barb['id'];
    $pdo->prepare("UPDATE barbearias SET " . implode(', ', $sets) . " WHERE id = ?")
        ->execute($valores);

    $stmt = $pdo->prepare("SELECT * FROM barbearias WHERE id = ?");
    $stmt->execute([$barb['id']]);
    echo json_encode(['success' => true, 'data' => $stmt->fetch()]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro interno: ' . $e->getMessage()]);
}
