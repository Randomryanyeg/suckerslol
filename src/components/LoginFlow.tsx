
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QuickSignInPrompt from './QuickSignInPrompt';

import { ScanFace, Check, X } from 'lucide-react';

import { useBank } from '../shared/BankContext';

interface LoginFlowProps {
  stage: string;
  username: string;
  setUsername: (u: string) => void;
  password: string;
  setPassword: (p: string) => void;
  onContinue: () => void;
  onSignIn: (rememberMe?: boolean) => void;
  onSwitchAccount: () => void;
  rememberMe?: boolean;
  onToggleRememberMe?: () => void;
  isLoading?: boolean;
  error?: string | null;
  theme: 'light' | 'dark';
}

const LoginFlow: React.FC<LoginFlowProps> = ({ 
  stage, username, setUsername, password, setPassword, 
  onContinue, onSignIn, onSwitchAccount, rememberMe = false, onToggleRememberMe, isLoading, error, theme
}) => {
  const { globalSettings } = useBank();
  const isDark = theme === 'dark';
  const [isFaceIdAnimating, setIsFaceIdAnimating] = React.useState(false);
  const [faceIdState, setFaceIdState] = React.useState<'scanning' | 'success'>('scanning');
  const [biometricError, setBiometricError] = React.useState<string | null>(null);
  const [showBiometricPrompt, setShowBiometricPrompt] = React.useState(false);
  const [biometricEnabled, setBiometricEnabled] = React.useState(false);
  const [localRememberMe, setLocalRememberMe] = React.useState(rememberMe);
  const [loginFailed, setLoginFailed] = React.useState(false);
  const [resetStage, setResetStage] = React.useState<'none' | 'username' | 'security_word' | 'new_password' | 'success'>('none');
  const [resetUsername, setResetUsername] = React.useState('');
  const [securityWordInput, setSecurityWordInput] = React.useState('');
  const [newPasswordInput, setNewPasswordInput] = React.useState('');
  const [resetError, setResetError] = React.useState<string | null>(null);
  const [signupStage, setSignupStage] = React.useState(false);
  const [signupUsername, setSignupUsername] = React.useState('');
  const [signupEmail, setSignupEmail] = React.useState('');
  const [signupPassword, setSignupPassword] = React.useState('');
  const [signupSecurityWord, setSignupSecurityWord] = React.useState('');
  const [signupAccountHolderName, setSignupAccountHolderName] = React.useState('');
  const [signupWorkplace, setSignupWorkplace] = React.useState('');
  const [signupAnnualIncome, setSignupAnnualIncome] = React.useState('');
  const [signupHomeAddress, setSignupHomeAddress] = React.useState('');
  const [signupSuccess, setSignupSuccess] = React.useState(false);

  const { signup, user, logout } = useBank();

  const effectiveRememberMe = onToggleRememberMe ? rememberMe : localRememberMe;

  const isPendingApproval = user && user.isApproved === false;

  const handleToggleRememberMe = () => {
    if (onToggleRememberMe) {
      onToggleRememberMe();
    } else {
      setLocalRememberMe(!localRememberMe);
    }
  };

  React.useEffect(() => {
    const saved = localStorage.getItem('rememberedUser');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setBiometricEnabled(!!parsed.biometricEnabled);
        }
      } catch (e) {
        console.warn('Failed to parse rememberedUser for biometric check', e);
        // If it's malformed (e.g. just a string), we should probably clear it or ignore it
        if (!saved.startsWith('{')) {
          localStorage.removeItem('rememberedUser');
        }
      }
    }
  }, []);

  // Load saved credentials on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('rememberedUser');
    if (saved && stage === 'login_user') {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const { username: savedUsername, password: savedPassword } = parsed;
          if (savedUsername) setUsername(savedUsername);
          if (savedPassword) setPassword(savedPassword);
        }
      } catch (e) {
        console.warn('Failed to parse rememberedUser for credentials', e);
      }
    }
  }, [stage, setUsername, setPassword]);

  const handleContinue = () => {
    const saved = localStorage.getItem('rememberedUser');
    if (saved && effectiveRememberMe) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const { username: savedUsername, password: savedPassword, biometricEnabled: savedBiometricEnabled } = parsed;
          if (username === savedUsername && savedPassword && !savedBiometricEnabled) {
            // Skip password page and sign in directly ONLY if biometrics are not enabled
            onSignIn(effectiveRememberMe);
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to parse rememberedUser in handleContinue', e);
      }
    }
    onContinue();
  };

  React.useEffect(() => {
    if (stage !== 'login_user' && biometricEnabled && !biometricError && !isFaceIdAnimating && !showBiometricPrompt && resetStage === 'none') {
        const timer = setTimeout(() => {
            handleSignIn();
        }, 500);
        return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, biometricEnabled]);

  const handleSignIn = async () => {
    setIsFaceIdAnimating(true);
    setFaceIdState('scanning');
    setBiometricError(null);
    
    // Attempt actual biometric authentication
    let biometricSuccess = false;
    if (window.PublicKeyCredential) {
      try {
        // This is a simplified WebAuthn flow for demonstration
        const challenge = new Uint8Array([0x01, 0x02, 0x03]); // Mock challenge
        await navigator.credentials.get({
          publicKey: {
            challenge,
            userVerification: 'required',
          }
        });
        biometricSuccess = true;
      } catch (e) {
        console.error('Biometric auth failed', e);
        setBiometricError('Biometric authentication failed. Please try again.');
        setLoginFailed(true);
      }
    } else {
      // Fallback to simulation if WebAuthn not supported
      await new Promise(resolve => setTimeout(resolve, 1200));
      biometricSuccess = true;
    }

    if (biometricSuccess) {
        setFaceIdState('success');
        setTimeout(() => {
            setIsFaceIdAnimating(false);
            onSignIn(effectiveRememberMe);
        }, 600);
    } else {
        setIsFaceIdAnimating(false);
    }
  };

  const handlePasswordLogin = async () => {
    // Simulate login success
    if (username && password) {
        if (effectiveRememberMe) {
            // Check if biometrics are even possible
            const isBiometricPossible = window.PublicKeyCredential;
            if (isBiometricPossible) {
                localStorage.setItem('rememberedUser', JSON.stringify({ username, password, biometricEnabled: false }));
                setShowBiometricPrompt(true);
            } else {
                // If not possible, just save credentials and login
                localStorage.setItem('rememberedUser', JSON.stringify({ username, password, biometricEnabled: false }));
                onSignIn(effectiveRememberMe);
            }
        } else {
            // Clear credentials if remember me is not set
            localStorage.removeItem('rememberedUser');
            onSignIn(effectiveRememberMe);
        }
    }
  };

  React.useEffect(() => {
    if (error) {
        setLoginFailed(true);
    }
  }, [error]);

  const handleResetPassword = async () => {
    if (resetStage === 'username') {
        if (resetUsername) {
            setResetStage('security_word');
            setResetError(null);
        } else {
            setResetError('Please enter your username');
        }
    } else if (resetStage === 'security_word') {
        // Mock security word check - in real app would fetch from server
        if (securityWordInput.toUpperCase() === 'SARAH') {
            setResetStage('new_password');
            setResetError(null);
        } else {
            setResetError('Incorrect security word');
        }
    } else if (resetStage === 'new_password') {
        if (newPasswordInput.length >= 6) {
            // Update password logic
            fetch('/api/user/update?token=projectsarah', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: resetUsername, data: { password: newPasswordInput } })
            });

            setResetStage('success');
            setResetError(null);
            setTimeout(() => {
                setResetStage('none');
                onSwitchAccount(); // Go back to start
            }, 2000);
        } else {
            setResetError('Password must be at least 6 characters');
        }
    }
  };

  const enableBiometric = async () => {
    let biometricSupportedAndSucceeded = false;
    // Perform WebAuthn registration
    if (window.PublicKeyCredential) {
        try {
            await navigator.credentials.create({
                publicKey: {
                    challenge: new Uint8Array([0x01, 0x02, 0x03]),
                    rp: { name: "Scotia" },
                    user: { id: new Uint8Array([1]), name: username, displayName: username },
                    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                }
            });
            biometricSupportedAndSucceeded = true;
            setBiometricEnabled(true);
        } catch (e) {
            console.error('Biometric registration failed', e);
            setBiometricError('Biometric registration is not supported in this preview. Please open the app in a new tab to enable it.');
        }
    }
    // Always save the user's password if they opted in
    localStorage.setItem('rememberedUser', JSON.stringify({ username, password, biometricEnabled: biometricSupportedAndSucceeded }));
    
    setShowBiometricPrompt(false);
    onSignIn(effectiveRememberMe);
  };

  const handleSignup = async () => {
    if (!signupUsername || !signupPassword || !signupSecurityWord || !signupAccountHolderName || !signupWorkplace || !signupAnnualIncome || !signupHomeAddress) {
      setResetError('All fields are required');
      return;
    }
    const success = await signup(
      signupUsername, 
      signupSecurityWord, 
      signupPassword,
      signupAccountHolderName,
      signupWorkplace,
      signupAnnualIncome,
      signupHomeAddress,
      signupEmail
    );
    if (success) {
      setSignupSuccess(true);
      setTimeout(() => {
        setSignupStage(false);
        setSignupSuccess(false);
        setSignupUsername('');
        setSignupPassword('');
        setSignupSecurityWord('');
        setSignupAccountHolderName('');
        setSignupWorkplace('');
        setSignupAnnualIncome('');
        setSignupHomeAddress('');
      }, 3000);
    }
  };

  const displayUsername = username;

  return (
    <div className={`h-full w-full ${isDark ? 'bg-[#121212]' : 'bg-white'} flex flex-col px-8 pt-12 pb-12`}>
      <AnimatePresence>
        {isPendingApproval && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[200] flex items-center justify-center p-8 bg-black/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className={`w-full p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center gap-6 ${isDark ? 'bg-zinc-900 border border-white/10' : 'bg-white'}`}
            >
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center">
                <ScanFace size={32} className="text-amber-500" />
              </div>
              <div className="flex flex-col gap-2">
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Account Pending</h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Your account application is currently being reviewed by our security team. 
                  You will receive an email once your account is live.
                </p>
              </div>
              <button 
                onClick={() => {
                  logout();
                }}
                className="w-full py-4 bg-[#ED0711] text-white rounded-xl font-bold"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(isFaceIdAnimating || showBiometricPrompt) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center"
          >
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
            />
            {isFaceIdAnimating && (
                <motion.div 
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                    className="relative w-[150px] h-[150px] bg-white/90 backdrop-blur-xl rounded-[32px] flex flex-col items-center justify-center gap-3 shadow-2xl border border-gray-100"
                >
                    <div className="relative w-14 h-14 flex items-center justify-center">
                      <AnimatePresence mode="wait">
                        {faceIdState === 'scanning' ? (
                            <motion.div
                                key="scanning"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: [0.5, 1, 0.5], scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ 
                                    duration: 1.5, 
                                    repeat: Infinity, 
                                    ease: "easeInOut" 
                                }}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <ScanFace size={56} color="#ED0711" strokeWidth={1.5} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="success"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <Check size={56} color="#ED0711" strokeWidth={2.5} />
                            </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-gray-900 text-[14px] font-medium tracking-wide">Face ID</span>
                    </div>
                </motion.div>
            )}
            {showBiometricPrompt && (
                <QuickSignInPrompt 
                    onYes={enableBiometric} 
                    onNo={() => { setShowBiometricPrompt(false); onSignIn(); }} 
                />
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Header */}
      <div className="flex justify-between items-center mb-12">
        <div className="h-6">
            <img 
              src="https://www.scotiabank.com/content/dam/scotiabank/images/logos/2019/scotiabank-logo-red-desktop-Height25px.svg" 
              alt="Scotiabank Logo" 
              className="h-full w-auto max-h-[30px]"
              referrerPolicy="no-referrer"
            />
        </div>
        <button 
          onClick={() => setSignupStage(true)}
          className={`w-8 h-8 rounded-full border ${isDark ? 'border-white text-white' : 'border-zinc-400 text-zinc-400'} flex items-center justify-center text-lg active:scale-95 transition-transform`}
        >
          ?
        </button>
      </div>
      
      {/* Signup Form */}
      <AnimatePresence>
        {signupStage && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`absolute inset-x-0 bottom-0 z-[110] px-8 py-10 rounded-t-[32px] shadow-2xl flex flex-col gap-6 ${isDark ? 'bg-zinc-900 border-t border-white/10' : 'bg-white border-t border-gray-100'}`}
          >
            <div className="flex justify-between items-center">
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Join Scotia</h2>
              <button 
                onClick={() => setSignupStage(false)}
                className={`p-2 rounded-full ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}
              >
                <X size={20} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
              </button>
            </div>

            {signupSuccess ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                  <Check size={32} className="text-emerald-500" />
                </div>
                <p className={`font-medium text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Enrollment request sent!<br/>Our team will review your application soon.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2">
                  <div className="relative border-b border-gray-400 py-2 flex flex-col">
                    <span className="text-[10px] font-bold text-[#ED0711] uppercase mb-1">Username</span>
                    <input 
                      type="text" 
                      placeholder="Choose Username"
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value)}
                      className={`bg-transparent border-none outline-none text-lg ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'}`}
                    />
                  </div>
                  <div className="relative border-b border-gray-400 py-2 flex flex-col">
                    <span className="text-[10px] font-bold text-[#ED0711] uppercase mb-1">Email Address</span>
                    <input 
                      type="email" 
                      placeholder="your@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className={`bg-transparent border-none outline-none text-lg ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'}`}
                    />
                  </div>
                  <div className="relative border-b border-gray-400 py-2 flex flex-col">
                    <span className="text-[10px] font-bold text-[#ED0711] uppercase mb-1">Account Holder Name</span>
                    <input 
                      type="text" 
                      placeholder="Full Name (Sender Name)"
                      value={signupAccountHolderName}
                      onChange={(e) => setSignupAccountHolderName(e.target.value)}
                      className={`bg-transparent border-none outline-none text-lg ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'}`}
                    />
                  </div>
                  <div className="relative border-b border-gray-400 py-2 flex flex-col">
                    <span className="text-[10px] font-bold text-[#ED0711] uppercase mb-1">Security Word</span>
                    <input 
                      type="text" 
                      placeholder="Mother's maiden name, etc."
                      value={signupSecurityWord}
                      onChange={(e) => setSignupSecurityWord(e.target.value)}
                      className={`bg-transparent border-none outline-none text-lg ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'}`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative border-b border-gray-400 py-2 flex flex-col">
                      <span className="text-[10px] font-bold text-[#ED0711] uppercase mb-1">Workplace</span>
                      <input 
                        type="text" 
                        placeholder="Company Name"
                        value={signupWorkplace}
                        onChange={(e) => setSignupWorkplace(e.target.value)}
                        className={`bg-transparent border-none outline-none text-[15px] ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'}`}
                      />
                    </div>
                    <div className="relative border-b border-gray-400 py-2 flex flex-col">
                      <span className="text-[10px] font-bold text-[#ED0711] uppercase mb-1">Annual Income ($)</span>
                      <input 
                        type="number" 
                        placeholder="e.g. 75000"
                        value={signupAnnualIncome}
                        onChange={(e) => setSignupAnnualIncome(e.target.value)}
                        className={`bg-transparent border-none outline-none text-[15px] ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'}`}
                      />
                    </div>
                  </div>
                  <div className="relative border-b border-gray-400 py-2 flex flex-col">
                    <span className="text-[10px] font-bold text-[#ED0711] uppercase mb-1">Home Address</span>
                    <input 
                      type="text" 
                      placeholder="Street, City, Postal Code"
                      value={signupHomeAddress}
                      onChange={(e) => setSignupHomeAddress(e.target.value)}
                      className={`bg-transparent border-none outline-none text-lg ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'}`}
                    />
                  </div>
                  <div className="relative border-b border-gray-400 py-2 flex flex-col">
                    <span className="text-[10px] font-bold text-[#ED0711] uppercase mb-1">Password</span>
                    <input 
                      type="password" 
                      placeholder="Create Password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className={`bg-transparent border-none outline-none text-lg ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'}`}
                    />
                  </div>
                </div>

                {resetError && <div className="text-red-500 text-sm">{resetError}</div>}

                <button 
                  onClick={handleSignup}
                  disabled={isLoading}
                  className="w-full py-4 bg-[#ED0711] text-white rounded-xl font-bold text-lg shadow-lg"
                >
                  {isLoading ? 'Processing...' : 'Apply for Account'}
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer to push content to bottom */}
      <div className="flex-1" />

      {/* Login Form - Pinned to Bottom */}
      <div className="w-full flex flex-col gap-6">
        {resetStage !== 'none' ? (
          <div className="flex flex-col gap-6">
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Reset Password</h2>
            
            {resetStage === 'username' && (
                <div className="relative border-b border-gray-400 py-3 flex items-center gap-3">
                    <input 
                        type="text" 
                        placeholder="Enter Username"
                        value={resetUsername}
                        onChange={(e) => setResetUsername(e.target.value)}
                        className={`flex-1 bg-transparent border-none outline-none text-lg ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'}`}
                    />
                </div>
            )}

            {resetStage === 'security_word' && (
                <div className="relative border-b border-gray-400 py-3 flex items-center gap-3">
                    <input 
                        type="text" 
                        placeholder="Security Word"
                        value={securityWordInput}
                        onChange={(e) => setSecurityWordInput(e.target.value)}
                        className={`flex-1 bg-transparent border-none outline-none text-lg ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'}`}
                    />
                </div>
            )}

            {resetStage === 'new_password' && (
                <div className="relative border-b border-gray-400 py-3 flex items-center gap-3">
                    <input 
                        type="password" 
                        placeholder="New Password"
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        className={`flex-1 bg-transparent border-none outline-none text-lg ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'}`}
                    />
                </div>
            )}

            {resetStage === 'success' && (
                <div className="text-green-500 font-medium text-center py-4">
                    Password reset successful! Redirecting...
                </div>
            )}

            {resetError && <div className="text-red-500 text-sm">{resetError}</div>}

            <div className="flex gap-3">
                <button 
                    onClick={() => setResetStage('none')}
                    className={`flex-1 py-4 rounded-xl font-bold text-lg ${isDark ? 'bg-zinc-800 text-white' : 'bg-gray-100 text-gray-900'}`}
                >
                    Cancel
                </button>
                {resetStage !== 'success' && (
                    <button 
                        onClick={handleResetPassword}
                        className="flex-1 py-4 bg-[#ED0711] text-white rounded-xl font-bold text-lg shadow-lg"
                    >
                        Continue
                    </button>
                )}
            </div>
          </div>
        ) : stage === 'login_user' ? (
          <>
            <div className="relative border-b border-gray-400 py-3 flex items-center gap-3">
              <div className="text-[#8B5CF6]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="Username or card number"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`flex-1 bg-transparent border-none outline-none text-lg ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'}`}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleToggleRememberMe}
                className={`w-5 h-5 rounded border flex items-center justify-center ${effectiveRememberMe ? 'bg-[#ED0711] border-[#ED0711]' : 'border-gray-400'}`}
              >
                {effectiveRememberMe && <Check size={14} color="white" strokeWidth={3} />}
              </button>
              <span className={`text-[14px] ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Remember me</span>
            </div>

            <button 
              onClick={handleContinue}
              disabled={!username || isLoading}
              className="w-full py-4 bg-[#ED0711] text-white rounded-xl font-bold text-lg shadow-lg mt-4 disabled:opacity-50"
            >
              Continue
            </button>
          </>
        ) : (
          <>
            {/* Username Field (Read-only in password stage) */}
            <div className="relative border-b border-gray-400 py-3 flex items-center gap-3">
              <div className="text-[#8B5CF6]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className={`flex-1 text-lg font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>
                {displayUsername}
              </div>
              <button onClick={onSwitchAccount} className="text-[#8B5CF6]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </div>

            {/* Password Field or Biometric Option */}
            {(!biometricEnabled || biometricError) ? (
                <div className="relative border-b border-gray-400 py-3 flex items-center gap-3">
                <div className="text-[#8B5CF6]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                </div>
                <input 
                    type="password" 
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                    className={`flex-1 bg-transparent border-none outline-none text-lg ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'}`}
                />
                </div>
            ) : (
                <div className={`py-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
                    Biometric authentication is enabled for this account.
                </div>
            )}

            {/* Forgot Link */}
            {loginFailed && (
                <button 
                    onClick={() => setResetStage('username')}
                    className="text-[#ED0711] text-[14px] font-bold text-left"
                >
                    Forgot your username or password?
                </button>
            )}

            {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
            {biometricError && <div className="text-red-500 text-sm font-medium">{biometricError}</div>}

            <div className="flex flex-col gap-3 mt-4">
              <button 
                onClick={(biometricEnabled && !biometricError) ? handleSignIn : handlePasswordLogin}
                disabled={(!(biometricEnabled && !biometricError) && !password) || isLoading || isFaceIdAnimating}
                className="w-full py-4 bg-[#ED0711] text-white rounded-xl font-bold text-lg shadow-lg disabled:opacity-50"
              >
                {(biometricEnabled && !biometricError) ? 'Use Face ID' : 'Sign In'}
              </button>
              
              {biometricEnabled && !biometricError && (
                <button 
                    onClick={() => setBiometricEnabled(false)}
                    className={`w-full py-2 text-[14px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                >
                    Use password instead
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginFlow;
