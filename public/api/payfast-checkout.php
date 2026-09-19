<?php
// api/payfast-checkout.php — PayFast Pakistan Payment Initiation (Hostinger / PHP).
//
// Authenticates with PayFast OAuth2 endpoint using your Merchant ID & Secured Key:
//   1. Fetch access_token from OAuth2 client_credentials.
//   2. Submit order details to PayFast Sandbox /process-transaction.
//   3. Returns hosted checkout redirectUrl as JSON to the browser.
//
// Credentials (PayFast Sandbox):
//   Merchant ID: 14833
//   Secured Key: rPcy4T7GQkSCFsHBLdn26s
declare(strict_types=1);

function payfast_config(string $key, string $fallback): string
{
    $value = getenv($key);
    if (is_string($value) && $value !== '' && !str_starts_with($value, 'YOUR_')) {
        return $value;
    }
    return $fallback;
}

$PAYFAST_MERCHANT_ID   = payfast_config('PAYFAST_MERCHANT_ID', '14833');
$PAYFAST_SECURED_KEY   = payfast_config('PAYFAST_SECURED_KEY', 'rPcy4T7GQkSCFsHBLdn26s');
$PAYFAST_MERCHANT_NAME = payfast_config('PAYFAST_MERCHANT_NAME', 'STORIUM');
$BASE_URL              = payfast_config('BASE_URL', 'https://storium.online');
$SUPABASE_URL          = rtrim(payfast_config('SUPABASE_URL', 'https://jvghdtlfwijbkhwwpdft.supabase.co'), '/');
$SUPABASE_SERVICE_ROLE_KEY = payfast_config('SUPABASE_SERVICE_ROLE_KEY', '');

const PAYFAST_TOKEN_URL  = 'https://secure.rapid-gateway.com/oauth2/token';
const PAYFAST_TXN_URL    = 'https://secure.rapid-gateway.com/sandbox/process-transaction';
const PAYFAST_VERSION    = 'MY_VER_1.0';

function send_json(int $status, array $body): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($body);
    exit;
}

function normalize_phone_pk(string $phone): string
{
    $digits = preg_replace('/\D+/', '', $phone) ?? '';
    if ($digits === '') return '';
    if (strlen($digits) === 10 && str_starts_with($digits, '3')) {
        $digits = '92' . $digits;
    } elseif (strlen($digits) === 11 && str_starts_with($digits, '03')) {
        $digits = '92' . substr($digits, 1);
    } elseif (strlen($digits) === 13 && str_starts_with($digits, '920')) {
        $digits = '92' . substr($digits, 3);
    }
    return '+' . $digits;
}

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
            $name = strtolower(trim(substr($line, 0, $colon)));
            $parsedHeaders[$name] = trim(substr($line, $colon + 1));
        }
    }

    if ($redirectUrl === '' && isset($parsedHeaders['location']) && $parsedHeaders['location'] !== '') {
        $redirectUrl = $parsedHeaders['location'];
    }

    return ['status' => $httpCode, 'headers' => $parsedHeaders, 'body' => $rawBody, 'redirect_url' => $redirectUrl];
}

// ── Request Handling ─────────────────────────────────────────────────
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

// ── Step 1: OAuth2 Token ─────────────────────────────────────────────
$creds     = base64_encode($PAYFAST_MERCHANT_ID . ':' . $PAYFAST_SECURED_KEY);
$tokenResp = http_post_form(
    PAYFAST_TOKEN_URL,
    ['Authorization: Basic ' . $creds, 'Content-Type: application/x-www-form-urlencoded'],
    ['grant_type' => 'client_credentials']
);

if (isset($tokenResp['error']) || $tokenResp['status'] >= 400) {
    send_json(502, ['error' => 'Could not reach PayFast payment gateway.']);
}

$tokenData   = json_decode($tokenResp['body'], true);
$accessToken = is_array($tokenData) && isset($tokenData['access_token']) && is_string($tokenData['access_token'])
    ? $tokenData['access_token']
    : '';

if ($accessToken === '') {
    send_json(502, ['error' => 'Could not authenticate with PayFast payment gateway.']);
}

// ── Step 2: Submit Transaction ───────────────────────────────────────
$txnResp = http_post_form(
    PAYFAST_TXN_URL,
    ['Authorization: Bearer ' . $accessToken, 'Content-Type: application/x-www-form-urlencoded'],
    [
        'MERCHANT_ID'            => $PAYFAST_MERCHANT_ID,
        'MERCHANT_NAME'          => $PAYFAST_MERCHANT_NAME,
        'TXNAMT'                 => '1000', // Test transaction amount
        'CURRENCY_CODE'          => 'PKR',
        'CUSTOMER_MOBILE_NO'     => $phone,
        'CUSTOMER_EMAIL_ADDRESS' => $email,
        'BASKET_ID'              => $orderId,
        'TXNDESC'                => $PAYFAST_MERCHANT_NAME . ' order ' . $orderId,
        'ORDER_DATE'             => date('Y-m-d'),
        'SUCCESS_URL'            => rtrim($BASE_URL, '/') . '/payment/success?order=' . urlencode($orderId),
        'FAILURE_URL'            => rtrim($BASE_URL, '/') . '/payment/failure?order=' . urlencode($orderId),
        'CHECKOUT_URL'           => rtrim($BASE_URL, '/') . '/payment/complete?order=' . urlencode($orderId),
        'VERSION'                => PAYFAST_VERSION,
        'PROCCODE'               => '0',
    ]
);

if (isset($txnResp['error'])) {
    send_json(502, ['error' => 'PayFast payment gateway unreachable.']);
}

$redirect = $txnResp['redirect_url'];
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

send_json(500, ['error' => 'PayFast gateway did not return a payment redirect URL.']);
