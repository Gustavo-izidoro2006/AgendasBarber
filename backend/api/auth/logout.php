<?php
require_once __DIR__ . '/../../config/database.php';
headers();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método não permitido']);
    exit;
}

$headers = getallheaders();
$token   = str_replace('Bearer ', '', $headers['Authorization'] ?? $headers['authorization'] ?? '');

if ($token) {
    try {
        $pdo = getDB();
        $pdo->prepare("DELETE FROM sessoes WHERE token = ?")->execute([$token]);
    } catch (PDOException $e) {
        // ignora
    }
}

echo json_encode(['success' => true, 'data' => null]);
