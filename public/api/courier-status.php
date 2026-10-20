<?php
/**
 * RUN Couriers Live Gateway Status Check
 * Endpoint: GET /api/courier-status.php
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/courier-lib.php';

$config = courier_config();
$apiUrl = rtrim($config['base_api_url'], '/');

// Ping the RUN Couriers API GetCitiesList endpoint to test live connectivity
$citiesUrl = $apiUrl . '/GetCitiesList.php';
$startTime = microtime(true);

$ch = curl_init($citiesUrl);
curl_setopt_array($ch, array(
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 8,
    CURLOPT_CONNECTTIMEOUT => 4,
    CURLOPT_SSL_VERIFYPEER => true,
));

$res = curl_exec($ch);
$httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr = curl_error($ch);
$latencyMs = round((microtime(true) - $startTime) * 1000);
curl_close($ch);

$connected = false;
$cityCount = 0;
$portalStatus = 'UNREACHABLE';
$message = '';

if ($res !== false && $httpCode >= 200 && $httpCode < 400) {
    $json = json_decode((string) $res, true);
    if (is_array($json) && !empty($json['data'])) {
        $connected = true;
        $portalStatus = 'ONLINE';
        $cityCount = count($json['data']);
        $message = "RUN Couriers API is active and online ({$cityCount} delivery hubs reachable).";
    } else {
        $connected = true;
        $portalStatus = 'ONLINE';
        $message = 'RUN Couriers API responded successfully.';
    }
} else {
    $portalStatus = 'OFFLINE';
    $message = 'Could not establish connection to portal.runcourier.com. Error: ' . ($curlErr ?: "HTTP {$httpCode}");
}

// Mask auth key for safe display (e.g. cf78••••••••••••••••••••••••••••4e)
$rawAuth = (string) $config['auth_key'];
$maskedAuth = strlen($rawAuth) > 8
    ? substr($rawAuth, 0, 4) . str_repeat('•', max(0, strlen($rawAuth) - 6)) . substr($rawAuth, -2)
    : 'Configured';

courier_json_response(array(
    'success'             => $connected,
    'connected'           => $connected,
    'portal_status'       => $portalStatus,
    'client_code'         => $config['client_code'],
    'auth_key_configured' => !empty($config['auth_key']),
    'auth_key_masked'     => $maskedAuth,
    'origin'              => $config['origin'],
    'service_type'        => $config['service_type'],
    'api_url'             => $apiUrl,
    'latency_ms'          => $latencyMs,
    'city_count'          => $cityCount,
    'message'             => $message,
    'tested_at'           => date('Y-m-d H:i:s'),
));
