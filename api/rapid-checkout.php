<?php
/**
 * POST /api/rapid-checkout.php
 *
 * Initiates a Rapid Gateway payment session.
 * Obtains an OAuth2 bearer token and submits the transaction, returning
 * the secure checkout redirect URL where the customer completes card payment.
 *
 * Request JSON:
 *   {
 *     "orderId": "STORIUM-20261018-XXXX",
 *     "total": 12500,
 *     "customerName": "John Doe",
 *     "customerEmail": "customer@example.com",
 *     "customerPhone": "03001234567"
 *   }
 *
 * Response JSON:
 *   {
 *     "success": true,
 *     "orderId": "STORIUM-...",
 *     "redirectUrl": "https://secure.rapid-gateway.com/..."
 *   }
 */

require_once __DIR__ . '/rapid-lib.php';

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method !== 'POST') {
    rapid_json_response(array('success' => false, 'error' => 'Method not allowed. Expected POST.'), 405);
}

$input = rapid_read_json_body();
if (empty($input)) {
    // Also accept standard form POST for flexibility
    $input = $_POST;
}

$orderId       = trim((string) ($input['orderId'] ?? $input['order_id'] ?? $input['basket_id'] ?? ''));
$total         = (float) ($input['total'] ?? $input['amount'] ?? 0);
$customerName  = trim((string) ($input['customerName'] ?? $input['customer_name'] ?? 'STORIUM Client'));
$customerEmail = trim((string) ($input['customerEmail'] ?? $input['customer_email'] ?? 'orders@storium.online'));
$customerPhone = trim((string) ($input['customerPhone'] ?? $input['customer_phone'] ?? '03001234567'));

if ($orderId === '') {
    rapid_json_response(array('success' => false, 'error' => 'Missing required parameter: orderId'), 422);
}

if ($total <= 0) {
    rapid_json_response(array('success' => false, 'error' => 'Total amount must be greater than 0 PKR'), 422);
}

$config = rapid_config();
if (empty($config['merchant_id']) || empty($config['client_secret']) || $config['merchant_id'] === 'YOUR_MERCHANT_ID') {
    rapid_json_response(array(
        'success' => false,
        'error'   => 'Rapid Gateway is not configured. Please add RAPID_MERCHANT_ID and RAPID_CLIENT_SECRET to public/api/rapid-config.php or your server environment.',
    ), 503);
}

$merchantId   = (string) $config['merchant_id'];
$clientSecret = (string) $config['client_secret'];
$storeName    = (string) ($config['store_name'] ?: 'STORIUM');
$tokenUrl     = (string) ($config['token_url'] ?: 'https://secure.rapid-gateway.com/oauth2/token');
$processUrl   = (string) ($config['process_url'] ?: 'https://secure.rapid-gateway.com/rapid/process-transaction');

// ── Step 1: Get Bearer token ──────────────────────────────────────
$tokenResult = rapid_get_token($merchantId, $clientSecret, $tokenUrl);
if (!$tokenResult['success']) {
    rapid_json_response(array(
        'success' => false,
        'error'   => 'Failed to authenticate with Rapid Gateway: ' . $tokenResult['error'],
        'detail'  => $tokenResult['detail'] ?? null,
    ), 502);
}
$token = $tokenResult['token'];

// Prepare transaction payload
$baseUrl     = rtrim($config['base_url'] ?: guess_rapid_base_url(), '/');
$callbackUrl = $baseUrl . '/api/rapid-callback.php';

$successUrl  = $callbackUrl . '?status=success&order=' . urlencode($orderId);
$failureUrl  = $callbackUrl . '?status=failure&order=' . urlencode($orderId);
$checkoutUrl = $callbackUrl . '?status=complete&order=' . urlencode($orderId);

$phoneFormatted = rapid_format_pakistan_phone($customerPhone);
$amountFormatted = number_format($total, 2, '.', '');

$txPayload = array(
    'MERCHANT_ID'            => $merchantId,
    'MERCHANT_NAME'          => $storeName,
    'TXNAMT'                 => $amountFormatted,
    'CURRENCY_CODE'          => (string) ($config['currency_code'] ?: 'PKR'),
    'CUSTOMER_MOBILE_NO'     => $phoneFormatted,
    'CUSTOMER_EMAIL_ADDRESS' => $customerEmail ?: 'orders@storium.online',
    'BASKET_ID'              => $orderId,
    'TXNDESC'                => 'Order payment: ' . $orderId,
    'ORDER_DATE'             => date('Y-m-d'),
    'SUCCESS_URL'            => $successUrl,
    'FAILURE_URL'            => $failureUrl,
    'CHECKOUT_URL'           => $checkoutUrl,
    'VERSION'                => (string) ($config['version'] ?: 'MY_VER_1.0'),
    'PROCCODE'               => (string) ($config['proc_code'] ?: '0'),
);

// ── Step 2: Submit transaction ────────────────────────────────────
$txResult = rapid_process_transaction($token, $txPayload, $processUrl);
if (!$txResult['success']) {
    rapid_json_response(array(
        'success' => false,
        'error'   => 'Rapid Gateway transaction initiation failed: ' . $txResult['error'],
        'detail'  => $txResult['body'] ?? $txResult['json'] ?? null,
    ), 502);
}

$redirectUrl = $txResult['redirectUrl'];

// If client requested direct redirect (e.g. traditional form submit)
if (!empty($_GET['redirect']) || !empty($input['redirect'])) {
    header('Location: ' . $redirectUrl, true, 302);
    exit;
}

// ── Step 3: Return JSON redirect URL to frontend SPA ──────────────
rapid_json_response(array(
    'success'     => true,
    'orderId'     => $orderId,
    'redirectUrl' => $redirectUrl,
));
