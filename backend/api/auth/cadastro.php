<?php
require_once __DIR__ . '/../../config/database.php';
headers();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método não permitido']);
    exit;
}

$body = body();
$nome          = trim($body['nome']          ?? '');
$email         = trim($body['email']         ?? '');
$senha         = $body['senha']              ?? '';
$nomeBarbearia = trim($body['nomeBarbearia'] ?? $nome);

if (!$nome || !$email || !$senha) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Campos obrigatórios: nome, email, senha']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'E-mail inválido']);
    exit;
}

if (strlen($senha) < 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Senha deve ter ao menos 6 caracteres']);
    exit;
}

try {
    $pdo = getDB();

    // Verifica e-mail duplicado
    $chk = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
    $chk->execute([$email]);
    if ($chk->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'error' => 'E-mail já cadastrado']);
        exit;
    }

    $userId = generateId();
    $hash   = password_hash($senha, PASSWORD_DEFAULT);

    $pdo->prepare(
        "INSERT INTO usuarios (id, nome, email, senha_hash) VALUES (?, ?, ?, ?)"
    )->execute([$userId, $nome, $email, $hash]);

    // Cria barbearia
    $barbId = generateId();
    $slug   = strtolower(preg_replace('/[^a-z0-9]+/', '-', $nomeBarbearia))
            . '-' . substr($barbId, 0, 6);
    $slug   = trim($slug, '-');

    $pdo->prepare(
        "INSERT INTO barbearias (id, user_id, nome, slug, email, status)
         VALUES (?, ?, ?, ?, ?, 'ativo')"
    )->execute([$barbId, $userId, $nomeBarbearia, $slug, $email]);

    // Cria configurações iniciais
    $cfgId = generateId();
    $pdo->prepare(
        "INSERT INTO configuracoes_barbearia (id, barbearia_id, onboarding_completo)
         VALUES (?, ?, 0)"
    )->execute([$cfgId, $barbId]);

    // Gera sessão
    $token   = bin2hex(random_bytes(32)); // 64 chars
    $expira  = date('Y-m-d H:i:s', strtotime('+30 days'));
    $pdo->prepare(
        "INSERT INTO sessoes (token, user_id, expira_em) VALUES (?, ?, ?)"
    )->execute([$token, $userId, $expira]);

    // Busca barbearia completa
    $stmt = $pdo->prepare("SELECT * FROM barbearias WHERE id = ?");
    $stmt->execute([$barbId]);
    $barbearia = $stmt->fetch();

    echo json_encode([
        'success' => true,
        'data'    => [
            'token'    => $token,
            'usuario'  => ['id' => $userId, 'nome' => $nome, 'email' => $email],
            'barbearia' => $barbearia,
            'onboarding_completo' => false,
        ],
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro interno: ' . $e->getMessage()]);
}
