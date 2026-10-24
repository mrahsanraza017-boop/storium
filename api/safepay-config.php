<?php
/**
 * SafePay gateway credentials and settings.
 *
 * This file is intentionally GITIGNORED (see public/api/safepay-config.php in
 * .gitignore). Push real credentials only by deploying this build artifact;
 * never commit keys to the repository.
 *
 * Overrides: SAFEPAY_API_KEY, SAFEPAY_SECRET_KEY, SAFEPAY_ENVIRONMENT,
 * SAFEPAY_WEBHOOK_SECRET, SAFEPAY_BASE_URL, SUPABASE_URL,
 * SUPABASE_SERVICE_ROLE_KEY environment variables take precedence.
 */
return array(
    // Public API key (merchant_api_key sent in the session body).
    'api_key' => 'sec_ee509646-a3d2-404c-84e4-4dd7eba342bb',
    // Merchant secret key (X-SFPY-MERCHANT-SECRET auth header).
    'secret_key' => '629cca57a0e2618cf882196441e18b19b7b667015b0bdcd68ec91150d74c2a2e',
    // 'sandbox' or 'production'.
    'environment' => 'sandbox',
    // HMAC-SHA512 secret used to verify payment webhooks (set in SafePay dashboard).
    'webhook_secret' => '',
    // Public site URL that SafePay redirects the shopper back to.
    'base_url' => 'https://storium.online',
    // Supabase (service role) used by the webhook to mark orders paid/failed.
    'supabase_url' => 'https://jvghdtlfwijbkhwwpdft.supabase.co',
    'supabase_service_role_key' => '',
);