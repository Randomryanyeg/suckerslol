import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { motion } from 'framer-motion';
export const SplashScreen = ({ onComplete }) => {
    useEffect(() => {
        const timer = setTimeout(onComplete, 2500); // Show for 2.5 seconds
        return () => clearTimeout(timer);
    }, [onComplete]);
    return (_jsx(motion.div, { className: "absolute inset-0 z-[10000] flex items-center justify-center bg-[#ED0711]", exit: { opacity: 0 }, transition: { duration: 0.5 }, children: _jsx(motion.div, { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { duration: 0.5, ease: "easeOut" }, className: "text-white text-4xl font-bold", children: "Scotia" }) }));
};
