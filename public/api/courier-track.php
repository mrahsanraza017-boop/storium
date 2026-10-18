<?php
/**
 * Track Order with RUN Couriers
 * Endpoint: GET or POST /api/courier-track.php?tracking_no=...
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/courier-lib.php';

$trackingNo = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $body = json_decode((string) $rawInput, true);
    if (is_array($body)) {
        $trackingNo = trim((string) ($body['tracking_no'] ?? $body['trackingNo'] ?? ''));
    }
}

if ($trackingNo === '') {
    $trackingNo = trim((string) ($_GET['tracking_no'] ?? $_GET['trackingNo'] ?? ''));
}

if ($trackingNo === '') {
    courier_json_response(array('success' => false, 'error' => 'tracking_no is required'), 400);
}

$trackRes = courier_track_order($trackingNo);
courier_json_response($trackRes);
