<?php
/**
 * Shared SafePay helpers — config loading, HTTP transport and JSON responses.
 * Included by the public SafePay endpoints.
 */

if (!function_exists('safepay_config')) {
    function safepay_config(): array {
        static $config = null;
        if ($config !== null) {
            return $config;
        }

        $defaults = array(
            'api_key' => '',
            'secret_key' => '',
            'environment' => 'sandbox',
            'webhook_secret' => '',
            'base_url' => '',
            'supabase_url' => '',
            'supabase_service_role_key' => '',
        );

        $file = __DIR__ . '/safepay-config.php';
        if (is_file($file)) {
            $fileConfig = require $file;
            if (is_array($fileConfig)) {
                $defaults = array_merge($defaults, $fileConfig);
            }
        }

        $envMap = array(
            'api_key' => 'SAFEPAY_API_KEY',
            'secret_key' => 'SAFEPAY_SECRET_KEY',
            'environment' => 'SAFEPAY_ENVIRONMENT',
            'webhook_secret' => 'SAFEPAY_WEBHOOK_SECRET',
            'base_url' => 'SAFEPAY_BASE_URL',
            'supabase_url' => 'SUPABASE_URL',
            'supabase_service_role_key' => 'SUPABASE_SERVICE_ROLE_KEY',
        );

        $config = $defaults;
        foreach ($envMap as $key => $envName) {
            $value = getenv($envName);
            if ($value !== false && $value !== '') {
                $config[$key] = $value;
            }
        }

        $config['environment'] = strtolower($config['environment']) === 'production'
            ? 'production'
            : 'sandbox';

        return $config;
    }
}

if (!function_exists('safepay_api_host')) {
    function safepay_api_host(string $environment): string {
        return $environment === 'production'
            ? 'https://api.getsafepay.com'
            : 'https://sandbox.api.getsafepay.com';
    }
}

if (!function_exists('safepay_checkout_origin')) {
    function safepay_checkout_origin(string $environment): string {
        return $environment === 'production'
            ? 'https://getsafepay.com'
            : 'https://sandbox.api.getsafepay.com';
    }
}

if (!function_exists('safepay_http_request')) {
    function safepay_http_request(string $method, string $url, array $payload, string $secretKey): array {
        $ch = curl_init($url);
        if ($ch === false) {
            return array('status' => 0, 'body' => '', 'json' => null, 'error' => 'curl init failed');
        }

        $headers = array(
            'Accept: application/json',
            'X-SFPY-MERCHANT-SECRET: ' . $secretKey,
        );

        $options = array(
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
        );

        if ($method === 'POST') {
            $options[CURLOPT_POST] = true;
            $options[CURLOPT_POSTFIELDS] = json_encode($payload);
            $headers[] = 'Content-Type: application/json';
        }

        curl_setopt_array($ch, $options);
        $body = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        return array(
            'status' => (int) $status,
            'body' => $body,
            'json' => json_decode((string) $body, true),
            'error' => $error,
        );
    }
}

if (!function_exists('safepay_environment')) {
    function safepay_environment(): string { return safepay_config()['environment']; }
}

if (!function_exists('safepay_api_key')) {
    function safepay_api_key(): string { return safepay_config()['api_key']; }
}

if (!function_exists('safepay_secret_key')) {
    function safepay_secret_key(): string { return safepay_config()['secret_key']; }
}

if (!function_exists('safepay_json_response')) {
    function safepay_json_response(array $payload, int $status = 200): void {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($payload);
        exit;
    }
}

if (!function_exists('safepay_read_json_body')) {
    function safepay_read_json_body(): array {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw ?: '', true);
        return is_array($data) ? $data : array();
    }
}