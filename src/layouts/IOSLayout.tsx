import React, { useState, useEffect } from 'react';
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
import RedeemStoreView from '../views/RedeemStoreView';
import MyCardsView from '../views/MyCardsView';
import ECardView from '../views/ECardView';
import { ApiExplorerView } from '../views/ApiExplorerView';
import TabNavigation from '../components/TabNavigation';
import { PurchasedCard } from '../shared/types';
import { AddContactView } from '../components/AddContactView';
import { useBank } from '../shared/BankContext';
import { useSocket } from '../shared/SocketContext';
import { SupportChat } from '../components/SupportChat';
import { MessageCircle, X } from 'lucide-react';

export default function IOSLayout() {
  const { user, login, logout, updateUser, updateAccount, performTransfer, error: bankError, isLoading, theme, toggleAdminPanel } = useBank();
  const { emitAction } = useSocket();
  const [view, setView] = useState<'landing' | 'login' | 'dashboard' | 'whatsnew' | 'deposit' | 'mailer' | 'redeem' | 'my-cards' | 'ecard' | 'api-explorer'>('landing');
  const [selectedCard, setSelectedCard] = useState<PurchasedCard | null>(null);
  const [stage, setStage] = useState('login_user');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [subView, setSubView] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [notification, setNotification] = useState<{ title: string; message: string } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // If user is already logged in and approved on mount, skip landing
    if (user && user.isApproved !== false && view === 'landing') {
      setView('dashboard');
    }
  }, [user, view]);

  useEffect(() => {
    const handleNotification = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setNotification(detail);
      setTimeout(() => setNotification(null), 5000);
    };

    const handleSupportMessage = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!isChatOpen) {
        setUnreadCount(prev => prev + 1);
        setNotification({
          title: "Scotia Support",
          message: detail.message
        });
      }
    };

    window.addEventListener('scotia_notification', handleNotification);
    window.addEventListener('scotia_support_message', handleSupportMessage);
    
    const handleOpenChat = () => {
      setIsChatOpen(true);
      setUnreadCount(0);
    };
    window.addEventListener('scotia_open_chat', handleOpenChat);

    return () => {
      window.removeEventListener('scotia_notification', handleNotification);
      window.removeEventListener('scotia_support_message', handleSupportMessage);
      window.removeEventListener('scotia_open_chat', handleOpenChat);
    };
  }, [isChatOpen]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if ((params.get('ref') && params.get('amt')) || params.get('view') === 'deposited') {
      setView('deposit');
      emitAction('Visit Deposit Page', { ref: params.get('ref'), amount: params.get('amt'), deposit: params.get('deposit') });
    } else if (params.get('view') === 'mailer') {
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
      // In React, state updates aren't immediate. 
      // But we can check the result of the login which usually persists the user.
      // However, it's safer to check the user record if we can.
      // Since 'user' from useBank() might be stale in this closure, 
      // we check again after login succeeds.
      
      // We will let LoginFlow handle the "pending" view if we don't switch to dashboard.
      // And we only switch to dashboard if user is approved.
      
      // Wait, if I stay in 'login' view, the LoginView component will be re-rendered
      // and it will see the non-null user and show the Pending modal.
      
      // However, I need to know IF I should call setView('dashboard').
      // I'll fetch the user from localStorage or just use a small delay if needed.
      // Better: check if the returned user from login would have been approved.
      
      setTimeout(() => {
        const storedUser = localStorage.getItem('scotia_user');
        if (storedUser) {
          const u = JSON.parse(storedUser);
          if (u.isApproved !== false) {
            setView('dashboard');
            emitAction('Login Success', { username });
          } else {
            emitAction('Login Success (Pending Approval)', { username });
          }
        }
      }, 100);
    } else {
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
  const isSettingsView = subView === 'Settings' || subView === 'profile_settings';
  const isApiExplorerView = subView === 'ApiExplorer';
  const isMoreView = subView === 'More';
  const isBillsView = subView === 'Bills';
  const isAdviceView = subView === 'Advice+';
  const isSceneView = subView === 'Scene+';
  const isManageAccountView = subView === 'Manage Account';
  const isTransferBetweenAccountsView = subView === 'Transfer between accounts';
  const isStatementsView = subView === 'Statements';
  const isScotiaSupportView = subView === 'Scotia Support';
  const isAddContactView = subView === 'add-contact';

  useEffect(() => {
    if (subView === 'AdminSettings') {
      toggleAdminPanel?.();
      setSubView(null);
    }
  }, [subView, toggleAdminPanel]);

  const handleTabChange = (tabId: string) => {
    setSelectedAccount(null);
    if (tabId === 'home') {
      setSubView(null);
    } else {
      const tabNames: Record<string, string> = {
          'transfers': 'Move money',
          'advice': 'Advice+',
          'scene': 'Scene+',
          'more': 'More'
      };
      setSubView(tabNames[tabId] || tabId);
    }
  };

  const getActiveTab = () => {
    if (!subView) return 'home';
    const tabMap: Record<string, string> = {
      'Move money': 'transfers',
      'Bills': 'transfers',
      'Advice+': 'advice',
      'Scene+': 'scene',
      'More': 'more'
    };
    return tabMap[subView] || 'home';
  };

  const showFooter = (view === 'dashboard' || view === 'deposit' || view === 'mailer' || view === 'redeem' || view === 'my-cards' || view === 'ecard') && !selectedAccount && !isTransferMenuView && !isETransferView && !isInteracSettings && !isSettingsView && !isManageAccountView && !isTransferBetweenAccountsView && !isStatementsView && !isScotiaSupportView;

  return (
    <div className="h-full w-full bg-[#F4F7F9] flex justify-center overflow-hidden relative">
      <div className="h-full w-full max-w-[430px] bg-white relative shadow-2xl overflow-hidden flex flex-col">
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence>
          {view === 'landing' && (
            <motion.div 
              key="landing" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1, transition: { duration: 0.5 } }} 
              exit={{ opacity: 0 }} 
              className="h-full"
            >
              <LandingView onSignIn={() => setView('login')} onWhatsNew={() => setView('whatsnew')} />
            </motion.div>
          )}
          {view === 'whatsnew' && (
            <motion.div key="whatsnew" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="h-full">
              <WhatsNewView onBack={() => setView('landing')} />
            </motion.div>
          )}
          {view === 'login' && (
            <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <LoginView 
                stage={stage}
                username={username}
                setUsername={setUsername}
                password={password}
                setPassword={setPassword}
                onContinue={() => setStage('login_pin')}
                onSignIn={handleLogin}
                onSwitchAccount={handleSwitchAccount}
                isLoading={isLoading}
                error={bankError}
                theme="light"
              />
            </motion.div>
          )}
          {(view === 'dashboard' || view === 'deposit' || view === 'mailer' || view === 'redeem' || view === 'my-cards' || view === 'ecard') && user && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
              <div className="flex-1 relative overflow-hidden">
                <AnimatePresence>
                  {!selectedAccount && !subView && (
                    <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                      <HomeView 
                        theme={theme}
                        accounts={user.accounts}
                        onSelectAccount={(name) => setSelectedAccount(name)}
                        onAction={(action) => setSubView(action)}
                        onChat={() => setIsChatOpen(true)}
                        onNotification={() => setSubView('Notifications')}
                        onRedeem={() => setView('redeem')}
                        onMyCards={() => setView('my-cards')}
                        interacWarningEnabled={user.settings.interacWarningEnabled}
                        attentionItemsEnabled={user.settings.attentionItemsEnabled}
                        currentUser={user}
                      />
                    </motion.div>
                  )}
                  {selectedAccount && !subView && (
                    <motion.div key="account-details" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="absolute inset-0">
                      <AccountDetailsView 
                        accountName={selectedAccount}
                        balance={user.accounts[selectedAccount]?.balance || 0}
                        onHold={user.accounts[selectedAccount]?.onHold || 0}
                        history={user.accounts[selectedAccount]?.history || []}
                        onBack={() => setSelectedAccount(null)}
                        onAction={(action) => setSubView(action)}
                        currentUser={user}
                        onBalanceChange={(newBalance) => updateAccount(selectedAccount, { balance: newBalance })}
                      />
                    </motion.div>
                  )}
                  {isMoveMoneyView && (
                    <motion.div key="move-money" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="absolute inset-0">
                      <MoveMoneyView 
                        onAction={(action) => setSubView(action)}
                        onBack={() => setSubView(null)}
                        theme={theme}
                        currentUser={user}
                      />
                    </motion.div>
                  )}
                  {isTransferMenuView && (
                    <TransferMenuView 
                      key="transfer-menu"
                      onAction={(action) => setSubView(action)}
                      onBack={() => setSubView(null)}
                      theme={theme}
                    />
                  )}
                  {isTransferBetweenAccountsView && (
                    <TransferBetweenAccountsView 
                      key="transfer-between"
                      accounts={user.accounts}
                      onBack={() => setSubView(null)}
                      onTransfer={performTransfer}
                      theme={theme}
                    />
                  )}
                  {isETransferView && (
                    <TransfersView 
                      key="etransfer"
                      accounts={user.accounts}
                      setAccounts={(accs) => updateUser({ accounts: accs })}
                      transferLimit={user.settings.transferLimit || 3000}
                      userName={user.username}
                      onBack={() => setSubView(null)}
                      onSettings={() => setSubView('Interac Settings')}
                      theme={theme}
                      contacts={user.contacts}
                      onTransfer={performTransfer}
                      defaultFromAccount={selectedAccount || undefined}
                    />
                  )}
                  {isInteracSettings && (
                    <InteracSettingsView 
                      key="interac-settings"
                      accounts={user.accounts}
                      onBack={() => setSubView('Interac e-Transfer')}
                      theme={theme}
                    />
                  )}
                  {isSettingsView && (
                    <SettingsView
                      key="settings"
                      accounts={user.accounts}
                      onBack={() => setSubView(null)}
                      onAction={(action) => setSubView(action)}
                      theme={theme}
                      setTheme={() => {}}
                      settings={user.settings}
                      updateSettings={(settings) => updateUser({ settings: { ...user.settings, ...settings } })}
                      toggleAdminPanel={toggleAdminPanel}
                      isAdmin={user.username?.toUpperCase() === 'PROJECTSARAH'}
                    />
                  )}
                  {isApiExplorerView && (
                    <motion.div key="api-explorer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[500]">
                      <ApiExplorerView onBack={() => setSubView('Settings')} />
                    </motion.div>
                  )}
                  {isBillsView && (
                    <BillsView 
                      key="bills"
                      onBack={() => setSubView(null)}
                      onAction={(action) => setSubView(action)}
                      theme={theme}
                    />
                  )}
                  {isAdviceView && (
                    <AdviceView 
                      key="advice"
                      onBack={() => setSubView(null)}
                      onAction={(action) => setSubView(action)}
                      theme={theme}
                    />
                  )}
                  {isSceneView && (
                    <SceneView 
                      key="scene"
                      onBack={() => setSubView(null)}
                      onAction={(action) => setSubView(action)}
                    />
                  )}
                  {isManageAccountView && selectedAccount && (
                    <ManageAccountView 
                      key="manage-account"
                      accountName={selectedAccount}
                      onBack={() => setSubView(null)}
                      theme={theme}
                    />
                  )}
                  {isStatementsView && (
                    <StatementsListView 
                      key="statements"
                      accounts={user.accounts}
                      onBack={() => setSubView(null)}
                      theme={theme}
                      currentUser={user}
                    />
                  )}
                  {isAddContactView && (
                    <AddContactView 
                      key="add-contact"
                      isOpen={true}
                      onClose={() => setSubView('Manage contacts')}
                      onSave={(contact) => {
                        updateUser({ contacts: [...user.contacts, contact] });
                        setSubView('Manage contacts');
                      }}
                      theme="light"
                    />
                  )}
                  {isScotiaSupportView && (
                    <ScotiaSupportView 
                      key="scotia-support"
                      onBack={() => setSubView(null)}
                      theme={theme}
                      userName={user.username.split('@')[0]}
                    />
                  )}
                  {isMoreView && (
                    <MoreView 
                      key="more"
                      onSignOut={handleSignOut}
                      onAction={(action) => {
                        if (action === 'contact_us') {
                          setIsChatOpen(true);
                        } else {
                          setSubView(action);
                        }
                      }}
                      theme={theme}
                      interacWarningEnabled={user.settings.interacWarningEnabled}
                      setInteracWarningEnabled={(enabled) => updateUser({ settings: { ...user.settings, interacWarningEnabled: enabled } })}
                      updateSettings={(settings) => updateUser({ settings: { ...user.settings, ...settings } })}
                      currentUser={user}
                      onBack={() => setSubView(null)}
                      toggleAdminPanel={toggleAdminPanel}
                    />
                  )}
                  {view === 'deposit' && (
                    <DepositView 
                      key="deposit"
                      onBack={() => {
                        window.history.replaceState({}, '', window.location.pathname);
                        setView('dashboard');
                      }}
                      theme={theme}
                    />
                  )}
                  {view === 'mailer' && (
                    <MailerView 
                      key="mailer"
                      onBack={() => setView('dashboard')}
                      theme={theme}
                    />
                  )}
                  {view === 'redeem' && (
                    <RedeemStoreView 
                      key="redeem"
                      onBack={() => setView('dashboard')}
                      onViewCards={() => setView('my-cards')}
                    />
                  )}
                  {view === 'my-cards' && (
                    <MyCardsView 
                      key="my-cards"
                      onBack={() => setView('dashboard')}
                      onRedeemMore={() => setView('redeem')}
                      onSelectCard={(card) => {
                        setSelectedCard(card);
                        setView('ecard');
                      }}
                    />
                  )}
                  {view === 'ecard' && selectedCard && (
                    <ECardView 
                      key="ecard"
                      card={selectedCard}
                      onBack={() => setView('my-cards')}
                      theme={theme}
                    />
                  )}
                  {subView && !isTransferMenuView && !isETransferView && !isMoveMoneyView && !isInteracSettings && !isSettingsView && !isBillsView && !isAdviceView && !isManageAccountView && !isMoreView && !isTransferBetweenAccountsView && !isStatementsView && !isScotiaSupportView && !isSceneView && (
                    <GenericPageView 
                      key="generic"
                      title={subView}
                      onBack={() => setSubView(null)}
                    />
                  )}
                </AnimatePresence>
              </div>
              
              <AnimatePresence>
                {isChatOpen && (
                  <motion.div 
                    key="chat"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute inset-0 z-[2000]"
                  >
                    <SupportChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {notification && (
                  <motion.div 
                    key="notification"
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    onClick={() => {
                      setIsChatOpen(true);
                      setNotification(null);
                    }}
                    className="absolute top-4 left-4 right-4 bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl z-[3000] flex items-center gap-4 cursor-pointer border border-white/20"
                  >
                    <div className="w-10 h-10 bg-[#ED0711] rounded-xl flex items-center justify-center shrink-0">
                      <MessageCircle className="text-white" size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900">{notification.title}</p>
                      <p className="text-xs text-gray-600 truncate">{notification.message}</p>
                    </div>
                    <div className="text-[10px] text-gray-400 font-medium">now</div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {!isChatOpen && unreadCount > 0 && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0, opacity: 0, y: 20 }}
                    className="absolute bottom-24 right-6 z-[1500] flex flex-col items-end gap-2"
                  >
                    <div className="bg-white rounded-2xl p-3 shadow-xl border border-gray-100 max-w-[200px] relative animate-bounce">
                      <p className="text-[10px] text-[#ED0711] font-black uppercase tracking-widest mb-1 italic">Support Alert</p>
                      <p className="text-xs text-gray-700 line-clamp-2">Agent is responding to your request...</p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setUnreadCount(0);
                        }}
                        className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full p-1 shadow-lg"
                      >
                        <X size={10} />
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setIsChatOpen(true);
                        setUnreadCount(0);
                      }}
                      className="w-14 h-14 bg-[#ED0711] rounded-full shadow-2xl flex items-center justify-center text-white active:scale-95 transition-all hover:bg-red-700 relative group"
                    >
                      <MessageCircle size={28} className="group-hover:rotate-12 transition-transform" />
                      <div className="absolute -top-1 -right-1 bg-white text-[#ED0711] text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#ED0711] shadow-lg">
                        {unreadCount}
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {showFooter && (
                <TabNavigation 
                  activeTab={getActiveTab()} 
                  onTabChange={handleTabChange} 
                  theme={theme}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
}
