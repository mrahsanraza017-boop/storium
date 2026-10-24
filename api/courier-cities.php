<?php
/**
 * Get RUN Couriers Cities List
 * Endpoint: GET /api/courier-cities.php
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
$url = rtrim($config['base_api_url'], '/') . '/GetCitiesList.php';

$ch = curl_init($url);
curl_setopt_array($ch, array(
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 10,
    CURLOPT_CONNECTTIMEOUT => 5,
));

$res = curl_exec($ch);
curl_close($ch);

$json = json_decode((string) $res, true);
if (is_array($json) && !empty($json['data'])) {
    courier_json_response($json);
}

// Fallback list of major Pakistan cities if external API is unreachable
$fallback = array(
    'response' => 1,
    'message'  => 'Standard Pakistan Cities',
    'data'     => array(
        array('id' => '1', 'city_name' => 'Lahore'),
        array('id' => '2', 'city_name' => 'Karachi'),
        array('id' => '3', 'city_name' => 'Islamabad'),
        array('id' => '4', 'city_name' => 'Rawalpindi'),
        array('id' => '5', 'city_name' => 'Faisalabad'),
        array('id' => '6', 'city_name' => 'Multan'),
        array('id' => '7', 'city_name' => 'Peshawar'),
        array('id' => '8', 'city_name' => 'Quetta'),
        array('id' => '9', 'city_name' => 'Sialkot'),
        array('id' => '10', 'city_name' => 'Gujranwala'),
        array('id' => '11', 'city_name' => 'Hyderabad'),
        array('id' => '12', 'city_name' => 'Abbottabad'),
        array('id' => '13', 'city_name' => 'Bahawalpur'),
        array('id' => '14', 'city_name' => 'Sargodha'),
        array('id' => '15', 'city_name' => 'Sukkur'),
    )
);

courier_json_response($fallback);
