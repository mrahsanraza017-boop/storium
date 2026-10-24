<?php
/**
 * RUN Couriers Configuration Template
 * -------------------------------------------------------------
 * Copy this file to courier-config.php and update with your production
 * RUN Couriers merchant credentials.
 *
 * Credentials are provided by RUN Couriers (portal.runcourier.com):
 *   - auth_key: API authorization key
 *   - client_code: Your unique merchant client code
 *   - profile_id: Booking profile ID (from Products & Services API)
 *   - origin: Default shipper city (e.g. Lahore / Karachi / Islamabad)
 */

return array(
    // RUN Couriers API Credentials
    'auth_key'                  => 'YOUR_RUN_COURIER_AUTH_KEY',
    'client_code'               => 'YOUR_CLIENT_CODE',
    'profile_id'                => 'YOUR_PROFILE_ID',
    'origin'                    => 'Lahore',
    'service_type'              => 'Overnight',
    'product'                   => 'Overnight',
    'api_vendor'                => 'auto',
    'default_weight'            => 0.5,

    // API Gateway URL
    'base_api_url'              => 'https://portal.runcourier.com/API',

    // Optional Supabase credentials to sync tracking back automatically
    'supabase_url'              => '',
    'supabase_service_role_key' => '',
);
