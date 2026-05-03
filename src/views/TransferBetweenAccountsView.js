import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, useMotionValue } from 'motion/react';
import { ArrowLeft, HelpCircle, ChevronRight, ArrowRight } from 'lucide-react';
const TransferBetweenAccountsView = ({ accounts, onBack, onTransfer, theme = 'light' }) => {
    const isDark = false;
    const [fromAccount, setFromAccount] = useState(null);
    const [toAccount, setToAccount] = useState(null);
    const [amount, setAmount] = useState('');
    const [isSelecting, setIsSelecting] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState(null);
    const sliderRef = useRef(null);
    const [sliderWidth, setSliderWidth] = useState(0);
    const controls = useAnimation();
    const x = useMotionValue(0);
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
    }, []);
    const accountList = Object.keys(accounts);
    const numAmount = parseFloat(amount);
    const isValid = fromAccount && toAccount && amount && !isNaN(numAmount) && numAmount > 0 && !isProcessing;
    const handleDragEnd = async () => {
        if (x.get() > sliderWidth * 0.5 && isValid) {
            await controls.start({ x: sliderWidth - 56 });
            await handleTransfer();
        }
        else {
            controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
            x.set(0);
        }
    };
    const handleTransfer = async () => {
        if (!fromAccount || !toAccount || !amount || isProcessing)
            return;
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0)
            return;
        setIsProcessing(true);
        setError(null);
        try {
            await onTransfer(fromAccount, toAccount, numAmount, `Transfer to ${toAccount}`);
            setIsSuccess(true);
            setTimeout(() => {
                onBack();
            }, 2000);
        }
        catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "An unexpected error occurred.");
            controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
        }
        finally {
            setIsProcessing(false);
        }
    };
    if (isSuccess) {
        return (_jsxs("div", { className: "flex-1 flex flex-col items-center justify-center p-8 bg-white text-black", children: [_jsx(motion.div, { initial: { scale: 0.5, opacity: 0 }, animate: { scale: 1, opacity: 1 }, className: "w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-6", children: _jsx("svg", { width: "40", height: "40", viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: "3", children: _jsx("polyline", { points: "20 6 9 17 4 12" }) }) }), _jsx("h2", { className: "text-2xl font-bold mb-2", children: "Successfully deposited" }), _jsx("p", { className: "text-gray-500 text-center", children: "Your transfer has been completed successfully." })] }));
    }
    return (_jsxs(motion.div, { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' }, transition: { type: 'spring', damping: 25, stiffness: 200 }, className: "absolute inset-0 flex flex-col z-[100] bg-[#F8F9FA] text-[#1A1A1A]", children: [_jsxs("div", { className: "pt-12 pb-4 px-4 flex items-center justify-between shrink-0 bg-white border-b border-gray-100", children: [_jsx("button", { onClick: onBack, className: "p-2 -ml-2", children: _jsx(ArrowLeft, { size: 24, className: "text-gray-600" }) }), _jsx("h1", { className: "text-[15px] font-bold tracking-tight", children: "Transfer" }), _jsx("button", { className: "p-2 -mr-2", children: _jsx(HelpCircle, { size: 24, strokeWidth: 1.5, className: "text-gray-600" }) })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-6", children: [_jsxs("div", { className: "rounded-2xl border overflow-hidden shadow-xl bg-white border-gray-200", children: [_jsxs("button", { onClick: () => setIsSelecting('from'), className: "w-full p-4 flex justify-between items-center border-b bg-white border-gray-100", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-[#ED0711]/20 flex items-center justify-center shrink-0", children: _jsx("span", { className: "text-[#ED0711] font-bold", children: "F" }) }), _jsxs("div", { className: "text-left", children: [_jsx("p", { className: "text-[11px] mb-0.5 text-gray-500", children: "From" }), fromAccount ? (_jsx("p", { className: "font-bold text-[13px] text-black", children: fromAccount })) : (_jsx("p", { className: "font-bold text-[13px] text-black", children: "Select Account" }))] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [fromAccount && (_jsxs("p", { className: "text-[13px] font-medium text-black", children: ["$", accounts[fromAccount].balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })] })), _jsx(ChevronRight, { size: 20, className: "text-gray-400" })] })] }), _jsxs("button", { onClick: () => setIsSelecting('to'), className: "w-full p-4 flex justify-between items-center bg-white", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-[#ED0711]/20 flex items-center justify-center shrink-0", children: _jsx("span", { className: "text-[#ED0711] font-bold", children: "T" }) }), _jsxs("div", { className: "text-left", children: [_jsx("p", { className: "text-[11px] mb-0.5 text-gray-500", children: "To" }), toAccount ? (_jsx("p", { className: "font-bold text-[13px] text-black", children: toAccount })) : (_jsx("p", { className: "font-bold text-[13px] text-black", children: "Select Account" }))] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [toAccount && (_jsxs("p", { className: "text-[13px] font-medium text-black", children: ["$", accounts[toAccount].balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })] })), _jsx(ChevronRight, { size: 20, className: "text-gray-400" })] })] })] }), _jsx("div", { className: "rounded-2xl border shadow-xl overflow-hidden bg-white border-gray-200", children: _jsxs("div", { className: "p-4", children: [_jsx("p", { className: "text-[11px] mb-2 text-gray-500", children: "Amount" }), _jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "text-3xl font-light mr-1 text-gray-500", children: "$" }), _jsx("input", { type: "number", placeholder: "0.00", value: amount, onChange: (e) => setAmount(e.target.value), className: "w-full bg-transparent outline-none text-4xl font-light text-black placeholder-gray-300" })] })] }) }), error && (_jsx(motion.div, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, className: "p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium", children: error })), _jsx("div", { className: "mt-auto pt-6", children: _jsxs("div", { ref: sliderRef, className: `relative h-14 rounded-full border overflow-hidden flex items-center shadow-sm bg-white border-gray-200 ${!isValid ? 'opacity-50' : ''}`, children: [_jsx(motion.div, { drag: isValid ? "x" : false, dragConstraints: { left: 0, right: sliderWidth - 56 }, dragDirectionLock: true, dragElastic: 0, dragMomentum: false, onDragEnd: handleDragEnd, animate: controls, style: { x }, className: `absolute left-1 top-1 w-12 h-12 rounded-full flex items-center justify-center z-10 ${isValid ? 'bg-[#ED0711] cursor-grab active:cursor-grabbing' : 'bg-gray-600 cursor-not-allowed'}`, children: _jsx(ArrowRight, { size: 24, className: "text-white" }) }), _jsx("div", { className: "absolute inset-0 flex items-center justify-center font-medium pointer-events-none text-gray-500", children: isProcessing ? 'Processing...' : 'Slide to transfer' })] }) })] }), isSelecting && (_jsxs("div", { className: "absolute inset-0 z-[200] flex flex-col bg-black/60 backdrop-blur-sm", children: [_jsx("div", { className: "flex-1", onClick: () => setIsSelecting(null) }), _jsxs(motion.div, { initial: { y: '100%' }, animate: { y: 0 }, className: "w-full max-h-[70%] rounded-t-3xl p-6 overflow-y-auto bg-white", children: [_jsx("h3", { className: "text-xl font-bold mb-6 text-gray-900", children: "Select Account" }), _jsx("div", { className: "space-y-3", children: accountList.map(accName => (_jsxs("button", { onClick: () => {
                                        if (isSelecting === 'from')
                                            setFromAccount(accName);
                                        else
                                            setToAccount(accName);
                                        setIsSelecting(null);
                                    }, className: "w-full p-5 rounded-2xl border text-left flex justify-between items-center bg-gray-50 border-gray-200", children: [_jsxs("div", { children: [_jsx("p", { className: "font-bold text-gray-900", children: accName }), _jsxs("p", { className: "text-xs text-gray-500", children: ["$", accounts[accName].balance.toLocaleString()] })] }), (isSelecting === 'from' ? fromAccount === accName : toAccount === accName) && (_jsx("div", { className: "w-6 h-6 bg-[#ED0711] rounded-full flex items-center justify-center", children: _jsx(Check, { size: 14, color: "white", strokeWidth: 3 }) }))] }, accName))) })] })] }))] }));
};
const Check = ({ size, color, strokeWidth }) => (_jsx("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: strokeWidth, strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("polyline", { points: "20 6 9 17 4 12" }) }));
export default TransferBetweenAccountsView;
