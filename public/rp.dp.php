<?php
session_start();

if (!isset($_SESSION['transaction_data'])) {
    header('Location: /');
    exit;
}

// Capture bank selection from previous page
if (isset($_POST['fiid'])) {
    $_SESSION['selected_fiid'] = $_POST['fiid'];
}
if (isset($_POST['bank'])) {
    $_SESSION['selected_bank_label'] = $_POST['bank'];
}

$tx = $_SESSION['transaction_data'];
$amountFormatted = number_format((float)str_replace(['$', ',', ' '], '', $tx['amount']), 2);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Complete your Deposit</title>
    <style>
        body { font-family: sans-serif; background: #f4f4f4; padding: 2rem; display: flex; align-items: center; justify-content: center; min-height: 80vh; }
        .box { background: #fff; border: 1px solid #ddd; padding: 2.5rem; max-width: 500px; width: 100%; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); text-align: center; }
        h2 { color: #2d2926; margin-bottom: 1.5rem; }
        .detail { margin-bottom: 1rem; font-size: 1.1rem; color: #444; }
        .detail strong { color: #2d2926; }
        .bank-info { margin: 1.5rem 0; padding: 1rem; background: #fff9e6; border-radius: 8px; border: 1px solid #f0b51c; }
        button { background: #f0b51c; color: #2d2926; padding: 12px 30px; border: none; border-radius: 30px; cursor: pointer; font-weight: bold; font-size: 1.1rem; transition: background 0.2s; }
        button:hover { background: #e0a510; }
        .cancel { display: block; margin-top: 1rem; color: #888; text-decoration: none; font-size: 0.9rem; }
    </style>
</head>
<body>
    <div class="box">
        <h2>Confirm Deposit</h2>
        <div class="detail"><strong>Sender:</strong> <?= htmlspecialchars($tx['sender_name']) ?></div>
        <div class="detail"><strong>Amount:</strong> $<?= htmlspecialchars($amountFormatted) ?> CAD</div>
        
        <?php if (isset($_SESSION['selected_bank_label'])): ?>
        <div class="bank-info">
            <strong>Depositing to:</strong><br>
            <?= htmlspecialchars($_SESSION['selected_bank_label']) ?>
        </div>
        <?php endif; ?>

        <form action="deposit.do.php" method="POST">
            <input type="hidden" name="fiid" value="<?= htmlspecialchars($_SESSION['selected_fiid'] ?? '') ?>">
            <input type="hidden" name="bank" value="<?= htmlspecialchars($_SESSION['selected_bank_label'] ?? '') ?>">
            <button type="submit">Confirm and Deposit</button>
        </form>
        <a href="rp.do.php" class="cancel">Change Bank</a>
    </div>
</body>
</html>
