import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Plus, Search, Star, ChevronRight, UserPlus } from 'lucide-react';
import { useBank } from '../shared/BankContext';
import { AddContactView } from '../components/AddContactView';
import { EditContactView } from '../components/EditContactView';
export const ManageContactsView = ({ onBack, theme = 'light' }) => {
    const { user, updateUser } = useBank();
    const isDark = theme === 'dark';
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddContact, setShowAddContact] = useState(false);
    const [editingContact, setEditingContact] = useState(null);
    if (!user)
        return null;
    const toggleFavorite = (e, contact) => {
        e.stopPropagation();
        const updatedContacts = user.contacts.map(c => c.id === contact.id ? { ...c, isFavorite: !c.isFavorite } : c);
        updateUser({ contacts: updatedContacts });
    };
    const filteredContacts = user.contacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const favorites = filteredContacts.filter(c => c.isFavorite);
    const allContacts = [...filteredContacts].sort((a, b) => a.name.localeCompare(b.name));
    return (_jsxs(motion.div, { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' }, className: `absolute inset-0 z-[150] flex flex-col ${isDark ? 'bg-[#121212] text-white' : 'bg-[#F4F4F4] text-gray-900'}`, children: [_jsxs("div", { className: `pt-12 pb-4 px-4 flex items-center justify-between border-b shrink-0 ${isDark ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-gray-200'}`, children: [_jsx("button", { onClick: onBack, className: "p-1 -ml-1 active:opacity-60 transition-opacity", children: _jsx(ArrowLeft, { size: 24, className: isDark ? 'text-white' : 'text-gray-900' }) }), _jsx("h1", { className: "font-bold text-[17px]", children: "Manage contacts" }), _jsx("button", { onClick: () => setShowAddContact(true), className: "p-1 -mr-1 active:opacity-60 transition-opacity", children: _jsx(Plus, { size: 24, className: "text-[#ED0711]" }) })] }), _jsxs("div", { className: "flex-1 overflow-y-auto px-4 py-6 space-y-6", children: [_jsxs("div", { className: `relative flex items-center rounded-xl border ${isDark ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-gray-200'} shadow-sm`, children: [_jsx(Search, { size: 18, className: "absolute left-4 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Search contacts", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "w-full p-3.5 pl-11 bg-transparent outline-none text-[14px] placeholder:text-gray-500" })] }), _jsxs("button", { onClick: () => setShowAddContact(true), className: `w-full p-4 flex items-center justify-between rounded-xl border shadow-sm active:opacity-80 transition-opacity ${isDark ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-gray-200'}`, children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-10 h-10 rounded-full flex items-center justify-center bg-[#ED0711]/10", children: _jsx(UserPlus, { size: 22, className: "text-[#ED0711]" }) }), _jsx("div", { className: "font-semibold text-[15px]", children: "Add a new contact" })] }), _jsx(ChevronRight, { size: 20, className: "text-gray-400" })] }), favorites.length > 0 && (_jsxs("div", { className: "space-y-3", children: [_jsx("h2", { className: "text-[11px] font-bold uppercase tracking-wider px-1 text-gray-500", children: "Favourites" }), _jsx("div", { className: `rounded-2xl border overflow-hidden shadow-sm ${isDark ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-gray-200'}`, children: favorites.map((c, idx) => (_jsxs("div", { onClick: () => setEditingContact(c), className: `flex items-center justify-between p-4 active:bg-gray-50/5 transition-colors cursor-pointer ${idx !== favorites.length - 1 ? (isDark ? 'border-b border-white/5' : 'border-b border-gray-100') : ''}`, children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "font-semibold text-[15px] truncate", children: c.name }), _jsx("div", { className: "text-[12px] text-gray-500 truncate mt-0.5", children: c.email })] }), _jsxs("div", { className: "flex items-center gap-3 shrink-0 ml-4", children: [_jsx("button", { onClick: (e) => toggleFavorite(e, c), className: "p-1", children: _jsx(Star, { size: 20, className: "text-[#ED0711] fill-[#ED0711]" }) }), _jsx(ChevronRight, { size: 18, className: "text-gray-400" })] })] }, c.id))) })] })), _jsxs("div", { className: "space-y-3", children: [_jsxs("h2", { className: "text-[11px] font-bold uppercase tracking-wider px-1 text-gray-500", children: ["All Contacts (", allContacts.length, ")"] }), _jsx("div", { className: `rounded-2xl border overflow-hidden shadow-sm ${isDark ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-gray-200'}`, children: allContacts.map((c, idx) => (_jsxs("div", { onClick: () => setEditingContact(c), className: `flex items-center justify-between p-4 active:bg-gray-50/5 transition-colors cursor-pointer ${idx !== allContacts.length - 1 ? (isDark ? 'border-b border-white/5' : 'border-b border-gray-100') : ''}`, children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "font-semibold text-[15px] truncate", children: c.name }), _jsx("div", { className: "text-[12px] text-gray-500 truncate mt-0.5", children: c.email })] }), _jsxs("div", { className: "flex items-center gap-3 shrink-0 ml-4", children: [_jsx("button", { onClick: (e) => toggleFavorite(e, c), className: "p-1", children: _jsx(Star, { size: 20, className: c.isFavorite ? "text-[#ED0711] fill-[#ED0711]" : "text-gray-300" }) }), _jsx(ChevronRight, { size: 18, className: "text-gray-400" })] })] }, c.id))) })] })] }), _jsx(AddContactView, { isOpen: showAddContact, onClose: () => setShowAddContact(false), onSave: (contact) => {
                    updateUser({ contacts: [...user.contacts, contact] });
                    setShowAddContact(false);
                }, theme: theme }), _jsx(EditContactView, { isOpen: !!editingContact, onClose: () => setEditingContact(null), contact: editingContact, onSave: (updated) => {
                    const updatedContacts = user.contacts.map(c => c.id === updated.id ? updated : c);
                    updateUser({ contacts: updatedContacts });
                    setEditingContact(null);
                }, onDelete: (id) => {
                    const updatedContacts = user.contacts.filter(c => c.id !== id);
                    updateUser({ contacts: updatedContacts });
                    setEditingContact(null);
                }, theme: theme })] }));
};
