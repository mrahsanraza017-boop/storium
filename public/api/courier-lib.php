<?php
/**
 * Shared RUN Couriers helper library.
 * Integrates with portal.runcourier.com APIs:
 *   - CreateOrder.php (POST)
 *   - CancelOrder.php (GET)
 *   - TrackOrder.php / CurrentStatus.php (POST)
 *   - GetCitiesList.php (GET)
 */

if (!function_exists('courier_config')) {
    function courier_config(): array {
        static $config = null;
        if ($config !== null) {
            return $config;
        }

        $defaults = array(
            'auth_key'                  => 'cf7882d2-d196-4be5-bf2e-4d9d4f38b24e',
            'client_code'               => '1000003434',
            'profile_id'                => '2002',
            'origin'                    => 'Lahore',
            'service_type'              => 'Overnight',
            'product'                   => 'Overnight',
            'api_vendor'                => 'auto',
            'default_weight'            => 0.5,
            'base_api_url'              => 'https://portal.runcourier.com/API',
            'supabase_url'              => '',
            'supabase_service_role_key' => '',
        );

        $file = __DIR__ . '/courier-config.php';
        if (is_file($file)) {
            $fileConfig = require $file;
            if (is_array($fileConfig)) {
                $defaults = array_merge($defaults, $fileConfig);
            }
        }

        $envMap = array(
            'auth_key'                  => 'RUN_COURIER_AUTH_KEY',
            'client_code'               => 'RUN_COURIER_CLIENT_CODE',
            'profile_id'                => 'RUN_COURIER_PROFILE_ID',
            'origin'                    => 'RUN_COURIER_ORIGIN',
            'service_type'              => 'RUN_COURIER_SERVICE_TYPE',
            'product'                   => 'RUN_COURIER_PRODUCT',
            'api_vendor'                => 'RUN_COURIER_API_VENDOR',
            'base_api_url'              => 'RUN_COURIER_API_URL',
            'supabase_url'              => 'SUPABASE_URL',
            'supabase_service_role_key' => 'SUPABASE_SERVICE_ROLE_KEY',
        );

        $config = $defaults;
        foreach ($envMap as $key => $envName) {
            $value = getenv($envName);
            if ($value !== false && $value !== '') {
                $config[$key] = $value;
            }
        }

        return $config;
    }
}

if (!function_exists('courier_create_order')) {
    /**
     * Books a parcel on RUN Couriers (portal.runcourier.com/API/CreateOrder.php)
     */
    function courier_create_order(array $params): array {
        $config = courier_config();
        $url = rtrim($config['base_api_url'], '/') . '/CreateOrder.php';

        $payload = array(
            'client_code'         => (string) ($params['client_code'] ?? $config['client_code']),
            'auth_key'            => (string) ($params['auth_key'] ?? $config['auth_key']),
            'service_type'        => (string) ($params['service_type'] ?? $config['service_type']),
            'product'             => (string) ($params['product'] ?? $config['product']),
            'profile_id'          => (string) ($params['profile_id'] ?? $config['profile_id']),
            'origin'              => (string) ($params['origin'] ?? $config['origin']),
            'receiver_phone'      => (string) ($params['receiver_phone'] ?? ''),
            'destination'         => (string) ($params['destination'] ?? 'Karachi'),
            'receiver_name'       => (string) ($params['receiver_name'] ?? 'Valued Customer'),
            'receiver_email'      => (string) ($params['receiver_email'] ?? ''),
            'receiver_address'    => (string) ($params['receiver_address'] ?? ''),
            'pieces'              => (int) ($params['pieces'] ?? 1),
            'tracking_no'         => '',
            'weight'              => (float) ($params['weight'] ?? $config['default_weight']),
            'order_date'          => date('Y-m-d H:i:s'),
            'collection_amount'   => (string) ($params['collection_amount'] ?? '0'),
            'product_description' => (string) ($params['product_description'] ?? 'STORIUM Luxury Goods'),
            'special_instruction' => (string) ($params['special_instruction'] ?? 'Fragile - Luxury Watch. Handle with Care.'),
            'order_id'            => (string) ($params['order_id'] ?? ''),
            'api_vendor'          => (string) ($params['api_vendor'] ?? $config['api_vendor']),
        );

        $ch = curl_init($url);
        if ($ch === false) {
            return array('success' => false, 'error' => 'cURL init failed');
        }

        curl_setopt_array($ch, array(
            CURLOPT_POST           => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => array(
                'Content-Type: application/json',
                'Accept: application/json',
            ),
            CURLOPT_POSTFIELDS     => json_encode($payload),
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_CONNECTTIMEOUT => 15,
            CURLOPT_SSL_VERIFYPEER => true,
        ));

        $res = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);

        if ($res === false || $err !== '') {
            return array('success' => false, 'error' => 'cURL error booking with RUN Couriers: ' . $err);
        }

        $rawStr = trim((string) $res);
        $json = json_decode($rawStr, true);
        if (is_string($json)) {
            return array('success' => false, 'error' => $json, 'raw' => $json);
        }
        if (!is_array($json)) {
            return array('success' => false, 'error' => 'Response from RUN Couriers: ' . substr($rawStr, 0, 300), 'raw' => $rawStr);
        }

        $trackingNo = (string) ($json['tracking_no'] ?? '');
        if ($trackingNo === '' && empty($json['id'])) {
            return array(
                'success' => false,
                'error'   => $json['message'] ?? 'Failed to generate RUN Couriers tracking number',
                'detail'  => $json,
            );
        }

        return array(
            'success'               => true,
            'tracking_no'           => $trackingNo,
            'id'                    => $json['id'] ?? null,
            'invoice_link'          => $json['invoice_link'] ?? '',
            'thirdparty_tracking_no'=> $json['thirdparty_tracking_no'] ?? null,
            'message'               => $json['message'] ?? 'Booked successfully',
            'raw'                   => $json,
        );
    }
}

if (!function_exists('courier_track_order')) {
    /**
     * Fetches tracking history from RUN Couriers
     */
    function courier_track_order(string $trackingNo): array {
        $config = courier_config();
        $url = rtrim($config['base_api_url'], '/') . '/TrackOrder.php';

        $payload = array(
            'tracking_no' => $trackingNo,
            'client_code' => $config['client_code'],
            'auth_key'    => $config['auth_key'],
        );

        $ch = curl_init($url);
        if ($ch === false) {
            return array('success' => false, 'error' => 'cURL init failed');
        }

        curl_setopt_array($ch, array(
            CURLOPT_POST           => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => array(
                'Content-Type: application/json',
                'Accept: application/json',
            ),
            CURLOPT_POSTFIELDS     => json_encode($payload),
            CURLOPT_TIMEOUT        => 20,
            CURLOPT_CONNECTTIMEOUT => 10,
        ));

        $res = curl_exec($ch);
        curl_close($ch);

        $json = json_decode((string) $res, true);
        if (!is_array($json)) {
            // Fallback: try CurrentStatus.php
            $altUrl = rtrim($config['base_api_url'], '/') . '/CurrentStatus.php';
            $chAlt = curl_init($altUrl);
            curl_setopt_array($chAlt, array(
                CURLOPT_POST           => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER     => array(
                    'Content-Type: application/json',
                    'Accept: application/json',
                ),
                CURLOPT_POSTFIELDS     => json_encode($payload),
                CURLOPT_TIMEOUT        => 15,
            ));
            $altRes = curl_exec($chAlt);
            curl_close($chAlt);
            $json = json_decode((string) $altRes, true);
        }

        if (is_string($json)) {
            return array(
                'success'        => false,
                'tracking_no'    => $trackingNo,
                'current_status' => 'Not Found',
                'history'        => array(),
                'error'          => $json,
                'raw'            => $json,
            );
        }

        $history = array();
        $currentStatus = 'In Transit';

        if (is_array($json)) {
            if (isset($json['history']) && is_array($json['history'])) {
                $history = $json['history'];
            } elseif (isset($json['data']) && is_array($json['data'])) {
                $history = $json['data'];
            } elseif (array_is_list($json)) {
                $history = $json;
            }

            if (isset($json['current_status']) && is_string($json['current_status'])) {
                $currentStatus = $json['current_status'];
            } elseif (isset($json['status']) && is_string($json['status'])) {
                $currentStatus = $json['status'];
            } elseif (!empty($history)) {
                $lastEvent = end($history);
                if (is_array($lastEvent) && isset($lastEvent['status'])) {
                    $currentStatus = (string) $lastEvent['status'];
                }
            }
        }

        return array(
            'success'        => is_array($json),
            'tracking_no'    => $trackingNo,
            'current_status' => $currentStatus,
            'history'        => $history,
            'raw'            => $json,
        );
    }
}

if (!function_exists('courier_cancel_order')) {
    /**
     * Cancels an order on RUN Couriers
     */
    function courier_cancel_order(string $trackingNo): array {
        $config = courier_config();
        $url = rtrim($config['base_api_url'], '/') . '/CancelOrder.php?auth_key=' . urlencode($config['auth_key']) . '&tracking_no=' . urlencode($trackingNo);

        $ch = curl_init($url);
        curl_setopt_array($ch, array(
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 15,
        ));
        $res = curl_exec($ch);
        curl_close($ch);

        $json = json_decode((string) $res, true);
        return array(
            'success' => is_array($json) && stripos((string) ($json['message'] ?? ''), 'cancelled') !== false,
            'message' => $json['message'] ?? 'Cancellation requested',
            'detail'  => $json,
        );
    }
}

if (!function_exists('courier_json_response')) {
    function courier_json_response(array $payload, int $status = 200): void {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($payload, JSON_UNESCAPED_SLASHES);
        exit;
    }
}
