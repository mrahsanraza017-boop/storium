<?php
/**
 * Rapid Gateway Local Configuration.
 *
 * Fill in your real Rapid Gateway Merchant ID and Client Secret below,
 * or configure them as environment variables (RAPID_MERCHANT_ID, RAPID_CLIENT_SECRET).
 */

return array(
    'merchant_id'               => 'YOUR_MERCHANT_ID',
    'client_secret'             => 'YOUR_CLIENT_SECRET',
    'store_name'                => 'STORIUM',
    'token_url'                 => 'https://secure.rapid-gateway.com/oauth2/token',
    'process_url'               => 'https://secure.rapid-gateway.com/rapid/process-transaction',
    'currency_code'             => 'PKR',
    'version'                   => 'MY_VER_1.0',
    'proc_code'                 => '0',
    'base_url'                  => 'https://storium.online',
    'supabase_url'              => 'https://jvghdtlfwijbkhwwpdft.supabase.co',
    'supabase_service_role_key' => '',
);
