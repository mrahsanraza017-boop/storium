<?php
/**
 * STORIUM Pakistan — Send Email OTP Verification Endpoint
 * Dispatches a 6-digit security verification code to the customer's email.
 *
 * Supports:
 * 1. Native PHP mail() function (Works on Hostinger/cPanel out of the box)
 * 2. Standalone SMTP Socket Client (Hostinger Webmail, Gmail, Zoho, Outlook, etc.)
 * 3. Resend API (HTTP REST)
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

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!is_array($data) || empty($data['email'])) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'error' => 'A valid email address is required.'));
    exit;
}

$email = strtolower(trim((string)$data['email']));
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'error' => 'Invalid email address format.'));
    exit;
}

// 1. Load Email Configuration
function get_otp_email_config(): array {
    $defaults = array(
        'method'           => 'mail', // 'mail' | 'smtp' | 'resend'
        'from_email'       => 'orders@storium.online',
        'from_name'        => 'STORIUM Pakistan',
        'reply_to'         => 'support@storium.online',
        'admin_email'      => 'admin@storium.online',
        'smtp_host'        => 'mail.storium.online',
        'smtp_port'        => 587,
        'smtp_user'        => '',
        'smtp_pass'        => '',
        'smtp_secure'      => 'tls',
        'smtp_timeout'     => 15,
        'resend_api_key'   => '',
        'store_name'       => 'STORIUM Pakistan',
        'store_url'        => 'https://storium.online',
        'hmac_secret'      => 'storium_email_otp_secret_key_849201948',
        'debug_mode'       => true,
    );

    $configFile = __DIR__ . '/email-config.php';
    if (is_file($configFile)) {
        $fileData = require $configFile;
        if (is_array($fileData)) {
            $defaults = array_merge($defaults, $fileData);
        }
    }

    if (!empty($_ENV['RESEND_API_KEY'])) {
        $defaults['resend_api_key'] = $_ENV['RESEND_API_KEY'];
        $defaults['method'] = 'resend';
    }
    if (!empty($_ENV['SMTP_HOST'])) $defaults['smtp_host'] = $_ENV['SMTP_HOST'];
    if (!empty($_ENV['SMTP_USER'])) $defaults['smtp_user'] = $_ENV['SMTP_USER'];
    if (!empty($_ENV['SMTP_PASS'])) $defaults['smtp_pass'] = $_ENV['SMTP_PASS'];

    return $defaults;
}

$config = get_otp_email_config();

// 2. Generate 6-digit OTP code & expiration
$otp = !empty($data['clientOtp']) && preg_match('/^\d{6}$/', (string)$data['clientOtp'])
    ? (string)$data['clientOtp']
    : (string)random_int(100000, 999999);

$customerName = !empty($data['customerName']) ? trim(strip_tags((string)$data['customerName'])) : 'Valued Customer';
$orderTotalText = !empty($data['orderTotal']) ? 'Rs. ' . number_format((float)$data['orderTotal']) : '';
$expiresAt = time() + (10 * 60); // 10 minutes validity

// 3. Cryptographic HMAC Token
$hmacSecret = $config['hmac_secret'] ?? 'storium_email_otp_secret_key_849201948';
$token = hash_hmac('sha256', "{$email}:{$otp}:{$expiresAt}", $hmacSecret);

// 4. Mask email for privacy display (e.g. m***d@example.com)
$parts = explode('@', $email);
$namePart = $parts[0];
$domainPart = $parts[1] ?? 'example.com';
if (strlen($namePart) <= 2) {
    $maskedName = substr($namePart, 0, 1) . '***';
} else {
    $maskedName = substr($namePart, 0, 1) . str_repeat('*', min(4, strlen($namePart) - 2)) . substr($namePart, -1);
}
$maskedEmail = $maskedName . '@' . $domainPart;

// 5. Build Branded HTML Email Template
function render_otp_email_html(string $otp, string $customerName, string $orderTotalText, array $config): string {
    $storeName = htmlspecialchars($config['store_name'] ?? 'STORIUM Pakistan');
    $safeName = htmlspecialchars($customerName);
    $totalBlock = $orderTotalText !== '' ? '<p style="margin: 8px 0 0 0; color: #D4AF37; font-size: 13px; font-weight: 600;">Order Total: ' . htmlspecialchars($orderTotalText) . '</p>' : '';

    return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Verification Code — {$storeName}</title>
</head>
<body style="margin:0; padding:0; background-color:#0B0C0E; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#E8E8EC;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0B0C0E; padding:40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:540px; background-color:#121316; border:1px solid #262930; border-radius:24px; overflow:hidden; box-shadow:0 20px 40px rgba(0,0,0,0.8);">
          <!-- Header Bar -->
          <tr>
            <td align="center" style="padding:36px 30px 20px 30px; border-bottom:1px solid #1E2127; background:linear-gradient(180deg, #181A1F 0%, #121316 100%);">
              <span style="display:inline-block; font-size:10px; letter-spacing:3px; text-transform:uppercase; color:#D4AF37; font-weight:700; margin-bottom:8px;">STORIUM &bull; SECURE CHECKOUT</span>
              <h1 style="margin:0; font-size:24px; font-weight:700; color:#FFFFFF; letter-spacing:0.5px;">Order Verification Code</h1>
            </td>
          </tr>
          
          <!-- Content Body -->
          <tr>
            <td style="padding:32px 30px 24px 30px; text-align:center;">
              <p style="margin:0 0 16px 0; font-size:14px; color:#CBD0DC; line-height:1.6;">
                Salam <strong style="color:#FFFFFF;">{$safeName}</strong>,<br>
                Please use the following 6-digit verification code to confirm your order dispatch:
              </p>
              {$totalBlock}

              <!-- Code Display Box -->
              <table role="presentation" align="center" cellspacing="0" cellpadding="0" style="margin:28px auto 24px auto;">
                <tr>
                  <td align="center" style="background:#090A0D; border:2px solid #D4AF37; border-radius:16px; padding:18px 36px; box-shadow:0 0 25px rgba(212,175,55,0.2);">
                    <span style="font-family:'Courier New', Courier, monospace; font-size:36px; font-weight:800; letter-spacing:8px; color:#D4AF37; display:block;">
                      {$otp}
                    </span>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px 0; font-size:12px; color:#8E929E;">
                This security code is valid for <strong>10 minutes</strong>.
              </p>
              <p style="margin:0; font-size:11px; color:#626673; line-height:1.5;">
                If you did not initiate this checkout on STORIUM, please ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 30px; background-color:#0B0C0E; border-top:1px solid #1E2127; text-align:center; font-size:11px; color:#626673;">
              <p style="margin:0 0 4px 0;">STORIUM Pakistan &bull; Insured Luxury Nationwide Delivery</p>
              <p style="margin:0;">Showroom Concierge: +92 321 5993022 &bull; <a href="https://storium.online" style="color:#D4AF37; text-decoration:none;">storium.online</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}

$subject = "Your Verification Code: {$otp} — STORIUM";
$htmlBody = render_otp_email_html($otp, $customerName, $orderTotalText, $config);
$textBody = "Salam {$customerName}!\n\nYour STORIUM order verification code is: {$otp}\n\nThis code expires in 10 minutes.\n\n— STORIUM Pakistan";

// 6. Transports: Resend, SMTP, or PHP mail()
$dispatched = false;
$dispatchError = null;
$deliveryMethod = $config['method'] ?? 'mail';

// Transport A: Resend API
if ($deliveryMethod === 'resend' || (!empty($config['resend_api_key']))) {
    $apiKey = $config['resend_api_key'];
    if (!empty($apiKey)) {
        $ch = curl_init('https://api.resend.com/emails');
        $payload = array(
            'from'    => "{$config['from_name']} <{$config['from_email']}>",
            'to'      => array($email),
            'subject' => $subject,
            'html'    => $htmlBody,
            'text'    => $textBody,
        );
        curl_setopt_array($ch, array(
            CURLOPT_POST           => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => array(
                'Authorization: Bearer ' . $apiKey,
                'Content-Type: application/json',
            ),
            CURLOPT_POSTFIELDS     => json_encode($payload),
            CURLOPT_TIMEOUT        => 10,
        ));
        $resp = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr  = curl_error($ch);
        curl_close($ch);

        if ($httpCode >= 200 && $httpCode < 300) {
            $dispatched = true;
            $deliveryMethod = 'resend';
        } else {
            $dispatchError = "Resend API error: " . ($curlErr ?: $resp);
        }
    }
}

// Transport B: SMTP Socket (if configured)
if (!$dispatched && ($deliveryMethod === 'smtp' || !empty($config['smtp_user']))) {
    if (!empty($config['smtp_host']) && !empty($config['smtp_user'])) {
        $host = $config['smtp_host'];
        $port = (int) ($config['smtp_port'] ?: 587);
        $user = $config['smtp_user'];
        $pass = $config['smtp_pass'];
        $secure = strtolower($config['smtp_secure'] ?? 'tls');
        $timeout = (int) ($config['smtp_timeout'] ?: 10);

        $targetHost = ($secure === 'ssl') ? 'ssl://' . $host : $host;
        $socket = @fsockopen($targetHost, $port, $errno, $errstr, $timeout);

        if ($socket) {
            stream_set_timeout($socket, $timeout);
            $read = function() use ($socket) {
                $res = '';
                while ($l = fgets($socket, 515)) {
                    $res .= $l;
                    if (isset($l[3]) && $l[3] === ' ') break;
                }
                return $res;
            };
            $send = function($cmd) use ($socket, $read) {
                fputs($socket, $cmd . "\r\n");
                return $read();
            };

            $read(); // banner
            $send("EHLO " . ($_SERVER['SERVER_NAME'] ?? 'storium.online'));

            if ($secure === 'tls') {
                $send("STARTTLS");
                @stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
                $send("EHLO " . ($_SERVER['SERVER_NAME'] ?? 'storium.online'));
            }

            $send("AUTH LOGIN");
            $send(base64_encode($user));
            $authResp = $send(base64_encode($pass));

            if (substr($authResp, 0, 3) === '235') {
                $fromEmail = $config['from_email'];
                $send("MAIL FROM:<$fromEmail>");
                $send("RCPT TO:<$email>");
                $send("DATA");

                $boundary = '----=_Part_' . md5(uniqid((string) mt_rand(), true));
                $rawMsg  = "Date: " . date('r') . "\r\n";
                $rawMsg .= "From: =?UTF-8?B?" . base64_encode($config['from_name']) . "?= <$fromEmail>\r\n";
                $rawMsg .= "To: <$email>\r\n";
                $rawMsg .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
                $rawMsg .= "MIME-Version: 1.0\r\n";
                $rawMsg .= "Content-Type: multipart/alternative; boundary=\"$boundary\"\r\n\r\n";
                $rawMsg .= "--$boundary\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n$textBody\r\n\r\n";
                $rawMsg .= "--$boundary\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n$htmlBody\r\n\r\n";
                $rawMsg .= "--$boundary--\r\n.";

                $dataResp = $send($rawMsg);
                $send("QUIT");
                fclose($socket);

                if (substr($dataResp, 0, 3) === '250') {
                    $dispatched = true;
                    $deliveryMethod = 'smtp';
                } else {
                    $dispatchError = "SMTP Data submission failed: " . $dataResp;
                }
            } else {
                fclose($socket);
                $dispatchError = "SMTP Authentication failed: " . $authResp;
            }
        } else {
            $dispatchError = "SMTP connection could not be opened: $errstr";
        }
    }
}

// Transport C: Native PHP mail() function (Standard cPanel / Hostinger PHP)
if (!$dispatched) {
    $headers  = "MIME-Version: 1.0\r\n";
    $headers .= "From: =?UTF-8?B?" . base64_encode($config['from_name']) . "?= <" . $config['from_email'] . ">\r\n";
    if (!empty($config['reply_to'])) {
        $headers .= "Reply-To: <" . $config['reply_to'] . ">\r\n";
    }
    $headers .= "X-Mailer: STORIUM Security Mailer\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";

    $encodedSubject = "=?UTF-8?B?" . base64_encode($subject) . "?=";
    $sent = @mail($email, $encodedSubject, $htmlBody, $headers);

    if ($sent) {
        $dispatched = true;
        $deliveryMethod = 'mail';
    } else {
        $lastErr = error_get_last();
        $dispatchError = $dispatchError ?: ($lastErr['message'] ?? 'PHP mail() function returned false.');
    }
}

echo json_encode(array(
    'success'       => true,
    'email'         => $email,
    'maskedEmail'   => $maskedEmail,
    'token'         => $token,
    'expiresAt'     => $expiresAt,
    'dispatched'    => $dispatched,
    'method'        => $deliveryMethod,
    'error'         => $dispatched ? null : $dispatchError,
    'devOtp'        => !empty($config['debug_mode']) ? $otp : null,
));
