import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { ScotiaLogoSVG } from '../components/ScotiaIcons';
import { motion } from 'motion/react';
const SplashView = ({ onComplete }) => {
    useEffect(() => {
        if (onComplete) {
            const timer = setTimeout(() => {
                onComplete();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [onComplete]);
    return (_jsx(motion.div, { className: "absolute inset-0 bg-[#ED0711] flex items-center justify-center", children: _jsx(motion.div, { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: {
                duration: 0.8,
                ease: "easeOut",
                scale: {
                    type: "spring",
                    damping: 12,
                    stiffness: 100
                }
            }, className: "flex flex-col items-center", children: _jsx(ScotiaLogoSVG, { color: "white", className: "w-20 h-20" }) }) }));
};
export default SplashView;
