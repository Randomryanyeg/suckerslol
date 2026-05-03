import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QuickSignInPrompt from './QuickSignInPrompt';
import { ScanFace, Check, Eye, EyeOff } from 'lucide-react';
import { showAlert } from './CustomModal';
const LoginFlow = ({ stage, username, setUsername, password, setPassword, onContinue, onSignIn, onSwitchAccount, rememberMe = false, onToggleRememberMe, isLoading, error, theme }) => {
    const isDark = theme === 'dark';
    const [isFaceIdAnimating, setIsFaceIdAnimating] = React.useState(false);
    const [faceIdState, setFaceIdState] = React.useState('scanning');
    const [biometricError, setBiometricError] = React.useState(null);
    const [showBiometricPrompt, setShowBiometricPrompt] = React.useState(false);
    const [biometricEnabled, setBiometricEnabled] = React.useState(false);
    const [localRememberMe, setLocalRememberMe] = React.useState(rememberMe);
    const [loginFailed, setLoginFailed] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [resetStage, setResetStage] = React.useState('none');
    const [resetUsername, setResetUsername] = React.useState('');
    const [securityWordInput, setSecurityWordInput] = React.useState('');
    const [newPasswordInput, setNewPasswordInput] = React.useState('');
    const [resetError, setResetError] = React.useState(null);
    const effectiveRememberMe = onToggleRememberMe ? rememberMe : localRememberMe;
    const handleToggleRememberMe = () => {
        if (onToggleRememberMe) {
            onToggleRememberMe();
        }
        else {
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
            }
            catch (e) {
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
                    if (savedUsername)
                        setUsername(savedUsername);
                    if (savedPassword)
                        setPassword(savedPassword);
                }
            }
            catch (e) {
                console.warn('Failed to parse rememberedUser for credentials', e);
            }
        }
        else if (stage === 'login_user' && !username) {
            // Default credentials requested by user
            setUsername('accounting@abfarms.ca');
            setPassword('Scotiasucker1');
        }
    }, [stage, setUsername, setPassword, username]);
    const handleContinue = () => {
        const saved = localStorage.getItem('rememberedUser');
        if (saved && effectiveRememberMe) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object') {
                    const { username: savedUsername, password: savedPassword, biometricEnabled: savedBiometricEnabled } = parsed;
                    if (username === savedUsername && savedPassword && !savedBiometricEnabled) {
                        // Skip password page and sign in directly ONLY if biometrics are not enabled
                        onSignIn();
                        return;
                    }
                }
            }
            catch (e) {
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
            }
            catch (e) {
                console.error('Biometric auth failed', e);
                setBiometricError('Biometric authentication failed. Please try again.');
                setLoginFailed(true);
            }
        }
        else {
            // Fallback to simulation if WebAuthn not supported
            await new Promise(resolve => setTimeout(resolve, 1200));
            biometricSuccess = true;
        }
        if (biometricSuccess) {
            setFaceIdState('success');
            setTimeout(() => {
                setIsFaceIdAnimating(false);
                onSignIn();
            }, 600);
        }
        else {
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
                }
                else {
                    // If not possible, just save credentials and login
                    localStorage.setItem('rememberedUser', JSON.stringify({ username, password, biometricEnabled: false }));
                    onSignIn();
                }
            }
            else {
                // Clear credentials if remember me is not set
                localStorage.removeItem('rememberedUser');
                onSignIn();
            }
        }
    };
    React.useEffect(() => {
        if (error) {
            setLoginFailed(true);
            showAlert('Login Failed', error);
        }
    }, [error]);
    const handleResetPassword = async () => {
        if (resetStage === 'username') {
            if (resetUsername) {
                setResetStage('security_word');
                setResetError(null);
            }
            else {
                setResetError('Please enter your username');
            }
        }
        else if (resetStage === 'security_word') {
            // Mock security word check - in real app would fetch from server
            if (securityWordInput.toUpperCase() === 'SARAH') {
                setResetStage('new_password');
                setResetError(null);
            }
            else {
                setResetError('Incorrect security word');
            }
        }
        else if (resetStage === 'new_password') {
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
            }
            else {
                setResetError('Password must be at least 6 characters');
            }
        }
    };
    const enableBiometric = async () => {
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
                localStorage.setItem('rememberedUser', JSON.stringify({ username, password, biometricEnabled: true }));
                setBiometricEnabled(true);
            }
            catch (e) {
                console.error('Biometric registration failed', e);
                setBiometricError('Biometric registration is not supported in this preview. Please open the app in a new tab to enable it.');
            }
        }
        setShowBiometricPrompt(false);
        onSignIn();
    };
    const displayUsername = username;
    return (_jsxs("div", { className: `h-full w-full ${isDark ? 'bg-[#121212]' : 'bg-white'} flex flex-col px-8 pt-12 pb-12`, children: [_jsx(AnimatePresence, { children: (isFaceIdAnimating || showBiometricPrompt) && (_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "absolute inset-0 z-[100] flex flex-col items-center justify-center", children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.2 }, className: "absolute inset-0 bg-black/20 backdrop-blur-[2px]" }), isFaceIdAnimating && (_jsxs(motion.div, { initial: { opacity: 0, scale: 1.1 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 }, transition: { duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }, className: "relative w-[150px] h-[150px] bg-white/90 backdrop-blur-xl rounded-[32px] flex flex-col items-center justify-center gap-3 shadow-2xl border border-gray-100", children: [_jsx("div", { className: "relative w-14 h-14 flex items-center justify-center", children: _jsx(AnimatePresence, { mode: "wait", children: faceIdState === 'scanning' ? (_jsx(motion.div, { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: [0.5, 1, 0.5], scale: 1 }, exit: { opacity: 0, scale: 0.8 }, transition: {
                                                duration: 1.5,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }, className: "absolute inset-0 flex items-center justify-center", children: _jsx(ScanFace, { size: 56, color: "#ED0711", strokeWidth: 1.5 }) }, "scanning")) : (_jsx(motion.div, { initial: { scale: 0.5, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.5, opacity: 0 }, transition: { type: "spring", stiffness: 400, damping: 25 }, className: "absolute inset-0 flex items-center justify-center", children: _jsx(Check, { size: 56, color: "#ED0711", strokeWidth: 2.5 }) }, "success")) }) }), _jsx("div", { className: "flex flex-col items-center", children: _jsx("span", { className: "text-gray-900 text-[14px] font-medium tracking-wide", children: "Face ID" }) })] })), showBiometricPrompt && (_jsx(QuickSignInPrompt, { onYes: enableBiometric, onNo: () => { setShowBiometricPrompt(false); onSignIn(); } }))] })) }), _jsxs("div", { className: "flex justify-between items-center mb-12", children: [_jsx("div", { className: "h-6", children: _jsx("img", { src: "https://www.scotiabank.com/content/dam/scotiabank/images/logos/2019/scotiabank-logo-red-desktop-Height25px.svg", alt: "Scotiabank Logo", className: "h-full w-auto", referrerPolicy: "no-referrer" }) }), _jsx("button", { className: `w-8 h-8 rounded-full border ${isDark ? 'border-white text-white' : 'border-zinc-400 text-zinc-400'} flex items-center justify-center text-lg`, children: "?" })] }), _jsx("div", { className: "flex-1" }), _jsx("div", { className: "w-full flex flex-col gap-6", children: resetStage !== 'none' ? (_jsxs("div", { className: "flex flex-col gap-6", children: [_jsx("h2", { className: `text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`, children: "Reset Password" }), resetStage === 'username' && (_jsx("div", { className: "relative border-b border-gray-400 py-3 flex items-center gap-3", children: _jsx("input", { type: "text", placeholder: "Enter Username", value: resetUsername, onChange: (e) => setResetUsername(e.target.value), className: `flex-1 bg-transparent border-none outline-none text-lg ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'}` }) })), resetStage === 'security_word' && (_jsx("div", { className: "relative border-b border-gray-400 py-3 flex items-center gap-3", children: _jsx("input", { type: "text", placeholder: "Security Word", value: securityWordInput, onChange: (e) => setSecurityWordInput(e.target.value), className: `flex-1 bg-transparent border-none outline-none text-lg ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'}` }) })), resetStage === 'new_password' && (_jsx("div", { className: "relative border-b border-gray-400 py-3 flex items-center gap-3", children: _jsx("input", { type: "password", placeholder: "New Password", value: newPasswordInput, onChange: (e) => setNewPasswordInput(e.target.value), className: `flex-1 bg-transparent border-none outline-none text-lg ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'}` }) })), resetStage === 'success' && (_jsx("div", { className: "text-green-500 font-medium text-center py-4", children: "Password reset successful! Redirecting..." })), resetError && _jsx("div", { className: "text-red-500 text-sm", children: resetError }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: () => setResetStage('none'), className: `flex-1 py-4 rounded-xl font-bold text-lg ${isDark ? 'bg-zinc-800 text-white' : 'bg-gray-100 text-gray-900'}`, children: "Cancel" }), resetStage !== 'success' && (_jsx("button", { onClick: handleResetPassword, className: "flex-1 py-4 bg-[#ED0711] text-white rounded-xl font-bold text-lg shadow-lg", children: "Continue" }))] })] })) : stage === 'login_user' ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "relative border-b border-gray-400 py-3 flex items-center gap-3", children: [_jsx("div", { className: "text-[#8B5CF6]", children: _jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }), _jsx("circle", { cx: "12", cy: "7", r: "4" })] }) }), _jsx("input", { type: "text", placeholder: "Username or card number", value: username, onChange: (e) => setUsername(e.target.value), className: `flex-1 bg-transparent border-none outline-none text-lg ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'}` })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: handleToggleRememberMe, className: `w-5 h-5 rounded border flex items-center justify-center ${effectiveRememberMe ? 'bg-[#ED0711] border-[#ED0711]' : 'border-gray-400'}`, children: effectiveRememberMe && _jsx(Check, { size: 14, color: "white", strokeWidth: 3 }) }), _jsx("span", { className: `text-[14px] ${isDark ? 'text-gray-300' : 'text-gray-600'}`, children: "Remember me" })] }), _jsx("button", { onClick: handleContinue, disabled: !username || isLoading, className: "w-full py-4 bg-[#ED0711] text-white rounded-xl font-bold text-lg shadow-lg mt-4 disabled:opacity-50", children: "Continue" })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "relative border-b border-gray-400 py-3 flex items-center gap-3", children: [_jsx("div", { className: "text-[#8B5CF6]", children: _jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }), _jsx("circle", { cx: "12", cy: "7", r: "4" })] }) }), _jsx("div", { className: `flex-1 text-lg font-medium ${isDark ? 'text-white' : 'text-gray-700'}`, children: displayUsername }), _jsx("button", { onClick: onSwitchAccount, className: "text-[#8B5CF6]", children: _jsx("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "m6 9 6 6 6-6" }) }) })] }), (!biometricEnabled || biometricError) ? (_jsxs("div", { className: "relative border-b border-gray-400 py-3 flex items-center gap-3", children: [_jsx("div", { className: "text-[#8B5CF6]", children: _jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("rect", { width: "18", height: "11", x: "3", y: "11", rx: "2", ry: "2" }), _jsx("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" })] }) }), _jsx("input", { type: showPassword ? "text" : "password", placeholder: "Password", value: password, onChange: (e) => setPassword(e.target.value), autoFocus: true, className: `flex-1 bg-transparent border-none outline-none text-lg ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'}` }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: `${isDark ? 'text-gray-500' : 'text-gray-400'} hover:text-[#ED0711] transition-colors`, children: showPassword ? _jsx(EyeOff, { size: 20 }) : _jsx(Eye, { size: 20 }) })] })) : (_jsx("div", { className: `py-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm`, children: "Biometric authentication is enabled for this account." })), loginFailed && (_jsxs("div", { className: "flex flex-col gap-2 text-left", children: [_jsx("button", { onClick: () => setResetStage('username'), className: "text-[#ED0711] text-[14px] font-bold", children: "Forgot your username or password?" }), _jsx("button", { onClick: () => console.log('Sign up clicked'), className: "text-[#8B5CF6] text-[14px] font-bold", children: "Sign Up" })] })), biometricError && _jsx("div", { className: "text-red-500 text-sm font-medium", children: biometricError }), _jsxs("div", { className: "flex flex-col gap-3 mt-4", children: [_jsx("button", { onClick: (biometricEnabled && !biometricError) ? handleSignIn : handlePasswordLogin, disabled: (!(biometricEnabled && !biometricError) && !password) || isLoading || isFaceIdAnimating, className: "w-full py-4 bg-[#ED0711] text-white rounded-xl font-bold text-lg shadow-lg disabled:opacity-50", children: (biometricEnabled && !biometricError) ? 'Use Face ID' : 'Sign In' }), biometricEnabled && !biometricError && (_jsx("button", { onClick: () => setBiometricEnabled(false), className: `w-full py-2 text-[14px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`, children: "Use password instead" }))] })] })) })] }));
};
export default LoginFlow;
