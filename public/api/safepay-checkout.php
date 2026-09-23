<?php
/**
 * POST /api/safepay-checkout.php
 *
 * Creates a SafePay payment session + auth token for a card order and returns
 * the hosted checkout URL the browser should redirect to.
 *
 * Request body (JSON):
 *   {
 *     "orderId": "STORIUM-...",
 *     "total": 4500.0,          // total in PKR
 *     "customerEmail": "a@b.c",
 *     "customerPhone": "+923xx"
 *   }
 *
 * Response (JSON):
 *   { "orderId": "...", "tracker": "track_...", "redirectUrl": "https://..." }
 */

require_once __DIR__ . '/safepay-lib.php';

if (($method = $_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    safepay_json_response(array('error' => 'Method not allowed'), 405);
}

$input = safepay_read_json_body();
$orderId = trim((string) ($input['orderId'] ?? ''));
$total = (float) ($input['total'] ?? 0);
$customerEmail = trim((string) ($input['customerEmail'] ?? ''));
$customerPhone = trim((string) ($input['customerPhone'] ?? ''));

if ($orderId === '' || $total <= 0) {
    safepay_json_response(array('error' => 'orderId and a positive total are required'), 422);
}

$config = safepay_config();
if ($config['api_key'] === '' || $config['secret_key'] === '') {
    safepay_json_response(array('error' => 'SafePay gateway is not configured'), 503);
}

$env = $config['environment'];
$host = safepay_api_host($env);

// SafePay amounts are in the lowest denomination (paisa for PKR): Rs 4500 => 450000.
$amount = (int) round($total * 100);

// Step 1: create the payment session (tracker).
$session = safepay_http_request(
    'POST',
    $host . '/order/payments/v3/',
    array(
        'merchant_api_key' => $config['api_key'],
        'intent' => 'CYBERSOURCE',
        'mode' => 'payment',
        'entry_mode' => 'raw',
        'currency' => 'PKR',
        'amount' => $amount,
        'metadata' => array('order_id' => $orderId),
    ),
    $config['secret_key']
);

$tracker = $session['json']['data']['tracker']['token'] ?? '';
if ($session['status'] < 200 || $session['status'] >= 300 || $tracker === '') {
    safepay_json_response(array(
        'error' => 'Failed to create SafePay payment session',
        'detail' => $session['json'] ?? $session['body'] ?? $session['error'],
    ), 502);
}

// Step 2: create the auth token used to authenticate the hosted checkout page.
$tokenResult = safepay_http_request(
    'POST',
    $host . '/client/passport/v1/token',
    array(),
    $config['secret_key']
);

$token = '';
if (isset($tokenResult['json']['data']) && is_string($tokenResult['json']['data'])) {
    $token = $tokenResult['json']['data'];
} elseif (isset($tokenResult['json']['data']['token']) && is_string($tokenResult['json']['data']['token'])) {
    $token = $tokenResult['json']['data']['token'];
}
if ($token === '') {
    safepay_json_response(array(
        'error' => 'Failed to create SafePay auth token',
        'detail' => $tokenResult['json'] ?? $tokenResult['body'] ?? $tokenResult['error'],
    ), 502);
}

// Step 3: build the hosted checkout URL. SafePay appends "tracker=" to the
// redirect_url when sending the shopper back.
$baseUrl = rtrim($config['base_url'] ?: guess_safepay_base_url(), '/');
$successUrl = $baseUrl . '/payment/success?order=' . urlencode($orderId);
$cancelUrl = $baseUrl . '/payment/failure?order=' . urlencode($orderId);

$checkoutUrl = safepay_checkout_origin($env) . '/embedded/';
$checkoutUrl .= '?environment=' . urlencode($env);
$checkoutUrl .= '&tbt=' . urlencode($token);
$checkoutUrl .= '&tracker=' . urlencode($tracker);
$checkoutUrl .= '&source=hosted';
$checkoutUrl .= '&redirect_url=' . urlencode($successUrl);
$checkoutUrl .= '&cancel_url=' . urlencode($cancelUrl);

safepay_json_response(array(
    'orderId' => $orderId,
    'tracker' => $tracker,
    'redirectUrl' => $checkoutUrl,
    'environment' => $env,
));

function guess_safepay_base_url(): string {
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    return $scheme . '://' . $host;
}