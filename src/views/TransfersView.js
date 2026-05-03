import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, AnimatePresence, LayoutGroup, useMotionValue, useTransform } from 'motion/react';
import { ChevronDown, ArrowLeft, HelpCircle, ArrowRight, ChevronRight, Plus, X, Search, Star, UserPlus, Send } from 'lucide-react';
import { AddContactView } from '../components/AddContactView';
import { EditContactView } from '../components/EditContactView';
import { AccountSelector } from '../components/AccountSelector';
import { ContactSelector } from '../components/ContactSelector';
import { OTPVerification } from '../components/OTPVerification';
import ProcessingOverlay from '../etransfer/components/ProcessingOverlay';
import ReceiptView from '../components/ReceiptView';
import { useBank } from '../shared/BankContext';
import { useSocket } from '../shared/SocketContext';
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: 'CAD',
    }).format(amount);
};
const TransfersView = ({ accounts, setAccounts, transferLimit, userName, onBack, onSettings, contacts: initialContacts, onTransfer, defaultFromAccount, theme }) => {
    const { user, updateUser, cancelTransfer, resendTransfer, performETransfer, requestETransfer } = useBank();
    const { emitAction, on, off } = useSocket();
    const [notification, setNotification] = useState(null);
    const [showCancelConfirm, setShowCancelConfirm] = useState(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelReceipt, setShowCancelReceipt] = useState(false);
    const [cancelledTransferData, setCancelledTransferData] = useState(null);
    const [showResendConfirm, setShowResendConfirm] = useState(null);
    const [isResending, setIsResending] = useState(false);
    const [showResendReceipt, setShowResendReceipt] = useState(false);
    const [resentTransferData, setResentTransferData] = useState(null);
    const [showManageContacts, setShowManageContacts] = useState(false);
    const [editingContact, setEditingContact] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [contacts, setContacts] = useState(initialContacts);
    const toggleFavorite = (id) => {
        if (!user)
            return;
        const contact = user.contacts.find(c => c.id === id);
        if (!contact)
            return;
        const updatedContacts = user.contacts.map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c);
        const favoriteCount = updatedContacts.filter(c => c.isFavorite).length;
        if (!contact.isFavorite && favoriteCount > 5) {
            return;
        }
        updateUser({ contacts: updatedContacts });
    };
    const filteredContacts = user?.contacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())) || [];
    const favorites = filteredContacts.filter(c => c.isFavorite);
    const allContacts = [...filteredContacts].sort((a, b) => a.name.localeCompare(b.name));
    useEffect(() => {
        if (user?.contacts) {
            setContacts(user.contacts);
        }
    }, [user?.contacts]);
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);
    const handleCancel = (id) => {
        setShowCancelConfirm(id);
    };
    const confirmCancel = async () => {
        if (!showCancelConfirm)
            return;
        const transferId = showCancelConfirm;
        const pendingTransfers = user?.pendingTransfers || [];
        const transfer = pendingTransfers.find(t => t.id === transferId);
        if (!transfer)
            return;
        setShowCancelConfirm(null);
        setIsCancelling(true);
        setTransferStage('sending');
        try {
            await cancelTransfer(transferId);
            const dt = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            setCancelledTransferData({
                recipientName: transfer.recipientName,
                amount: `$${transfer.amount.toFixed(2)}`,
                date: dt,
                status: 'Cancelled',
                referenceNumber: transfer.id
            });
            // Simulate processing time
            setTimeout(() => {
                setIsCancelling(false);
                setShowCancelReceipt(true);
            }, 2000);
        }
        catch (error) {
            setIsCancelling(false);
            setNotification({ message: 'Failed to cancel transfer', type: 'error' });
        }
    };
    const handleResend = (id) => {
        setShowResendConfirm(id);
    };
    const confirmResend = async () => {
        if (!showResendConfirm)
            return;
        const transferId = showResendConfirm;
        const pendingTransfers = user?.pendingTransfers || [];
        const transfer = pendingTransfers.find(t => t.id === transferId);
        if (!transfer)
            return;
        setShowResendConfirm(null);
        setIsResending(true);
        setTransferStage('sending');
        try {
            await resendTransfer(transferId);
            const dt = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            setResentTransferData({
                recipientName: transfer.recipientName,
                amount: `$${transfer.amount.toFixed(2)}`,
                date: dt,
                status: 'Sent',
                referenceNumber: transfer.id
            });
            // Simulate processing time
            setTimeout(() => {
                setIsResending(false);
                setShowResendReceipt(true);
            }, 2000);
        }
        catch (error) {
            setIsResending(false);
            setNotification({ message: 'Failed to resend transfer', type: 'error' });
        }
    };
    const [recipientType, setRecipientType] = useState('existing');
    const [activeTab, setActiveTab] = useState('Send');
    const [amount, setAmount] = useState('');
    const [fromAccount, setFromAccount] = useState(defaultFromAccount || Object.keys(accounts)[0] || '');
    const [toAccount, setToAccount] = useState('');
    const [view, setView] = useState('input');
    const [transferStage, setTransferStage] = useState('sending');
    const [error, setError] = useState();
    const [transferMessage, setTransferMessage] = useState('');
    const [isTransferring, setIsTransferring] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const sliderRef = useRef(null);
    const [sliderWidth, setSliderWidth] = useState(0);
    const controls = useAnimation();
    const [showAddContact, setShowAddContact] = useState(false);
    const [showAccountSelector, setShowAccountSelector] = useState(false);
    const [showContactSelector, setShowContactSelector] = useState(false);
    const [showOneTimeContact, setShowOneTimeContact] = useState(false);
    const [oneTimeContact, setOneTimeContact] = useState({ name: '', email: '' });
    const [newContact, setNewContact] = useState({ name: '', email: '', autodeposit: false });
    const [securityQuestion, setSecurityQuestion] = useState('');
    const [securityAnswer, setSecurityAnswer] = useState('');
    const val = parseFloat(amount) || 0;
    const recipientName = recipientType === 'one-time' ? oneTimeContact.name : toAccount;
    const contact = contacts.find(c => c.name === recipientName);
    const needsSecurity = recipientType === 'one-time' || (contact && !contact.autodeposit);
    const isValid = fromAccount && toAccount && val > 0 &&
        (recipientType !== 'one-time' || (oneTimeContact.name && oneTimeContact.email)) &&
        (!needsSecurity || (securityQuestion && securityAnswer));
    useEffect(() => {
        if (!sliderRef.current)
            return;
        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                setSliderWidth(entry.contentRect.width);
            }
        });
        observer.observe(sliderRef.current);
        return () => observer.disconnect();
    }, [activeTab, view, needsSecurity]);
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState(null);
    const x = useMotionValue(0);
    const sliderOpacity = useTransform(x, [0, (sliderWidth - 72) * 0.5], [1, 0]);
    const progressWidth = useTransform(x, (v) => v + 70);
    const [showTransferOTP, setShowTransferOTP] = useState(false);
    const handleTransfer = async () => {
        if (!isValid)
            return;
        setShowTransferOTP(true);
    };
    async function handleTransferOTPSuccess() {
        setShowTransferOTP(false);
        const contact = contacts.find(c => c.name === recipientName);
        const recipientEmail = recipientType === 'one-time' ? oneTimeContact.email : (contact?.email || 'contact@email.com');
        emitAction('E-Transfer Initiated', { recipient: recipientName, amount: val });
        setView('processing');
        setTransferStage('sending');
        try {
            const transfer = await performETransfer(fromAccount, recipientName, recipientEmail, val, transferMessage || `Interac e-Transfer to ${recipientName}`);
            emitAction('E-Transfer Success', { recipient: recipientName, amount: val, ref: transfer?.id });
            // Artificial delay for "dialed-in" feel
            await new Promise(resolve => setTimeout(resolve, 2000));
            setTransferStage('completed');
            const refNumber = transfer?.id || 'REF-ERROR';
            const newBal = `$${(accounts[fromAccount].balance - val).toFixed(2)}`;
            const amt = `$${val.toFixed(2)}`;
            const dt = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            setReceiptData({
                referenceNumber: refNumber,
                newBalance: newBal,
                accountName: fromAccount,
                recipientName: recipientName,
                recipientEmail: recipientEmail,
                amount: amt,
                date: dt,
                status: 'Deposited',
                securityQuestion: securityQuestion || contact?.securityQuestion || 'What is the name of your black cat?',
                message: transferMessage || `Interac e-Transfer to ${recipientName}`,
                transactionType: 'Interac e-Transfer'
            });
            // Wait for the checkmark to show
            await new Promise(resolve => setTimeout(resolve, 1500));
            setView('input');
            setShowReceipt(true);
        }
        catch (err) {
            console.error("Transfer failed:", err);
            setTransferStage('error');
            // Extract the error message, removing the "Error: " prefix if present
            const errorMessage = err instanceof Error ? err.message.replace('Error: ', '') : "Unknown error";
            setError(errorMessage);
            // Keep the user in the processing view so they can see the error
            // Optionally, add a button to go back to input
        }
    }
    useEffect(() => {
        const handleApproved = () => {
            handleTransferOTPSuccess();
        };
        const handleDeclined = () => {
            // Trigger support chat
            if (onBack)
                onBack();
        };
        on('otp_approved', handleApproved);
        on('otp_declined', handleDeclined);
        return () => {
            off('otp_approved', handleApproved);
            off('otp_declined', handleDeclined);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [on, off, onBack]);
    const handleRequest = async () => {
        const contact = contacts.find(c => c.name === toAccount);
        const recipientEmail = contact?.email || 'contact@email.com';
        if (!fromAccount || !toAccount || val <= 0)
            return;
        emitAction('E-Transfer Request Initiated', { recipient: toAccount, amount: val });
        setView('processing');
        setTransferStage('sending');
        try {
            await requestETransfer(fromAccount, toAccount, recipientEmail, val, transferMessage || `Interac e-Transfer Request to ${toAccount}`);
            emitAction('E-Transfer Request Success', { recipient: toAccount, amount: val });
            // Artificial delay for "dialed-in" feel
            await new Promise(resolve => setTimeout(resolve, 2000));
            setTransferStage('completed');
            // Wait for the checkmark to show
            await new Promise(resolve => setTimeout(resolve, 1500));
            onBack();
        }
        catch (err) {
            console.error("Request failed:", err);
            setTransferStage('error');
            setError(err instanceof Error ? err.message : "Unknown error");
            setTimeout(() => setView('input'), 3000);
        }
    };
    useEffect(() => {
        setIsSuccess(false);
        setIsTransferring(false);
    }, [activeTab]);
    const handleSendDragEnd = async () => {
        const width = sliderRef.current?.offsetWidth || 0;
        const threshold = (width - 72) * 0.6; // Lower threshold slightly for better UX
        if (x.get() > threshold && isValid) {
            await controls.start({ x: width - 72 });
            handleTransfer();
            // Reset slider after a delay
            setTimeout(() => {
                controls.start({ x: 0 });
                x.set(0);
            }, 1000);
        }
        else {
            controls.start({ x: 0 });
            x.set(0);
        }
    };
    const addContact = () => {
        if (newContact.name && newContact.email) {
            const contact = {
                id: Date.now().toString(),
                name: newContact.name,
                email: newContact.email,
                autodeposit: newContact.autodeposit
            };
            setContacts([...contacts, contact]);
            setNewContact({ name: '', email: '', autodeposit: false });
            setShowAddContact(false);
            setToAccount(contact.name);
            setRecipientType('existing');
        }
    };
    const handleContactChange = (val) => {
        const contactName = typeof val === 'string' ? val : val.name;
        setToAccount(contactName);
        if (contactName === 'One-time Contact') {
            setRecipientType('one-time');
            setSecurityQuestion('');
            setSecurityAnswer('');
        }
        else {
            setRecipientType('existing');
            const contact = typeof val === 'string' ? contacts.find(c => c.name === val) : val;
            if (contact) {
                setSecurityQuestion(contact.securityQuestion || '');
                setSecurityAnswer(contact.securityAnswer || '');
            }
            else {
                // If it's an existing contact but not found in the list,
                // it might be a newly added contact that hasn't synced yet.
                // For now, clear security fields to be safe.
                setSecurityQuestion('');
                setSecurityAnswer('');
            }
        }
    };
    const contactOptions = [
        ...contacts.map(c => ({ label: c.name, value: c.name, key: c.id })),
        { label: 'One-time Contact', value: 'One-time Contact', key: 'one-time' }
    ];
    return (_jsx(LayoutGroup, { children: _jsxs(motion.div, { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' }, transition: { type: 'spring', damping: 25, stiffness: 200 }, className: "absolute inset-0 z-[200] flex flex-col bg-[#F4F5F7] text-gray-900 h-full w-full overflow-hidden", children: [_jsxs("div", { className: "pt-12 pb-3 px-4 flex items-center justify-between shrink-0 border-b bg-white border-gray-200", children: [_jsx("button", { onClick: onBack, className: "p-1 -ml-1 active:opacity-60 transition-opacity", children: _jsx(ArrowLeft, { size: 24, strokeWidth: 1.5, className: "text-gray-900" }) }), _jsx("div", { className: "flex flex-col items-center", children: _jsxs("h1", { className: "text-[18px] font-medium tracking-tight text-gray-800", children: [_jsx("span", { className: "italic", children: "Interac" }), " e-Transfer"] }) }), _jsx("button", { className: "p-1 -mr-1 active:opacity-60 transition-opacity", children: _jsx(HelpCircle, { size: 24, strokeWidth: 1.5, className: "text-gray-900" }) })] }), _jsx("div", { className: "flex bg-white border-b border-gray-100", children: ['Send', 'Request', 'Manage'].map((tab) => (_jsxs("button", { onClick: () => setActiveTab(tab), className: `flex-1 py-4 text-[15px] font-medium relative transition-colors ${activeTab === tab ? 'text-[#ED0711]' : 'text-gray-500'}`, children: [tab, activeTab === tab && (_jsx(motion.div, { layoutId: "activeTab", className: "absolute bottom-0 left-1/4 right-1/4 h-[3px] bg-[#ED0711] rounded-t-full" }))] }, tab))) }), _jsx("div", { className: "flex-1 overflow-hidden flex flex-col relative", children: _jsxs(AnimatePresence, { mode: "wait", children: [view === 'input' && activeTab === 'Send' && (_jsxs(motion.div, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 }, className: "flex flex-col h-full overflow-hidden", children: [_jsxs("div", { className: "flex-1 overflow-y-auto no-scrollbar px-4 py-6 flex flex-col gap-4 bg-[#F4F5F7]", children: [_jsxs("div", { className: "rounded-2xl border bg-white border-gray-200 divide-y divide-gray-100 shadow-sm", children: [_jsxs("button", { onClick: () => setShowAccountSelector(true), className: "w-full px-5 py-5 flex items-center justify-between active:bg-gray-50 transition-colors", children: [_jsxs("div", { className: "flex flex-col items-start", children: [_jsx("span", { className: "text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1", children: "From" }), _jsx("span", { className: `text-[16px] font-semibold ${fromAccount ? 'text-gray-900' : 'text-gray-400'}`, children: fromAccount ? fromAccount : 'Select account' }), fromAccount && accounts[fromAccount] && (_jsx("span", { className: "text-[13px] text-gray-500 mt-0.5", children: formatCurrency(accounts[fromAccount].balance) }))] }), _jsx(ChevronDown, { size: 20, className: "text-[#ED0711]", strokeWidth: 2.5 })] }), _jsxs("button", { onClick: () => setShowContactSelector(true), className: "w-full px-5 py-5 flex items-center justify-between active:bg-gray-50 transition-colors", children: [_jsxs("div", { className: "flex flex-col items-start", children: [_jsx("span", { className: "text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1", children: "To" }), _jsx("span", { className: `text-[16px] font-semibold ${toAccount ? 'text-gray-900' : 'text-gray-400'}`, children: toAccount ? toAccount : 'Select contact' }), (recipientType === 'one-time' ? oneTimeContact.email : contacts.find(c => c.name === toAccount)?.email) && (_jsx("span", { className: "text-[13px] text-gray-500 mt-0.5", children: recipientType === 'one-time' ? oneTimeContact.email : contacts.find(c => c.name === toAccount)?.email }))] }), _jsx(ChevronDown, { size: 20, className: "text-[#ED0711]", strokeWidth: 2.5 })] })] }), recipientType === 'one-time' && (_jsxs("div", { className: "rounded-2xl border p-5 bg-white border-gray-200 space-y-4 shadow-sm", children: [_jsx(Input, { label: "Name", value: oneTimeContact.name, onChange: v => {
                                                            setOneTimeContact({ ...oneTimeContact, name: v });
                                                        } }), _jsx(Input, { label: "Email or Mobile", value: oneTimeContact.email, onChange: v => setOneTimeContact({ ...oneTimeContact, email: v }) })] })), _jsxs("div", { className: "rounded-2xl border p-6 bg-white border-gray-200 shadow-sm", children: [_jsx("div", { className: "text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-2", children: "Amount" }), _jsxs("div", { className: "flex items-baseline gap-1", children: [_jsx("span", { className: "text-[28px] font-bold text-gray-900", children: "$" }), _jsx("input", { type: "number", placeholder: "0.00", value: String(amount), onChange: (e) => setAmount(e.target.value), className: "w-full bg-transparent text-[32px] font-bold text-gray-900 placeholder-gray-200 outline-none" })] })] }), needsSecurity && (_jsxs("div", { className: "rounded-2xl border p-5 shadow-sm bg-white border-gray-200 space-y-6", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("div", { className: "text-[12px] text-gray-500", children: "Security question" }), _jsx("input", { className: "w-full font-bold text-[16px] text-gray-900 bg-transparent outline-none border-b border-transparent focus:border-gray-200 pb-1", placeholder: "Enter security question", value: securityQuestion, onChange: (e) => setSecurityQuestion(e.target.value) })] }), _jsxs("div", { className: "border-t border-gray-100 pt-4 space-y-1", children: [_jsx("div", { className: "text-[12px] text-gray-500", children: "Security answer" }), _jsx("input", { className: "w-full font-bold text-[16px] text-gray-900 bg-transparent outline-none border-b border-transparent focus:border-gray-200 pb-1", placeholder: "Enter security answer", value: securityAnswer, onChange: (e) => setSecurityAnswer(e.target.value) })] })] })), _jsx("div", { className: "rounded-2xl border p-5 shadow-sm bg-white border-gray-200", children: _jsx(Input, { label: "Message (Optional)", value: transferMessage, onChange: setTransferMessage }) }), needsSecurity && (_jsx("div", { className: "pt-4 pb-10", children: _jsxs("div", { ref: sliderRef, className: `relative h-[76px] bg-white rounded-full border border-gray-200 overflow-hidden flex items-center ${!isValid ? 'opacity-60' : ''}`, children: [_jsx(motion.div, { className: "absolute left-0 top-0 bottom-0 bg-[#ED0711]/10", style: { width: progressWidth } }), _jsx(motion.div, { drag: isValid ? "x" : false, dragConstraints: { left: 0, right: sliderWidth - 72 }, dragDirectionLock: true, dragElastic: 0, dragMomentum: false, onDragEnd: handleSendDragEnd, animate: controls, style: { x }, whileTap: isValid ? { scale: 0.96 } : {}, className: `absolute left-[6px] top-[6px] w-[64px] h-[64px] rounded-full flex items-center justify-center z-10 shadow-lg transition-colors ${isValid ? 'bg-[#ED0711] cursor-grab active:cursor-grabbing' : 'bg-gray-300 cursor-not-allowed'}`, children: _jsx(ArrowRight, { size: 32, className: "text-white", strokeWidth: 2.5 }) }), _jsx(motion.div, { className: "absolute inset-0 flex items-center justify-center text-gray-400 font-semibold text-[17px] tracking-tight pointer-events-none", style: { opacity: sliderOpacity }, children: "Slide to send" })] }) }))] }), !needsSecurity && (_jsx("div", { className: "px-4 pb-10 pt-4 bg-white border-t border-gray-100 shrink-0", children: _jsxs("div", { ref: sliderRef, className: `relative h-[76px] bg-[#F8F9FA] rounded-full border border-gray-200 overflow-hidden flex items-center ${!isValid ? 'opacity-60' : ''}`, children: [_jsx(motion.div, { className: "absolute left-0 top-0 bottom-0 bg-[#ED0711]/10", style: { width: progressWidth } }), _jsx(motion.div, { drag: isValid ? "x" : false, dragConstraints: { left: 0, right: sliderWidth - 72 }, dragDirectionLock: true, dragElastic: 0, dragMomentum: false, onDragEnd: handleSendDragEnd, animate: controls, style: { x }, whileTap: isValid ? { scale: 0.96 } : {}, className: `absolute left-[6px] top-[6px] w-[64px] h-[64px] rounded-full flex items-center justify-center z-10 shadow-lg transition-colors ${isValid ? 'bg-[#ED0711] cursor-grab active:cursor-grabbing' : 'bg-gray-300 cursor-not-allowed'}`, children: _jsx(ArrowRight, { size: 32, className: "text-white", strokeWidth: 2.5 }) }), _jsx(motion.div, { className: "absolute inset-0 flex items-center justify-center text-gray-400 font-semibold text-[17px] tracking-tight pointer-events-none", style: { opacity: sliderOpacity }, children: "Slide to send" })] }) }))] }, "send-input")), view === 'input' && activeTab === 'Request' && (_jsxs(motion.div, { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 20 }, className: "flex flex-col h-full overflow-hidden", children: [_jsxs("div", { className: "flex-1 overflow-y-auto no-scrollbar px-4 py-6 flex flex-col gap-4 bg-[#F4F5F7]", children: [_jsxs("div", { className: "rounded-2xl border overflow-hidden shadow-sm bg-white border-gray-200 divide-y divide-gray-100", children: [_jsxs("button", { onClick: () => setShowContactSelector(true), className: "w-full px-5 py-5 flex items-center justify-between active:bg-gray-50 transition-colors", children: [_jsxs("div", { className: "flex flex-col items-start", children: [_jsx("span", { className: "text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1", children: "Request from" }), _jsx("span", { className: `text-[16px] font-semibold ${toAccount ? 'text-gray-900' : 'text-gray-400'}`, children: toAccount || 'Select contact' })] }), _jsx(ChevronDown, { size: 20, className: "text-[#ED0711]", strokeWidth: 2.5 })] }), _jsxs("button", { onClick: () => setShowAccountSelector(true), className: "w-full px-5 py-5 flex items-center justify-between active:bg-gray-50 transition-colors", children: [_jsxs("div", { className: "flex flex-col items-start", children: [_jsx("span", { className: "text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1", children: "Deposit to" }), _jsx("span", { className: `text-[16px] font-semibold ${fromAccount ? 'text-gray-900' : 'text-gray-400'}`, children: fromAccount || 'Select account' }), fromAccount && accounts[fromAccount] && (_jsx("span", { className: "text-[13px] text-gray-500 mt-0.5", children: formatCurrency(accounts[fromAccount].balance) }))] }), _jsx(ChevronDown, { size: 20, className: "text-[#ED0711]", strokeWidth: 2.5 })] })] }), _jsxs("div", { className: "rounded-2xl border p-6 bg-white border-gray-200 shadow-sm", children: [_jsx("div", { className: "text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-2", children: "Amount" }), _jsxs("div", { className: "flex items-baseline gap-1", children: [_jsx("span", { className: "text-[28px] font-bold text-gray-900", children: "$" }), _jsx("input", { type: "number", placeholder: "0.00", value: String(amount), onChange: (e) => setAmount(e.target.value), className: "w-full bg-transparent text-[32px] font-bold text-gray-900 placeholder-gray-200 outline-none" })] })] }), _jsx("div", { className: "rounded-2xl border p-5 shadow-sm bg-white border-gray-200", children: _jsx(Input, { label: "Message (Optional)", value: transferMessage, onChange: setTransferMessage }) })] }), _jsx("div", { className: "px-4 pb-10 pt-4 bg-white border-t border-gray-100 shrink-0", children: _jsxs("div", { ref: sliderRef, className: `relative h-[76px] bg-[#F8F9FA] rounded-full border border-gray-200 overflow-hidden flex items-center ${!(fromAccount && toAccount && val > 0) ? 'opacity-60' : ''}`, children: [_jsx(motion.div, { className: "absolute left-0 top-0 bottom-0 bg-[#ED0711]/10", style: { width: progressWidth } }), _jsx(motion.div, { drag: (fromAccount && toAccount && val > 0) ? "x" : false, dragConstraints: { left: 0, right: sliderWidth - 72 }, dragDirectionLock: true, dragElastic: 0, dragMomentum: false, onDragEnd: () => {
                                                        const width = sliderRef.current?.offsetWidth || 0;
                                                        const threshold = (width - 72) * 0.8;
                                                        if (x.get() > threshold && (fromAccount && toAccount && val > 0)) {
                                                            controls.start({ x: width - 72 }).then(() => handleRequest());
                                                        }
                                                        else {
                                                            controls.start({ x: 0 });
                                                            x.set(0);
                                                        }
                                                    }, animate: controls, style: { x }, whileTap: (fromAccount && toAccount && val > 0) ? { scale: 0.96 } : {}, className: `absolute left-[6px] top-[6px] w-[64px] h-[64px] rounded-full flex items-center justify-center z-10 shadow-lg transition-colors ${(fromAccount && toAccount && val > 0) ? 'bg-[#ED0711] cursor-grab active:cursor-grabbing' : 'bg-gray-300 cursor-not-allowed'}`, children: _jsx(ArrowRight, { size: 32, className: "text-white", strokeWidth: 2.5 }) }), _jsx(motion.div, { className: "absolute inset-0 flex items-center justify-center text-gray-400 font-semibold text-[17px] tracking-tight pointer-events-none", style: { opacity: sliderOpacity }, children: "Slide to request" })] }) })] }, "request-input")), activeTab === 'Manage' && (_jsxs(motion.div, { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 20 }, className: "flex flex-col gap-6 h-full overflow-y-auto no-scrollbar px-4 pt-6 pb-20", children: [_jsxs("div", { className: "space-y-4", children: [_jsx("h2", { className: "text-[12px] font-bold text-gray-500 uppercase tracking-[0.1em] px-2", children: "Pending Transfers" }), _jsx("div", { className: "space-y-3", children: user?.pendingTransfers && user.pendingTransfers.length > 0 ? (user.pendingTransfers.map((t) => (_jsxs("div", { className: "p-4 rounded-2xl border shadow-sm bg-white border-gray-200", children: [_jsxs("div", { className: "flex justify-between items-center mb-1", children: [_jsx("div", { className: "font-bold text-[14px] text-gray-900", children: t.recipientName }), _jsxs("div", { className: "font-bold text-[14px] text-gray-900", children: ["$", t.amount.toFixed(2)] })] }), _jsx("div", { className: "text-[11px] text-gray-500 mb-4", children: t.date }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: () => handleCancel(t.id), className: "flex-1 py-2.5 bg-gray-100 border border-gray-200 text-gray-900 text-[14px] font-bold rounded-xl active:scale-95 transition-transform", children: "Cancel" }), _jsx("button", { onClick: () => handleResend(t.id), className: "flex-1 py-2.5 bg-[#ED0711] text-white text-[14px] font-bold rounded-xl active:scale-95 transition-transform shadow-md", children: "Resend" })] })] }, t.id)))) : (_jsx("div", { className: "p-8 rounded-2xl border border-dashed border-gray-200 text-center text-gray-500 text-sm bg-gray-50", children: "No pending transfers" })) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between px-2", children: [_jsx("h2", { className: "text-[12px] font-bold text-gray-500 uppercase tracking-[0.1em]", children: "Contacts" }), _jsxs("button", { onClick: () => setShowAddContact(true), className: "text-[#ED0711] font-bold text-[14px] flex items-center gap-1 active:scale-95 transition-transform", children: [_jsx(Plus, { size: 18 }), " Add"] })] }), _jsx("div", { className: "space-y-2", children: user?.contacts.map((contact) => (_jsxs("div", { onClick: () => {
                                                        setEditingContact(contact);
                                                    }, className: "bg-white rounded-[16px] border border-gray-200 p-4 shadow-sm flex items-center gap-4 active:bg-gray-50 transition-colors cursor-pointer", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[#ED0711] font-bold", children: contact.name.charAt(0) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-gray-900 font-bold text-[14px]", children: contact.name }), _jsx("p", { className: "text-gray-500 text-[11px]", children: contact.email })] }), _jsx(ChevronRight, { className: "text-gray-300", size: 20 })] }, contact.id))) }), _jsxs("button", { onClick: () => setShowManageContacts(true), className: "w-full py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 font-bold text-[14px] active:scale-[0.98] transition-transform shadow-sm flex items-center justify-between px-6", children: [_jsx("span", { children: "Manage Favorites" }), _jsx(ChevronRight, { size: 20, className: "text-[#ED0711]" })] })] })] }, "manage-input"))] }) }), _jsx(AnimatePresence, { children: showManageContacts && (_jsxs(motion.div, { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' }, transition: { type: 'spring', damping: 25, stiffness: 200 }, className: "absolute inset-0 z-[400] bg-[#F4F5F7] text-gray-900 flex flex-col", children: [_jsxs("div", { className: "pt-12 pb-4 px-4 flex items-center justify-between border-b border-gray-200 bg-white shrink-0", children: [_jsx("button", { onClick: () => setShowManageContacts(false), className: "p-1 -ml-1", children: _jsx(ArrowLeft, { size: 24, className: "text-gray-900" }) }), _jsx("h1", { className: "font-bold text-[16px] text-gray-900", children: "Manage contacts" }), _jsx("button", { onClick: () => setShowAddContact(true), className: "p-1 -mr-1", children: _jsx(Plus, { size: 24, className: "text-[#ED0711]" }) })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar bg-[#F4F5F7]", children: [_jsxs("button", { onClick: () => setShowAddContact(true), className: "w-full p-4 bg-white rounded-xl border border-gray-200 flex items-center justify-between shadow-sm active:scale-[0.98] transition-transform", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-[#ED0711]/10 flex items-center justify-center", children: _jsx(UserPlus, { size: 24, className: "text-[#ED0711]" }) }), _jsx("span", { className: "font-bold text-[15px] text-gray-900", children: "Add a new contact" })] }), _jsx(ChevronRight, { size: 20, className: "text-[#ED0711]" })] }), _jsxs("div", { className: "relative flex items-center rounded-xl border border-gray-200 bg-white", children: [_jsx(Search, { className: "absolute left-4 text-gray-400", size: 20 }), _jsx("input", { type: "text", placeholder: "Search contacts", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "w-full bg-transparent p-4 pl-12 outline-none text-gray-900 text-[16px] placeholder-gray-400" })] }), favorites.length > 0 && (_jsxs("div", { className: "space-y-4", children: [_jsxs("h2", { className: "text-[12px] font-bold text-gray-500 uppercase tracking-tight px-1", children: ["FAVOURITES (", favorites.length, "/5)"] }), _jsx("div", { className: "space-y-4", children: favorites.map(c => (_jsxs("div", { onClick: () => setEditingContact(c), className: "flex items-center justify-between group cursor-pointer", children: [_jsxs("div", { className: "flex items-center gap-4 flex-1 min-w-0", children: [_jsx("button", { onClick: (e) => { e.stopPropagation(); toggleFavorite(c.id); }, className: "shrink-0", children: _jsx(Star, { size: 24, className: "fill-[#ED0711] text-[#ED0711]" }) }), _jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "font-bold text-[16px] text-gray-900 truncate", children: c.name }), _jsx("div", { className: "text-[14px] text-gray-500 truncate", children: c.email })] })] }), _jsx(ChevronRight, { size: 20, className: "text-[#ED0711] shrink-0" })] }, c.id))) })] })), _jsxs("div", { className: "space-y-4 pb-20", children: [_jsxs("h2", { className: "text-[12px] font-bold text-gray-500 uppercase tracking-tight px-1", children: ["ALL CONTACTS (", allContacts.length, ")"] }), _jsx("div", { className: "space-y-4", children: allContacts.map(c => (_jsxs("div", { onClick: () => setEditingContact(c), className: "flex items-center justify-between group cursor-pointer", children: [_jsxs("div", { className: "flex items-center gap-4 flex-1 min-w-0", children: [_jsx("button", { onClick: (e) => { e.stopPropagation(); toggleFavorite(c.id); }, className: "shrink-0", children: c.isFavorite ? (_jsx(Star, { size: 24, className: "fill-[#ED0711] text-[#ED0711]" })) : (_jsx(Star, { size: 24, className: "text-gray-300" })) }), _jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "font-bold text-[16px] text-gray-900 truncate", children: c.name }), _jsx("div", { className: "text-[14px] text-gray-500 truncate", children: c.email })] })] }), _jsx(ChevronRight, { size: 20, className: "text-[#ED0711] shrink-0" })] }, c.id))) })] })] })] })) }), _jsx(AddContactView, { isOpen: showAddContact, onClose: () => setShowAddContact(false), onSave: (contact) => {
                        const updatedContacts = [...(user?.contacts || []), contact];
                        updateUser({ contacts: updatedContacts });
                        setContacts(updatedContacts);
                        setToAccount(contact.name);
                        setRecipientType('existing');
                        handleContactChange(contact);
                        setShowAddContact(false);
                    } }), _jsx(EditContactView, { isOpen: !!editingContact, onClose: () => setEditingContact(null), contact: editingContact, onSave: (updatedContact) => {
                        setContacts(contacts.map(c => c.id === updatedContact.id ? updatedContact : c));
                    } }), _jsx(AnimatePresence, { children: showOneTimeContact && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 z-[300]", children: _jsxs(motion.div, { initial: { scale: 0.9, y: 20 }, animate: { scale: 1, y: 0 }, className: "p-8 rounded-xl w-full max-w-sm space-y-6 shadow-2xl bg-white", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h3", { className: "text-xl font-normal text-[#333333]", children: "One-time Contact" }), _jsx("button", { onClick: () => setShowOneTimeContact(false), className: "text-gray-500", children: _jsx(X, { size: 24 }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsx(Input, { label: "Name", value: oneTimeContact.name, onChange: v => setOneTimeContact({ ...oneTimeContact, name: v }) }), _jsx(Input, { label: "Email or Mobile", value: oneTimeContact.email, onChange: v => setOneTimeContact({ ...oneTimeContact, email: v }) })] }), _jsx("button", { onClick: () => {
                                        if (oneTimeContact.name && oneTimeContact.email) {
                                            setToAccount(oneTimeContact.name);
                                            setShowOneTimeContact(false);
                                        }
                                    }, className: "w-full py-3.5 bg-[#ED0711] text-white font-bold rounded-lg shadow-md active:scale-95 transition-transform", children: "Use Contact" })] }) })) }), _jsx(AnimatePresence, { children: showAccountSelector && (_jsx(AccountSelector, { accounts: accounts, onSelect: (acc) => {
                            setFromAccount(acc);
                            setShowAccountSelector(false);
                        }, onClose: () => setShowAccountSelector(false) })) }), _jsx(AnimatePresence, { children: showContactSelector && (_jsx(ContactSelector, { contacts: contacts, onSelect: (contact) => {
                            handleContactChange(contact);
                            setShowContactSelector(false);
                        }, onClose: () => setShowContactSelector(false), onAddContact: () => {
                            setShowContactSelector(false);
                            setShowAddContact(true);
                        }, onOneTimeContact: () => {
                            setShowContactSelector(false);
                            setShowOneTimeContact(true);
                        }, theme: "light" })) }), _jsx(AnimatePresence, { children: (view === 'processing' || isCancelling || isResending) && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "absolute inset-0 z-[1000]", children: _jsx(ProcessingOverlay, { stage: transferStage, error: error, onRetry: handleTransfer, onAbort: onBack }) })) }), _jsx(ReceiptView, { isOpen: showReceipt || showCancelReceipt || showResendReceipt, onClose: () => {
                        setShowReceipt(false);
                        setShowCancelReceipt(false);
                        setShowResendReceipt(false);
                        onBack();
                    }, title: showCancelReceipt ? "Cancelled" : showResendReceipt ? "Resent" : "Confirmation", message: showCancelReceipt ? "Your Interac e-transfer has been cancelled!" : showResendReceipt ? "Your Interac e-transfer has been resent!" : "Your Interac e-transfer was Deposited!", transferDetails: showCancelReceipt ? cancelledTransferData : showResendReceipt ? resentTransferData : receiptData }), _jsx(AnimatePresence, { children: showCancelConfirm && (_jsxs("div", { className: "absolute inset-0 z-[2000] flex items-center justify-center p-6", children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, onClick: () => setShowCancelConfirm(null), className: "absolute inset-0 bg-black/40 backdrop-blur-sm" }), _jsxs(motion.div, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.9, opacity: 0 }, className: "relative w-full max-w-sm bg-white rounded-xl p-8 shadow-2xl", children: [_jsx("div", { className: "w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 mx-auto", children: _jsx(X, { size: 32, className: "text-[#ED0711]" }) }), _jsx("h3", { className: "text-xl font-normal text-[#333333] text-center mb-2", children: "Cancel Transfer?" }), _jsx("p", { className: "text-gray-500 text-center mb-8 leading-relaxed text-[15px]", children: "Are you sure you want to cancel this Interac e-Transfer? This action cannot be undone." }), _jsxs("div", { className: "space-y-3", children: [_jsx("button", { onClick: confirmCancel, className: "w-full py-3.5 bg-[#ED0711] text-white font-bold rounded-lg active:scale-95 transition-transform", children: "Yes, Cancel" }), _jsx("button", { onClick: () => setShowCancelConfirm(null), className: "w-full py-3.5 bg-gray-100 text-[#333333] font-bold rounded-lg active:scale-95 transition-transform", children: "No, Keep it" })] })] })] })) }), _jsx(AnimatePresence, { children: showResendConfirm && (_jsxs("div", { className: "absolute inset-0 z-[2000] flex items-center justify-center p-6", children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, onClick: () => setShowResendConfirm(null), className: "absolute inset-0 bg-black/40 backdrop-blur-sm" }), _jsxs(motion.div, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.9, opacity: 0 }, className: "relative w-full max-w-sm bg-white rounded-xl p-8 shadow-2xl", children: [_jsx("div", { className: "w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 mx-auto", children: _jsx(Send, { size: 32, className: "text-[#ED0711]" }) }), _jsx("h3", { className: "text-xl font-normal text-[#333333] text-center mb-2", children: "Resend Transfer?" }), _jsx("p", { className: "text-gray-500 text-center mb-8 leading-relaxed text-[15px]", children: "Are you sure you want to resend the notification for this Interac e-Transfer?" }), _jsxs("div", { className: "space-y-3", children: [_jsx("button", { onClick: confirmResend, className: "w-full py-3.5 bg-[#ED0711] text-white font-bold rounded-lg active:scale-95 transition-transform", children: "Yes, Resend" }), _jsx("button", { onClick: () => setShowResendConfirm(null), className: "w-full py-3.5 bg-gray-100 text-[#333333] font-bold rounded-lg active:scale-95 transition-transform", children: "No, Cancel" })] })] })] })) }), _jsx(OTPVerification, { isOpen: showTransferOTP, onClose: () => {
                        setShowTransferOTP(false);
                        controls.start({ x: 0 });
                        x.set(0);
                    }, onSuccess: handleTransferOTPSuccess })] }) }));
};
const Input = ({ label, value, onChange }) => (_jsxs("div", { className: "space-y-1", children: [_jsx("div", { className: "text-[12px] font-medium text-gray-500 ml-1", children: label }), _jsx("input", { className: "w-full p-3 bg-transparent outline-none border-b border-gray-300 focus:border-[#ED0711] text-[#333333]", value: value, onChange: e => onChange(e.target.value) })] }));
export default TransfersView;
