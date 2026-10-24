<?php
/**
 * GET /api/rapid-status.php?order=STORIUM-...&tracker=...
 *
 * Verifies payment status of an order server-side using Supabase service-role credentials,
 * allowing guest checkouts to verify status even when client-side RLS prevents direct access.
 *
 * Response (JSON):
 *   {
 *     "orderId": "STORIUM-...",
 *     "status": "paid|pending|failed|unknown",
 *     "rgTransactionRef": "..."
 *   }
 */

require_once __DIR__ . '/rapid-lib.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    rapid_json_response(array('error' => 'Method not allowed. Expected GET.'), 405);
}

$orderId = trim((string) ($_GET['order'] ?? $_GET['orderId'] ?? $_GET['basket_id'] ?? ''));
if ($orderId === '') {
    rapid_json_response(array('error' => 'order parameter is required'), 422);
}

$config = rapid_config();
if (empty($config['supabase_url']) || empty($config['supabase_service_role_key'])) {
    // If Supabase service role key is not configured, fall back to default acknowledgment
    rapid_json_response(array(
        'orderId' => $orderId,
        'status'  => 'unknown',
        'note'    => 'Supabase service role not configured on server',
    ));
}

$url = rtrim($config['supabase_url'], '/') . '/rest/v1/orders?order_number=eq.' . urlencode($orderId) . '&select=order_number,payment_status,rg_transaction_ref';
$ch = curl_init($url);
if ($ch === false) {
    rapid_json_response(array('error' => 'Failed to initialize cURL'), 500);
}

curl_setopt_array($ch, array(
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => array(
        'Accept: application/json',
        'apikey: ' . $config['supabase_service_role_key'],
        'Authorization: Bearer ' . $config['supabase_service_role_key'],
    ),
    CURLOPT_TIMEOUT        => 10,
));

$res = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$orders = json_decode((string) $res, true);
if (!is_array($orders) || empty($orders)) {
    rapid_json_response(array(
        'orderId' => $orderId,
        'status'  => 'not-found',
    ));
}

$order = $orders[0];
$paymentStatus = $order['payment_status'] ?? 'pending';

rapid_json_response(array(
    'orderId'          => $orderId,
    'status'           => $paymentStatus,
    'rgTransactionRef' => $order['rg_transaction_ref'] ?? null,
));
