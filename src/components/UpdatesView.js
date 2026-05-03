import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { GiftIcon, TransferIcon } from './ScotiaIcons';
import * as ScotiaIcons from './ScotiaIcons';
const ActivityIcon = ScotiaIcons.ActivityIcon;
const UpdatesView = ({ onAction }) => {
    const updates = [
        { title: "Recent Transfer", desc: "Sent $50.00 to John Doe", icon: TransferIcon, color: "text-blue-500" },
        { title: "Account Activity", desc: "Purchase at Save-On-Foods: $45.20", icon: ActivityIcon, color: "text-green-500" },
        { title: "Special Offer", desc: "Get 5x Scene+ points on gas purchases.", icon: GiftIcon, color: "text-[#ED0711]" },
        { title: "Security Alert", desc: "New login detected on iPhone 15.", icon: ActivityIcon, color: "text-yellow-500" }
    ];
    return (_jsxs("div", { className: "px-6 py-6 space-y-4 animate-in fade-in", children: [_jsx("h3", { className: "text-white font-bold text-lg mb-2", children: "Recent Activity" }), updates.map((upd) => (_jsxs("button", { onClick: () => onAction?.(upd.title), className: "bg-[#1E1E1E] w-full rounded-2xl border border-white/10 p-4 flex gap-4 text-left shadow-sm active:scale-[0.98] transition-all", children: [_jsx("div", { className: "w-12 h-12 rounded-full bg-[#2A2A2A] flex items-center justify-center shrink-0", children: _jsx(upd.icon, { size: 24, className: upd.color }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "text-white font-bold text-[15px] mb-1", children: upd.title }), _jsx("p", { className: "text-gray-400 text-[13px] leading-tight", children: upd.desc })] })] }, upd.title)))] }));
};
export default UpdatesView;
