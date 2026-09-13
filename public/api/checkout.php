<?php
// api/checkout.php — Payment-initiation endpoint for Hostinger (PHP).
// Equivalent of the old Vercel serverless function: fetches a bearer token,
// submits the transaction to Rapid Gateway, and returns the hosted-checkout
// redirect URL as JSON. Card details are entered on the gateway's secure
// page; they never reach this server or the browser bundle.
//
// The client calls this via: fetch('/api/checkout.php', { method: 'POST', ... })
declare(strict_types=1);

// ── Configuration ─────────────────────────────────────────────────────
// The script reads RG_MERCHANT_ID / RG_CLIENT_SECRET from environment
// variables. On Hostinger you can set them per-domain in hPanel:
//   Advanced → PHP Settings → Environment variables
// or with `SetEnv` in a server-level .htaccess outside this repo.
// If no env var is found, edit the fallback constants below (they stay
// server-side and are never echoed back to the client).
function rg_config(string $key, string $fallback): string
{
    $value = getenv($key);
    return is_string($value) && $value !== '' ? $value : $fallback;
}

$RG_MERCHANT_ID   = rg_config('RG_MERCHANT_ID', 'YOUR_RG_MERCHANT_ID');
$RG_CLIENT_SECRET = rg_config('RG_CLIENT_SECRET', 'YOUR_RG_CLIENT_SECRET');
$RG_MERCHANT_NAME = rg_config('RG_MERCHANT_NAME', 'STORIUM');
$BASE_URL         = rg_config('BASE_URL', 'https://storium.pk');

function send_json(int $status, array $body): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($body);
    exit;
}

/**
 * Run a form-urlencoded POST and return the parsed headers plus body.
 * FollowLocation is disabled so the 3xx Location header can be read for
 * the hosted-checkout redirect.
 */
function http_post_form(string $url, array $headers, array $fields): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => http_build_query($fields),
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER         => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
    ]);

    $response = curl_exec($ch);
    if ($response === false) {
        $error = curl_error($ch);
        curl_close($ch);
        return ['error' => $error];
    }

    $headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
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

    return ['headers' => $parsedHeaders, 'body' => $rawBody];
}

// ── Request handling ──────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(405, ['error' => 'Method not allowed. Use POST.']);
}

$rawInput  = file_get_contents('php://input');
$input     = json_decode($rawInput === false ? '' : $rawInput, true);
if (!is_array($input)) {
    send_json(400, ['error' => 'Invalid JSON body.']);
}

$amount  = isset($input['amount']) ? (float) $input['amount'] : 0.0;
$phone   = isset($input['phone']) ? trim((string) $input['phone']) : '';
$email   = isset($input['email']) ? trim((string) $input['email']) : '';
$orderId = isset($input['orderId']) ? trim((string) $input['orderId']) : '';

if (!is_numeric($amount) || $amount <= 0) {
    send_json(400, ['error' => 'A valid positive amount is required.']);
}
if ($phone === '') {
    send_json(400, ['error' => 'Phone number is required.']);
}
if ($email === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
    send_json(400, ['error' => 'A valid email is required.']);
}
if ($orderId === '') {
    send_json(400, ['error' => 'Order reference is required.']);
}

// ── Step 1: fetch bearer token ───────────────────────────────────────
$creds     = base64_encode($RG_MERCHANT_ID . ':' . $RG_CLIENT_SECRET);
$tokenResp = http_post_form(
    'https://secure.rapid-gateway.com/oauth2/token',
    ['Authorization: Basic ' . $creds, 'Content-Type: application/x-www-form-urlencoded'],
    ['grant_type' => 'client_credentials']
);

if (isset($tokenResp['error'])) {
    send_json(502, ['error' => 'Could not reach the payment gateway.']);
}

$tokenData   = json_decode($tokenResp['body'], true);
$accessToken = is_array($tokenData) && isset($tokenData['access_token'])
    ? (string) $tokenData['access_token']
    : '';

if ($accessToken === '') {
    send_json(502, ['error' => 'Could not authenticate with the payment gateway.']);
}

// ── Step 2: submit the transaction ───────────────────────────────────
$txnResp = http_post_form(
    'https://secure.rapid-gateway.com/rapid/process-transaction',
    ['Authorization: Bearer ' . $accessToken, 'Content-Type: application/x-www-form-urlencoded'],
    [
        'MERCHANT_ID'            => $RG_MERCHANT_ID,
        'MERCHANT_NAME'          => $RG_MERCHANT_NAME,
        'TXNAMT'                 => (string) round($amount),
        'CURRENCY_CODE'          => 'PKR',
        'CUSTOMER_MOBILE_NO'     => $phone,
        'CUSTOMER_EMAIL_ADDRESS' => $email,
        'BASKET_ID'              => $orderId,
        'SUCCESS_URL'            => rtrim($BASE_URL, '/') . '/payment/success',
        'FAILURE_URL'            => rtrim($BASE_URL, '/') . '/payment/failure',
        'CHECKOUT_URL'           => rtrim($BASE_URL, '/') . '/payment/complete',
        'VERSION'                => 'MY_VER_1.0',
        'PROCCODE'               => '0',
    ]
);

if (isset($txnResp['error'])) {
    send_json(502, ['error' => 'Payment gateway is unreachable. Please try again.']);
}

$redirect = $txnResp['headers']['location'] ?? '';

// Some gateway builds echo the checkout URL in the response body instead.
if ($redirect === '') {
    $payJson = json_decode($txnResp['body'], true);
    if (is_array($payJson)) {
        foreach (['redirect_url', 'url', 'payment_url'] as $key) {
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