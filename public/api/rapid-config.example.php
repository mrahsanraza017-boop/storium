<?php
/**
 * Rapid Gateway Configuration Template.
 *
 * Copy this file to public/api/rapid-config.php and add your credentials:
 *   - merchant_id: Provided by Rapid Gateway merchant portal
 *   - client_secret: Provided by Rapid Gateway merchant portal
 *
 * NOTE: public/api/rapid-config.php is intentionally gitignored to prevent
 * committing sensitive production secrets to source control.
 *
 * Environment variable overrides:
 *   RAPID_MERCHANT_ID, RAPID_CLIENT_SECRET, RAPID_STORE_NAME,
 *   BASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

return array(
    // Your Rapid Gateway Merchant ID (e.g. "102")
    'merchant_id'               => 'YOUR_MERCHANT_ID',

    // Your Rapid Gateway Client Secret
    'client_secret'             => 'YOUR_CLIENT_SECRET',

    // Store name displayed on Rapid Gateway checkout screen
    'store_name'                => 'STORIUM',

    // Rapid Gateway API endpoints
    'token_url'                 => 'https://secure.rapid-gateway.com/oauth2/token',
    'process_url'               => 'https://secure.rapid-gateway.com/rapid/process-transaction',

    // Transaction defaults
    'currency_code'             => 'PKR',
    'version'                   => 'MY_VER_1.0',
    'proc_code'                 => '0',

    // Public website URL
    'base_url'                  => 'https://storium.online',

    // Optional: Supabase credentials for server-side order status updates
    'supabase_url'              => 'https://jvghdtlfwijbkhwwpdft.supabase.co',
    'supabase_service_role_key' => '',
);
