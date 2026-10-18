<?php
/**
 * Shared Rapid Gateway helpers — configuration, OAuth2 token generation,
 * transaction submission, callback handling, and Supabase synchronization.
 *
 * Rapid Gateway endpoint references:
 *   - OAuth2 Token:        POST https://secure.rapid-gateway.com/oauth2/token
 *   - Process Transaction: POST https://secure.rapid-gateway.com/rapid/process-transaction
 */

if (!function_exists('rapid_config')) {
    function rapid_config(): array {
        static $config = null;
        if ($config !== null) {
            return $config;
        }

        $defaults = array(
            'merchant_id'               => '',
            'client_secret'             => '',
            'store_name'                => 'STORIUM',
            'token_url'                 => 'https://secure.rapid-gateway.com/oauth2/token',
            'process_url'               => 'https://secure.rapid-gateway.com/rapid/process-transaction',
            'currency_code'             => 'PKR',
            'version'                   => 'MY_VER_1.0',
            'proc_code'                 => '0',
            'base_url'                  => '',
            'supabase_url'              => '',
            'supabase_service_role_key' => '',
        );

        $file = __DIR__ . '/rapid-config.php';
        if (is_file($file)) {
            $fileConfig = require $file;
            if (is_array($fileConfig)) {
                $defaults = array_merge($defaults, $fileConfig);
            }
        }

        // Environment variables override static file configuration
        $envMap = array(
            'merchant_id'               => 'RAPID_MERCHANT_ID',
            'client_secret'             => 'RAPID_CLIENT_SECRET',
            'store_name'                => 'RAPID_STORE_NAME',
            'token_url'                 => 'RAPID_TOKEN_URL',
            'process_url'               => 'RAPID_PROCESS_URL',
            'currency_code'             => 'RAPID_CURRENCY_CODE',
            'version'                   => 'RAPID_VERSION',
            'proc_code'                 => 'RAPID_PROC_CODE',
            'base_url'                  => 'BASE_URL',
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

if (!function_exists('rapid_get_token')) {
    /**
     * Step 1: Obtains an OAuth2 Bearer token from Rapid Gateway
     */
    function rapid_get_token(string $merchantId, string $clientSecret, string $tokenUrl): array {
        $ch = curl_init($tokenUrl);
        if ($ch === false) {
            return array('success' => false, 'error' => 'cURL initialization failed for token endpoint');
        }

        $authHeader = 'Basic ' . base64_encode($merchantId . ':' . $clientSecret);

        curl_setopt_array($ch, array(
            CURLOPT_POST           => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => array(
                'Authorization: ' . $authHeader,
                'Content-Type: application/x-www-form-urlencoded',
                'Accept: application/json',
            ),
            CURLOPT_POSTFIELDS     => http_build_query(array('grant_type' => 'client_credentials')),
            CURLOPT_TIMEOUT        => 20,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => true,
        ));

        $raw = curl_exec($ch);
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);
        curl_close($ch);

        if ($raw === false || $curlErr !== '') {
            return array('success' => false, 'error' => 'cURL error during token request: ' . $curlErr);
        }

        $json = json_decode((string) $raw, true);
        if (!is_array($json)) {
            return array(
                'success' => false,
                'error'   => 'Invalid token response (HTTP ' . $httpCode . '): ' . substr((string) $raw, 0, 200),
            );
        }

        $token = $json['access_token'] ?? $json['token'] ?? '';
        if ($token === '') {
            $errDesc = $json['error_description'] ?? $json['error'] ?? $json['message'] ?? 'Missing access_token';
            return array('success' => false, 'error' => 'OAuth token error: ' . $errDesc, 'detail' => $json);
        }

        return array('success' => true, 'token' => (string) $token, 'data' => $json);
    }
}

if (!function_exists('rapid_process_transaction')) {
    /**
     * Step 2: Submits the transaction to Rapid Gateway and captures redirect URL
     */
    function rapid_process_transaction(string $token, array $payload, string $processUrl): array {
        $ch = curl_init($processUrl);
        if ($ch === false) {
            return array('success' => false, 'error' => 'cURL initialization failed for transaction endpoint');
        }

        curl_setopt_array($ch, array(
            CURLOPT_POST           => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => false, // Capture redirect, do not automatically follow
            CURLOPT_HEADER         => true,  // Read headers in case redirect URL is returned in Location
            CURLOPT_HTTPHEADER     => array(
                'Authorization: Bearer ' . $token,
                'Content-Type: application/x-www-form-urlencoded',
                'Accept: text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8',
            ),
            CURLOPT_POSTFIELDS     => http_build_query($payload),
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_CONNECTTIMEOUT => 15,
            CURLOPT_SSL_VERIFYPEER => true,
        ));

        $response = curl_exec($ch);
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $redirectUrl = (string) curl_getinfo($ch, CURLINFO_REDIRECT_URL);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $curlErr = curl_error($ch);
        curl_close($ch);

        if ($response === false || $curlErr !== '') {
            return array('success' => false, 'error' => 'cURL error during transaction submission: ' . $curlErr);
        }

        $headerStr = substr((string) $response, 0, $headerSize);
        $bodyStr = substr((string) $response, $headerSize);

        // Fallback: If CURLINFO_REDIRECT_URL is empty, inspect Location header
        if ($redirectUrl === '') {
            if (preg_match('/^Location:\s*(.*?)$/mi', $headerStr, $matches)) {
                $redirectUrl = trim($matches[1]);
            }
        }

        // Fallback: Inspect JSON body if Rapid Gateway responded with a JSON payload
        $bodyJson = json_decode($bodyStr, true);
        if ($redirectUrl === '' && is_array($bodyJson)) {
            $redirectUrl = $bodyJson['redirect_url'] ?? $bodyJson['checkout_url'] ?? $bodyJson['url'] ?? $bodyJson['data']['redirect_url'] ?? '';
        }

        if ($redirectUrl === '') {
            return array(
                'success'  => false,
                'error'    => 'Rapid Gateway did not return a checkout redirect URL (HTTP ' . $httpCode . ')',
                'httpCode' => $httpCode,
                'body'     => substr($bodyStr, 0, 500),
                'json'     => $bodyJson,
            );
        }

        return array(
            'success'     => true,
            'redirectUrl' => $redirectUrl,
            'httpCode'    => $httpCode,
            'body'        => $bodyStr,
        );
    }
}

if (!function_exists('rapid_format_pakistan_phone')) {
    /**
     * Normalizes a phone number to standard Pakistani local format: 03001234567
     */
    function rapid_format_pakistan_phone(string $phone): string {
        $digits = preg_replace('/\D+/', '', $phone);
        if (substr($digits, 0, 2) === '92' && strlen($digits) === 12) {
            return '0' . substr($digits, 2);
        }
        if (substr($digits, 0, 2) === '03' && strlen($digits) === 11) {
            return $digits;
        }
        if (substr($digits, 0, 1) === '3' && strlen($digits) === 10) {
            return '0' . $digits;
        }
        return $digits ?: '03001234567';
    }
}

if (!function_exists('guess_rapid_base_url')) {
    /**
     * Determines current public site URL
     */
    function guess_rapid_base_url(): string {
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        return $scheme . '://' . $host;
    }
}

if (!function_exists('rapid_json_response')) {
    function rapid_json_response(array $payload, int $status = 200): void {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($payload, JSON_UNESCAPED_SLASHES);
        exit;
    }
}

if (!function_exists('rapid_read_json_body')) {
    function rapid_read_json_body(): array {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw ?: '', true);
        return is_array($data) ? $data : array();
    }
}

if (!function_exists('rapid_patch_supabase_order')) {
    /**
     * Updates an order status in Supabase via REST API
     */
    function rapid_patch_supabase_order(array $config, string $orderId, array $patch): bool {
        if (empty($config['supabase_url']) || empty($config['supabase_service_role_key'])) {
            return false;
        }

        $url = rtrim($config['supabase_url'], '/') . '/rest/v1/orders?order_number=eq.' . urlencode($orderId);
        $ch = curl_init($url);
        if ($ch === false) {
            return false;
        }

        curl_setopt_array($ch, array(
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST  => 'PATCH',
            CURLOPT_HTTPHEADER     => array(
                'Content-Type: application/json',
                'apikey: ' . $config['supabase_service_role_key'],
                'Authorization: Bearer ' . $config['supabase_service_role_key'],
                'Prefer: return=minimal',
            ),
            CURLOPT_POSTFIELDS     => json_encode($patch),
            CURLOPT_TIMEOUT        => 15,
        ));

        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return $code >= 200 && $code < 300;
    }
}
