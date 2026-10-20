<?php
/**
 * STORIUM Pakistan — WhatsApp Gateway Configuration
 *
 * Configures the WhatsApp OTP verification and notification delivery system.
 *
 * Supported delivery providers:
 *  - 'concierge' : Direct WhatsApp concierge / wa.me protocol (Always works without external subscription)
 *  - 'ultramsg'  : UltraMsg API (Popular in Pakistan, https://ultramsg.com)
 *  - 'greenapi'  : Green API (https://green-api.com)
 *  - 'meta'      : Meta / Facebook WhatsApp Cloud API (graph.facebook.com)
 *  - 'twilio'    : Twilio WhatsApp Messaging
 */

return array(
    // Active provider: 'concierge' | 'ultramsg' | 'greenapi' | 'meta' | 'twilio'
    'provider' => 'concierge',

    // Secret salt for HMAC OTP signing (ensures stateless tamper-proof code verification)
    'hmac_secret' => 'storium_whatsapp_otp_secret_key_99238472',

    // Store WhatsApp Concierge Helpline (Pakistani format 923XXXXXXXXX)
    'concierge_phone' => '923215993022',
    'store_name' => 'STORIUM Pakistan',

    // UltraMsg Configuration (if provider is 'ultramsg')
    'ultramsg_instance_id' => '', // e.g. 'instance12345'
    'ultramsg_token'       => '', // e.g. 'abcdef123456'

    // Green API Configuration (if provider is 'greenapi')
    'greenapi_id_instance' => '',
    'greenapi_api_token'   => '',

    // Meta Cloud API Configuration (if provider is 'meta')
    'meta_phone_number_id' => '',
    'meta_access_token'    => '',
    'meta_template_name'   => '', // Optional template name

    // Twilio WhatsApp Configuration (if provider is 'twilio')
    'twilio_account_sid'   => '',
    'twilio_auth_token'    => '',
    'twilio_whatsapp_from' => 'whatsapp:+14155238886',

    // Development / Testing Mode
    // Set to true to include devOtp in response for easy developer/admin testing
    'debug_mode' => true,
);
