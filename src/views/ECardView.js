import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Heart, Download, Copy, Edit3, DollarSign, CheckCircle, ChevronRight } from 'lucide-react';
import bwipjs from 'bwip-js';
import { useBank } from '../shared/BankContext';
const { useState, useEffect, useRef } = React;
const PREFIX = "637717060000";
const calculateLuhnCheckDigit = (number) => {
    let sum = 0;
    let shouldDouble = true;
    for (let i = number.length - 1; i >= 0; i--) {
        let digit = parseInt(number.charAt(i));
        if (shouldDouble) {
            digit *= 2;
            if (digit > 9)
                digit -= 9;
        }
        sum += digit;
        shouldDouble = !shouldDouble;
    }
    return (10 - (sum % 10)) % 10;
};
const generateValidLuhnNumber = (usedNumbers) => {
    let attempts = 0;
    while (attempts < 5000) {
        const min = 100000;
        const max = 950999;
        const randomVal = Math.floor(Math.random() * (max - min + 1)) + min;
        const baseNumber = PREFIX + randomVal.toString();
        const checkDigit = calculateLuhnCheckDigit(baseNumber);
        const fullNumber = baseNumber + checkDigit;
        if (!usedNumbers.has(fullNumber)) {
            return fullNumber;
        }
        attempts++;
    }
    return PREFIX + "100000" + calculateLuhnCheckDigit(PREFIX + "100000");
};
export default function ECardView({ card, onBack, theme: _theme = 'light' }) {
    const { user, updateUser } = useBank();
    // Force light theme as requested ("LITE MODE")
    const isDark = false;
    console.log('Theme requested:', _theme); // Use to avoid lint error
    const [cardNumber, setCardNumber] = useState(card.cardNumber);
    const [pin] = useState(card.pin);
    const [usedNumbers, setUsedNumbers] = useState(new Set());
    const canvasRef = useRef(null);
    const getCompanyColor = (company) => {
        if (card.isRedeemed)
            return '#6B7280'; // Gray for redeemed
        const colors = {
            'Dollarama': '#006A4E',
            'Winners': '#ED0711',
            'Marshalls': '#004B8D',
            'HomeSense': '#75203B',
            'Starbucks': '#00704A',
            'Amazon': '#232F3E',
        };
        return colors[company] || '#ED0711';
    };
    const DOLLARAMA_IMAGE = "https://www.giftcards.com/content/dam/bhn/live/nam/ca/en/catalog-assets/product-images/07675058430/07675058430_1031158_master.png/_jcr_content/renditions/cq5dam.web.1280.1280.jpeg";
    const DOLLARAMA_ICON = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRaExjx1DOdg3VFYQBmcQhGBqf7dpDQx7nvXw&s";
    useEffect(() => {
        const saved = localStorage.getItem(`used_numbers_${card.company}`);
        if (saved) {
            try {
                setUsedNumbers(new Set(JSON.parse(saved)));
            }
            catch (e) {
                console.error('Failed to parse used numbers', e);
            }
        }
    }, [card.company]);
    const handleTap = () => {
        if (card.isRedeemed)
            return;
        const newNumber = generateValidLuhnNumber(usedNumbers);
        setCardNumber(newNumber);
        const updated = new Set(usedNumbers);
        updated.add(newNumber);
        setUsedNumbers(updated);
        localStorage.setItem(`used_numbers_${card.company}`, JSON.stringify(Array.from(updated)));
    };
    const handleRedeem = async (e) => {
        e.stopPropagation();
        if (!user || card.isRedeemed)
            return;
        const updatedCards = user.purchasedCards.map(c => c.id === card.id ? { ...c, balance: 0, isRedeemed: true } : c);
        try {
            await updateUser({ purchasedCards: updatedCards });
        }
        catch (err) {
            console.error('Failed to redeem card:', err);
        }
    };
    useEffect(() => {
        if (canvasRef.current && cardNumber) {
            try {
                bwipjs.toCanvas(canvasRef.current, {
                    bcid: 'pdf417',
                    text: cardNumber,
                    scale: 2,
                    height: 12,
                    includetext: false,
                });
            }
            catch (e) {
                console.error('Barcode generation error:', e);
            }
        }
    }, [cardNumber]);
    const formatCardNumber = (num) => {
        return num.replace(/(\d{4})(\d{4})(\d{4})(\d{4})(\d{3})/, '$1 $2 $3 $4 $5');
    };
    const companyColor = getCompanyColor(card.company);
    return (_jsxs(motion.div, { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' }, transition: { type: 'spring', damping: 25, stiffness: 200 }, className: `absolute inset-0 z-[200] flex flex-col overflow-y-auto ${isDark ? 'bg-[#0A0A0A] text-white' : 'bg-[#F8F9FA] text-[#1A1A1A]'}`, onClick: handleTap, children: [_jsxs("div", { className: `pt-12 pb-4 px-4 flex items-center justify-between shrink-0 ${isDark ? 'bg-[#121212]' : 'bg-white'}`, children: [_jsxs("div", { className: "flex items-center", children: [_jsx("button", { onClick: (e) => { e.stopPropagation(); onBack(); }, className: "p-2 -ml-2 rounded-full active:bg-gray-100 transition-colors", children: _jsx(ChevronLeft, { size: 24, className: isDark ? 'text-white' : companyColor, style: { color: !isDark ? companyColor : undefined } }) }), card.company === 'Dollarama' ? (_jsx("div", { className: `w-8 h-8 rounded-lg overflow-hidden ml-2 shadow-sm ${card.isRedeemed ? 'grayscale' : ''}`, children: _jsx("img", { src: DOLLARAMA_ICON, alt: "Dollarama", className: "w-full h-full object-cover", referrerPolicy: "no-referrer" }) })) : null, _jsx("h1", { className: "font-bold text-[19px] ml-2", children: card.company })] }), _jsx("button", { onClick: (e) => e.stopPropagation(), className: "p-2 rounded-full active:bg-gray-100 transition-colors", children: _jsx(Heart, { size: 24, className: "text-gray-300 fill-gray-300" }) })] }), _jsx("div", { className: "py-2.5 px-4 flex justify-center items-center transition-colors duration-500", style: { backgroundColor: companyColor }, children: _jsx("span", { className: "text-white font-medium text-[15px]", children: card.isRedeemed ? 'Card Redeemed' : `Total Balance: $${card.balance.toFixed(2)}` }) }), _jsxs("div", { className: "flex flex-col items-center pt-8 pb-6 space-y-4", children: [card.company === 'Dollarama' ? (_jsxs("div", { className: `relative w-[280px] h-[170px] rounded-[20px] overflow-hidden shadow-xl transition-all duration-500 ${card.isRedeemed ? 'grayscale opacity-60 scale-95' : ''}`, children: [_jsx("img", { src: DOLLARAMA_IMAGE, alt: "Dollarama Card", className: "w-full h-full object-cover", referrerPolicy: "no-referrer" }), card.isRedeemed && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/20", children: _jsx("div", { className: "bg-white/90 px-4 py-2 rounded-full shadow-lg", children: _jsx("span", { className: "text-gray-900 font-black uppercase tracking-widest text-sm", children: "Redeemed" }) }) }))] })) : (_jsxs("div", { className: `relative w-[280px] h-[170px] rounded-[20px] overflow-hidden shadow-xl flex items-center justify-center transition-all duration-500 ${card.isRedeemed ? 'opacity-60 scale-95' : ''}`, style: { backgroundColor: companyColor }, children: [_jsx("div", { className: "absolute inset-0 opacity-20 flex flex-wrap gap-2 p-2 overflow-hidden pointer-events-none", children: Array.from({ length: 20 }).map((_, i) => (_jsx("span", { className: "text-[10px] font-black italic text-white uppercase", children: card.company }, i))) }), _jsxs("div", { className: "relative z-10 flex flex-col items-center", children: [_jsx("h2", { className: "text-3xl font-black tracking-tighter italic text-white uppercase", children: card.company }), _jsx("p", { className: "text-[8px] text-white/60 font-bold uppercase tracking-[0.3em] mt-1", children: "Digital Gift Card" })] }), card.isRedeemed && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/20", children: _jsx("div", { className: "bg-white/90 px-4 py-2 rounded-full shadow-lg", children: _jsx("span", { className: "text-gray-900 font-black uppercase tracking-widest text-sm", children: "Redeemed" }) }) }))] })), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("span", { className: `text-3xl font-bold transition-colors duration-500 ${card.isRedeemed ? 'text-gray-400' : 'text-gray-900'}`, children: ["$", card.balance.toFixed(2)] }), _jsx("button", { onClick: (e) => e.stopPropagation(), className: "p-2 bg-gray-100 rounded-full", children: _jsx(Download, { size: 18, className: "text-gray-600" }) })] })] }), _jsx("div", { className: "px-4 pb-8", children: _jsxs("div", { className: `rounded-[24px] overflow-hidden border transition-all duration-500 ${isDark ? 'bg-[#121212] border-white/5' : 'bg-white border-gray-100 shadow-sm'} ${card.isRedeemed ? 'opacity-50' : ''}`, children: [_jsxs("div", { className: "px-6 pt-6 pb-4 flex justify-between items-center", children: [_jsx("button", { onClick: (e) => e.stopPropagation(), className: "text-[14px] font-semibold underline decoration-2 underline-offset-4", style: { color: companyColor }, children: "Barcode won't scan?" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("span", { className: "text-gray-400 text-[14px]", children: ["PIN: ", _jsx("span", { className: "font-bold", style: { color: companyColor }, children: pin })] }), _jsx("button", { onClick: (e) => e.stopPropagation(), className: "p-1.5 bg-gray-50 rounded-lg", children: _jsx(Copy, { size: 16, style: { color: companyColor } }) })] })] }), _jsx("div", { className: "px-4 py-4 flex justify-center", children: _jsx("div", { className: `w-full max-w-[320px] h-[100px] flex items-center justify-center overflow-hidden transition-all duration-500 ${card.isRedeemed ? 'grayscale' : ''}`, children: _jsx("canvas", { ref: canvasRef, className: "w-full h-full object-contain" }) }) }), _jsxs("div", { className: `mx-6 mb-6 mt-2 rounded-2xl p-4 flex items-center justify-between ${isDark ? 'bg-white/5' : 'bg-gray-50'}`, children: [_jsx("span", { className: "font-mono text-[17px] font-bold tracking-wider", style: { color: companyColor }, children: formatCardNumber(cardNumber) }), _jsx("button", { onClick: (e) => e.stopPropagation(), className: "p-1.5 bg-white rounded-lg shadow-sm border border-gray-100", children: _jsx(Copy, { size: 16, style: { color: companyColor } }) })] })] }) }), _jsxs("div", { className: "px-6 flex justify-between items-center pb-8", children: [_jsxs("div", { className: "flex flex-col items-center space-y-2", children: [_jsx("button", { onClick: (e) => e.stopPropagation(), className: "w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center", style: { color: companyColor }, children: _jsx(Edit3, { size: 20 }) }), _jsx("span", { className: "text-[12px] font-medium text-gray-500", children: "Edit Card" })] }), _jsxs("div", { className: "flex flex-col items-center space-y-2", children: [_jsx("button", { onClick: (e) => e.stopPropagation(), className: "w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center", style: { color: companyColor }, children: _jsx(DollarSign, { size: 20 }) }), _jsx("span", { className: "text-[12px] font-medium text-gray-500", children: "Balance" })] }), _jsxs("div", { className: "flex flex-col items-center space-y-2", children: [_jsx("button", { onClick: handleRedeem, disabled: card.isRedeemed, className: `w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${card.isRedeemed ? 'bg-green-100 text-green-600' : 'bg-gray-50 text-gray-600'}`, style: { color: !card.isRedeemed ? companyColor : undefined }, children: card.isRedeemed ? _jsx(CheckCircle, { size: 20 }) : _jsx(CheckCircle, { size: 20 }) }), _jsx("span", { className: "text-[12px] font-medium text-gray-500", children: card.isRedeemed ? 'Redeemed' : 'Redeem' })] })] }), _jsxs("div", { className: "px-6 pb-20", children: [_jsxs("div", { className: "border-t border-gray-100 py-4 flex justify-between items-center", children: [_jsx("span", { className: "text-[15px] font-bold text-gray-800", children: "Notes:" }), _jsx(ChevronRight, { size: 20, className: "text-gray-300" })] }), _jsx("div", { className: "border-t border-gray-100 py-4", children: _jsx("p", { className: "text-[13px] text-gray-500 font-medium", children: "Expiry date: Doesn't Expire" }) })] })] }));
}
