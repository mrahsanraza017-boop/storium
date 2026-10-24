<?php
/**
 * STORIUM Pakistan — Email Configuration Settings
 *
 * Configures the order confirmation and notification email system.
 * Supports:
 *  1. 'smtp'   - Socket-based SMTP delivery (works with Gmail, cPanel webmail, Zoho, Hostinger, etc.)
 *  2. 'resend' - Resend API (via https://api.resend.com/emails)
 *  3. 'mail'   - Native PHP mail() function (standard cPanel/PHP hosting)
 *
 * Environment variables take precedence when set.
 */
return array(
    // Delivery method: 'smtp' | 'resend' | 'mail'
    'method' => 'mail',

    // Sender details
    'from_email' => 'orders@storium.online',
    'from_name'  => 'STORIUM Pakistan',
    'reply_to'   => 'support@storium.online',

    // Admin notification copy (BCC or separate notification)
    'admin_email' => 'admin@storium.online',
    'notify_admin' => true,

    // SMTP Settings (active when method is 'smtp' or fallback)
    'smtp_host'   => 'mail.storium.online',
    'smtp_port'   => 587,
    'smtp_user'   => '',
    'smtp_pass'   => '',
    'smtp_secure' => 'tls', // 'tls' | 'ssl' | 'none'
    'smtp_timeout' => 15,

    // Resend API (active when method is 'resend' or RESEND_API_KEY is provided)
    'resend_api_key' => '',

    // Store branding & concierge
    'store_name' => 'STORIUM Pakistan',
    'store_url'  => 'https://storium.online',
    'support_phone' => '+92 300 0000000',
    'support_whatsapp' => 'https://wa.me/923000000000',
);
