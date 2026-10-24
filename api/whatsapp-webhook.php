<?php
/**
 * STORIUM Pakistan — Meta WhatsApp Cloud API Webhook
 * Endpoint: https://storium.online/api/whatsapp-webhook.php
 *
 * Verifies webhook handshakes with Meta (GET) and receives incoming WhatsApp messages (POST).
 */

header('X-Content-Type-Options: nosniff');

$configFile = __DIR__ . '/whatsapp-config.php';
$config = file_exists($configFile) ? require $configFile : array();
$verifyToken = $config['webhook_verify_token'] ?? 'storium_ai_webhook_secret_2026';

// 1. Meta Webhook Verification Handshake (GET)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $mode = $_GET['hub_mode'] ?? $_GET['hub.mode'] ?? '';
    $token = $_GET['hub_verify_token'] ?? $_GET['hub.verify_token'] ?? '';
    $challenge = $_GET['hub_challenge'] ?? $_GET['hub.challenge'] ?? '';

    if ($mode === 'subscribe' && $token === $verifyToken) {
        http_response_code(200);
        header('Content-Type: text/plain');
        echo $challenge;
        exit;
    }

    http_response_code(403);
    echo 'Forbidden: Invalid verify token';
    exit;
}

// 2. Incoming Messages & Events from WhatsApp (POST)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $payload = json_decode((string)$rawInput, true);

    // Always respond 200 OK immediately so Meta doesn't retry
    http_response_code(200);
    header('Content-Type: application/json');
    echo json_encode(array('success' => true, 'received' => true));
    exit;
}

http_response_code(405);
echo 'Method not allowed';
