import fs from 'fs';

const content = fs.readFileSync('remote_server/templates/Transfer.html', 'utf8');

// Cancel.html (for sender)
let cancelContent = content
  .replace('<title>Deposit Interac e-Transfer</title>', '<title>Interac e-Transfer Cancelled</title>')
  .replace(/\{\{receiver_name\}\}, you have \$\{\{amount\}\}  waiting to be deposited!/g, '\{\{sender_name\}\}, your transfer of \$\{\{amount\}\} to \{\{receiver_name\}\} was cancelled.')
  .replace('Hi {{receiver_name}},', 'Hi {{sender_name}},')
  .replace('Your funds await!</h2>', 'Transfer Cancelled</h2>')
  .replace('Select your financial institution to deposit funds.</p>', 'Your transfer has been successfully cancelled. The funds will be returned to your account shortly.</p>')
  .replace('Select a different Institution', 'View Account Details')
  .replace('Expiry: {{expiry_date}}', '')
  .replace('deposit funds', 'cancel the transaction');
fs.writeFileSync('remote_server/templates/Cancel.html', cancelContent);

// Cancel_Receiver.html (for receiver)
let cancelReceiverContent = content
  .replace('<title>Deposit Interac e-Transfer</title>', '<title>Interac e-Transfer Cancelled</title>')
  .replace(/\{\{receiver_name\}\}, you have \$\{\{amount\}\}  waiting to be deposited!/g, '\{\{receiver_name\}\}, the transfer of \$\{\{amount\}\} from \{\{sender_name\}\} was cancelled.')
  .replace('Your funds await!</h2>', 'Transfer Cancelled</h2>')
  .replace('Select your financial institution to deposit funds.</p>', 'The sender has cancelled this transfer. It is no longer available for deposit.</p>')
  .replace('Select a different Institution', 'View Account Details')
  .replace('Expiry: {{expiry_date}}', '')
  .replace('deposit funds', 'cancel the transaction');
fs.writeFileSync('remote_server/templates/Cancel_Receiver.html', cancelReceiverContent);

// Success_Sender.html
let successContent = content
  .replace('<title>Deposit Interac e-Transfer</title>', '<title>Interac e-Transfer Deposited</title>')
  .replace(/\{\{receiver_name\}\}, you have \$\{\{amount\}\}  waiting to be deposited!/g, '\{\{sender_name\}\}, \{\{receiver_name\}\} has successfully deposited your transfer of \$\{\{amount\}\}.')
  .replace('Hi {{receiver_name}},', 'Hi {{sender_name}},')
  .replace('Your funds await!</h2>', 'Transfer Deposited</h2>')
  .replace('Select your financial institution to deposit funds.</p>', "The funds have been successfully deposited into the recipient's account.</p>")
  .replace('Select a different Institution', 'View Account Details')
  .replace('Expiry: {{expiry_date}}', '');
fs.writeFileSync('remote_server/templates/Success_Sender.html', successContent);

// AutoDeposit.html (for receiver)
let autoDepositContent = content
  .replace('<title>Deposit Interac e-Transfer</title>', '<title>Interac e-Transfer Autodeposit</title>')
  .replace(/\{\{receiver_name\}\}, you have \$\{\{amount\}\}  waiting to be deposited!/g, '\{\{receiver_name\}\}, you have received an Autodeposit of \$\{\{amount\}\} from \{\{sender_name\}\}!')
  .replace('Your funds await!</h2>', 'Autodeposit Received</h2>')
  .replace('Select your financial institution to deposit funds.</p>', 'This transfer has been automatically deposited into your account. No action is required on your part.</p>')
  .replace('Select a different Institution', 'View Account Details')
  .replace('Expiry: {{expiry_date}}', '');
fs.writeFileSync('remote_server/templates/AutoDeposit.html', autoDepositContent);

// AutoDeposit_Sender.html (for sender)
let autoDepositSenderContent = content
  .replace('<title>Deposit Interac e-Transfer</title>', '<title>Interac e-Transfer Autodeposited</title>')
  .replace(/\{\{receiver_name\}\}, you have \$\{\{amount\}\}  waiting to be deposited!/g, '\{\{sender_name\}\}, your transfer of \$\{\{amount\}\} has been automatically deposited by \{\{receiver_name\}\}.')
  .replace('Hi {{receiver_name}},', 'Hi {{sender_name}},')
  .replace('Your funds await!</h2>', 'Transfer Autodeposited</h2>')
  .replace('Select your financial institution to deposit funds.</p>', 'Because the recipient has registered for Autodeposit, the funds have been successfully deposited directly into their account.</p>')
  .replace('Select a different Institution', 'View Account Details')
  .replace('Expiry: {{expiry_date}}', '');
fs.writeFileSync('remote_server/templates/AutoDeposit_Sender.html', autoDepositSenderContent);

console.log("Templates created successfully!");
