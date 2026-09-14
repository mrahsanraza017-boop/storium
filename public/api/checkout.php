<?php
// api/checkout.php — Payment-initiation endpoint for Hostinger (PHP).
//
// Implements the Rapid Gateway server-to-server integration exactly as
// documented in the merchant sandbox kit:
//   1. Fetch a bearer token (OAuth2 client_credentials).
//   2. Submit the transaction to /sandbox/process-transaction.
//   3. The gateway answers with a 302 Location: the hosted checkout URL.
//      We do NOT follow it — we hand it back to the browser as JSON.
//
// The customer enters card details on the gateway's secure page; they never
// reach this server or the browser bundle. On completion the gateway returns
// the customer to one of the URLs set below:
//   SUCCESS_URL  -> /payment/success
//   FAILURE_URL  -> /payment/failure
//   CHECKOUT_URL -> /payment/complete
//
// Client calls: fetch('/api/checkout.php', { method: 'POST', jsonBody })
// Returns:      { redirectUrl, orderId } | { error }
declare(strict_types=1);

// ── Configuration ─────────────────────────────────────────────────────
// Read from environment variables. On Hostinger set them in hPanel:
//   Advanced → PHP Settings → Environment variables
// or with `SetEnv` in a server-level .htaccess outside this repo.
// No VITE_ prefix — these must never reach the client bundle.
function rg_config(string $key, string $fallback): string
{
    $value = getenv($key);
    return is_string($value) && $value !== '' ? $value : $fallback;
}

$RG_MERCHANT_ID   = rg_config('RG_MERCHANT_ID', 'YOUR_RG_MERCHANT_ID');
$RG_CLIENT_SECRET = rg_config('RG_CLIENT_SECRET', 'YOUR_RG_CLIENT_SECRET');
$RG_MERCHANT_NAME = rg_config('RG_MERCHANT_NAME', 'STORIUM');
$BASE_URL         = rg_config('BASE_URL', 'https://storium.online');
$SUPABASE_URL     = rtrim(rg_config('SUPABASE_URL', 'https://jvghdtlfwijbkhwwpdft.supabase.co'), '/');
$SUPABASE_SERVICE_ROLE_KEY = rg_config('SUPABASE_SERVICE_ROLE_KEY', 'YOUR_SUPABASE_SERVICE_ROLE_KEY');

const RG_TOKEN_URL  = 'https://secure.rapid-gateway.com/oauth2/token';
const RG_TXN_URL    = 'https://secure.rapid-gateway.com/sandbox/process-transaction';
const RG_VERSION    = 'MY_VER_1.0';

function send_json(int $status, array $body): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($body);
    exit;
}

/**
 * Normalize a Pakistani phone number to E.164 (+92...) for the gateway.
 * Accepted forms: 03001234567, 92 300 1234567, +92 300 1234567.
 */
function normalize_phone_pk(string $phone): string
{
    $digits = preg_replace('/\D+/', '', $phone) ?? '';
    if ($digits === '') {
        return '';
    }
    if (strlen($digits) === 10 && str_starts_with($digits, '3')) {
        $digits = '92' . $digits;
    } elseif (strlen($digits) === 11 && str_starts_with($digits, '03')) {
        $digits = '92' . substr($digits, 1);
    } elseif (strlen($digits) === 13 && str_starts_with($digits, '920')) {
        $digits = '92' . substr($digits, 3);
    }
    return '+' . $digits;
}

/**
 * Run a form-urlencoded POST. Does NOT follow redirects — the 3xx Location
 * header (the hosted checkout) is what the caller needs.
 */
function http_post_form(string $url, array $headers, array $fields): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => http_build_query($fields),
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
    ]);

    $response = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    if ($response === false) {
        $error = curl_error($ch);
        curl_close($ch);
        return ['status' => 0, 'headers' => [], 'body' => '', 'redirect_url' => '', 'error' => $error];
    }

    $redirectUrl = (string) curl_getinfo($ch, CURLINFO_REDIRECT_URL);
    $headerSize  = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    curl_close($ch);

    $headerBlock = substr($response, 0, $headerSize);
    $rawBody     = (string) substr($response, $headerSize);

    $parsedHeaders = [];
    foreach (preg_split('/\r?\n/', $headerBlock) ?: [] as $line) {
        $line  = trim($line);
        $colon = strpos($line, ':');
        if ($colon !== false) {
            $name                                  = strtolower(trim(substr($line, 0, $colon)));
            $parsedHeaders[$name] = trim(substr($line, $colon + 1));
        }
    }

    // Fallback in case CURLINFO_REDIRECT_URL is empty but a Location header exists.
    if ($redirectUrl === '' && isset($parsedHeaders['location']) && $parsedHeaders['location'] !== '') {
        $redirectUrl = $parsedHeaders['location'];
    }

    return ['status' => $httpCode, 'headers' => $parsedHeaders, 'body' => $rawBody, 'redirect_url' => $redirectUrl];
}

/**
 * Fetch order from Supabase to verify the amount server-side.
 * Returns the trusted order total, or null if the order is not found / cannot be verified.
 */
function fetch_order_from_supabase(string $orderNumber): ?array
{
    global $SUPABASE_URL, $SUPABASE_SERVICE_ROLE_KEY;
    if (str_starts_with($SUPABASE_SERVICE_ROLE_KEY, 'YOUR_') || $SUPABASE_SERVICE_ROLE_KEY === '') {
        return null;
    }
    $url = $SUPABASE_URL . '/rest/v1/orders?order_number=eq.' . urlencode($orderNumber) . '&select=total,payment_status,order_number';
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

// ── Request handling ──────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(405, ['error' => 'Method not allowed. Use POST.']);
}

$rawInput = file_get_contents('php://input');
$input    = json_decode($rawInput === false ? '' : $rawInput, true);
if (!is_array($input)) {
    send_json(400, ['error' => 'Invalid JSON body.']);
}

$phone   = isset($input['phone']) ? normalize_phone_pk((string) $input['phone']) : '';
$email   = isset($input['email']) ? trim((string) $input['email']) : '';
$orderId = isset($input['orderId']) ? trim((string) $input['orderId']) : '';

if ($phone === '') {
    send_json(400, ['error' => 'A valid Pakistani phone number is required.']);
}
if ($email === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
    send_json(400, ['error' => 'A valid email is required.']);
}
if ($orderId === '' || !preg_match('/^STM-PK-\d{5}$/', $orderId)) {
    send_json(400, ['error' => 'Invalid order reference format.']);
}

if (str_starts_with($RG_MERCHANT_ID, 'YOUR_') || $RG_CLIENT_SECRET === '' || str_starts_with($RG_CLIENT_SECRET, 'YOUR_')) {
    send_json(503, ['error' => 'Rapid Gateway is not configured yet.']);
}

// ── Step 0: verify order from Supabase (never trust browser-supplied amount) ──
$orderRow = fetch_order_from_supabase($orderId);
if ($orderRow === null) {
    send_json(400, ['error' => 'Order not found.']);
}
$trustedAmount = (float) ($orderRow['total'] ?? 0);
if ($trustedAmount <= 0) {
    send_json(400, ['error' => 'Invalid order total.']);
}
// Prevent duplicate payment attempts on already-paid orders
if (($orderRow['payment_status'] ?? '') === 'paid') {
    send_json(400, ['error' => 'This order has already been paid.']);
}

// ── Step 1: fetch bearer token ───────────────────────────────────────
$creds     = base64_encode($RG_MERCHANT_ID . ':' . $RG_CLIENT_SECRET);
$tokenResp = http_post_form(
    RG_TOKEN_URL,
    ['Authorization: Basic ' . $creds, 'Content-Type: application/x-www-form-urlencoded'],
    ['grant_type' => 'client_credentials']
);

if (isset($tokenResp['error']) || $tokenResp['status'] >= 400) {
    send_json(502, ['error' => 'Could not reach the payment gateway.']);
}

$tokenData = json_decode($tokenResp['body'], true);
$accessToken = is_array($tokenData) && isset($tokenData['access_token']) && is_string($tokenData['access_token'])
    ? $tokenData['access_token']
    : '';

if ($accessToken === '') {
    send_json(502, ['error' => 'Could not authenticate with the payment gateway.']);
}

// ── Step 2: submit the transaction ───────────────────────────────────
$txnResp = http_post_form(
    RG_TXN_URL,
    ['Authorization: Bearer ' . $accessToken, 'Content-Type: application/x-www-form-urlencoded'],
    [
        'MERCHANT_ID'            => $RG_MERCHANT_ID,
        'MERCHANT_NAME'          => $RG_MERCHANT_NAME,
        'TXNAMT'                 => (string) (int) round($trustedAmount), // PKR whole rupees, verified from Supabase
        'CURRENCY_CODE'          => 'PKR',
        'CUSTOMER_MOBILE_NO'     => $phone,
        'CUSTOMER_EMAIL_ADDRESS' => $email,
        'BASKET_ID'              => $orderId,
        'TXNDESC'                => $RG_MERCHANT_NAME . ' order ' . $orderId,
        'ORDER_DATE'             => date('Y-m-d'),
        'SUCCESS_URL'            => rtrim($BASE_URL, '/') . '/payment/success?order=' . urlencode($orderId),
        'FAILURE_URL'            => rtrim($BASE_URL, '/') . '/payment/failure?order=' . urlencode($orderId),
        'CHECKOUT_URL'           => rtrim($BASE_URL, '/') . '/payment/complete?order=' . urlencode($orderId),
        'VERSION'                => RG_VERSION,
        'PROCCODE'               => '0',
    ]
);

if (isset($txnResp['error'])) {
    send_json(502, ['error' => 'Payment gateway is unreachable. Please try again.']);
}

$redirect = $txnResp['redirect_url'];

// Some gateway builds echo the checkout URL in the response body instead.
if ($redirect === '') {
    $payJson = json_decode($txnResp['body'], true);
    if (is_array($payJson)) {
        foreach (['redirect_url', 'url', 'payment_url', 'checkout_url'] as $key) {
            if (isset($payJson[$key]) && is_string($payJson[$key]) && $payJson[$key] !== '') {
                $redirect = $payJson[$key];
                break;
            }
        }
    }
}

if ($redirect !== '') {
    send_json(200, ['redirectUrl' => $redirect, 'orderId' => $orderId]);
}

$gatewayMessage = isset($payJson['message']) && is_string($payJson['message'])
    ? $payJson['message']
    : null;

send_json(500, [
    'error'          => 'Payment gateway did not return a checkout URL.',
    'gatewayMessage' => $gatewayMessage,
]);