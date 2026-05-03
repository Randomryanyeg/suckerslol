import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { ScotiaLogoSVG } from '../components/ScotiaIcons';
import { MessageCircle, ChevronUp, ChevronRight, Bell, Lock, ArrowLeft, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
const HomeView = ({ accounts, onSelectAccount, onAction, onChat, currentUser }) => {
    const [subTab, setSubTab] = useState('accounts');
    const [bankingExpanded, setBankingExpanded] = useState(true);
    const [creditExpanded, setCreditExpanded] = useState(true);
    // Speed tap logic
    const [tapCount, setTapCount] = useState(0);
    const [lastTapTime, setLastTapTime] = useState(0);
    const [showPinPrompt, setShowPinPrompt] = useState(false);
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState(false);
    const handleLogoTap = () => {
        const now = Date.now();
        if (now - lastTapTime < 500) {
            const newCount = tapCount + 1;
            setTapCount(newCount);
            if (newCount >= 5) {
                setShowPinPrompt(true);
                setTapCount(0);
            }
        }
        else {
            setTapCount(1);
        }
        setLastTapTime(now);
    };
    const handlePinSubmit = (enteredPin) => {
        const correctPin = currentUser?.settings?.adminPin || '6969';
        if (enteredPin === correctPin) {
            setShowPinPrompt(false);
            setPin('');
            onAction('AdminSettings');
        }
        else {
            setPinError(true);
            setPin('');
            setTimeout(() => setPinError(false), 500);
        }
    };
    const bankingEntries = useMemo(() => Object.entries(accounts).filter(([_, acc]) => acc.type === 'banking'), [accounts]);
    const creditEntries = useMemo(() => Object.entries(accounts).filter(([_, acc]) => acc.type === 'credit'), [accounts]);
    const name = currentUser?.settings?.displayName || currentUser?.username?.split('@')[0] || 'First Name';
    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12)
            return 'Good morning';
        if (hour < 17)
            return 'Good afternoon';
        return 'Good evening';
    }, []);
    return (_jsxs("div", { className: "flex-1 flex flex-col bg-[#F4F7F9] overflow-hidden h-full font-sans", children: [_jsxs("div", { className: "bg-[#ED0711] pt-12 pb-24 px-6 shrink-0 relative", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("div", { onClick: handleLogoTap, className: "cursor-pointer active:scale-95 transition-transform", children: _jsx(ScotiaLogoSVG, { color: "white", className: "w-11 h-11" }) }), _jsx("button", { onClick: onChat, className: "p-1 active:scale-90 transition-transform", children: _jsx(MessageCircle, { size: 28, className: "text-white", strokeWidth: 1.5 }) })] }), _jsxs("h1", { className: "text-white text-[22px] font-bold leading-tight mb-2", children: [greeting, ", ", name] })] }), _jsxs("div", { className: "flex-1 overflow-y-auto no-scrollbar relative z-10 -mt-16 px-4 pb-24", children: [_jsxs("div", { className: "bg-white rounded-[14px] shadow-sm overflow-hidden mb-4", children: [_jsxs("div", { className: "flex border-b border-gray-100", children: [_jsx(TabButton, { active: subTab === 'accounts', onClick: () => setSubTab('accounts'), label: "My accounts" }), _jsx(TabButton, { active: subTab === 'updates', onClick: () => setSubTab('updates'), label: "My updates" })] }), subTab === 'accounts' && (_jsxs("div", { className: "px-4 pb-2", children: [_jsxs("div", { className: "flex items-center justify-between w-full py-5", children: [_jsxs("span", { className: "font-bold text-[18px] text-[#ED0711]", children: ["Banking (", bankingEntries.length, ")"] }), _jsx(ChevronUp, { size: 24, color: "#ED0711", className: `transition-transform ${!bankingExpanded ? 'rotate-180' : ''}`, onClick: () => setBankingExpanded(!bankingExpanded) })] }), bankingExpanded && (_jsxs("div", { className: "space-y-0", children: [bankingEntries.map(([name, acc]) => (_jsx(AccountRow, { name: name, balance: acc.balance || 0, accountNumber: acc.accountNumber || '0000', isLast: false, onClick: () => onSelectAccount(name) }, name))), _jsxs("div", { className: "flex items-center justify-between py-5 border-t border-gray-100", children: [_jsx("span", { className: "font-bold text-[16px] text-gray-900", children: "Total:" }), _jsxs("span", { className: "text-[16px] text-gray-600", children: ["$", bankingEntries.reduce((sum, [, acc]) => sum + (acc.balance || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })] })] })] }))] })), subTab === 'updates' && (_jsxs("div", { className: "p-12 text-center", children: [_jsx("div", { className: "w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Bell, { size: 24, className: "text-gray-400" }) }), _jsx("p", { className: "text-gray-500 text-xs", children: "No new updates right now." })] }))] }), subTab === 'accounts' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "bg-white rounded-[14px] shadow-sm px-4 pb-2 mb-4", children: [_jsxs("div", { className: "flex items-center justify-between w-full py-5", children: [_jsxs("span", { className: "font-bold text-[18px] text-[#ED0711]", children: ["Credit cards (", creditEntries.length, ")"] }), _jsx(ChevronUp, { size: 24, color: "#ED0711", className: `transition-transform ${!creditExpanded ? 'rotate-180' : ''}`, onClick: () => setCreditExpanded(!creditExpanded) })] }), creditExpanded && (_jsxs("div", { className: "space-y-0", children: [creditEntries.map(([name, acc]) => (_jsx(AccountRow, { name: name, balance: acc.balance || 0, accountNumber: acc.accountNumber || '0000', isLast: false, onClick: () => onSelectAccount(name) }, name))), _jsxs("div", { className: "flex items-center justify-between py-5 border-t border-gray-100", children: [_jsx("span", { className: "font-bold text-[16px] text-gray-900", children: "Total:" }), _jsxs("span", { className: "text-[16px] text-gray-600", children: ["$", creditEntries.reduce((sum, [, acc]) => sum + (acc.balance || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })] })] })] }))] }), _jsxs("div", { className: "bg-white rounded-[14px] shadow-sm p-5 flex items-center justify-between active:bg-gray-50 transition-colors", onClick: () => onAction('AddProduct'), children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-10 h-10 flex items-center justify-center", children: _jsxs("div", { className: "relative", children: [_jsx(CreditCard, { size: 28, className: "text-gray-700" }), _jsx("div", { className: "absolute -bottom-1 -right-1 bg-white rounded-full p-0.5", children: _jsx("div", { className: "bg-[#00A4E4] rounded-full p-0.5", children: _jsx("div", { className: "w-2.5 h-2.5 flex items-center justify-center text-white text-[10px] font-bold", children: "+" }) }) })] }) }), _jsx("span", { className: "font-bold text-[18px] text-gray-800", children: "Add a new product" })] }), _jsx(ChevronRight, { size: 24, className: "text-[#00A4E4]" })] })] }))] }), _jsx(AnimatePresence, { children: showPinPrompt && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "absolute inset-0 z-[500] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6", children: _jsxs(motion.div, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.9, opacity: 0 }, className: "w-full max-w-sm rounded-3xl p-8 flex flex-col items-center bg-[#1E1E1E] text-white", children: [_jsx("div", { className: "w-16 h-16 bg-[#ED0711]/10 rounded-full flex items-center justify-center mb-6", children: _jsx(Lock, { size: 32, className: "text-[#ED0711]" }) }), _jsx("h2", { className: "text-lg font-bold mb-2", children: "Admin Access" }), _jsx("p", { className: "text-xs text-gray-500 text-center mb-8", children: "Enter PIN to unlock hidden settings" }), _jsx("div", { className: "flex gap-4 mb-8", children: [0, 1, 2, 3].map((i) => (_jsx("div", { className: `w-4 h-4 rounded-full border-2 ${pin.length > i ? 'bg-[#ED0711] border-[#ED0711]' : 'border-gray-600'} ${pinError ? 'bg-red-500 border-red-500 animate-shake' : ''}` }, i))) }), _jsx("div", { className: "grid grid-cols-3 gap-4 w-full", children: [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((num, i) => (_jsx("button", { onClick: () => {
                                        if (num === 'del')
                                            setPin(prev => prev.slice(0, -1));
                                        else if (num !== '') {
                                            if (pin.length < 4) {
                                                const newPin = pin + num;
                                                setPin(newPin);
                                                if (newPin.length === 4) {
                                                    setTimeout(() => handlePinSubmit(newPin), 200);
                                                }
                                            }
                                        }
                                    }, className: `h-16 rounded-2xl flex items-center justify-center text-lg font-bold active:bg-white/10 transition-colors ${num === '' ? 'pointer-events-none' : ''}`, children: num === 'del' ? _jsx(ArrowLeft, { size: 24 }) : num }, i))) }), _jsx("button", { onClick: () => { setShowPinPrompt(false); setPin(''); }, className: "mt-8 text-xs font-bold text-gray-500 uppercase tracking-widest", children: "Cancel" })] }) })) })] }));
};
// Sub-components
const TabButton = ({ active, onClick, label }) => (_jsxs("button", { onClick: onClick, className: `flex-1 py-5 text-center font-bold text-[18px] flex flex-col items-center justify-center transition-all duration-300 ${active ? 'text-[#ED0711]' : 'text-[#666666]'}`, children: [label, _jsx("div", { className: `mt-2 w-full h-[3px] transition-colors duration-300 ${active ? 'bg-[#ED0711]' : 'bg-transparent'}` })] }));
const AccountRow = ({ name, balance, accountNumber, onClick }) => (_jsxs("button", { onClick: onClick, className: "flex flex-col py-5 w-full text-left active:bg-gray-50 transition-colors border-t border-gray-100 first:border-t-0", children: [_jsxs("div", { className: "flex items-center gap-1 mb-1", children: [_jsx("p", { className: "font-bold text-[18px] text-gray-800", children: name }), _jsxs("p", { className: "text-[18px] text-gray-300 font-medium", children: ["(", accountNumber?.replace('...', '') || '0000', ")"] })] }), _jsxs("p", { className: "text-[18px] text-gray-900", children: ["$", balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })] })] }));
export default HomeView;
