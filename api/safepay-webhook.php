<?php
/**
 * POST /api/safepay-webhook.php
 *
 * Receives SafePay payment events (payment.succeeded / payment.failed) and
 * marks the order paid/failed in Supabase using the service-role key.
 *
 * Signature verification: SafePay signs the raw body with HMAC-SHA512 using
 * the webhook secret and sends it in the "X-SFPY-SIGNATURE" header. When a
 * webhook_secret is configured we verify it; otherwise (sandbox without a
 * configured webhook) we log and still process so the store works end-to-end.
 */

require_once __DIR__ . '/safepay-lib.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    safepay_json_response(array('error' => 'Method not allowed'), 405);
}

$rawBody = file_get_contents('php://input');
$payload = json_decode($rawBody ?: '', true);
if (!is_array($payload)) {
    safepay_json_response(array('error' => 'Invalid JSON payload'), 400);
}

$config = safepay_config();

// Verify signature when a webhook secret is configured.
if ($config['webhook_secret'] !== '') {
    $signature = $_SERVER['HTTP_X_SFPY_SIGNATURE'] ?? '';
    $expected = hash_hmac('sha512', $rawBody, $config['webhook_secret']);
    if (!is_string($signature) || !hash_equals($expected, $signature)) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(array('error' => 'Invalid signature'));
        exit;
    }
}

$type = (string) ($payload['type'] ?? '');
$data = is_array($payload['data'] ?? null) ? $payload['data'] : array();
$tracker = (string) ($data['tracker'] ?? '');
$metadata = is_array($data['metadata'] ?? null) ? $data['metadata'] : array();
$orderId = (string) ($metadata['order_id'] ?? ($data['order_id'] ?? ''));

// We only react to the events that change order state.
$supported = array('payment.succeeded', 'payment.failed');
if (!in_array($type, $supported, true) || $orderId === '') {
    // Acknowledge receipt so SafePay doesn't retry, nothing to do.
    safepay_json_response(array('status' => 'ignored', 'type' => $type), 200);
}

$patch = array();
if ($type === 'payment.succeeded') {
    $patch = array(
        'payment_status' => 'paid',
        'paid_at' => gmdate('c'),
        'order_status' => 'Processing',
    );
}
if ($type === 'payment.failed') {
    $patch = array(
        'payment_status' => 'failed',
        'payment_failed_at' => gmdate('c'),
    );
}
if ($tracker !== '') {
    $patch['rg_transaction_ref'] = $tracker;
}

if ($config['supabase_url'] !== '' && $config['supabase_service_role_key'] !== '') {
    supabase_patch_order($config, $orderId, $patch);
}

safepay_json_response(array('status' => 'ok'));

function supabase_patch_order(array $config, string $orderId, array $patch): void {
    $url = rtrim($config['supabase_url'], '/') . '/rest/v1/orders?order_number=eq.' . urlencode($orderId);
    $ch = curl_init($url);
    if ($ch === false) return;

    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => 'PATCH',
        CURLOPT_HTTPHEADER => array(
            'Content-Type: application/json',
            'apikey: ' . $config['supabase_service_role_key'],
            'Authorization: Bearer ' . $config['supabase_service_role_key'],
            'Prefer: return=minimal',
        ),
        CURLOPT_POSTFIELDS => json_encode($patch),
        CURLOPT_TIMEOUT => 20,
    ));
    curl_exec($ch);
    curl_close($ch);
}