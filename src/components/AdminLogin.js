import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, User, Key, ShieldAlert } from 'lucide-react';
export default function AdminLogin({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, pin }),
            });
            const data = await response.json();
            if (data.success) {
                onLogin();
            }
            else {
                setError(data.message || 'Invalid credentials');
            }
        }
        catch (err) {
            console.error('Login error:', err);
            setError('Connection failed. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen w-full bg-[#0a0a0a] flex items-center justify-center p-4", children: _jsxs(motion.div, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, className: "w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 shadow-2xl", children: [_jsxs("div", { className: "flex flex-col items-center mb-8", children: [_jsx("div", { className: "w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mb-4", children: _jsx(Lock, { className: "w-8 h-8 text-blue-500" }) }), _jsx("h1", { className: "text-2xl font-bold text-white", children: "Project Sarah" }), _jsx("p", { className: "text-gray-400 text-sm mt-2", children: "OS Simulator Admin Access" })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-xs font-semibold text-gray-400 uppercase tracking-wider", children: "Username" }), _jsxs("div", { className: "relative", children: [_jsx(User, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" }), _jsx("input", { type: "text", value: username, onChange: (e) => setUsername(e.target.value), className: "w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all", placeholder: "admin", required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-xs font-semibold text-gray-400 uppercase tracking-wider", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx(Key, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-xs font-semibold text-gray-400 uppercase tracking-wider", children: "PIN" }), _jsxs("div", { className: "relative", children: [_jsx(ShieldAlert, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" }), _jsx("input", { type: "text", maxLength: 6, value: pin, onChange: (e) => setPin(e.target.value), className: "w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all", placeholder: "******", required: true })] })] }), error && (_jsx(motion.div, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, className: "bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg text-center", children: error })), _jsx("button", { type: "submit", disabled: loading, className: "w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2", children: loading ? (_jsx("div", { className: "w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" })) : ('Authenticate') })] }), _jsx("div", { className: "mt-8 pt-8 border-t border-white/5 text-center", children: _jsx("p", { className: "text-xs text-gray-600", children: "Authorized Personnel Only. All access is logged." }) })] }) }));
}
