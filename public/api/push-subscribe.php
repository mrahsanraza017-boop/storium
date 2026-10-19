<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$subFile = __DIR__ . '/.push_subscriptions.json';
$existing = [];
if (file_exists($subFile)) {
    $existing = json_decode((string)file_get_contents($subFile), true) ?: [];
}

// Allow GET to query subscriber count & paired devices
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $devices = [];
    foreach ($existing as $endpoint => $item) {
        $devices[] = [
            'deviceLabel' => $item['deviceLabel'] ?? 'Admin Phone',
            'updatedAt'   => $item['updatedAt'] ?? date('c'),
            'endpoint'    => substr($endpoint, 0, 40) . '...',
        ];
    }
    echo json_encode([
        'success'          => true,
        'totalSubscribers' => count($existing),
        'devices'          => $devices,
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON payload']);
    exit;
}

// Handle unsubscribe
if (!empty($data['action']) && $data['action'] === 'unsubscribe') {
    $endpoint = $data['endpoint'] ?? '';
    if ($endpoint && isset($existing[$endpoint])) {
        unset($existing[$endpoint]);
        @file_put_contents($subFile, json_encode($existing, JSON_PRETTY_PRINT));
    }
    echo json_encode([
        'success'          => true,
        'unsubscribed'     => true,
        'totalSubscribers' => count($existing),
    ]);
    exit;
}

// Handle subscribe
if (empty($data['subscription']) || empty($data['subscription']['endpoint'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid subscription payload. Endpoint is required.']);
    exit;
}

$endpoint = (string)$data['subscription']['endpoint'];

// Basic validation: push endpoint must be HTTPS
if (!str_starts_with($endpoint, 'https://')) {
    http_response_code(400);
    echo json_encode(['error' => 'Push endpoint must use HTTPS']);
    exit;
}

$existing[$endpoint] = [
    'subscription' => $data['subscription'],
    'deviceLabel'  => (string)($data['deviceLabel'] ?? 'Admin Device'),
    'updatedAt'    => date('c'),
];

@file_put_contents($subFile, json_encode($existing, JSON_PRETTY_PRINT));

echo json_encode([
    'success'          => true,
    'subscribed'       => true,
    'totalSubscribers' => count($existing),
]);
