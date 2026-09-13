<?php
// api/webhook.php — OPTIONAL payment webhook receiver (Hostinger).
//
// The primary signal in the sandbox-kit flow is the SUCCESS_URL redirect, which
// PaymentCompleteView handles client-side. This endpoint is only used if your
// Rapid Gateway account is also configured to POST payment events here. It
// verifies the X-RG-Signature (hex HMAC-SHA256 of the raw body using your
// webhook secret), then marks the matching order paid in Supabase.
//
// NOTE: This uses the Supabase SERVICE ROLE key, NOT the publishable/anon key.
// The service role key bypasses Row Level Security and must only ever live in
// this server-side file / Hostinger env vars — never use a VITE_ prefix.
declare(strict_types=1);

function rg_config(string $key, string $fallback): string
{
    $value = getenv($key);
    return is_string($value) && $value !== '' ? $value : $fallback;
}

$RG_WEBHOOK_SECRET = rg_config('RG_WEBHOOK_SECRET', 'YOUR_RG_WEBHOOK_SECRET');
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
 * Verify the HMAC signature. Rapid Gateway sends the raw body and signs it
 * using HMAC-SHA256 with your webhook secret.
 */
function verify_signature(string $rawBody, ?string $signature): bool
{
    if ($signature === null || $signature === '') {
        return false;
    }
    // Tolerate a "v1=..." prefix in case the payload format evolves.
    $candidate = $signature;
    if (str_contains($candidate, '=')) {
        $candidate = substr($candidate, strpos($candidate, '=') + 1);
    }
    $expected = hash_hmac('sha256', $rawBody, rg_config('RG_WEBHOOK_SECRET', ''));
    return hash_equals($expected, strtolower(trim($candidate)));
}

/**
 * Best-effort extraction of our STORIUM order reference from the event.
 * The order reference is threaded through the payment intent as metadata
 * (and used as the idempotency key), so it appears in several possible
 * places depending on the gateway's payload shape.
 */
function extract_order_id(array $event, array $data): ?string
{
    $candidates = [
        $data['metadata']['order_id'] ?? null,
        $data['metadata']['orderId'] ?? null,
        $data['order_id'] ?? null,
        $data['orderId'] ?? null,
        $data['reference'] ?? null,
        $data['client_reference_id'] ?? null,
        $data['basket_id'] ?? null,
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
 * Mark the order paid in Supabase via the REST API (service role — bypasses RLS).
 */
function mark_order_paid_in_supabase(string $orderId, string $supabaseUrl, string $serviceRoleKey): bool
{
    if (str_starts_with($serviceRoleKey, 'YOUR_') || $serviceRoleKey === '') {
        return false;
    }

    $ch = curl_init($supabaseUrl . '/rest/v1/orders?order_number=eq.' . urlencode($orderId));
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => 'PATCH',
        CURLOPT_POSTFIELDS    => json_encode([
            'payment_status' => 'paid',
            'order_status'   => 'Processing',
        ]),
        CURLOPT_HTTPHEADER => [
            'apikey: ' . $serviceRoleKey,
            'Authorization: Bearer ' . $serviceRoleKey,
            'Content-Type: application/json',
            'Prefer: return=minimal',
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
    ]);

    $body = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    // 204 = matched and updated. 404 = no matching row (maybe table missing),
    // still treated as success so the gateway stops retrying.
    if ($code === 204) {
        return true;
    }
    error_log("Supabase order update returned HTTP {$code}: " . ($body === false ? 'curl error' : substr((string) $body, 0, 300)));
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

$signature = $_SERVER['HTTP_X_RG_SIGNATURE'] ?? null;
if (!verify_signature($rawBody, $signature)) {
    send_json(401, ['error' => 'Invalid signature.']);
}

$event = json_decode($rawBody, true);
if (!is_array($event)) {
    send_json(400, ['error' => 'Invalid JSON payload.']);
}

$type = $event['type'] ?? '';
$data = is_array($event['data'] ?? null) ? $event['data'] : [];

// Only payment.succeeded flips an order to paid. Other events are retried by
// the gateway, and we acknowledge them so retries stop.
if ($type === 'payment.succeeded') {
    $orderId = extract_order_id($event, $data);
    if ($orderId !== null) {
        mark_order_paid_in_supabase($orderId, $SUPABASE_URL, $SUPABASE_SERVICE_ROLE_KEY);
    }
}

send_json(200, ['ok' => true]);