<?php
/**
 * STORIUM Pakistan — Verify WhatsApp Mobile OTP Endpoint
 * Validates the 6-digit OTP code against the stateless HMAC token.
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array('success' => false, 'verified' => false, 'error' => 'Method not allowed. Use POST.'));
    exit;
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!is_array($data) || empty($data['phone']) || empty($data['otp']) || empty($data['token']) || empty($data['expiresAt'])) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'verified' => false, 'error' => 'Missing verification parameters.'));
    exit;
}

// Load WhatsApp config for secret
$configFile = __DIR__ . '/whatsapp-config.php';
$config = file_exists($configFile) ? require $configFile : array();
$hmacSecret = isset($config['hmac_secret']) ? $config['hmac_secret'] : 'storium_whatsapp_otp_secret_key_99238472';

// Normalize Pakistani Phone Number
$rawPhone = preg_replace('/\D/', '', (string)$data['phone']);
if (strpos($rawPhone, '92') === 0) {
    $normalizedPhone = $rawPhone;
} elseif (strpos($rawPhone, '03') === 0) {
    $normalizedPhone = '92' . substr($rawPhone, 1);
} elseif (strlen($rawPhone) === 10 && strpos($rawPhone, '3') === 0) {
    $normalizedPhone = '92' . $rawPhone;
} else {
    $normalizedPhone = $rawPhone;
}

$otp = trim((string)$data['otp']);
$expiresAt = (int)$data['expiresAt'];
$token = trim((string)$data['token']);

// Check expiry
if (time() > $expiresAt) {
    http_response_code(400);
    echo json_encode(array(
        'success'  => false,
        'verified' => false,
        'error'    => 'Verification code has expired. Please request a new code.',
    ));
    exit;
}

// Recalculate HMAC signature
$expectedToken = hash_hmac('sha256', "{$normalizedPhone}:{$otp}:{$expiresAt}", $hmacSecret);

if (hash_equals($expectedToken, $token)) {
    echo json_encode(array(
        'success'  => true,
        'verified' => true,
        'phone'    => $normalizedPhone,
        'message'  => 'Phone number verified successfully.',
    ));
} else {
    http_response_code(400);
    echo json_encode(array(
        'success'  => false,
        'verified' => false,
        'error'    => 'Incorrect verification code. Please check your WhatsApp and try again.',
    ));
}
