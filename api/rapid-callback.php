<?php
/**
 * GET/POST /api/rapid-callback.php
 *
 * Return handler for Rapid Gateway transactions.
 * Captures redirect or webhook data from Rapid Gateway, marks the order in
 * Supabase (using the server-side service-role key if configured), and redirects
 * the customer into the React SPA payment confirmation screen.
 */

require_once __DIR__ . '/rapid-lib.php';

$config = rapid_config();
$baseUrl = rtrim($config['base_url'] ?: guess_rapid_base_url(), '/');

// Merge GET and POST data
$params = array_merge($_GET, $_POST);
$rawInput = file_get_contents('php://input');
if ($rawInput) {
    $json = json_decode($rawInput, true);
    if (is_array($json)) {
        $params = array_merge($params, $json);
    }
}

// Extract Order / Basket ID
$orderId = trim((string) (
    $params['order'] ??
    $params['orderId'] ??
    $params['BASKET_ID'] ??
    $params['basket_id'] ??
    $params['order_id'] ??
    ''
));

// Extract Transaction Reference / Tracker
$txnRef = trim((string) (
    $params['tracker'] ??
    $params['TXNREF'] ??
    $params['txnref'] ??
    $params['transaction_id'] ??
    $params['TXN_REF_NO'] ??
    $params['rrn'] ??
    $params['RRN'] ??
    ''
));

// Extract Status Indicators
$urlStatus   = strtolower(trim((string) ($params['status'] ?? '')));
$rc          = trim((string) ($params['RC'] ?? $params['rc'] ?? $params['RESPONSE_CODE'] ?? ''));
$txnStatus   = trim((string) ($params['TXN_STATUS'] ?? $params['txn_status'] ?? ''));
$rgStatus    = strtoupper(trim((string) ($params['STATUS'] ?? '')));

// Determine Outcome
// Rapid Gateway / Bank Alfalah / CyberSource standard return codes:
// RC "00" or "0" indicates success. TXN_STATUS "1" or "SUCCESS" indicates success.
$isSuccess = (
    $urlStatus === 'success' ||
    $rc === '00' ||
    $rc === '0' ||
    $txnStatus === '1' ||
    $rgStatus === 'SUCCESS' ||
    $rgStatus === 'PAID'
);

$isFailure = (
    $urlStatus === 'failure' ||
    $urlStatus === 'cancel' ||
    ($rc !== '' && $rc !== '00' && $rc !== '0') ||
    $txnStatus === '0' ||
    $rgStatus === 'FAILED' ||
    $rgStatus === 'CANCELLED'
);

if ($isSuccess && $orderId !== '') {
    $patch = array(
        'payment_status' => 'paid',
        'paid_at'        => gmdate('c'),
        'order_status'   => 'Processing',
    );
    if ($txnRef !== '') {
        $patch['rg_transaction_ref'] = $txnRef;
    }

    rapid_patch_supabase_order($config, $orderId, $patch);

    $destination = $baseUrl . '/payment/success?order=' . urlencode($orderId) . '&status=paid&gateway=rapid';
    if ($txnRef !== '') {
        $destination .= '&tracker=' . urlencode($txnRef);
    }

    header('Location: ' . $destination, true, 302);
    exit;
}

if ($isFailure && $orderId !== '') {
    $patch = array(
        'payment_status'    => 'failed',
        'payment_failed_at' => gmdate('c'),
    );
    rapid_patch_supabase_order($config, $orderId, $patch);

    $destination = $baseUrl . '/payment/failure?order=' . urlencode($orderId) . '&status=failed&gateway=rapid';
    header('Location: ' . $destination, true, 302);
    exit;
}

// Fallback: Checkout complete landing page
$destination = $baseUrl . '/payment/complete?order=' . urlencode($orderId) . '&gateway=rapid';
if ($txnRef !== '') {
    $destination .= '&tracker=' . urlencode($txnRef);
}
header('Location: ' . $destination, true, 302);
exit;
