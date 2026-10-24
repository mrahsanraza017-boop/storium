<?php
/**
 * STORIUM Pakistan — WhatsApp Gateway Configuration Template
 * Copy this file to whatsapp-config.php and fill in your WhatsApp API credentials.
 */

return array(
    'provider' => 'concierge', // 'concierge' | 'ultramsg' | 'greenapi' | 'meta' | 'twilio'
    'hmac_secret' => 'storium_whatsapp_otp_secret_key_change_me',
    'concierge_phone' => '923215993022',
    'store_name' => 'STORIUM Pakistan',

    'ultramsg_instance_id' => '',
    'ultramsg_token'       => '',

    'greenapi_id_instance' => '',
    'greenapi_api_token'   => '',

    'meta_phone_number_id' => '',
    'meta_access_token'    => '',
    'meta_template_name'   => '',

    'twilio_account_sid'   => '',
    'twilio_auth_token'    => '',
    'twilio_whatsapp_from' => 'whatsapp:+14155238886',

    'debug_mode' => true,
);
