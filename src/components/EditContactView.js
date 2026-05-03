import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ChevronDown, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
export const EditContactView = ({ isOpen, onClose, onSave, onDelete, contact, theme = 'light' }) => {
    const isDark = theme === 'dark';
    const [name, setName] = useState('');
    const [method, setMethod] = useState('Email');
    const [email, setEmail] = useState('');
    const [methodError, setMethodError] = useState('');
    const [securityQuestion, setSecurityQuestion] = useState('What is this for?');
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [showSecurityFields, setShowSecurityFields] = useState(false);
    const [showAutoDepositModal, setShowAutoDepositModal] = useState(false);
    useEffect(() => {
        if (contact && isOpen) {
            setName(contact.name);
            setEmail(contact.email);
            setSecurityQuestion(contact.securityQuestion || 'What is this for?');
            setSecurityAnswer(contact.securityAnswer || '');
            // If it already has security fields, show them
            if (contact.securityQuestion && contact.securityAnswer) {
                setShowSecurityFields(true);
            }
        }
    }, [contact, isOpen]);
    const handleMethodChange = (val) => {
        setMethod(val);
        setMethodError(val === 'Mobile' ? 'Mobile contact method is not supported.' : '');
    };
    const handleEmailChange = (val) => {
        setEmail(val);
    };
    const handleContinue = () => {
        if (!showSecurityFields) {
            // First click: Check auto-deposit
            setShowAutoDepositModal(true);
        }
        else {
            // Second click: Save contact directly
            handleSaveContact();
        }
    };
    const handleModalConfirm = () => {
        setShowAutoDepositModal(false);
        setShowSecurityFields(true);
    };
    const handleSaveContact = () => {
        if (contact) {
            const updatedContact = {
                ...contact,
                name,
                email,
                securityQuestion,
                securityAnswer
            };
            onSave(updatedContact);
        }
        onClose();
    };
    return (_jsx(AnimatePresence, { children: isOpen && contact && (_jsxs(motion.div, { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' }, className: `absolute inset-0 z-[400] flex flex-col ${isDark ? 'bg-[#121212] text-white' : 'bg-white text-[#1A1A1A]'}`, children: [_jsxs("div", { className: `pt-12 pb-3 px-4 flex items-center border-b ${isDark ? 'border-white/5' : 'border-gray-100'}`, children: [_jsx("button", { onClick: onClose, className: "p-1 -ml-1", children: _jsx(ArrowLeft, { size: 24, className: isDark ? 'text-gray-400' : 'text-[#4A4A4A]' }) }), _jsx("div", { className: "flex-1 flex items-center justify-center", children: _jsx("h1", { className: "font-bold text-[17px]", children: "Edit contact" }) }), _jsx("div", { className: "w-8" })] }), _jsxs("div", { className: "flex-1 p-6 space-y-8", children: [_jsx(UnderlineInput, { label: "Contact name", value: name, onChange: setName, placeholder: "First name Last name", isDark: isDark }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("div", { className: `text-[14px] font-medium ml-1 ${isDark ? 'text-gray-400' : 'text-[#4A4A4A]'}`, children: "Contact method" }), _jsxs("div", { className: "relative", children: [_jsxs("select", { className: `w-full p-2 border-b outline-none appearance-none ${isDark ? 'bg-[#121212] border-white/20 text-white focus:border-[#ED0711]' : 'bg-white border-gray-300 text-[#1A1A1A] focus:border-[#ED0711]'}`, value: method, onChange: e => handleMethodChange(e.target.value), children: [_jsx("option", { children: "Email" }), _jsx("option", { children: "Mobile" })] }), _jsx(ChevronDown, { className: "absolute right-0 top-2 text-[#ED0711]", size: 20 })] }), methodError && _jsxs("p", { className: "text-red-600 text-xs mt-1 flex items-center gap-1", children: [_jsx(AlertCircle, { size: 12 }), methodError] })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx(UnderlineInput, { label: "Email", value: email, onChange: handleEmailChange, placeholder: "name@email.com", isDark: isDark }), showSecurityFields && (_jsxs("p", { className: `text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`, children: [email, " is not registered for auto-deposit."] }))] }), showSecurityFields && (_jsxs("div", { className: "space-y-4", children: [_jsx(UnderlineInput, { label: "Security Question", value: securityQuestion, onChange: setSecurityQuestion, isDark: isDark, placeholder: "e.g. What is my dog's name?" }), _jsx(UnderlineInput, { label: "Security Answer", value: securityAnswer, onChange: setSecurityAnswer, isDark: isDark, placeholder: "Answer" })] })), onDelete && (_jsx("div", { className: "pt-8", children: _jsx("button", { onClick: () => contact && onDelete(contact.id), className: "w-full py-4 text-red-600 font-bold text-[15px] border border-red-100 rounded-xl active:bg-red-50 transition-colors", children: "Delete contact" }) }))] }), _jsxs("div", { className: "p-6 flex justify-end items-center", children: [_jsx("span", { className: "text-[#ED0711] font-bold text-lg mr-4", children: "Save changes" }), _jsx("button", { onClick: handleContinue, disabled: !!methodError || !email || (showSecurityFields && (!securityQuestion || !securityAnswer)), className: "w-14 h-14 rounded-full bg-[#ED0711] flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform disabled:opacity-50", children: _jsx(ArrowRight, { size: 28 }) })] }), showAutoDepositModal && (_jsx("div", { className: "absolute inset-0 z-[500] flex items-center justify-center bg-black/50 p-6", children: _jsx("div", { className: `p-8 rounded-[24px] max-w-[320px] w-full shadow-2xl animate-in fade-in zoom-in duration-200 ${isDark ? 'bg-[#1E1E1E]' : 'bg-white'}`, children: _jsxs("div", { className: "flex flex-col items-center text-center", children: [_jsx("div", { className: "w-16 h-16 bg-[#ED0711]/10 rounded-full flex items-center justify-center mb-4", children: _jsx(ShieldCheck, { size: 32, className: "text-[#ED0711]" }) }), _jsx("h3", { className: `text-[18px] font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`, children: "Not Registered for Autodeposit" }), _jsxs("p", { className: `text-[14px] leading-relaxed mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`, children: [email, " hasn't set up Autodeposit yet. This means they'll need to answer a security question to receive the funds you send.", _jsx("br", {}), _jsx("br", {}), _jsx("strong", { children: "Why use Autodeposit?" }), _jsx("br", {}), "Autodeposit is a secure way to receive funds without having to answer a security question. It's faster and more convenient for both the sender and the recipient.", _jsx("br", {}), _jsx("br", {}), _jsx("strong", { children: "Important:" }), " You'll need to create a security question and share the answer with them securely. They will use this answer to deposit the funds into their own bank account.", _jsx("br", {}), _jsx("br", {}), "Make sure the answer is something only they would know, or share it with them through a different channel."] }), _jsx("button", { onClick: handleModalConfirm, className: "w-full bg-[#ED0711] text-white py-4 rounded-full font-bold shadow-lg active:scale-[0.98] transition-all", children: "Set Security Question" })] }) }) }))] })) }));
};
const UnderlineInput = React.forwardRef(({ label, value, onChange, placeholder, isDark }, ref) => (_jsxs("div", { className: "space-y-1.5", children: [_jsx("div", { className: `text-[14px] font-medium ml-1 ${isDark ? 'text-gray-400' : 'text-[#4A4A4A]'}`, children: label }), _jsx("input", { ref: ref, className: `w-full p-2 border-b outline-none focus:border-[#ED0711] ${isDark ? 'bg-[#121212] border-white/20 text-white' : 'bg-white border-gray-300 text-[#1A1A1A]'}`, value: value, onChange: e => onChange(e.target.value), placeholder: placeholder })] })));
