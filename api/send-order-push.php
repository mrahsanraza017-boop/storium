<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = file_get_contents('php://input');
$order = json_decode($input, true);

if (!$order || empty($order['orderNumber'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid order payload. orderNumber is required.']);
    exit;
}

$subFile = __DIR__ . '/.push_subscriptions.json';
if (!file_exists($subFile)) {
    echo json_encode([
        'success'  => true,
        'notified' => 0,
        'message'  => 'No admin devices currently paired for push notifications',
    ]);
    exit;
}

$subscriptions = json_decode((string)file_get_contents($subFile), true) ?: [];
if (empty($subscriptions)) {
    echo json_encode([
        'success'  => true,
        'notified' => 0,
        'message'  => 'No active push subscriptions found',
    ]);
    exit;
}

$orderNum = htmlspecialchars((string)$order['orderNumber'], ENT_QUOTES, 'UTF-8');
$total = number_format((float)($order['total'] ?? 0), 0);
$customer = htmlspecialchars((string)($order['customerName'] ?? 'Customer'), ENT_QUOTES, 'UTF-8');
$city = htmlspecialchars((string)($order['city'] ?? 'Pakistan'), ENT_QUOTES, 'UTF-8');
$method = strtoupper((string)($order['paymentMethod'] ?? 'COD'));

$notificationPayload = json_encode([
    'title'   => "🛍️ New Order #{$orderNum}",
    'body'    => "Rs. {$total} ({$method}) — {$customer}, {$city}. Tap to review in Admin.",
    'orderId' => (string)($order['orderId'] ?? $orderNum),
    'url'     => '/admin',
    'badge'   => '/favicon-32.png',
    'icon'    => '/logo.png',
    'vibrate' => [300, 150, 300, 150, 300],
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

$delivered = 0;
$failed = 0;
$staleEndpoints = [];

// Dispatch Web Push notification to all registered admin devices
foreach ($subscriptions as $endpoint => $meta) {
    if (!filter_var($endpoint, FILTER_VALIDATE_URL) || !str_starts_with($endpoint, 'https://')) {
        $staleEndpoints[] = $endpoint;
        continue;
    }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $endpoint);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $notificationPayload);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 6);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'TTL: 86400',
        'Urgency: high',
        'Content-Length: ' . strlen((string)$notificationPayload),
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // 200, 201, or 202 means successfully accepted by browser push service (FCM / Mozilla / Apple)
    if ($httpCode >= 200 && $httpCode < 300) {
        $delivered++;
    } elseif ($httpCode === 404 || $httpCode === 410) {
        // Subscription is no longer valid or user cleared browser site data
        $staleEndpoints[] = $endpoint;
        $failed++;
    } else {
        $failed++;
    }
}

// Prune stale/expired subscriptions automatically
if (!empty($staleEndpoints)) {
    foreach ($staleEndpoints as $stale) {
        unset($subscriptions[$stale]);
    }
    @file_put_contents($subFile, json_encode($subscriptions, JSON_PRETTY_PRINT));
}

// Log delivery
$logFile = __DIR__ . '/.push_delivery.log';
$logEntry = date('c') . " | Order {$orderNum} | Delivered: {$delivered} | Failed: {$failed} | Active Devices: " . count($subscriptions) . "\n";
@file_put_contents($logFile, $logEntry, FILE_APPEND);

echo json_encode([
    'success'       => true,
    'order'         => $orderNum,
    'delivered'     => $delivered,
    'failed'        => $failed,
    'activeDevices' => count($subscriptions),
]);
