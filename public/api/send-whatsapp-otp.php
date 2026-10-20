<?php
/**
 * STORIUM Pakistan — Send WhatsApp Mobile OTP Endpoint
 * Dispatches 6-digit verification code to customer's mobile number via WhatsApp.
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array('success' => false, 'error' => 'Method not allowed. Use POST.'));
    exit;
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!is_array($data) || empty($data['phone'])) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'error' => 'Valid phone number is required.'));
    exit;
}

// Load WhatsApp config
$configFile = __DIR__ . '/whatsapp-config.php';
$config = file_exists($configFile) ? require $configFile : array();

$provider        = isset($config['provider']) ? $config['provider'] : 'concierge';
$hmacSecret      = isset($config['hmac_secret']) ? $config['hmac_secret'] : 'storium_whatsapp_otp_secret_key_99238472';
$conciergePhone  = isset($config['concierge_phone']) ? $config['concierge_phone'] : '923215993022';
$storeName       = isset($config['store_name']) ? $config['store_name'] : 'STORIUM Pakistan';
$debugMode       = !empty($config['debug_mode']);

// Normalize Pakistani Phone Number to 923XXXXXXXXX
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

// Generate 6-digit OTP code (or accept client fallback)
$otp = !empty($data['clientOtp']) && preg_match('/^\d{6}$/', (string)$data['clientOtp'])
    ? (string)$data['clientOtp']
    : (string)random_int(100000, 999999);

$customerName = !empty($data['customerName']) ? trim(strip_tags((string)$data['customerName'])) : 'Valued Customer';
$expiresAt = time() + (10 * 60); // 10 minutes validity

// Generate tamper-proof cryptographic HMAC signature
$token = hash_hmac('sha256', "{$normalizedPhone}:{$otp}:{$expiresAt}", $hmacSecret);

// Format masked phone for UI
$maskedPhone = '+92 ' . substr($normalizedPhone, 2, 3) . ' •••••' . substr($normalizedPhone, -2);

// Compose WhatsApp Message
$message = "Salam {$customerName}!\n\nYour {$storeName} order verification code is:\n\n*{$otp}*\n\nPlease enter this 6-digit code on the checkout screen to confirm your order dispatch.\n\nHelpline: +92 321 5993022";

$dispatchedViaApi = false;
$apiError = null;

// Provider 1: UltraMsg (https://ultramsg.com)
if ($provider === 'ultramsg' && !empty($config['ultramsg_instance_id']) && !empty($config['ultramsg_token'])) {
    $postData = http_build_query(array(
        'token' => $config['ultramsg_token'],
        'to'    => '+' . $normalizedPhone,
        'body'  => $message,
    ));

    $apiUrl = 'https://api.ultramsg.com/' . rawurlencode($config['ultramsg_instance_id']) . '/messages/chat';
    $ch = curl_init($apiUrl);
    curl_setopt_array($ch, array(
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $postData,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 8,
        CURLOPT_HTTPHEADER     => array('Content-Type: application/x-www-form-urlencoded'),
    ));
    $apiResponse = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 300) {
        $dispatchedViaApi = true;
    }
}

// Provider 2: Green API (https://green-api.com)
if (!$dispatchedViaApi && $provider === 'greenapi' && !empty($config['greenapi_id_instance']) && !empty($config['greenapi_api_token'])) {
    $apiUrl = 'https://api.green-api.com/waInstance' . rawurlencode($config['greenapi_id_instance']) . '/sendMessage/' . rawurlencode($config['greenapi_api_token']);
    $payload = json_encode(array(
        'chatId'  => $normalizedPhone . '@c.us',
        'message' => $message,
    ));

    $ch = curl_init($apiUrl);
    curl_setopt_array($ch, array(
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 8,
        CURLOPT_HTTPHEADER     => array('Content-Type: application/json'),
    ));
    $apiResponse = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 300) {
        $dispatchedViaApi = true;
    }
}

// Provider 3: Meta WhatsApp Cloud API (graph.facebook.com)
if (!$dispatchedViaApi && $provider === 'meta' && !empty($config['meta_phone_number_id']) && !empty($config['meta_access_token'])) {
    $apiUrl = 'https://graph.facebook.com/v18.0/' . rawurlencode($config['meta_phone_number_id']) . '/messages';
    $payload = json_encode(array(
        'messaging_product' => 'whatsapp',
        'to'                => $normalizedPhone,
        'type'              => 'text',
        'text'              => array('body' => $message),
    ));

    $ch = curl_init($apiUrl);
    curl_setopt_array($ch, array(
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 8,
        CURLOPT_HTTPHEADER     => array(
            'Authorization: Bearer ' . $config['meta_access_token'],
            'Content-Type: application/json',
        ),
    ));
    $apiResponse = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 300) {
        $dispatchedViaApi = true;
    }
}

// Customer direct WhatsApp click URL (allows one-tap chat with code or concierge)
$whatsappUrl = 'https://wa.me/' . rawurlencode($normalizedPhone) . '?text=' . rawurlencode($message);
$conciergeChatUrl = 'https://wa.me/' . rawurlencode($conciergePhone) . '?text=' . rawurlencode("Salam Storium, my order verification code is: {$otp} for mobile: +{$normalizedPhone}");

echo json_encode(array(
    'success'           => true,
    'phone'             => $normalizedPhone,
    'maskedPhone'       => $maskedPhone,
    'token'             => $token,
    'expiresAt'         => $expiresAt,
    'dispatchedViaApi'  => $dispatchedViaApi,
    'whatsappUrl'       => $whatsappUrl,
    'conciergeChatUrl'  => $conciergeChatUrl,
    'devOtp'            => $debugMode ? $otp : null,
));
