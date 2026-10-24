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
    // Active provider: 'meta' | 'agent' | 'ultramsg' | 'greenapi' | 'twilio' | 'concierge'
    'provider' => 'meta',

    // Storium AI Agent Configuration
    'agent_name' => 'Shami (Storium AI Agent)',
    'agent_role' => 'Order Security & OTP Verification',

    // Secret salt for HMAC OTP signing (ensures stateless tamper-proof code verification)
    'hmac_secret' => 'storium_whatsapp_otp_secret_key_99238472',
    'webhook_verify_token' => 'storium_ai_webhook_secret_2026',

    // Store WhatsApp Concierge Helpline (Pakistani format 923XXXXXXXXX)
    'concierge_phone' => '923215993022',
    'store_name' => 'STORIUM Pakistan',

    // WhatsApp Agent API Key provided by merchant
    'api_key' => 'EAAcFPk7gFA4BSZCrAWWp1ZAZAMFC8ur2e6tqJP3uspyg6jkne68we4PchGYHlgFO5yA4HfP9EFLZCZA7g1UilmeRE2mxOOQUu6ugHuL8AO7erQjITi2ZAlTEdZA5ZClZAK2akR4aUmVxuLFeUrWe0VHmytGRHy68Pv8J5ILCi4bZC5PrKLKpFKEUQaYRNeqQQEGSiDwJosbbYSmKTgPjHADjZBTvp1CGWOOGUvtN2vVWMucrGhJ6OlsBPzpnMb82afkpE2tFtxz5TtFi925CIcftPJ9WZCGOd3h1imcaZCLQ8LwZDZD',

    // Meta Cloud API Configuration
    // If using Meta WhatsApp Cloud API:
    'meta_access_token'    => 'EAAcFPk7gFA4BSZCrAWWp1ZAZAMFC8ur2e6tqJP3uspyg6jkne68we4PchGYHlgFO5yA4HfP9EFLZCZA7g1UilmeRE2mxOOQUu6ugHuL8AO7erQjITi2ZAlTEdZA5ZClZAK2akR4aUmVxuLFeUrWe0VHmytGRHy68Pv8J5ILCi4bZC5PrKLKpFKEUQaYRNeqQQEGSiDwJosbbYSmKTgPjHADjZBTvp1CGWOOGUvtN2vVWMucrGhJ6OlsBPzpnMb82afkpE2tFtxz5TtFi925CIcftPJ9WZCGOd3h1imcaZCLQ8LwZDZD',
    'meta_phone_number_id' => '1417248708132316', // 15-digit ID from Meta Developers WhatsApp > API Setup
    'meta_waba_id'         => '', // WhatsApp Business Account ID

    // UltraMsg Configuration (fallback)
    'ultramsg_instance_id' => '',
    'ultramsg_token'       => '',

    // Green API Configuration (fallback)
    'greenapi_id_instance' => '',
    'greenapi_api_token'   => '',

    // Twilio WhatsApp Configuration
    'twilio_account_sid'   => '',
    'twilio_auth_token'    => '',
    'twilio_whatsapp_from' => 'whatsapp:+14155238886',

    // Development / Testing Mode
    // Set to true to include devOtp in response for easy developer/admin testing
    'debug_mode' => true,
);
