import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import TopHeader from '../components/TopHeader';
const AddUserView = ({ onClose, onAddUser }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [accountPin, setAccountPin] = useState('');
    const handleAdd = () => {
        onAddUser({ name, email, accountPin });
        onClose();
    };
    return (_jsxs("div", { className: "absolute inset-0 z-[600] bg-white flex flex-col h-full animate-in slide-up", children: [_jsx(TopHeader, { onBack: onClose, title: "Add New User" }), _jsxs("div", { className: "flex-1 p-6 space-y-6", children: [_jsxs("div", { className: "bg-zinc-50 p-6 rounded-[24px] border border-zinc-200", children: [_jsx("p", { className: "text-zinc-500 font-black text-[11px] uppercase tracking-widest mb-3", children: "Full Name" }), _jsx("input", { type: "text", value: name, onChange: e => setName(e.target.value), placeholder: "John Doe", className: "w-full bg-transparent text-black text-lg font-black outline-none placeholder:text-zinc-400" })] }), _jsxs("div", { className: "bg-zinc-50 p-6 rounded-[24px] border border-zinc-200", children: [_jsx("p", { className: "text-zinc-500 font-black text-[11px] uppercase tracking-widest mb-3", children: "Email Address" }), _jsx("input", { type: "email", value: email, onChange: e => setEmail(e.target.value), placeholder: "john@example.com", className: "w-full bg-transparent text-black text-lg font-black outline-none placeholder:text-zinc-400" })] }), _jsxs("div", { className: "bg-zinc-50 p-6 rounded-[24px] border border-zinc-200", children: [_jsx("p", { className: "text-zinc-500 font-black text-[11px] uppercase tracking-widest mb-3", children: "Account PIN" }), _jsx("input", { type: "password", value: accountPin, onChange: e => setAccountPin(e.target.value), placeholder: "****", maxLength: 4, className: "w-full bg-transparent text-black text-lg font-black outline-none placeholder:text-zinc-400" })] })] }), _jsx("div", { className: "p-8 pb-12 border-t border-zinc-200", children: _jsx("button", { onClick: handleAdd, disabled: !name || !email || !accountPin, className: "w-full py-5 bg-[#ED0711] disabled:opacity-20 text-white font-black rounded-[22px] shadow-lg active:scale-95 transition-all uppercase tracking-widest text-[13px]", children: "Add User" }) })] }));
};
export default AddUserView;
