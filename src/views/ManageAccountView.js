import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'motion/react';
import { ChevronLeft, Shield, CreditCard, Bell, Lock, Smartphone, Info } from 'lucide-react';
import { useBank } from '../shared/BankContext';
const ManageAccountView = ({ accountName, onBack, theme = 'light' }) => {
    const isDark = theme === 'dark';
    const { user } = useBank();
    const account = user?.accounts[accountName];
    const settings = [
        { title: 'Security', items: [
                { label: 'Face ID for this account', icon: _jsx(Shield, { size: 20, className: "text-blue-400" }), value: 'Enabled' },
                { label: 'Transaction alerts', icon: _jsx(Bell, { size: 20, className: "text-pink-400" }), value: 'On' },
                { label: 'Lock this card', icon: _jsx(Lock, { size: 20, className: "text-red-400" }), isToggle: true }
            ] },
        { title: 'Account Info', items: [
                { label: 'Account number', icon: _jsx(Info, { size: 20, className: "text-gray-400" }), value: account?.accountNumber || '**** 3456' },
                { label: 'Transit number', icon: _jsx(Info, { size: 20, className: "text-gray-400" }), value: account?.accountNumber?.split('-')[0] || '12345' },
                { label: 'Institution number', icon: _jsx(Info, { size: 20, className: "text-gray-400" }), value: account?.accountNumber?.split('-')[1] || '002' }
            ] },
        { title: 'Cards', items: [
                { label: 'Replace card', icon: _jsx(CreditCard, { size: 20, className: "text-emerald-400" }) },
                { label: 'Add to Apple Wallet', icon: _jsx(Smartphone, { size: 20, className: "text-black bg-white rounded-md p-0.5" }) }
            ] }
    ];
    return (_jsxs(motion.div, { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' }, transition: { type: 'spring', damping: 25, stiffness: 200 }, className: `absolute inset-0 z-[200] flex flex-col ${isDark ? 'bg-[#121212] text-white' : 'bg-[#F8F9FA] text-[#1A1A1A]'}`, children: [_jsxs("div", { className: `pt-12 pb-4 px-4 flex items-center justify-between border-b shrink-0 ${isDark ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-gray-100'}`, children: [_jsx("button", { onClick: onBack, className: "p-1 -ml-1", children: _jsx(ChevronLeft, { size: 24, strokeWidth: 1.5, className: isDark ? 'text-gray-400' : 'text-[#4A4A4A]' }) }), _jsxs("h1", { className: "font-medium text-[17px]", children: ["Manage ", accountName.split(' ')[0]] }), _jsx("div", { className: "w-8" })] }), _jsx("div", { className: "flex-1 overflow-y-auto no-scrollbar pb-12", children: _jsxs("div", { className: "p-4", children: [settings.map((section, sIdx) => (_jsxs("div", { className: "mb-8", children: [_jsx("h3", { className: `px-2 mb-2 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`, children: section.title }), _jsx("div", { className: `rounded-xl border overflow-hidden ${isDark ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-gray-200'}`, children: section.items.map((item, iIdx) => (_jsxs("div", { className: `flex items-center gap-4 px-4 py-4 ${iIdx !== section.items.length - 1 ? (isDark ? 'border-b border-white/5' : 'border-b border-gray-100') : ''}`, children: [_jsx("div", { className: "w-8 flex justify-center", children: item.icon }), _jsx("span", { className: "flex-1 text-[15px]", children: item.label }), item.value && _jsx("span", { className: "text-sm text-gray-500", children: item.value }), item.isToggle && (_jsx("div", { className: "w-10 h-5 bg-gray-600 rounded-full relative", children: _jsx("div", { className: "absolute left-1 top-1 w-3 h-3 bg-white rounded-full" }) }))] }, iIdx))) })] }, sIdx))), _jsx("button", { className: "w-full py-4 text-[#ED0711] font-bold border-2 border-[#ED0711] rounded-xl mt-4", children: "Close this account" })] }) })] }));
};
export default ManageAccountView;
