import React from 'react';
import { useAuth } from '../contexts/AppContext';
import { getUserDisplayName } from '../utils/dateUtils';
import useLocalStorage from '../hooks/useLocalStorage';

interface HeaderProps {
    setPage: (page: 'dashboard' | 'set-workplace' | 'team-overview') => void;
}

// Minimal type to handle the install prompt event
interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const Header: React.FC<HeaderProps> = ({ setPage }) => {
    const { user, logout, theme, setTheme, language, setLanguage, t, refreshData, changePassword } = useAuth();

    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
    // remove obsolete toggleLanguage definition – flags now handle language selection
    // const toggleLanguage = () => setLanguage(language === 'en' ? 'nl' : 'en');

    const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
    const [bannerDismissed, setBannerDismissed] = useLocalStorage<boolean>('pwa-banner-dismissed', false);
    const [showMobileGuide, setShowMobileGuide] = React.useState(false);
    const [isStandalone, setIsStandalone] = React.useState(false);
    const [showChangePassword, setShowChangePassword] = React.useState(false);
    const [newPassword, setNewPassword] = React.useState('');
    const [passwordStatus, setPasswordStatus] = React.useState<string>('');
    const [changeLoading, setChangeLoading] = React.useState(false);
    const [confirmPassword, setConfirmPassword] = React.useState('');

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isInstalled = React.useMemo(() => isStandalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches), [isStandalone]);

    React.useEffect(() => {
        const onLoad = () => {
            setIsStandalone((navigator as any).standalone === true);
        };
        window.addEventListener('load', onLoad);
        return () => window.removeEventListener('load', onLoad);
    }, []);

    React.useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };
        window.addEventListener('beforeinstallprompt', handler);
        const onInstalled = () => {
            setDeferredPrompt(null);
            setBannerDismissed(true);
        };
        window.addEventListener('appinstalled', onInstalled);
        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, [setBannerDismissed]);

    const shouldShowBanner = !bannerDismissed && !isInstalled && (deferredPrompt !== null || isIOS);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            // No install prompt available
            setShowMobileGuide(isIOS);
            return;
        }
        try {
            await deferredPrompt.prompt();
            const choice = await deferredPrompt.userChoice;
            if (choice.outcome === 'accepted') {
                setBannerDismissed(true);
            }
            setDeferredPrompt(null);
        } catch {
            // silently ignore
        }
    };

    const handleDismiss = () => {
        setBannerDismissed(true);
        setShowMobileGuide(false);
    };

    const computeStrength = (pwd: string): 'weak' | 'medium' | 'strong' => {
        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        if (score <= 1) return 'weak';
        if (score === 2 || score === 3) return 'medium';
        return 'strong';
    };

    const onPasswordChange = (val: string) => {
        setNewPassword(val);
        const s = computeStrength(val);
        setPasswordStatus(t(s));
    };

    const handleChangePassword = async () => {
        setChangeLoading(true);
        setPasswordStatus('');
        try {
            if (newPassword.length < 8) {
                setPasswordStatus(t('passwordTooShort'));
                setChangeLoading(false);
                return;
            }
            if (newPassword !== confirmPassword) {
                setPasswordStatus(t('passwordsDoNotMatch'));
                setChangeLoading(false);
                return;
            }
            await changePassword(newPassword);
            setPasswordStatus(t('passwordUpdated'));
            setNewPassword('');
            setConfirmPassword('');
            setShowChangePassword(false);
        } catch (e) {
            setPasswordStatus(t('passwordUpdateError'));
        } finally {
            setChangeLoading(false);
        }
    };

    return (
        <header className="bg-white dark:bg-gray-800 shadow-md p-4 sticky top-0 z-10">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img src="/werkplekplanner.png" alt="Werkplek Planner" className="h-8 w-8 rounded flex-shrink-0" />
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400 cursor-pointer truncate" onClick={() => setPage('dashboard')}>
                        Werkplek Planner
                    </h1>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
                    {user && <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-300">{t('welcomeMessage')} {getUserDisplayName(user)}</span>}
                    <button onClick={() => setPage('dashboard')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label={t('home')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 dark:text-gray-200" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                    </button>
                    <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Toggle Theme">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 dark:text-gray-200" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 2a1 1 0 011 1v2a1 1 0 01-2 0V3a1 1 0 011-1zm0 12a4 4 0 100-8 4 4 0 000 8zm8-4a1 1 0 01-1 1h-2a1 1 0 110-2h2a1 1 0 011 1zM5 10a1 1 0 01-1 1H2a1 1 0 110-2h2a1 1 0 011 1z" />
                        </svg>
                    </button>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setLanguage('en')}
                            className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${language === 'en' ? 'ring-2 ring-blue-500' : ''}`}
                            aria-label="Set language to English"
                            title="English"
                        >
                            <svg viewBox="0 0 60 36" className="h-5 w-8" xmlns="http://www.w3.org/2000/svg">
                                <rect width="60" height="36" fill="#012169"/>
                                <polygon points="0,0 7,0 60,29 60,36 53,36 0,7" fill="#FFFFFF"/>
                                <polygon points="60,0 53,0 0,29 0,36 7,36 60,7" fill="#FFFFFF"/>
                                <polygon points="0,0 3.5,0 60,26.5 60,36 56.5,36 0,9.5" fill="#C8102E"/>
                                <polygon points="60,0 56.5,0 0,26.5 0,36 3.5,36 60,9.5" fill="#C8102E"/>
                                <rect x="0" y="14" width="60" height="8" fill="#FFFFFF"/>
                                <rect x="26" y="0" width="8" height="36" fill="#FFFFFF"/>
                                <rect x="0" y="16" width="60" height="4" fill="#C8102E"/>
                                <rect x="28" y="0" width="4" height="36" fill="#C8102E"/>
                            </svg>
                        </button>
                        <button
                            onClick={() => setLanguage('nl')}
                            className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${language === 'nl' ? 'ring-2 ring-blue-500' : ''}`}
                            aria-label="Set language to Dutch"
                            title="Nederlands"
                        >
                            <svg viewBox="0 0 60 36" className="h-5 w-8" xmlns="http://www.w3.org/2000/svg">
                                <rect width="60" height="36" fill="#ffffff" stroke="#cbd5e1"/>
                                <rect width="60" height="12" fill="#dc2626"/>
                                <rect y="24" width="60" height="12" fill="#1d4ed8"/>
                            </svg>
                        </button>
                    </div>
                    {user && (
                        <button onClick={() => setShowChangePassword(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label={t('changePasswordTitle')} title={t('changePasswordTitle')}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 dark:text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 1v4" />
                                <path d="M12 19v4" />
                                <path d="M5.22 5.22l2.83 2.83" />
                                <path d="M15.95 15.95l2.83 2.83" />
                                <circle cx="12" cy="12" r="6" />
                            </svg>
                        </button>
                    )}
                    {user && (
                        <button onClick={logout} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Logout">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 dark:text-gray-200" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M3 4a1 1 0 011-1h6a1 1 0 110 2H5v10h5a1 1 0 110 2H4a1 1 0 01-1-1V4zm11.293 5.293a1 1 0 011.414 1.414L14.414 12H10a1 1 0 110-2h4.414l-.707-.707z" />
                            </svg>
                        </button>
                    )}
                    <button onClick={() => refreshData()} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label={t('refresh')} title={t('refresh')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 dark:text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 4v6h-6" />
                            <path d="M1 20v-6h6" />
                            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10" />
                            <path d="M20.49 15a9 9 0 01-14.85 3.36L1 14" />
                        </svg>
                    </button>
                </div>
            </div>

            {shouldShowBanner && (
                <div className="mt-3 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-md flex items-center justify-between gap-2 text-sm whitespace-nowrap overflow-x-auto">
                    <span className="truncate">
                        {isIOS ? t('pwaMobileMessage') : t('pwaInstallMessage')}
                    </span>
                    <div className="flex items-center gap-2">
                        <button onClick={handleInstallClick} className="px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                            {isIOS ? t('pwaMobileInstructionsTitle') : t('pwaInstallButton')}
                        </button>
                        <button onClick={handleDismiss} className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600">
                            {t('dismiss')}
                        </button>
                    </div>
                </div>
            )}

            {showMobileGuide && (
                <div className="mt-2 p-3 bg-white dark:bg-gray-700 rounded-md shadow-lg text-sm">
                    <div className="font-semibold mb-1">{t('pwaMobileInstructionsTitle')}</div>
                    <div className="text-gray-700 dark:text-gray-300">{t('pwaMobileInstructionsText')}</div>
                    <div className="text-right mt-2">
                        <button onClick={() => setShowMobileGuide(false)} className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100">
                            {t('close')}
                        </button>
                    </div>
                </div>
            )}
            {showChangePassword && (
                <div className="mt-2 p-4 bg-white dark:bg-gray-700 rounded-md shadow-lg">
                    <div className="font-semibold mb-2">{t('changePasswordTitle')}</div>
                    <div className="space-y-2">
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => onPasswordChange(e.target.value)}
                            placeholder={t('newPasswordLabel')}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder={t('confirmNewPasswordLabel')}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                        {confirmPassword && newPassword !== confirmPassword && (
                            <div className="text-sm text-red-600">{t('passwordsDoNotMatch')}</div>
                        )}
                        <div className="text-sm">
                            <span className="font-medium">{t('passwordStrength')}: </span>
                            <span className={`${newPassword.length >= 8 ? (computeStrength(newPassword) === 'strong' ? 'text-green-600' : computeStrength(newPassword) === 'medium' ? 'text-yellow-600' : 'text-red-600') : 'text-red-600'}`}>{passwordStatus}</span>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-3">
                        <button onClick={() => setShowChangePassword(false)} className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100">
                            {t('dismiss')}
                        </button>
                        <button onClick={handleChangePassword} disabled={changeLoading} className="px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400">
                            {t('savePasswordButton')}
                        </button>
                    </div>
                    {passwordStatus && (
                        <div className="mt-2 text-sm">{passwordStatus}</div>
                    )}
                </div>
            )}
        </header>
    );
};

export default Header;