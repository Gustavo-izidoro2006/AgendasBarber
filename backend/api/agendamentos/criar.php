<?php
require_once __DIR__ . '/../../config/database.php';
headers();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método não permitido']);
    exit;
}

$body = body();

$barbeariaId     = trim($body['barbearia_id']     ?? '');
$dataAgendamento = trim($body['data_agendamento'] ?? '');
$horario         = trim($body['horario']          ?? '');
$clienteId       = $body['cliente_id']            ?? null;
$servicoId       = $body['servico_id']            ?? null;
$observacoes     = $body['observacoes']           ?? null;
$status          = in_array($body['status'] ?? '', ['ativo', 'pendente']) ? $body['status'] : 'ativo';

if (!$barbeariaId || !$dataAgendamento || !$horario) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Campos obrigatórios: barbearia_id, data_agendamento, horario']);
    exit;
}

// Validação básica de data
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $dataAgendamento)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'data_agendamento deve ser YYYY-MM-DD']);
    exit;
}

try {
    $pdo = getDB();

    // Verifica conflito de horário
    if ($clienteId) {
        $chk = $pdo->prepare(
            "SELECT id FROM agendamentos
             WHERE barbearia_id = ? AND data_agendamento = ? AND horario = ? AND status != 'cancelado' AND (cliente_id IS NULL OR cliente_id != ?)"
        );
        $chk->execute([$barbeariaId, $dataAgendamento, $horario, $clienteId]);
    } else {
        $chk = $pdo->prepare(
            "SELECT id FROM agendamentos
             WHERE barbearia_id = ? AND data_agendamento = ? AND horario = ? AND status != 'cancelado'"
        );
        $chk->execute([$barbeariaId, $dataAgendamento, $horario]);
    }
    if ($chk->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'error' => 'Horário já ocupado']);
        exit;
    }

    $id = generateId();
    $pdo->prepare(
        "INSERT INTO agendamentos (id, barbearia_id, cliente_id, servico_id, data_agendamento, horario, status, observacoes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )->execute([$id, $barbeariaId, $clienteId ?: null, $servicoId ?: null, $dataAgendamento, $horario, $status, $observacoes]);

    $stmt = $pdo->prepare("SELECT * FROM agendamentos WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true, 'data' => $stmt->fetch()]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro interno: ' . $e->getMessage()]);
}
