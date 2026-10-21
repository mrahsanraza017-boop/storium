<?php
/**
 * STORIUM Pakistan — Verify Email OTP Endpoint
 * Validates the 6-digit code against HMAC signature and 10-minute expiry window.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(array('verified' => false, 'error' => 'Method not allowed. Use POST.'));
    exit;
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(array('verified' => false, 'error' => 'Invalid JSON input.'));
    exit;
}

$email     = strtolower(trim((string)($data['email'] ?? '')));
$otp       = trim((string)($data['otp'] ?? ''));
$token     = trim((string)($data['token'] ?? ''));
$expiresAt = (int)($data['expiresAt'] ?? 0);

if (empty($email) || empty($otp) || empty($token) || empty($expiresAt)) {
    http_response_code(400);
    echo json_encode(array('verified' => false, 'error' => 'Email, OTP, token, and expiry are required.'));
    exit;
}

// 1. Check expiration
if (time() > $expiresAt) {
    http_response_code(400);
    echo json_encode(array(
        'verified' => false,
        'error'    => 'Verification code has expired. Please request a new code.',
        'expired'  => true,
    ));
    exit;
}

// 2. Load HMAC Secret
$configFile = __DIR__ . '/email-config.php';
$config = is_file($configFile) ? require $configFile : array();
$hmacSecret = $config['hmac_secret'] ?? 'storium_email_otp_secret_key_849201948';

// 3. Verify HMAC signature
$expectedToken = hash_hmac('sha256', "{$email}:{$otp}:{$expiresAt}", $hmacSecret);

if (hash_equals($expectedToken, $token)) {
    echo json_encode(array(
        'verified' => true,
        'message'  => 'Email verified successfully.',
        'email'    => $email,
    ));
} else {
    http_response_code(400);
    echo json_encode(array(
        'verified' => false,
        'error'    => 'Incorrect verification code. Please check your email inbox and spam folder.',
    ));
}
