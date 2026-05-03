import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, HelpCircle, Info } from 'lucide-react';
let modalCallback = () => { };
export const showAlert = (title, message) => {
    return new Promise((resolve) => {
        modalCallback({
            title,
            message,
            type: 'alert',
            onConfirm: () => resolve(),
            onCancel: () => resolve()
        });
    });
};
export const showConfirm = (title, message) => {
    return new Promise((resolve) => {
        modalCallback({
            title,
            message,
            type: 'confirm',
            onConfirm: () => resolve(true),
            onCancel: () => resolve(false)
        });
    });
};
export const showPrompt = (title, message, defaultValue = '') => {
    return new Promise((resolve) => {
        modalCallback({
            title,
            message,
            type: 'prompt',
            defaultValue,
            onConfirm: (val) => resolve(val || null),
            onCancel: () => resolve(null)
        });
    });
};
export default function CustomModal() {
    const [options, setOptions] = useState(null);
    const [inputValue, setInputValue] = useState('');
    useEffect(() => {
        modalCallback = (opt) => {
            setOptions(opt);
            setInputValue(opt.defaultValue || '');
        };
    }, []);
    if (!options)
        return null;
    const handleConfirm = () => {
        options.onConfirm(inputValue);
        setOptions(null);
    };
    const handleCancel = () => {
        options.onCancel();
        setOptions(null);
    };
    const Icon = options.type === 'alert' ? AlertCircle : options.type === 'confirm' ? HelpCircle : Info;
    const iconColor = options.type === 'alert' ? 'text-red-500' : options.type === 'confirm' ? 'text-blue-500' : 'text-gray-500';
    return (_jsx(AnimatePresence, { children: options && (_jsx("div", { className: "fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm", children: _jsx(motion.div, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.9, opacity: 0 }, className: "bg-white rounded-[24px] w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[90vh]", children: _jsxs("div", { className: "p-6 overflow-y-auto", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: `p-2 rounded-full bg-gray-50 ${iconColor}`, children: _jsx(Icon, { size: 24 }) }), _jsx("h3", { className: "text-lg font-bold text-gray-900", children: options.title })] }), _jsx("p", { className: "text-gray-600 text-[15px] leading-relaxed mb-6", children: options.message }), options.type === 'prompt' && (_jsx("input", { autoFocus: true, type: "text", className: "w-full p-4 bg-gray-100 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-black font-medium", value: inputValue, onChange: (e) => setInputValue(e.target.value), onKeyDown: (e) => e.key === 'Enter' && handleConfirm() })), _jsxs("div", { className: "flex gap-3", children: [(options.type === 'confirm' || options.type === 'prompt') && (_jsx("button", { onClick: handleCancel, className: "flex-1 py-3.5 bg-gray-100 text-gray-900 font-bold rounded-xl active:scale-95 transition-transform", children: "Cancel" })), _jsx("button", { onClick: handleConfirm, className: "flex-1 py-3.5 bg-black text-white font-bold rounded-xl active:scale-95 transition-transform", children: options.type === 'alert' ? 'OK' : 'Confirm' })] })] }) }) })) }));
}
