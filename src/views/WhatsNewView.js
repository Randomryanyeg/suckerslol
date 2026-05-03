import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
const WhatsNewView = ({ onBack }) => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isPWA, setIsPWA] = useState(false);
    const [platform, setPlatform] = useState('other');
    useEffect(() => {
        setIsPWA(window.matchMedia('(display-mode: standalone)').matches);
        const userAgent = window.navigator.userAgent.toLowerCase();
        if (/iphone|ipad|ipod/.test(userAgent)) {
            setPlatform('ios');
        }
        else if (/android/.test(userAgent)) {
            setPlatform('android');
        }
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);
    const handleInstall = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choice) => {
                if (choice.outcome === 'accepted') {
                    setDeferredPrompt(null);
                }
            });
        }
    };
    return (_jsxs("div", { className: "absolute inset-0 bg-[#F4F4F4] flex flex-col z-[100] overflow-hidden", children: [_jsxs("div", { className: "bg-white pt-12 pb-4 px-4 flex items-center border-b border-gray-100 shrink-0", children: [_jsx("button", { onClick: onBack, className: "text-gray-900 p-2 -ml-2", children: _jsx("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M19 12H5M12 19l-7-7 7-7" }) }) }), _jsx("h1", { className: "text-gray-900 font-bold text-xl ml-2", children: "What's New" })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-6 space-y-6", children: [!isPWA && (_jsxs("div", { className: "bg-white rounded-2xl p-6 border border-gray-200 space-y-6 shadow-sm", children: [_jsx("h2", { className: "text-gray-900 font-bold text-xl", children: "Install Scotia App" }), _jsx("p", { className: "text-gray-600 text-sm", children: "Get a faster, more reliable experience by installing Scotia as an app on your device." }), platform === 'android' && deferredPrompt && (_jsx("button", { onClick: handleInstall, className: "w-full py-4 bg-[#ED0711] text-white rounded-xl font-bold text-lg", children: "Install App" })), platform === 'ios' && (_jsxs("div", { className: "bg-gray-50 p-4 rounded-xl text-sm text-gray-600 space-y-2 border border-gray-100", children: [_jsx("p", { children: "To install on iOS:" }), _jsxs("ol", { className: "list-decimal list-inside space-y-1", children: [_jsxs("li", { children: ["Tap the ", _jsx("strong", { children: "Share" }), " button in your browser."] }), _jsxs("li", { children: ["Scroll down and tap ", _jsx("strong", { children: "Add to Home Screen" }), "."] })] })] })), _jsxs("div", { className: "flex flex-col items-center gap-3", children: [_jsx("p", { className: "text-gray-500 text-xs", children: "Or scan to install on another device:" }), _jsx("div", { className: "p-2 bg-white rounded-xl border border-gray-100", children: _jsx(QRCodeSVG, { value: window.location.origin + '/?token=projectsarah', size: 128 }) })] })] })), _jsx(UpdateCard, { version: "Version 24.3.0", date: "March 31, 2026", title: "Light Mode is Here!", description: "A fresh new look. Enjoy a clean, crisp light mode experience across the entire app. It's designed for maximum readability and a modern feel." }), _jsx(UpdateCard, { version: "Version 24.2.1", date: "February 28, 2026", title: "Enhanced Security", description: "We've added new security features to keep your accounts even safer, including improved Face ID integration and real-time fraud alerts." }), _jsx(UpdateCard, { version: "Version 24.1.0", date: "January 10, 2026", title: "Redesigned Dashboard", description: "A fresh new look for your accounts dashboard. Finding your balances and recent transactions is now faster than ever." })] })] }));
};
const UpdateCard = ({ version, date, title, description }) => (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "bg-white rounded-2xl p-6 border border-gray-200 shadow-sm", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("span", { className: "text-[#ED0711] font-bold text-sm", children: version }), _jsx("span", { className: "text-gray-500 text-xs", children: date })] }), _jsx("h2", { className: "text-gray-900 font-bold text-lg mb-2", children: title }), _jsx("p", { className: "text-gray-600 text-sm leading-relaxed", children: description })] }));
export default WhatsNewView;
