<?php
/**
 * POST /api/send-order-email.php
 *
 * Sends luxury order confirmation receipts and status notifications to customers
 * and store administrators.
 *
 * Supports:
 * 1. Resend API (HTTP REST)
 * 2. Standalone Pure-PHP SMTP Client (RFC 5321 / TLS / SSL, no Composer required)
 * 3. Native PHP mail() function
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(array('success' => false, 'error' => 'Method not allowed. Use POST.'));
    exit;
}

// 1. Load config
function get_email_config(): array {
    $defaults = array(
        'method'           => 'mail',
        'from_email'       => 'orders@storium.online',
        'from_name'        => 'STORIUM Pakistan',
        'reply_to'         => 'support@storium.online',
        'admin_email'      => '',
        'notify_admin'     => true,
        'smtp_host'        => '',
        'smtp_port'        => 587,
        'smtp_user'        => '',
        'smtp_pass'        => '',
        'smtp_secure'      => 'tls',
        'smtp_timeout'     => 15,
        'resend_api_key'   => '',
        'store_name'       => 'STORIUM Pakistan',
        'store_url'        => 'https://storium.online',
        'support_phone'    => '+92 300 0000000',
        'support_whatsapp' => 'https://wa.me/923000000000',
    );

    $configFile = __DIR__ . '/email-config.php';
    if (is_file($configFile)) {
        $fileData = require $configFile;
        if (is_array($fileData)) {
            $defaults = array_merge($defaults, $fileData);
        }
    }

    $envMap = array(
        'method'         => 'EMAIL_METHOD',
        'from_email'     => 'FROM_EMAIL',
        'from_name'      => 'FROM_NAME',
        'reply_to'       => 'REPLY_TO_EMAIL',
        'admin_email'    => 'ADMIN_EMAIL',
        'smtp_host'      => 'SMTP_HOST',
        'smtp_port'      => 'SMTP_PORT',
        'smtp_user'      => 'SMTP_USER',
        'smtp_pass'      => 'SMTP_PASS',
        'smtp_secure'    => 'SMTP_SECURE',
        'resend_api_key' => 'RESEND_API_KEY',
        'store_name'     => 'STORE_NAME',
        'store_url'      => 'BASE_URL',
    );

    foreach ($envMap as $key => $envName) {
        $val = getenv($envName);
        if ($val !== false && $val !== '') {
            $defaults[$key] = $val;
        }
    }

    return $defaults;
}

// 2. Parse input JSON
$rawBody = file_get_contents('php://input');
$payload = json_decode($rawBody ?: '', true);

if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'error' => 'Invalid JSON payload.'));
    exit;
}

$type = (string) ($payload['type'] ?? 'order_confirmation');
$order = is_array($payload['order'] ?? null) ? $payload['order'] : array();
$customRecipient = trim((string) ($payload['to'] ?? ''));

$config = get_email_config();

// If preview only requested, return the generated HTML without sending
if (!empty($payload['preview_only'])) {
    $html = render_order_email_html($order, $config, $type);
    echo json_encode(array('success' => true, 'html' => $html));
    exit;
}

// Determine recipient
$recipientEmail = '';
$recipientName = 'Valued Customer';

if ($customRecipient !== '') {
    $recipientEmail = $customRecipient;
    $recipientName = (string) ($payload['name'] ?? 'STORIUM Client');
} elseif (!empty($order['customer']['email'])) {
    $recipientEmail = trim((string) $order['customer']['email']);
    $recipientName = trim((string) ($order['customer']['fullName'] ?? 'Valued Customer'));
}

if ($recipientEmail === '' || !filter_var($recipientEmail, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'error' => 'Missing or invalid recipient email address.'));
    exit;
}

// Subject line
$orderNum = (string) ($order['orderNumber'] ?? 'Pending');
if ($type === 'test') {
    $subject = 'STORIUM Pakistan — Email Service Test & Verification';
} elseif ($type === 'payment_receipt') {
    $subject = 'Payment Confirmed — Order #' . $orderNum . ' — STORIUM Pakistan';
} else {
    $subject = 'Order Confirmation — Order #' . $orderNum . ' — STORIUM Pakistan';
}

$htmlContent = render_order_email_html($order, $config, $type);
$textContent = strip_tags(str_replace(array('<br>', '<br/>', '</p>', '</tr>'), "\n", $htmlContent));

// Send the email
$sendResult = send_email_message($config, $recipientEmail, $recipientName, $subject, $htmlContent, $textContent);

// Send admin copy if enabled
if ($sendResult['success'] && !empty($config['admin_email']) && $config['notify_admin'] && $type !== 'test' && $recipientEmail !== $config['admin_email']) {
    $adminSubject = '[New Order Alert] ' . $subject;
    send_email_message($config, $config['admin_email'], 'STORIUM Admin', $adminSubject, $htmlContent, $textContent);
}

if ($sendResult['success']) {
    http_response_code(200);
    echo json_encode(array(
        'success' => true,
        'message' => 'Confirmation email successfully dispatched to ' . $recipientEmail,
        'method' => $sendResult['method'],
        'orderNumber' => $orderNum,
    ));
} else {
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'error' => $sendResult['error'] ?? 'Failed to send confirmation email.',
        'method' => $sendResult['method'] ?? 'unknown',
    ));
}

// -------------------------------------------------------------
// Core Email Dispatcher
// -------------------------------------------------------------
function send_email_message(array $config, string $toEmail, string $toName, string $subject, string $htmlBody, string $textBody): array {
    // 1. Resend API
    if (!empty($config['resend_api_key'])) {
        $resendResult = send_via_resend($config, $toEmail, $toName, $subject, $htmlBody, $textBody);
        if ($resendResult['success']) {
            return array('success' => true, 'method' => 'resend');
        }
    }

    // 2. SMTP Delivery (if SMTP host & user/credentials are set)
    if (!empty($config['smtp_host']) && !empty($config['smtp_user'])) {
        $smtpResult = send_via_smtp_socket($config, $toEmail, $toName, $subject, $htmlBody, $textBody);
        if ($smtpResult['success']) {
            return array('success' => true, 'method' => 'smtp');
        }
    }

    // 3. Standard PHP mail() fallback
    $mailResult = send_via_php_mail($config, $toEmail, $toName, $subject, $htmlBody);
    if ($mailResult['success']) {
        return array('success' => true, 'method' => 'php_mail');
    }

    return array(
        'success' => false,
        'method'  => 'all_failed',
        'error'   => $mailResult['error'] ?? 'All delivery methods failed.',
    );
}

// -------------------------------------------------------------
// Resend API Transport
// -------------------------------------------------------------
function send_via_resend(array $config, string $toEmail, string $toName, string $subject, string $htmlBody, string $textBody): array {
    $apiKey = $config['resend_api_key'];
    $from = $config['from_name'] . ' <' . $config['from_email'] . '>';
    if (strpos($config['from_email'], 'resend.dev') !== false || empty($config['from_email'])) {
        $from = 'STORIUM <onboarding@resend.dev>';
    }

    $payload = array(
        'from'    => $from,
        'to'      => array($toEmail),
        'subject' => $subject,
        'html'    => $htmlBody,
        'text'    => $textBody,
    );

    if (!empty($config['reply_to'])) {
        $payload['reply_to'] = $config['reply_to'];
    }

    $ch = curl_init('https://api.resend.com/emails');
    if ($ch === false) {
        return array('success' => false, 'error' => 'curl_init failed');
    }

    curl_setopt_array($ch, array(
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => array(
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
        ),
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_TIMEOUT        => 15,
    ));

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr  = curl_error($ch);
    curl_close($ch);

    if ($curlErr !== '' || $httpCode < 200 || $httpCode >= 300) {
        return array('success' => false, 'error' => 'Resend Error: ' . ($curlErr ?: $response));
    }

    return array('success' => true);
}

// -------------------------------------------------------------
// Native PHP mail() Transport
// -------------------------------------------------------------
function send_via_php_mail(array $config, string $toEmail, string $toName, string $subject, string $htmlBody): array {
    $boundary = '----=_NextPart_' . md5(uniqid((string) mt_rand(), true));
    
    $headers  = "MIME-Version: 1.0\r\n";
    $headers .= "From: =?UTF-8?B?" . base64_encode($config['from_name']) . "?= <" . $config['from_email'] . ">\r\n";
    if (!empty($config['reply_to'])) {
        $headers .= "Reply-To: <" . $config['reply_to'] . ">\r\n";
    }
    $headers .= "X-Mailer: STORIUM Concierge Mailer\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "Content-Transfer-Encoding: base64\r\n";

    $encodedSubject = "=?UTF-8?B?" . base64_encode($subject) . "?=";
    $encodedBody    = chunk_split(base64_encode($htmlBody));

    $sent = @mail($toEmail, $encodedSubject, $encodedBody, $headers);

    if ($sent) {
        return array('success' => true);
    }

    $lastErr = error_get_last();
    return array('success' => false, 'error' => $lastErr['message'] ?? 'PHP mail() function returned false.');
}

// -------------------------------------------------------------
// Standalone SMTP Socket Client
// -------------------------------------------------------------
function send_via_smtp_socket(array $config, string $toEmail, string $toName, string $subject, string $htmlBody, string $textBody): array {
    $host = $config['smtp_host'];
    $port = (int) ($config['smtp_port'] ?: 587);
    $user = $config['smtp_user'];
    $pass = $config['smtp_pass'];
    $secure = strtolower($config['smtp_secure'] ?? 'tls');
    $timeout = (int) ($config['smtp_timeout'] ?: 15);

    $targetHost = ($secure === 'ssl') ? 'ssl://' . $host : $host;
    $socket = @fsockopen($targetHost, $port, $errno, $errstr, $timeout);

    if (!$socket) {
        return array('success' => false, 'error' => "SMTP Connection failed: $errstr ($errno)");
    }

    stream_set_timeout($socket, $timeout);

    $readResponse = function() use ($socket) {
        $response = '';
        while ($line = fgets($socket, 515)) {
            $response .= $line;
            if (substr($line, 3, 1) === ' ') break;
        }
        return $response;
    };

    $sendCommand = function($cmd) use ($socket, $readResponse) {
        fputs($socket, $cmd . "\r\n");
        return $readResponse();
    };

    $initial = $readResponse();
    if (substr($initial, 0, 3) !== '220') {
        fclose($socket);
        return array('success' => false, 'error' => 'SMTP greeting failed: ' . $initial);
    }

    $ehlo = $sendCommand('EHLO storium.online');

    // Handle STARTTLS
    if ($secure === 'tls' && strpos($ehlo, 'STARTTLS') !== false) {
        $starttls = $sendCommand('STARTTLS');
        if (substr($starttls, 0, 3) !== '220') {
            fclose($socket);
            return array('success' => false, 'error' => 'STARTTLS failed: ' . $starttls);
        }
        $cryptoMethod = STREAM_CRYPTO_METHOD_TLS_CLIENT;
        if (defined('STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT')) {
            $cryptoMethod |= STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT;
        }
        if (defined('STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT')) {
            $cryptoMethod |= STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT;
        }
        if (!stream_socket_enable_crypto($socket, true, $cryptoMethod)) {
            fclose($socket);
            return array('success' => false, 'error' => 'TLS handshake failed.');
        }
        $sendCommand('EHLO storium.online');
    }

    // Authenticate
    if ($user !== '') {
        $authResp = $sendCommand('AUTH LOGIN');
        if (substr($authResp, 0, 3) !== '334') {
            fclose($socket);
            return array('success' => false, 'error' => 'AUTH LOGIN rejected: ' . $authResp);
        }
        $userResp = $sendCommand(base64_encode($user));
        if (substr($userResp, 0, 3) !== '334') {
            fclose($socket);
            return array('success' => false, 'error' => 'SMTP Username rejected: ' . $userResp);
        }
        $passResp = $sendCommand(base64_encode($pass));
        if (substr($passResp, 0, 3) !== '235') {
            fclose($socket);
            return array('success' => false, 'error' => 'SMTP Password rejected: ' . $passResp);
        }
    }

    // Set envelope sender & recipient
    $fromEmail = $config['from_email'];
    $mailFrom = $sendCommand("MAIL FROM:<$fromEmail>");
    if (substr($mailFrom, 0, 3) !== '250') {
        fclose($socket);
        return array('success' => false, 'error' => 'MAIL FROM error: ' . $mailFrom);
    }

    $rcptTo = $sendCommand("RCPT TO:<$toEmail>");
    if (substr($rcptTo, 0, 3) !== '250') {
        fclose($socket);
        return array('success' => false, 'error' => 'RCPT TO error: ' . $rcptTo);
    }

    // Send DATA
    $dataCmd = $sendCommand('DATA');
    if (substr($dataCmd, 0, 3) !== '354') {
        fclose($socket);
        return array('success' => false, 'error' => 'DATA initiation failed: ' . $dataCmd);
    }

    $boundary = '----=_Part_' . md5(uniqid((string) mt_rand(), true));

    $headers = array();
    $headers[] = "Date: " . date('r');
    $headers[] = "From: =?UTF-8?B?" . base64_encode($config['from_name']) . "?= <$fromEmail>";
    $headers[] = "To: =?UTF-8?B?" . base64_encode($toName) . "?= <$toEmail>";
    if (!empty($config['reply_to'])) {
        $headers[] = "Reply-To: <" . $config['reply_to'] . ">";
    }
    $headers[] = "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=";
    $headers[] = "MIME-Version: 1.0";
    $headers[] = "Content-Type: multipart/alternative; boundary=\"$boundary\"";
    $headers[] = "X-Mailer: STORIUM Luxury Mailer";

    $rawMessage  = implode("\r\n", $headers) . "\r\n\r\n";
    $rawMessage .= "--$boundary\r\n";
    $rawMessage .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $rawMessage .= "Content-Transfer-Encoding: base64\r\n\r\n";
    $rawMessage .= chunk_split(base64_encode($textBody)) . "\r\n";

    $rawMessage .= "--$boundary\r\n";
    $rawMessage .= "Content-Type: text/html; charset=UTF-8\r\n";
    $rawMessage .= "Content-Transfer-Encoding: base64\r\n\r\n";
    $rawMessage .= chunk_split(base64_encode($htmlBody)) . "\r\n";
    $rawMessage .= "--$boundary--\r\n";
    $rawMessage .= "."; // Ending dot

    $sendData = $sendCommand($rawMessage);
    $sendCommand('QUIT');
    fclose($socket);

    if (substr($sendData, 0, 3) !== '250') {
        return array('success' => false, 'error' => 'DATA submission failed: ' . $sendData);
    }

    return array('success' => true);
}

// -------------------------------------------------------------
// Luxury Branded HTML Email Template Generator
// -------------------------------------------------------------
function render_order_email_html(array $order, array $config, string $type): string {
    $orderNumber = htmlspecialchars((string) ($order['orderNumber'] ?? 'STM-PK-0000'));
    $orderDate = !empty($order['date']) ? date('M d, Y - h:i A', strtotime($order['date'])) : date('M d, Y - h:i A');
    $trackingNumber = htmlspecialchars((string) ($order['trackingNumber'] ?? 'TCS-TRACKING-PENDING'));
    
    $customer = is_array($order['customer'] ?? null) ? $order['customer'] : array();
    $customerName = htmlspecialchars((string) ($customer['fullName'] ?? 'Valued Customer'));
    $customerEmail = htmlspecialchars((string) ($customer['email'] ?? ''));
    $customerPhone = htmlspecialchars((string) ($customer['phone'] ?? ''));
    $customerAddress = htmlspecialchars((string) ($customer['address'] ?? ''));
    $customerCity = htmlspecialchars((string) ($customer['city'] ?? ''));
    $customerProvince = htmlspecialchars((string) ($customer['province'] ?? 'Pakistan'));
    
    $paymentMethod = ($order['paymentMethod'] ?? '') === 'card' ? 'Online Payment (Debit / Credit Card via SafePay)' : 'Cash on Delivery (COD)';
    $paymentStatus = strtoupper((string) ($order['paymentStatus'] ?? 'PENDING'));
    $paymentColor = ($paymentStatus === 'PAID') ? '#34D399' : '#D4AF37';

    $subtotal = number_format((float) ($order['subtotal'] ?? 0));
    $shippingFee = (float) ($order['shippingFee'] ?? 0);
    $shippingText = $shippingFee == 0 ? 'FREE Luxury Courier' : 'Rs. ' . number_format($shippingFee);
    $total = number_format((float) ($order['total'] ?? 0));

    $items = is_array($order['items'] ?? null) ? $order['items'] : array();
    
    $itemRowsHtml = '';
    if (empty($items)) {
        $itemRowsHtml = '<tr><td colspan="3" style="padding: 18px; text-align: center; color: #A0A5B5; font-size: 13px;">Item details are being processed by our concierge.</td></tr>';
    } else {
        foreach ($items as $item) {
            $name = htmlspecialchars((string) ($item['productName'] ?? 'STORIUM Timepiece'));
            $qty = (int) ($item['quantity'] ?? 1);
            $price = number_format((float) ($item['price'] ?? 0));
            $rowTotal = number_format((float) (($item['price'] ?? 0) * $qty));
            $thumbnail = !empty($item['productThumbnail']) ? htmlspecialchars((string) $item['productThumbnail']) : 'https://storium.online/logo.png';
            
            $variantText = '';
            if (!empty($item['selectedVariant']) && is_array($item['selectedVariant'])) {
                $varParts = array();
                foreach ($item['selectedVariant'] as $k => $v) {
                    $varParts[] = htmlspecialchars($k . ': ' . $v);
                }
                $variantText = '<div style="font-size: 11px; color: #D4AF37; margin-top: 4px;">' . implode(' | ', $varParts) . '</div>';
            }

            $itemRowsHtml .= '
            <tr style="border-bottom: 1px solid #232730;">
                <td style="padding: 16px 8px 16px 0; vertical-align: top; width: 60px;">
                    <img src="' . $thumbnail . '" alt="' . $name . '" width="54" height="54" style="border-radius: 8px; border: 1px solid #323744; object-fit: cover; display: block;" />
                </td>
                <td style="padding: 16px 12px; vertical-align: top;">
                    <div style="font-size: 14px; font-weight: 600; color: #FFFFFF; line-height: 1.4;">' . $name . '</div>
                    <div style="font-size: 12px; color: #8F95A5; margin-top: 2px;">Qty: ' . $qty . ' &times; Rs. ' . $price . '</div>
                    ' . $variantText . '
                </td>
                <td style="padding: 16px 0 16px 12px; vertical-align: top; text-align: right; font-size: 14px; font-weight: 700; color: #D4AF37; white-space: nowrap;">
                    Rs. ' . $rowTotal . '
                </td>
            </tr>';
        }
    }

    $headingBadge = ($type === 'payment_receipt' || $paymentStatus === 'PAID')
        ? 'PAYMENT CONFIRMED'
        : 'ORDER CONFIRMED';

    $headingText = ($type === 'payment_receipt' || $paymentStatus === 'PAID')
        ? 'Thank you for your payment'
        : 'Thank you for your order';

    $subHeading = ($type === 'payment_receipt' || $paymentStatus === 'PAID')
        ? 'Your payment has been successfully verified. Your luxury timepiece is being carefully prepared for white-glove dispatch.'
        : 'We have received your order request. Our concierge will review the details and confirm dispatch shortly.';

    return '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>' . $headingBadge . ' — STORIUM Pakistan</title>
    <style>
        body { margin: 0; padding: 0; background-color: #0B0C0E; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #E8E8EC; -webkit-font-smoothing: antialiased; }
        table { border-collapse: collapse; }
        a { color: #D4AF37; text-decoration: none; }
    </style>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #0B0C0E;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center">
                <!-- Main Container -->
                <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #121418; border: 1px solid #262933; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
                    
                    <!-- Top Gold Accent Bar -->
                    <tr>
                        <td height="4" style="background: linear-gradient(90deg, #D4AF37, #FFF2A8, #D4AF37); font-size: 1px; line-height: 1px;">&nbsp;</td>
                    </tr>

                    <!-- Header Brand Banner -->
                    <tr>
                        <td style="padding: 32px 32px 24px 32px; text-align: center; border-bottom: 1px solid #1F232B;">
                            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center">
                                        <div style="font-family: Georgia, serif; font-size: 24px; font-weight: 700; letter-spacing: 0.3em; color: #F5F5F7; text-transform: uppercase;">STORIUM</div>
                                        <div style="font-size: 10px; letter-spacing: 0.4em; color: #D4AF37; text-transform: uppercase; margin-top: 4px; font-weight: 600;">Haute Horlogerie & Concierge</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Hero Confirmation Section -->
                    <tr>
                        <td style="padding: 32px 32px 20px 32px; text-align: center;">
                            <div style="display: inline-block; padding: 6px 14px; background-color: rgba(212, 175, 55, 0.12); border: 1px solid rgba(212, 175, 55, 0.35); border-radius: 30px; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; color: #D4AF37; text-transform: uppercase;">
                                ' . $headingBadge . '
                            </div>
                            <h1 style="font-family: Georgia, serif; font-size: 26px; font-weight: 700; color: #FFFFFF; margin: 16px 0 10px 0; line-height: 1.3;">' . $headingText . '</h1>
                            <p style="font-size: 14px; color: #A0A5B5; line-height: 1.6; margin: 0 auto; max-width: 480px;">' . $subHeading . '</p>
                        </td>
                    </tr>

                    <!-- Order Metadata Card -->
                    <tr>
                        <td style="padding: 0 32px 24px 32px;">
                            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0B0C0E; border: 1px solid #232730; border-radius: 12px; padding: 18px 20px;">
                                <tr>
                                    <td style="width: 50%; padding: 6px 0;">
                                        <div style="font-size: 11px; color: #787D8E; text-transform: uppercase; letter-spacing: 0.05em;">Order Number</div>
                                        <div style="font-size: 14px; font-weight: 700; color: #D4AF37; font-family: monospace; margin-top: 3px;">' . $orderNumber . '</div>
                                    </td>
                                    <td style="width: 50%; padding: 6px 0; text-align: right;">
                                        <div style="font-size: 11px; color: #787D8E; text-transform: uppercase; letter-spacing: 0.05em;">Order Date</div>
                                        <div style="font-size: 13px; font-weight: 600; color: #E8E8EC; margin-top: 3px;">' . $orderDate . '</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="width: 50%; padding: 10px 0 0 0; border-top: 1px solid #1B1E26;">
                                        <div style="font-size: 11px; color: #787D8E; text-transform: uppercase; letter-spacing: 0.05em;">Payment Status</div>
                                        <div style="font-size: 13px; font-weight: 700; color: ' . $paymentColor . '; margin-top: 3px;">' . $paymentStatus . '</div>
                                    </td>
                                    <td style="width: 50%; padding: 10px 0 0 0; text-align: right; border-top: 1px solid #1B1E26;">
                                        <div style="font-size: 11px; color: #787D8E; text-transform: uppercase; letter-spacing: 0.05em;">Tracking ID</div>
                                        <div style="font-size: 12px; font-weight: 600; color: #E8E8EC; font-family: monospace; margin-top: 3px;">' . $trackingNumber . '</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Items Table -->
                    <tr>
                        <td style="padding: 0 32px 24px 32px;">
                            <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #D4AF37; margin-bottom: 12px;">Purchased Items</div>
                            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0B0C0E; border: 1px solid #232730; border-radius: 12px; padding: 4px 18px;">
                                ' . $itemRowsHtml . '
                            </table>
                        </td>
                    </tr>

                    <!-- Order Total Summary -->
                    <tr>
                        <td style="padding: 0 32px 28px 32px;">
                            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #171920; border: 1px solid #262933; border-radius: 12px; padding: 16px 20px;">
                                <tr>
                                    <td style="padding: 4px 0; font-size: 13px; color: #8F95A5;">Subtotal</td>
                                    <td style="padding: 4px 0; font-size: 13px; color: #E8E8EC; text-align: right;">Rs. ' . $subtotal . '</td>
                                </tr>
                                <tr>
                                    <td style="padding: 4px 0; font-size: 13px; color: #8F95A5;">Shipping & Insurance</td>
                                    <td style="padding: 4px 0; font-size: 13px; color: #34D399; text-align: right; font-weight: 600;">' . $shippingText . '</td>
                                </tr>
                                <tr>
                                    <td style="padding: 4px 0; font-size: 13px; color: #8F95A5;">Payment Method</td>
                                    <td style="padding: 4px 0; font-size: 12px; color: #D4AF37; text-align: right; font-weight: 600;">' . $paymentMethod . '</td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="padding: 8px 0 0 0; border-top: 1px solid #262933;">
                                        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td style="font-size: 15px; font-weight: 700; color: #FFFFFF;">Grand Total (PKR)</td>
                                                <td style="font-size: 18px; font-weight: 800; color: #D4AF37; text-align: right;">Rs. ' . $total . '</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Customer & Delivery Address -->
                    <tr>
                        <td style="padding: 0 32px 28px 32px;">
                            <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #D4AF37; margin-bottom: 12px;">Delivery Details</div>
                            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0B0C0E; border: 1px solid #232730; border-radius: 12px; padding: 18px 20px;">
                                <tr>
                                    <td>
                                        <div style="font-size: 14px; font-weight: 700; color: #FFFFFF;">' . $customerName . '</div>
                                        <div style="font-size: 13px; color: #A0A5B5; margin-top: 4px; line-height: 1.5;">
                                            ' . $customerAddress . '<br />
                                            ' . $customerCity . ', ' . $customerProvince . '
                                        </div>
                                        <div style="font-size: 13px; color: #A0A5B5; margin-top: 8px;">
                                            <strong style="color: #E8E8EC;">Phone:</strong> ' . $customerPhone . ' &nbsp;|&nbsp; <strong style="color: #E8E8EC;">Email:</strong> ' . $customerEmail . '
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Concierge & Support Box -->
                    <tr>
                        <td style="padding: 0 32px 32px 32px; text-align: center;">
                            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background: rgba(212, 175, 55, 0.05); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 12px; padding: 20px;">
                                <tr>
                                    <td align="center">
                                        <div style="font-size: 14px; font-weight: 700; color: #FFFFFF;">Need Assistance With Your Order?</div>
                                        <div style="font-size: 12px; color: #A0A5B5; margin-top: 6px; line-height: 1.5;">Our luxury concierge is available 7 days a week for inquiries, delivery updates, and sizing adjustments.</div>
                                        <div style="margin-top: 14px;">
                                            <a href="' . htmlspecialchars($config['support_whatsapp']) . '" style="display: inline-block; padding: 10px 20px; background-color: #D4AF37; color: #0B0C0E; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; border-radius: 8px; margin: 4px;">WhatsApp Concierge</a>
                                            <a href="' . htmlspecialchars($config['store_url']) . '/account" style="display: inline-block; padding: 10px 20px; background-color: #1F232B; border: 1px solid #323744; color: #FFFFFF; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; border-radius: 8px; margin: 4px;">View in Account</a>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 32px 32px 32px; background-color: #08090A; border-top: 1px solid #1F232B; text-align: center;">
                            <div style="font-size: 11px; color: #626673; line-height: 1.6;">
                                &copy; ' . date('Y') . ' STORIUM Pakistan. All rights reserved.<br />
                                High-End Luxury Timepieces & Curated Gentlemen\'s Accessories.<br />
                                This is an automated order confirmation and official purchase receipt.
                            </div>
                        </td>
                    </tr>

                </table>
                <!-- End Main Container -->
            </td>
        </tr>
    </table>
</body>
</html>';
}
