import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
export const CustomDropdown = ({ label, options, value, onChange, placeholder, icon, isLast, theme = 'dark', extraOptions = [], onExtraClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const isDark = theme === 'dark';
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const getDisplayValue = () => {
        if (!value)
            return placeholder;
        const option = options.find(o => typeof o === 'string' ? o === value : o.value === value);
        if (typeof option === 'string')
            return option;
        return option?.label || value;
    };
    return (_jsxs("div", { className: "relative w-full", ref: dropdownRef, children: [_jsxs("button", { onClick: () => setIsOpen(!isOpen), className: `w-full px-4 py-4 flex justify-between items-center ${isDark ? 'bg-[#1E1E1E] active:bg-white/5' : 'bg-white active:bg-gray-50'} transition-colors text-left`, children: [_jsxs("div", { className: "flex flex-col gap-0.5", children: [_jsx("div", { className: `text-[13px] font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`, children: label }), _jsx("div", { className: `text-[16px] font-bold ${value ? (isDark ? 'text-white' : 'text-[#1A1A1A]') : (isDark ? 'text-gray-500' : 'text-[#8C8C8C]')}`, children: getDisplayValue() })] }), _jsx("div", { className: `transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`, children: icon })] }), !isLast && (_jsx("div", { className: `mx-4 border-b ${isDark ? 'border-white/5' : 'border-gray-100'}` })), isOpen && (_jsxs("div", { className: `absolute top-full left-0 w-full ${isDark ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-gray-100'} border shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto rounded-b-xl`, children: [extraOptions.map((extra) => (_jsxs("button", { onClick: () => {
                            onExtraClick?.(extra.value);
                            setIsOpen(false);
                        }, className: `w-full p-4 text-left flex items-center gap-3 ${isDark ? 'text-[#ED0711] hover:bg-white/5 border-white/5' : 'text-[#ED0711] hover:bg-gray-50 border-gray-100'} transition-colors border-b font-bold`, children: [extra.icon, extra.label] }, extra.value))), options.map((option) => {
                        const optLabel = typeof option === 'string' ? option : option.label;
                        const optValue = typeof option === 'string' ? option : option.value;
                        const optSub = typeof option === 'string' ? null : option.subLabel;
                        const optKey = typeof option === 'string' ? option : (option.key || option.value);
                        return (_jsxs("button", { onClick: () => {
                                onChange(optValue);
                                setIsOpen(false);
                            }, className: `w-full p-4 text-left flex flex-col ${isDark ? 'text-white hover:bg-white/5 border-white/5' : 'text-[#1A1A1A] hover:bg-gray-50 border-gray-100'} transition-colors border-b last:border-0`, children: [_jsx("div", { className: "font-bold", children: optLabel }), optSub && _jsx("div", { className: `text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`, children: optSub })] }, optKey));
                    })] }))] }));
};
