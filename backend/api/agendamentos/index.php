<?php
require_once __DIR__ . '/../../config/database.php';
headers();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método não permitido']);
    exit;
}

$barbeariaId = trim($_GET['barbearia_id'] ?? '');
$data        = trim($_GET['data']         ?? '');
$id          = trim($_GET['id']           ?? '');

try {
    $pdo = getDB();

    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM agendamentos WHERE id = ?");
        $stmt->execute([$id]);
        $ag = $stmt->fetch();
        if (!$ag) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Agendamento não encontrado']);
            exit;
        }
        echo json_encode(['success' => true, 'data' => $ag]);
        exit;
    }

    if (!$barbeariaId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Parâmetro barbearia_id obrigatório']);
        exit;
    }

    if ($data) {
        // Retorna apenas os horários ocupados (para página pública)
        $stmt = $pdo->prepare(
            "SELECT a.*, c.nome AS cliente_nome, s.nome AS servico_nome
             FROM agendamentos a
             LEFT JOIN clientes_barbearia c ON c.id = a.cliente_id
             LEFT JOIN servicos s ON s.id = a.servico_id
             WHERE a.barbearia_id = ? AND a.data_agendamento = ? AND a.status != 'cancelado'
             ORDER BY a.horario"
        );
        $stmt->execute([$barbeariaId, $data]);
    } else {
        $stmt = $pdo->prepare(
            "SELECT a.*, c.nome AS cliente_nome, s.nome AS servico_nome
             FROM agendamentos a
             LEFT JOIN clientes_barbearia c ON c.id = a.cliente_id
             LEFT JOIN servicos s ON s.id = a.servico_id
             WHERE a.barbearia_id = ?
             ORDER BY a.data_agendamento DESC, a.horario"
        );
        $stmt->execute([$barbeariaId]);
    }

    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro interno: ' . $e->getMessage()]);
}
