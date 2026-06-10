<?php
require_once __DIR__ . '/../../config/database.php';
headers();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método não permitido']);
    exit;
}

$body  = body();
$email = trim($body['email'] ?? '');
$senha = $body['senha']      ?? '';

if (!$email || !$senha) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'E-mail e senha são obrigatórios']);
    exit;
}

try {
    $pdo  = getDB();
    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($senha, $user['senha_hash'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'E-mail ou senha incorretos']);
        exit;
    }

    // Remove sessões antigas expiradas
    $pdo->prepare("DELETE FROM sessoes WHERE user_id = ? AND expira_em < NOW()")->execute([$user['id']]);

    // Gera novo token
    $token  = bin2hex(random_bytes(32));
    $expira = date('Y-m-d H:i:s', strtotime('+30 days'));
    $pdo->prepare("INSERT INTO sessoes (token, user_id, expira_em) VALUES (?, ?, ?)")
        ->execute([$token, $user['id'], $expira]);

    // Busca barbearia
    $stmt = $pdo->prepare("SELECT * FROM barbearias WHERE user_id = ? LIMIT 1");
    $stmt->execute([$user['id']]);
    $barbearia = $stmt->fetch() ?: null;

    $onboarding = false;
    if ($barbearia) {
        $stmt = $pdo->prepare("SELECT * FROM configuracoes_barbearia WHERE barbearia_id = ?");
        $stmt->execute([$barbearia['id']]);
        $cfg = $stmt->fetch();
        $onboarding = !empty($cfg['onboarding_completo']);
    }

    echo json_encode([
        'success' => true,
        'data'    => [
            'token'               => $token,
            'usuario'             => ['id' => $user['id'], 'nome' => $user['nome'], 'email' => $user['email']],
            'barbearia'           => $barbearia,
            'onboarding_completo' => $onboarding,
        ],
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro interno: ' . $e->getMessage()]);
}
