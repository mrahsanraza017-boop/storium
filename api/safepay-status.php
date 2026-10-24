<?php
/**
 * GET /api/safepay-status.php?tracker=track_xxx
 *
 * Verifies a SafePay payment tracker against the reporter API, server-side,
 * so the returned state does not depend on the browser session.
 *
 * Response (JSON):
 *   { "tracker": "track_xxx", "state": "TRACKER_ENDED",
 *     "status": "paid|pending|failed|unknown" }
 */

require_once __DIR__ . '/safepay-lib.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    safepay_json_response(array('error' => 'Method not allowed'), 405);
}

$tracker = trim((string) ($_GET['tracker'] ?? ''));
if ($tracker === '') {
    safepay_json_response(array('error' => 'tracker is required'), 422);
}

$config = safepay_config();
if ($config['secret_key'] === '') {
    safepay_json_response(array('error' => 'SafePay gateway is not configured'), 503);
}

$host = safepay_api_host($config['environment']);
$result = safepay_http_request(
    'GET',
    $host . '/reporter/api/v1/payments/' . urlencode($tracker),
    array(),
    $config['secret_key']
);

$state = (string) ($result['json']['data']['tracker']['state'] ?? '');
$status = 'unknown';
if ($state === 'TRACKER_ENDED') {
    $status = 'paid';
} elseif (stripos($state, 'fail') !== false) {
    $status = 'failed';
} elseif ($state !== '') {
    $status = 'pending';
}

safepay_json_response(array(
    'tracker' => $tracker,
    'state' => $state,
    'status' => $status,
));