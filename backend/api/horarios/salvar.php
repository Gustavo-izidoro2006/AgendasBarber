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

$barbeariaId = trim($body['barbearia_id'] ?? '');
$horarios    = $body['horarios']          ?? [];

if (!$barbeariaId || !is_array($horarios)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'barbearia_id e horarios[] são obrigatórios']);
    exit;
}

try {
    $pdo  = getDB();
    
    // Desativa todos os horários da barbearia antes de salvar para desmarcar os dias não enviados
    $pdo->prepare("UPDATE horarios_atendimento SET ativo = 0 WHERE barbearia_id = ?")->execute([$barbeariaId]);

    $sql  = "INSERT INTO horarios_atendimento (id, barbearia_id, dia_semana, abertura, fechamento, ativo)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE abertura = VALUES(abertura), fechamento = VALUES(fechamento), ativo = VALUES(ativo)";
    $stmt = $pdo->prepare($sql);

    foreach ($horarios as $h) {
        $diaSemana = (int) ($h['dia_semana'] ?? -1);
        $abertura  = trim($h['abertura']  ?? '');
        $fechamento= trim($h['fechamento']?? '');
        $ativo     = isset($h['ativo']) ? (int)(bool)$h['ativo'] : 1;

        if ($diaSemana < 0 || $diaSemana > 6 || !$abertura || !$fechamento) continue;

        // Gera ID determinístico baseado em barbearia + dia
        $id = md5($barbeariaId . '_' . $diaSemana);
        $stmt->execute([$id, $barbeariaId, $diaSemana, $abertura, $fechamento, $ativo]);
    }

    $fetch = $pdo->prepare("SELECT * FROM horarios_atendimento WHERE barbearia_id = ? ORDER BY dia_semana");
    $fetch->execute([$barbeariaId]);
    echo json_encode(['success' => true, 'data' => $fetch->fetchAll()]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro interno: ' . $e->getMessage()]);
}
