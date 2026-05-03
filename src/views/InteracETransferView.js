import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, RefreshCcw, MessageSquare, Loader2 } from 'lucide-react';
import { BackIcon, HelpCircleIcon, ChevronDownIcon, ScotiaLogoSVG } from '../components/ScotiaIcons';
import { OTPVerification } from '../components/OTPVerification';
import { useBank } from '../shared/BankContext';
const InteracETransferView = ({ accounts, onBack }) => {
    const { user, updateUser, performETransfer } = useBank();
    const [activeTab, setActiveTab] = useState('send');
    const accountNames = Object.keys(accounts);
    const selectedAccount = 'Preferred Package';
    const [selectedContact, setSelectedContact] = useState(null);
    const [amount, setAmount] = useState('0.00');
    const [isSent, setIsSent] = useState(false);
    const [isFailed, setIsFailed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isSelectingContact, setIsSelectingContact] = useState(false);
    const [isAddingContact, setIsAddingContact] = useState(false);
    const [isEditingContact, setIsEditingContact] = useState(false);
    const [viewingContact, setViewingContact] = useState(null);
    const [newContactName, setNewContactName] = useState('');
    const [newContactEmail, setNewContactEmail] = useState('');
    const [newContactQuestion, setNewContactQuestion] = useState('');
    const [newContactAnswer, setNewContactAnswer] = useState('');
    const [showAddContactOTP, setShowAddContactOTP] = useState(false);
    const [pendingContact, setPendingContact] = useState(null);
    const contacts = user?.contacts || [];
    const pendingTransfers = user?.pendingTransfers || [];
    // Slide to send logic
    const x = useMotionValue(0);
    const sliderRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(0);
    useEffect(() => {
        if (!sliderRef.current)
            return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width);
            }
        });
        observer.observe(sliderRef.current);
        return () => observer.disconnect();
    }, [activeTab, isSent]);
    const buttonWidth = 56;
    const slideRange = containerWidth ? containerWidth - buttonWidth - 8 : 260;
    const opacity = useTransform(x, [0, slideRange * 0.5], [1, 0]);
    const numAmount = parseFloat(amount);
    const selectedContactData = contacts.find(c => c.name === selectedContact);
    const isValid = selectedContact && amount && !isNaN(numAmount) && numAmount > 0;
    const handleDragEnd = () => {
        const threshold = slideRange * 0.9;
        if (x.get() > threshold && isValid) {
            setIsConfirming(true);
            x.set(0); // Reset slider position
        }
        else {
            x.set(0);
        }
    };
    const handleConfirmSend = async () => {
        setIsConfirming(false);
        setIsLoading(true);
        try {
            const amountNum = parseFloat(amount);
            const contact = contacts.find(c => c.name === selectedContact);
            if (!contact)
                throw new Error("Contact not selected");
            await performETransfer(selectedAccount, contact.name, contact.email, amountNum, `Interac e-Transfer to ${contact.name}`);
            setIsLoading(false);
            setIsSent(true);
            // Play success sound
            try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
                audio.play().catch(e => console.warn('Audio play failed', e));
            }
            catch (e) {
                console.warn('Audio failed', e);
            }
            // Show SMS notification
            window.dispatchEvent(new CustomEvent('scotia_notification', {
                detail: {
                    title: 'Interac e-Transfer',
                    message: `10001: Interac e-Transfer: Transfer of $${amount} to ${selectedContact} was successfully deposited.`
                }
            }));
        }
        catch (error) {
            console.error("Transfer failed", error);
            setIsLoading(false);
            setIsFailed(true);
        }
    };
    const handleCancelSend = () => {
        setIsConfirming(false);
        x.set(0);
    };
    const handleAddContact = async () => {
        if (newContactName && newContactEmail) {
            const contactData = {
                name: newContactName,
                email: newContactEmail,
                securityQuestion: newContactQuestion,
                securityAnswer: newContactAnswer,
                autodeposit: false,
                id: ''
            };
            if (isEditingContact && viewingContact) {
                const updatedContacts = contacts.map(c => c.id === viewingContact.id ? {
                    ...c,
                    ...contactData,
                    id: c.id
                } : c);
                await updateUser({ contacts: updatedContacts });
                setIsAddingContact(false);
                setIsEditingContact(false);
                setViewingContact(null);
            }
            else {
                // For new contact, trigger OTP
                setPendingContact({
                    ...contactData,
                    id: Date.now().toString()
                });
                setShowAddContactOTP(true);
            }
        }
    };
    const handleOTPSuccess = async () => {
        if (pendingContact) {
            const updatedContacts = [pendingContact, ...contacts];
            await updateUser({ contacts: updatedContacts });
            setSelectedContact(pendingContact.name);
            setPendingContact(null);
        }
        setShowAddContactOTP(false);
        setIsAddingContact(false);
        setNewContactName('');
        setNewContactEmail('');
        setNewContactQuestion('');
        setNewContactAnswer('');
    };
    const startEditing = (contact) => {
        setNewContactName(contact.name);
        setNewContactEmail(contact.email);
        setNewContactQuestion(contact.question || '');
        setNewContactAnswer(contact.answer || '');
        setIsEditingContact(true);
        setIsAddingContact(true);
    };
    const account = accounts[selectedAccount] || accounts[accountNames[0]];
    return (_jsxs("div", { className: "absolute inset-0 bg-white flex flex-col z-[200] overflow-hidden animate-in slide-in-from-bottom-full duration-300", children: [_jsxs("div", { className: "pt-12 pb-2 px-4 flex items-center justify-between shrink-0 bg-white border-b border-gray-100", children: [_jsx("button", { onClick: onBack, className: "text-gray-900 p-2 -ml-2 active:opacity-60 transition-opacity", children: _jsx(BackIcon, { color: "currentColor", size: 24 }) }), _jsx("h1", { className: "text-gray-900 font-bold text-[16px] tracking-tight", children: "Interac e-Transfer" }), _jsx("button", { className: "text-gray-900 p-2 -mr-2 active:opacity-60 transition-opacity", children: _jsx(HelpCircleIcon, { color: "currentColor", size: 24 }) })] }), _jsx("div", { className: "flex border-b border-gray-100 px-4 bg-white", children: ['send', 'request', 'manage'].map((tab) => (_jsxs("button", { onClick: () => setActiveTab(tab), className: `flex-1 py-4 text-center text-[13px] font-bold capitalize relative transition-colors ${activeTab === tab ? 'text-[#ED0711]' : 'text-gray-400'}`, children: [tab, activeTab === tab && (_jsx(motion.div, { layoutId: "activeTabUnderline", className: "absolute bottom-0 left-0 right-0 h-[3px] bg-[#ED0711]" }))] }, tab))) }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-[#F4F4F4]", children: [activeTab === 'send' && (_jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, className: "space-y-4", children: [_jsxs("div", { className: "bg-white rounded-[16px] border border-gray-200 overflow-hidden shadow-sm", children: [_jsxs("button", { className: "w-full p-5 text-left active:bg-gray-50 transition-colors border-b border-gray-100 group", children: [_jsx("p", { className: "text-gray-500 text-[11px] font-medium mb-1", children: "From" }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "space-y-0.5", children: [_jsxs("p", { className: "text-gray-900 font-bold text-[14px] leading-tight", children: ["Chequing \u2013 ", selectedAccount] }), _jsxs("p", { className: "text-gray-500 text-[12px] font-medium", children: ["(", account?.accountNumber ? account.accountNumber.slice(-4) : '2188', ")"] }), _jsxs("p", { className: "text-gray-900 font-bold text-[14px] mt-1", children: ["$", account?.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })] })] }), _jsx("div", { className: "text-[#ED0711] group-active:translate-y-0.5 transition-transform", children: _jsx(ChevronDownIcon, { color: "currentColor", size: 24 }) })] })] }), _jsxs("button", { onClick: () => setIsSelectingContact(true), className: "w-full p-5 text-left active:bg-gray-50 transition-colors group", children: [_jsx("p", { className: "text-gray-500 text-[11px] font-medium mb-1", children: "To" }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "flex flex-col", children: [_jsx("p", { className: `text-[14px] font-medium ${selectedContact ? 'text-gray-900 font-bold' : 'text-gray-400'}`, children: selectedContact || 'Select contact' }), selectedContact && (_jsx("p", { className: "text-gray-500 text-[12px] font-medium", children: contacts.find(c => c.name === selectedContact)?.email }))] }), _jsx("div", { className: "text-[#ED0711] group-active:translate-y-0.5 transition-transform", children: _jsx(ChevronDownIcon, { color: "currentColor", size: 24 }) })] })] })] }), _jsxs("div", { className: "bg-white rounded-[16px] border border-gray-200 p-5 shadow-sm", children: [_jsx("p", { className: "text-gray-900 font-bold text-[14px] mb-3", children: "Amount" }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: "text", inputMode: "decimal", placeholder: "Enter amount", value: amount, onFocus: () => amount === '0.00' && setAmount(''), onBlur: () => !amount && setAmount('0.00'), onChange: (e) => setAmount(e.target.value.replace(/[^0-9.]/g, '')), className: "w-full bg-transparent text-gray-900 text-[14px] font-medium outline-none placeholder:text-gray-400 py-1" }), _jsx("div", { className: "absolute bottom-0 left-0 right-0 h-[1px] bg-gray-100" })] })] }), selectedContactData && (_jsxs(motion.div, { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, className: "bg-white rounded-[16px] border border-gray-200 p-5 shadow-sm space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-1", children: "Security Question" }), _jsx("p", { className: "text-gray-900 font-medium text-[14px]", children: selectedContactData.question || 'No question set' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-1", children: "Security Answer" }), _jsx("p", { className: "text-gray-900 font-medium text-[14px]", children: selectedContactData.answer || 'No answer set' })] })] }))] })), activeTab === 'manage' && (_jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, className: "space-y-6", children: [_jsxs("section", { className: "space-y-3", children: [_jsx("h2", { className: "text-gray-900 font-bold text-[16px] px-1", children: "Pending Transfers" }), _jsx("div", { className: "space-y-3", children: pendingTransfers.map((transfer) => (_jsxs("div", { className: "bg-white rounded-[16px] border border-gray-200 p-5 shadow-sm flex justify-between items-center active:scale-[0.98] transition-transform cursor-pointer", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-900 font-bold text-[14px]", children: transfer.name }), _jsx("p", { className: "text-gray-500 text-[12px] font-medium", children: transfer.date })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "text-gray-900 font-bold text-[14px]", children: ["$", transfer.amount.toFixed(2)] }), _jsx("p", { className: "text-[#ED0711] text-[10px] font-extrabold uppercase tracking-wider mt-0.5", children: transfer.status })] })] }, transfer.id))) }), pendingTransfers.length === 0 && (_jsx("div", { className: "text-center py-8", children: _jsx("p", { className: "text-gray-500 font-medium", children: "No pending transfers" }) }))] }), _jsxs("section", { className: "space-y-3", children: [_jsxs("div", { className: "flex justify-between items-center px-1", children: [_jsx("h2", { className: "text-gray-900 font-bold text-[16px]", children: "Manage Contacts" }), _jsx("button", { onClick: () => setIsAddingContact(true), className: "text-[#ED0711] font-bold text-[14px]", children: "+ Add" })] }), _jsx("div", { className: "space-y-2", children: contacts.map((contact) => (_jsxs("div", { onClick: () => startEditing(contact), className: "bg-white rounded-[16px] border border-gray-200 p-4 shadow-sm flex items-center gap-4 active:bg-gray-50 transition-colors cursor-pointer", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[#ED0711] font-bold", children: contact.name.charAt(0) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-gray-900 font-bold text-[14px]", children: contact.name }), _jsx("p", { className: "text-gray-500 text-[11px]", children: contact.email })] }), _jsx(ChevronDownIcon, { className: "-rotate-90 text-gray-300", size: 20 })] }, contact.id))) })] })] })), activeTab === 'request' && (_jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, className: "text-center py-20", children: [_jsx("div", { className: "w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(ScotiaLogoSVG, { color: "#ED0711", className: "w-8 h-8 opacity-40" }) }), _jsx("p", { className: "text-gray-400 font-medium", children: "Request money feature coming soon" })] }))] }), isSelectingContact && (_jsxs("div", { className: "absolute inset-0 bg-white z-[300] flex flex-col animate-in slide-in-from-right duration-300", children: [_jsxs("div", { className: "pt-12 pb-4 px-4 flex items-center justify-between border-b border-gray-100", children: [_jsx("button", { onClick: () => setIsSelectingContact(false), className: "text-gray-900 p-2", children: _jsx(BackIcon, { color: "currentColor", size: 24 }) }), _jsx("h2", { className: "text-gray-900 font-bold text-[16px]", children: "Select Contact" }), _jsx("div", { className: "w-10" })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar", children: [_jsxs("button", { onClick: () => setIsAddingContact(true), className: "w-full p-4 bg-gray-50 rounded-[12px] flex items-center gap-3 active:bg-gray-100 transition-colors", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-[#ED0711]/10 flex items-center justify-center", children: _jsx("span", { className: "text-[#ED0711] text-[20px] font-bold", children: "+" }) }), _jsx("span", { className: "text-gray-900 font-bold", children: "Add new contact" })] }), _jsx("div", { className: "pt-4 pb-2", children: _jsx("p", { className: "text-gray-400 text-[10px] font-bold uppercase tracking-wider px-1", children: "All Contacts" }) }), contacts.map((contact) => (_jsxs("button", { onClick: () => {
                                    setViewingContact(contact);
                                }, className: "w-full p-4 bg-white border border-gray-100 rounded-[12px] flex items-center justify-between text-left active:bg-gray-50 transition-colors shadow-sm", children: [_jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "text-gray-900 font-bold", children: contact.name }), _jsx("span", { className: "text-gray-500 text-[11px]", children: contact.email })] }), _jsx("div", { className: "text-gray-400", children: _jsx("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M9 18l6-6-6-6" }) }) })] }, contact.id)))] })] })), viewingContact && !isAddingContact && (_jsxs("div", { className: "absolute inset-0 bg-white z-[350] flex flex-col animate-in slide-in-from-right duration-300", children: [_jsxs("div", { className: "pt-12 pb-4 px-4 flex items-center justify-between border-b border-gray-100", children: [_jsx("button", { onClick: () => setViewingContact(null), className: "text-gray-900 p-2", children: _jsx(BackIcon, { color: "currentColor", size: 24 }) }), _jsx("h2", { className: "text-gray-900 font-bold text-[16px]", children: "Contact Details" }), _jsx("button", { onClick: () => startEditing(viewingContact), className: "text-[#ED0711] font-bold text-[14px] p-2", children: "Edit" })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-6 space-y-8", children: [_jsxs("div", { className: "flex flex-col items-center text-center pb-4", children: [_jsx("div", { className: "w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-[#ED0711] font-bold text-[32px]", children: viewingContact.name.charAt(0) }), _jsx("h3", { className: "text-gray-900 font-bold text-[20px]", children: viewingContact.name }), _jsx("p", { className: "text-gray-500", children: viewingContact.email })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-gray-50 rounded-[16px] p-5 border border-gray-100", children: [_jsx("p", { className: "text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-2", children: "Security Question" }), _jsx("p", { className: "text-gray-900 font-medium", children: viewingContact.question || 'Not set' })] }), _jsxs("div", { className: "bg-gray-50 rounded-[16px] p-5 border border-gray-100", children: [_jsx("p", { className: "text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-2", children: "Security Answer" }), _jsx("p", { className: "text-gray-900 font-medium", children: viewingContact.answer ? '••••••••' : 'Not set' })] })] }), _jsx("button", { onClick: () => {
                                    setSelectedContact(viewingContact.name);
                                    setViewingContact(null);
                                    setIsSelectingContact(false);
                                }, className: "w-full py-4 bg-[#ED0711] text-white font-bold rounded-full shadow-lg active:scale-[0.98] transition-all", children: "Select for Transfer" })] })] })), isAddingContact && (_jsxs("div", { className: "absolute inset-0 bg-white z-[400] flex flex-col animate-in slide-in-from-bottom-full duration-300", children: [_jsxs("div", { className: "pt-12 pb-4 px-4 flex items-center justify-between border-b border-gray-100", children: [_jsx("button", { onClick: () => { setIsAddingContact(false); setIsEditingContact(false); }, className: "text-gray-900 p-2", children: _jsx(BackIcon, { color: "currentColor", size: 24 }) }), _jsx("h2", { className: "text-gray-900 font-bold text-[16px]", children: isEditingContact ? 'Edit Contact' : 'Add New Contact' }), _jsx("div", { className: "w-10" })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-gray-500 text-[11px] font-bold uppercase tracking-wider", children: "Full Name" }), _jsx("input", { type: "text", placeholder: "Enter name", value: newContactName, onChange: (e) => setNewContactName(e.target.value), className: "w-full bg-gray-50 border border-gray-200 rounded-[12px] p-4 text-gray-900 outline-none focus:border-[#ED0711] transition-colors" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-gray-500 text-[11px] font-bold uppercase tracking-wider", children: "Email Address" }), _jsx("input", { type: "email", placeholder: "Enter email", value: newContactEmail, onChange: (e) => setNewContactEmail(e.target.value), className: "w-full bg-gray-50 border border-gray-200 rounded-[12px] p-4 text-gray-900 outline-none focus:border-[#ED0711] transition-colors" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-gray-500 text-[11px] font-bold uppercase tracking-wider", children: "Security Question" }), _jsx("input", { type: "text", placeholder: "Enter question", value: newContactQuestion, onChange: (e) => setNewContactQuestion(e.target.value), className: "w-full bg-gray-50 border border-gray-200 rounded-[12px] p-4 text-gray-900 outline-none focus:border-[#ED0711] transition-colors" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-gray-500 text-[11px] font-bold uppercase tracking-wider", children: "Security Answer" }), _jsx("input", { type: "text", placeholder: "Enter answer", value: newContactAnswer, onChange: (e) => setNewContactAnswer(e.target.value), className: "w-full bg-gray-50 border border-gray-200 rounded-[12px] p-4 text-gray-900 outline-none focus:border-[#ED0711] transition-colors" })] }), _jsx("button", { onClick: handleAddContact, disabled: !newContactName || !newContactEmail, className: "w-full py-4 bg-[#ED0711] text-white font-bold rounded-full shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 mt-4", children: isEditingContact ? 'Update Contact' : 'Save Contact' })] })] })), activeTab === 'send' && (_jsxs("div", { className: "p-8 pb-12 flex justify-center bg-[#F4F4F4]", children: [!isSent && !isFailed && !isLoading && (_jsxs("div", { ref: sliderRef, className: "relative w-full max-w-[360px] h-[64px] bg-white rounded-full p-1 flex items-center shadow-md overflow-hidden border border-gray-200", children: [_jsx(motion.div, { className: "absolute inset-0 flex items-center justify-center pointer-events-none", style: { opacity }, children: _jsx("span", { className: "text-gray-400 font-bold text-[14px] tracking-tight", children: "Slide to send" }) }), _jsx(motion.div, { drag: isValid ? "x" : false, dragConstraints: { left: 0, right: slideRange }, dragElastic: 0, onDragEnd: handleDragEnd, style: { x }, className: `w-14 h-14 rounded-full flex items-center justify-center z-10 shadow-lg ${isValid ? 'bg-[#ED0711] cursor-grab active:cursor-grabbing' : 'bg-gray-400 cursor-not-allowed'}`, children: _jsx("svg", { width: "28", height: "28", viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M5 12h14M12 5l7 7-7 7" }) }) })] })), (isSent || isFailed || isLoading) && (_jsx("div", { className: "h-[64px]" }) // Placeholder to maintain layout
                    )] })), isConfirming && (_jsx("div", { className: "absolute inset-0 bg-black/60 z-[500] flex items-center justify-center p-6 animate-in fade-in duration-200", children: _jsxs(motion.div, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, className: "bg-white w-full max-w-[320px] rounded-[24px] p-6 border border-gray-200 shadow-2xl", children: [_jsx("h2", { className: "text-gray-900 font-bold text-[18px] mb-2 text-center", children: "Confirm Transfer" }), _jsxs("p", { className: "text-gray-500 text-center mb-6", children: ["Are you sure you want to send ", _jsxs("span", { className: "text-gray-900 font-bold", children: ["$", amount] }), " to ", _jsx("span", { className: "text-gray-900 font-bold", children: selectedContact || 'this contact' }), "?"] }), _jsxs("div", { className: "space-y-3", children: [_jsx("button", { onClick: handleConfirmSend, className: "w-full py-4 bg-[#ED0711] text-white font-bold rounded-full shadow-lg active:scale-[0.98] transition-all", children: "Send Now" }), _jsx("button", { onClick: handleCancelSend, className: "w-full py-4 bg-gray-100 text-gray-900 font-bold rounded-full active:bg-gray-200 transition-all", children: "Cancel" })] })] }) })), _jsxs(AnimatePresence, { children: [isLoading && (_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "absolute inset-0 bg-white/95 backdrop-blur-sm z-[1000] flex flex-col items-center justify-center p-8 text-center", children: [_jsx(motion.div, { animate: { rotate: 360 }, transition: { repeat: Infinity, duration: 1, ease: 'linear' }, className: "mb-6", children: _jsx(Loader2, { size: 64, className: "text-[#ED0711]" }) }), _jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Processing Transfer" }), _jsx("p", { className: "text-gray-500", children: "Please wait while we securely process your Interac e-Transfer..." })] }, "loading")), isSent && (_jsx(motion.div, { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' }, className: "absolute inset-0 bg-white z-[1000] flex flex-col pt-12", children: _jsxs("div", { className: "flex-1 flex flex-col items-center justify-center p-8 text-center", children: [_jsx("div", { className: "w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-8", children: _jsx(CheckCircle2, { size: 48, className: "text-emerald-600" }) }), _jsx("h2", { className: "text-3xl font-bold text-gray-900 mb-4", children: "Transfer Successful" }), _jsxs("p", { className: "text-gray-500 mb-8 max-w-xs", children: ["Your transfer of ", _jsxs("span", { className: "text-gray-900 font-bold", children: ["$", amount] }), " to ", _jsx("span", { className: "text-gray-900 font-bold", children: selectedContact }), " has been sent."] }), _jsx("div", { className: "w-full space-y-4", children: _jsx("button", { onClick: () => {
                                            setIsSent(false);
                                            onBack();
                                        }, className: "w-full py-4 bg-[#ED0711] text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all", children: "Done" }) })] }) }, "success")), isFailed && (_jsx(motion.div, { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' }, className: "absolute inset-0 bg-white z-[1000] flex flex-col pt-12", children: _jsxs("div", { className: "flex-1 flex flex-col items-center justify-center p-8 text-center", children: [_jsx("div", { className: "w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-8", children: _jsx(XCircle, { size: 48, className: "text-[#ED0711]" }) }), _jsx("h2", { className: "text-3xl font-bold text-gray-900 mb-4", children: "Transfer Failed" }), _jsx("p", { className: "text-gray-500 mb-12 max-w-xs", children: "We encountered an error while processing your transfer. Your funds have not been moved." }), _jsxs("div", { className: "w-full space-y-4 px-4", children: [_jsxs("button", { onClick: () => setIsFailed(false), className: "w-full py-4 bg-[#ED0711] text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all", children: [_jsx(RefreshCcw, { size: 20 }), "Try Again"] }), _jsxs("button", { onClick: () => {
                                                window.dispatchEvent(new CustomEvent('scotia_open_chat'));
                                                setIsFailed(false);
                                            }, className: "w-full py-4 bg-white border-2 border-[#ED0711] text-[#ED0711] font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all", children: [_jsx(MessageSquare, { size: 20 }), "Contact Support"] }), _jsx("button", { onClick: () => {
                                                setIsFailed(false);
                                                onBack();
                                            }, className: "w-full py-4 text-gray-400 font-medium", children: "Cancel and return" })] })] }) }, "failure"))] }), _jsx(OTPVerification, { isOpen: showAddContactOTP, onClose: () => setShowAddContactOTP(false), onSuccess: handleOTPSuccess, phoneNumberEnding: "452" })] }));
};
export default InteracETransferView;
