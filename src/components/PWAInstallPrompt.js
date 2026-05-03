import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
export const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    useEffect(() => {
        // Check if it's iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
        setIsIOS(isIOSDevice);
        // Check if already installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
        if (isStandalone) {
            return;
        }
        const handler = (e) => {
            const dismissedAt = localStorage.getItem('pwa-prompt-dismissed');
            const isRecentlyDismissed = dismissedAt && (Date.now() - parseInt(dismissedAt)) < 1000 * 60 * 60 * 24; // 24 hours
            if (isRecentlyDismissed)
                return;
            // Don't prevent default, let the browser's native prompt also have a chance
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setIsVisible(true);
        };
        window.addEventListener('beforeinstallprompt', handler);
        const triggerHandler = () => {
            if (isStandalone)
                return;
            setIsVisible(true);
        };
        window.addEventListener('trigger-pwa-install', triggerHandler);
        // For iOS, we show the prompt manually after a delay if not standalone
        if (isIOSDevice && !isStandalone) {
            const dismissedAt = localStorage.getItem('pwa-prompt-dismissed');
            const isRecentlyDismissed = dismissedAt && (Date.now() - parseInt(dismissedAt)) < 1000 * 60 * 60 * 24; // 24 hours
            if (!isRecentlyDismissed) {
                const timer = setTimeout(() => {
                    setIsVisible(true);
                }, 3000);
                return () => {
                    clearTimeout(timer);
                    window.removeEventListener('trigger-pwa-install', triggerHandler);
                };
            }
        }
        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('trigger-pwa-install', triggerHandler);
        };
    }, []);
    const handleInstallClick = async () => {
        if (!deferredPrompt)
            return;
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsVisible(false);
    };
    const handleDismiss = () => {
        setIsVisible(false);
        // Optionally store in localStorage to not show again for a while
        localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    };
    if (!isVisible)
        return null;
    return (_jsx(AnimatePresence, { children: _jsxs(motion.div, { initial: { y: 100, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: 100, opacity: 0 }, className: "fixed bottom-20 left-4 right-4 z-[9999] bg-white rounded-xl shadow-2xl border border-gray-200 p-4 flex items-center gap-4", children: [_jsx("div", { className: "w-8 h-8 bg-[#ED0711] rounded-lg flex items-center justify-center flex-shrink-0", children: _jsx("img", { src: "https://cdn.brandfetch.io/idpIpGPfn2/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B", alt: "App Icon", className: "w-4 h-4 rounded-sm" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-bold text-gray-900 text-[10px]", children: "Scotia Mobile App" }), _jsx("p", { className: "text-[8px] text-gray-500 leading-tight", children: isIOS
                                ? "Tap 'Share' then 'Add to Home Screen'"
                                : "Switch to the App for full security" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [!isIOS && (_jsxs("button", { onClick: handleInstallClick, className: "bg-[#ED0711] text-white px-5 py-2.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-lg shadow-red-100 animate-bounce-subtle", children: [_jsx(Download, { size: 14 }), "Install"] })), _jsx("button", { onClick: handleDismiss, className: "p-2 text-gray-400 hover:text-gray-600", children: _jsx(X, { size: 20 }) })] })] }) }));
};
