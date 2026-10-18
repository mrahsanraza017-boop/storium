<?php
/**
 * Book Order with RUN Couriers (portal.runcourier.com)
 * Endpoint: POST /api/courier-book.php
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(array('success' => false, 'error' => 'Method not allowed. Use POST.'));
    exit;
}

require_once __DIR__ . '/courier-lib.php';

$rawInput = file_get_contents('php://input');
$body = json_decode((string) $rawInput, true);

if (!is_array($body)) {
    courier_json_response(array('success' => false, 'error' => 'Invalid JSON body in booking request'), 400);
}

// Destination city mapping & cleanup
$destination = trim((string) ($body['destinationCity'] ?? $body['destination'] ?? 'Karachi'));
$receiverName = trim((string) ($body['customerName'] ?? $body['receiver_name'] ?? 'Valued Customer'));
$receiverPhone = trim((string) ($body['customerPhone'] ?? $body['receiver_phone'] ?? ''));
$receiverEmail = trim((string) ($body['customerEmail'] ?? $body['receiver_email'] ?? ''));
$receiverAddress = trim((string) ($body['shippingAddress'] ?? $body['receiver_address'] ?? ''));
$collectionAmount = (string) ($body['collectionAmount'] ?? $body['collection_amount'] ?? '0');
$productDesc = trim((string) ($body['productDescription'] ?? $body['product_description'] ?? 'STORIUM Luxury Goods'));
$orderId = trim((string) ($body['orderId'] ?? $body['order_id'] ?? ''));
$weight = (float) ($body['weight'] ?? 0.5);
$pieces = (int) ($body['pieces'] ?? 1);
$specialInstruction = trim((string) ($body['specialInstruction'] ?? 'Fragile - Luxury Timepiece. Handle with Care.'));

if ($receiverAddress === '') {
    courier_json_response(array('success' => false, 'error' => 'Receiver shipping address is required for courier booking'), 400);
}

if ($receiverPhone === '') {
    courier_json_response(array('success' => false, 'error' => 'Receiver contact phone is required for courier booking'), 400);
}

// Build parameters for RUN Couriers
$params = array(
    'destination'         => $destination,
    'receiver_name'       => $receiverName,
    'receiver_phone'      => $receiverPhone,
    'receiver_email'      => $receiverEmail,
    'receiver_address'    => $receiverAddress,
    'collection_amount'   => $collectionAmount,
    'product_description' => $productDesc,
    'order_id'            => $orderId,
    'weight'              => $weight > 0 ? $weight : 0.5,
    'pieces'              => $pieces > 0 ? $pieces : 1,
    'special_instruction' => $specialInstruction,
);

$result = courier_create_order($params);

if (!$result['success']) {
    courier_json_response(array(
        'success' => false,
        'error'   => $result['error'] ?? 'Booking failed on RUN Couriers',
        'detail'  => $result,
    ), 502);
}

// Success response
courier_json_response(array(
    'success'       => true,
    'courier'       => 'RUN Couriers',
    'tracking_no'   => $result['tracking_no'],
    'invoice_link'  => $result['invoice_link'],
    'booking_id'    => $result['id'],
    'message'       => $result['message'],
    'payload'       => array(
        'order_id'          => $orderId,
        'destination'       => $destination,
        'collection_amount' => $collectionAmount,
    ),
));
