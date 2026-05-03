import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ChevronLeft, CreditCard, ChevronRight, PlusCircle } from 'lucide-react';
import { useBank } from '../shared/BankContext';
const DOLLARAMA_ICON = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRaExjx1DOdg3VFYQBmcQhGBqf7dpDQx7nvXw&s";
export default function MyCardsView({ onBack, onSelectCard, onRedeemMore }) {
    const { user } = useBank();
    const cards = user?.purchasedCards || [];
    const activeCards = cards.filter(c => !c.isRedeemed);
    const redeemedCards = cards.filter(c => c.isRedeemed);
    const getCompanyColor = (company, isRedeemed) => {
        if (isRedeemed)
            return '#9CA3AF'; // Gray for redeemed
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
    const renderCardRow = (card) => (_jsxs("button", { onClick: () => onSelectCard(card), className: `w-full rounded-3xl p-5 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all border ${card.isRedeemed ? 'bg-gray-50 border-gray-100 opacity-75' : 'bg-white border-gray-50'}`, children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: `w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm overflow-hidden ${card.isRedeemed ? 'grayscale' : ''}`, style: { backgroundColor: getCompanyColor(card.company, card.isRedeemed) }, children: card.company === 'Dollarama' ? (_jsx("img", { src: DOLLARAMA_ICON, alt: "Dollarama", className: "w-full h-full object-cover", referrerPolicy: "no-referrer" })) : (_jsx(CreditCard, { size: 24 })) }), _jsxs("div", { className: "text-left", children: [_jsx("h3", { className: `font-bold ${card.isRedeemed ? 'text-gray-500' : 'text-gray-900'}`, children: card.company }), _jsxs("p", { className: "text-xs text-gray-400", children: ["Purchased ", new Date(card.purchaseDate).toLocaleDateString()] })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "text-right", children: [_jsxs("p", { className: `font-bold ${card.isRedeemed ? 'text-gray-400' : 'text-gray-900'}`, children: ["$", card.balance.toFixed(2)] }), card.isRedeemed && _jsx("span", { className: "text-[10px] font-black uppercase text-gray-400 tracking-wider", children: "Redeemed" })] }), _jsx(ChevronRight, { size: 20, className: "text-gray-300" })] })] }, card.id));
    return (_jsxs("div", { className: "absolute inset-0 z-[140] bg-[#F4F7F9] flex flex-col font-sans", children: [_jsxs("div", { className: "bg-white pt-12 pb-4 px-6 flex items-center justify-between border-b border-gray-100", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("button", { onClick: onBack, className: "p-2 -ml-2 rounded-full active:bg-gray-100 transition-colors", children: _jsx(ChevronLeft, { size: 24, className: "text-gray-900" }) }), _jsx("h1", { className: "font-bold text-xl text-gray-900", children: "My eCards" })] }), _jsx("button", { onClick: onRedeemMore, className: "p-2 rounded-full bg-[#ED0711]/10 text-[#ED0711] active:scale-95 transition-transform", children: _jsx(PlusCircle, { size: 20 }) })] }), _jsx("div", { className: "flex-1 overflow-y-auto p-6 no-scrollbar", children: cards.length === 0 ? (_jsxs("div", { className: "h-full flex flex-col items-center justify-center text-center space-y-6 pt-20", children: [_jsx("div", { className: "w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-300", children: _jsx(CreditCard, { size: 48 }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-gray-900", children: "No cards yet" }), _jsx("p", { className: "text-gray-500 mt-2 max-w-[240px]", children: "Redeem your Scene+ points for eCards from your favorite stores." })] }), _jsx("button", { onClick: onRedeemMore, className: "px-8 py-3 bg-[#ED0711] text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-transform", children: "Redeem Points" })] })) : (_jsxs("div", { className: "space-y-8 pb-20", children: [activeCards.length > 0 && (_jsxs("div", { className: "space-y-4", children: [_jsx("h2", { className: "text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 px-1", children: "Active Cards" }), _jsx("div", { className: "space-y-3", children: activeCards.map(renderCardRow) })] })), redeemedCards.length > 0 && (_jsxs("div", { className: "space-y-4", children: [_jsx("h2", { className: "text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 px-1", children: "Redeemed History" }), _jsx("div", { className: "space-y-3", children: redeemedCards.map(renderCardRow) })] }))] })) })] }));
}
