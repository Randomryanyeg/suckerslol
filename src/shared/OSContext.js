import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
const OSContext = createContext(undefined);
export const OSProvider = ({ children }) => {
    const [currentOS, setCurrentOS] = useState('ios');
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    useEffect(() => {
        const fetchConfig = async () => {
            setLoading(true);
            try {
                console.log(`Fetching OS config from /api/os?os=${currentOS}`);
                const response = await fetch(`/api/os?os=${currentOS}`);
                if (!response.ok) {
                    console.error(`Fetch failed with status ${response.status}`);
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setConfig(data);
            }
            catch (error) {
                console.error('Failed to fetch OS config:', error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, [currentOS]);
    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);
    return (_jsx(OSContext.Provider, { value: { currentOS, setOS: setCurrentOS, config, loading, isAdmin, setAdmin: setIsAdmin, deferredPrompt }, children: children }));
};
export const useOS = () => {
    const context = useContext(OSContext);
    if (context === undefined) {
        throw new Error('useOS must be used within an OSProvider');
    }
    return context;
};
