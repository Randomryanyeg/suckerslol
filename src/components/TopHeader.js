import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { BackIcon, ScotiaLogoSVG, SearchIcon } from './ScotiaIcons';
import { useBank } from '../shared/BankContext';
const TopHeader = ({ theme = 'light', onBack, title, rightElement, onChat, greeting, showCenterLogo, red = false }) => {
    const isDark = theme === 'dark';
    const bgClass = red ? 'bg-[#ED0711]' : (isDark ? 'bg-black' : 'bg-white');
    const textColor = red ? 'text-white' : (isDark ? 'text-white' : 'text-gray-900');
    const [tapCount, setTapCount] = useState(0);
    const { toggleAdminPanel } = useBank();
    useEffect(() => {
        if (tapCount >= 5) {
            const pin = prompt('Enter Admin PIN:');
            if (pin === '6969') {
                toggleAdminPanel();
            }
            setTapCount(0);
        }
    }, [tapCount, toggleAdminPanel]);
    const handleLogoTap = () => {
        setTapCount(prev => prev + 1);
        setTimeout(() => setTapCount(0), 2000);
    };
    return (_jsxs("div", { className: `${bgClass} pt-12 pb-6 px-6 flex flex-col shrink-0 relative z-50 ${!red && !isDark ? 'border-b border-gray-100' : ''}`, children: [_jsxs("div", { className: "flex items-center justify-between relative", children: [_jsxs("div", { className: "flex items-center gap-3 z-10", children: [onBack ? (_jsx("button", { onClick: onBack, className: "p-1 active:scale-90 transition-transform -ml-1", children: _jsx(BackIcon, { color: isDark || red ? 'white' : '#1A1A1A', size: 20 }) })) : null, _jsx("button", { onClick: handleLogoTap, className: "focus:outline-none", children: _jsx(ScotiaLogoSVG, { color: "#ED0711", className: "w-8 h-8" }) }), title && _jsx("h1", { className: `${textColor} font-bold text-base ml-2`, children: title })] }), showCenterLogo && (_jsx("div", { className: "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0", children: _jsx("button", { onClick: handleLogoTap, className: "focus:outline-none", children: _jsx(ScotiaLogoSVG, { color: "#ED0711", className: "w-8 h-8" }) }) })), _jsx("div", { className: "flex items-center gap-4 z-10", children: rightElement ? rightElement : (_jsx("button", { onClick: onChat, className: `${textColor} active:scale-90 transition-transform`, children: _jsx(SearchIcon, { size: 24, color: "currentColor" }) })) })] }), greeting && (_jsx("div", { className: "mt-6", children: _jsx("h1", { className: `${textColor} text-xl font-bold`, children: greeting }) }))] }));
};
export default TopHeader;
