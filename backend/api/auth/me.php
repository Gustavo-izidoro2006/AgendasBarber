<?php
require_once __DIR__ . '/../../config/database.php';
headers();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método não permitido']);
    exit;
}

$user = autenticar();

// Busca barbearia do usuário
$pdo  = getDB();
$stmt = $pdo->prepare("SELECT * FROM barbearias WHERE user_id = ? LIMIT 1");
$stmt->execute([$user['id']]);
$barbearia = $stmt->fetch() ?: null;

echo json_encode([
    'success' => true,
    'data'    => [
        'usuario'   => ['id' => $user['id'], 'nome' => $user['nome'], 'email' => $user['email']],
        'barbearia' => $barbearia,
    ],
]);
