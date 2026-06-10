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

$barbeariaId          = trim($body['barbearia_id']          ?? '');
$onboardingCompleto   = isset($body['onboarding_completo'])   ? (int)(bool)$body['onboarding_completo']   : null;
$intervaloAgendamento = isset($body['intervalo_agendamento']) ? (int)$body['intervalo_agendamento']        : null;
$antecedenciaMinima   = isset($body['antecedencia_minima'])   ? (int)$body['antecedencia_minima']          : null;

if (!$barbeariaId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'barbearia_id obrigatório']);
    exit;
}

try {
    $pdo = getDB();
    $id  = md5('cfg_' . $barbeariaId); // ID determinístico

    $sql = "INSERT INTO configuracoes_barbearia
                (id, barbearia_id, onboarding_completo, intervalo_agendamento, antecedencia_minima)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                onboarding_completo   = COALESCE(VALUES(onboarding_completo),   onboarding_completo),
                intervalo_agendamento = COALESCE(VALUES(intervalo_agendamento), intervalo_agendamento),
                antecedencia_minima   = COALESCE(VALUES(antecedencia_minima),   antecedencia_minima)";

    $pdo->prepare($sql)->execute([
        $id,
        $barbeariaId,
        $onboardingCompleto,
        $intervaloAgendamento,
        $antecedenciaMinima,
    ]);

    $stmt = $pdo->prepare("SELECT * FROM configuracoes_barbearia WHERE barbearia_id = ?");
    $stmt->execute([$barbeariaId]);
    echo json_encode(['success' => true, 'data' => $stmt->fetch()]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro interno: ' . $e->getMessage()]);
}
