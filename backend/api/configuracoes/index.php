<?php
require_once __DIR__ . '/../../config/database.php';
headers();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método não permitido']);
    exit;
}

$barbeariaId = trim($_GET['barbearia_id'] ?? '');

if (!$barbeariaId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Parâmetro barbearia_id obrigatório']);
    exit;
}

try {
    $pdo  = getDB();
    $stmt = $pdo->prepare("SELECT * FROM configuracoes_barbearia WHERE barbearia_id = ?");
    $stmt->execute([$barbeariaId]);
    $cfg = $stmt->fetch();

    if (!$cfg) {
        // Retorna configuração default sem erro
        echo json_encode([
            'success' => true,
            'data'    => [
                'barbearia_id'          => $barbeariaId,
                'onboarding_completo'   => 0,
                'intervalo_agendamento' => 30,
                'antecedencia_minima'   => 1,
            ],
        ]);
        exit;
    }

    echo json_encode(['success' => true, 'data' => $cfg]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro interno: ' . $e->getMessage()]);
}
