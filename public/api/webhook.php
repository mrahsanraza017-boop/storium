<?php
// api/webhook.php — Rapid Gateway payment webhook receiver (Hostinger).
//
// This is the AUTHORITATIVE source of truth for payment confirmation.
// SUCCESS_URL must NEVER be treated as proof of payment.
//
// Handles:
//   transaction.completed — marks the order as PAID
//   transaction.failed   — records the failure
//
// Verifies X-RG-Signature (HMAC-SHA256 of the raw body using the webhook signing salt).
// Uses the Supabase SERVICE ROLE key to update orders (bypasses RLS).
// Idempotent: duplicate webhook deliveries are safely acknowledged.
declare(strict_types=1);

function rg_config(string $key, string $fallback): string
{
    $value = getenv($key);
    return is_string($value) && $value !== '' ? $value : $fallback;
}

$RG_WEBHOOK_SECRET = rg_config('RG_WEBHOOK_SECRET', '');
$SUPABASE_URL      = rtrim(rg_config('SUPABASE_URL', 'https://jvghdtlfwijbkhwwpdft.supabase.co'), '/');
$SUPABASE_SERVICE_ROLE_KEY = rg_config('SUPABASE_SERVICE_ROLE_KEY', 'YOUR_SUPABASE_SERVICE_ROLE_KEY');

function send_json(int $status, array $body): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($body);
    exit;
}

/**
 * Verify the HMAC signature. Rapid Gateway signs the raw body using
 * HMAC-SHA256 with the webhook signing salt (per environment).
 */
function verify_signature(string $rawBody, ?string $signature): bool
{
    global $RG_WEBHOOK_SECRET;
    if ($signature === null || $signature === '' || $RG_WEBHOOK_SECRET === '') {
        return false;
    }
    // Tolerate a "v1=..." prefix in case the payload format evolves.
    $candidate = $signature;
    if (str_contains($candidate, '=')) {
        $candidate = substr($candidate, strpos($candidate, '=') + 1);
    }
    $expected = hash_hmac('sha256', $rawBody, $RG_WEBHOOK_SECRET);
    return hash_equals($expected, strtolower(trim($candidate)));
}

/**
 * Extract the Storium order reference (BASKET_ID) from the webhook payload.
 */
function extract_order_id(array $event, array $data): ?string
{
    $candidates = [
        $data['basket_id'] ?? null,
        $data['metadata']['order_id'] ?? null,
        $data['metadata']['orderId'] ?? null,
        $data['order_id'] ?? null,
        $data['orderId'] ?? null,
        $data['reference'] ?? null,
        $data['client_reference_id'] ?? null,
        $event['basket_id'] ?? null,
        $event['reference'] ?? null,
    ];
    foreach ($candidates as $value) {
        if (is_string($value) && $value !== '') {
            return $value;
        }
    }
    return null;
}

/**
 * Extract the Rapid Gateway transaction reference from the webhook payload.
 */
function extract_rg_reference(array $event, array $data): ?string
{
    $candidates = [
        $data['transaction_id'] ?? null,
        $data['rg_transaction_id'] ?? null,
        $data['reference'] ?? null,
        $event['transaction_id'] ?? null,
        $event['reference'] ?? null,
    ];
    foreach ($candidates as $value) {
        if (is_string($value) && $value !== '') {
            return $value;
        }
    }
    return null;
}

/**
 * Query Supabase for an order by order_number.
 */
function fetch_order(string $orderNumber): ?array
{
    global $SUPABASE_URL, $SUPABASE_SERVICE_ROLE_KEY;
    if (str_starts_with($SUPABASE_SERVICE_ROLE_KEY, 'YOUR_') || $SUPABASE_SERVICE_ROLE_KEY === '') {
        return null;
    }
    $url = $SUPABASE_URL . '/rest/v1/orders?order_number=eq.' . urlencode($orderNumber) . '&select=*,id';
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_HTTPHEADER => [
            'apikey: ' . $SUPABASE_SERVICE_ROLE_KEY,
            'Authorization: Bearer ' . $SUPABASE_SERVICE_ROLE_KEY,
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
    ]);
    $body = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if ($code < 200 || $code >= 300 || $body === false) {
        return null;
    }
    $rows = json_decode($body, true);
    if (!is_array($rows) || count($rows) === 0) {
        return null;
    }
    return $rows[0];
}

/**
 * Mark the order paid in Supabase via the REST API (service role — bypasses RLS).
 * Idempotent: safe to call multiple times for the same order.
 */
function mark_order_paid_in_supabase(string $orderNumber, ?string $rgReference): bool
{
    global $SUPABASE_URL, $SUPABASE_SERVICE_ROLE_KEY;
    if (str_starts_with($SUPABASE_SERVICE_ROLE_KEY, 'YOUR_') || $SUPABASE_SERVICE_ROLE_KEY === '') {
        return false;
    }

    // First check current status — if already paid, skip update (idempotent)
    $existing = fetch_order($orderNumber);
    if ($existing !== null && ($existing['payment_status'] ?? '') === 'paid') {
        return true; // Already processed
    }

    $patchData = [
        'payment_status' => 'paid',
        'order_status'   => 'Processing',
        'paid_at'        => gmdate('Y-m-d\TH:i:s\Z'),
    ];

    // Store the Rapid Gateway reference if the column exists (ignore errors if it doesn't)
    if ($rgReference !== null) {
        $patchData['rg_transaction_ref'] = $rgReference;
    }

    $ch = curl_init($SUPABASE_URL . '/rest/v1/orders?order_number=eq.' . urlencode($orderNumber));
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => 'PATCH',
        CURLOPT_POSTFIELDS    => json_encode($patchData),
        CURLOPT_HTTPHEADER => [
            'apikey: ' . $SUPABASE_SERVICE_ROLE_KEY,
            'Authorization: Bearer ' . $SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type: application/json',
            'Prefer: return=minimal',
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
    ]);

    $body = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    if ($code === 204) {
        return true;
    }
    // 400 may mean rg_transaction_ref column doesn't exist yet — retry without it
    if ($code === 400 && isset($patchData['rg_transaction_ref'])) {
        unset($patchData['rg_transaction_ref']);
        $ch2 = curl_init($SUPABASE_URL . '/rest/v1/orders?order_number=eq.' . urlencode($orderNumber));
        curl_setopt_array($ch2, [
            CURLOPT_CUSTOMREQUEST => 'PATCH',
            CURLOPT_POSTFIELDS    => json_encode($patchData),
            CURLOPT_HTTPHEADER => [
                'apikey: ' . $SUPABASE_SERVICE_ROLE_KEY,
                'Authorization: Bearer ' . $SUPABASE_SERVICE_ROLE_KEY,
                'Content-Type: application/json',
                'Prefer: return=minimal',
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        ]);
        $body2 = curl_exec($ch2);
        $code2 = (int) curl_getinfo($ch2, CURLINFO_RESPONSE_CODE);
        curl_close($ch2);
        if ($code2 >= 200 && $code2 < 300) {
            return true;
        }
        error_log("Supabase order update (fallback) returned HTTP {$code2}: " . substr((string)($body2 ?? ''), 0, 300));
        return false;
    }

    error_log("Supabase order update returned HTTP {$code}: " . substr((string)($body ?? ''), 0, 300));
    return $code >= 200 && $code < 300;
}

/**
 * Record a failed payment in Supabase.
 */
function mark_order_failed_in_supabase(string $orderNumber): bool
{
    global $SUPABASE_URL, $SUPABASE_SERVICE_ROLE_KEY;
    if (str_starts_with($SUPABASE_SERVICE_ROLE_KEY, 'YOUR_') || $SUPABASE_SERVICE_ROLE_KEY === '') {
        return false;
    }

    $ch = curl_init($SUPABASE_URL . '/rest/v1/orders?order_number=eq.' . urlencode($orderNumber));
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => 'PATCH',
        CURLOPT_POSTFIELDS    => json_encode([
            'payment_status'     => 'failed',
            'payment_failed_at'  => gmdate('Y-m-d\TH:i:s\Z'),
        ]),
        CURLOPT_HTTPHEADER => [
            'apikey: ' . $SUPABASE_SERVICE_ROLE_KEY,
            'Authorization: Bearer ' . $SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type: application/json',
            'Prefer: return=minimal',
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
    ]);

    $body = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    if ($code === 204) {
        return true;
    }
    error_log("Supabase order fail update returned HTTP {$code}: " . substr((string)($body ?? ''), 0, 300));
    return $code >= 200 && $code < 300;
}

// ── Request handling ──────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

$rawBody = file_get_contents('php://input');
if ($rawBody === false || $rawBody === '') {
    http_response_code(400);
    exit;
}

// ── Step 1: Verify webhook signature ─────────────────────────────────
$signature = $_SERVER['HTTP_X_RAPIDGATEWAY_SIGNATURE'] ?? $_SERVER['HTTP_X_RG_SIGNATURE'] ?? null;
if (!verify_signature($rawBody, $signature)) {
    send_json(401, ['error' => 'Invalid signature.']);
}

$event = json_decode($rawBody, true);
if (!is_array($event)) {
    send_json(400, ['error' => 'Invalid JSON payload.']);
}

$type = $event['type'] ?? '';
$data = is_array($event['data'] ?? null) ? $event['data'] : [];

// ── Step 2: Process event by type ────────────────────────────────────
if ($type === 'transaction.completed') {
    $orderId = extract_order_id($event, $data);
    $rgReference = extract_rg_reference($event, $data);

    if ($orderId === null) {
        send_json(400, ['error' => 'No order reference in payload.']);
    }

    // Verify the order exists before marking paid
    $order = fetch_order($orderId);
    if ($order === null) {
        // Order not found — acknowledge so gateway stops retrying, but log it
        error_log("Webhook: order {$orderId} not found in Supabase.");
        send_json(200, ['ok' => true, 'note' => 'order not found']);
    }

    // Idempotent: if already paid, just acknowledge
    if (($order['payment_status'] ?? '') === 'paid') {
        send_json(200, ['ok' => true, 'note' => 'already paid']);
    }

    // Verify amount where possible
    if (isset($data['amount']) && isset($order['total'])) {
        $webhookAmount = (float) $data['amount'];
        $orderTotal = (float) $order['total'];
        if (abs($webhookAmount - $orderTotal) > 0.01) {
            error_log("Webhook: amount mismatch for order {$orderId}. Expected {$orderTotal}, got {$webhookAmount}");
            send_json(400, ['error' => 'Amount mismatch.']);
        }
    }

    $success = mark_order_paid_in_supabase($orderId, $rgReference);
    if (!$success) {
        error_log("Webhook: failed to update order {$orderId} in Supabase.");
    }

    send_json(200, ['ok' => true]);
}

if ($type === 'transaction.failed') {
    $orderId = extract_order_id($event, $data);

    if ($orderId === null) {
        send_json(400, ['error' => 'No order reference in payload.']);
    }

    mark_order_failed_in_supabase($orderId);
    send_json(200, ['ok' => true]);
}

// Unknown event type — acknowledge so gateway stops retrying
send_json(200, ['ok' => true, 'note' => 'unhandled event type']);
