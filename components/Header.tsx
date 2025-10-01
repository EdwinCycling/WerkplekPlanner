import React from 'react';
import { useAuth } from '../contexts/AppContext';
import { getUserDisplayName } from '../utils/dateUtils';
import useLocalStorage from '../hooks/useLocalStorage';

interface HeaderProps {
    setPage: (page: 'dashboard' | 'set-workplace' | 'team-overview' | 'vacation-planner' | 'insights') => void;
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

    // Add Escape key handling to close the modal when open
    React.useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setShowChangePassword(false);
      };
      if (showChangePassword) {
        window.addEventListener('keydown', onKeyDown);
      }
      return () => {
        window.removeEventListener('keydown', onKeyDown);
      };
    }, [showChangePassword]);
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 dark:text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7" />
                            <path d="M9 22V12h6v10" />
                        </svg>
                    </button>
                    <button onClick={() => refreshData()} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label={t('refresh')} title={t('refresh')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 dark:text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 4v6h-6" />
                            <path d="M1 20v-6h6" />
                            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10" />
                            <path d="M20.49 15a9 9 0 01-14.85 3.36L1 14" />
                        </svg>
                    </button>
                    <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Toggle Theme">
                        {/* Sun (light) and Moon (dark) combined icon using currentColor */}
                        {theme === 'light' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 dark:text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="4" />
                                <path d="M12 2v2" />
                                <path d="M12 20v2" />
                                <path d="M4.93 4.93l1.41 1.41" />
                                <path d="M17.66 17.66l1.41 1.41" />
                                <path d="M2 12h2" />
                                <path d="M20 12h2" />
                                <path d="M4.93 19.07l1.41-1.41" />
                                <path d="M17.66 6.34l1.41-1.41" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 dark:text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                            </svg>
                        )}
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
                                <rect x="0" y="15" width="60" height="6" fill="#C8102E"/>
                                <rect x="27" y="0" width="6" height="36" fill="#C8102E"/>
                            </svg>
                        </button>
                        <button
                            onClick={() => setLanguage('nl')}
                            className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${language === 'nl' ? 'ring-2 ring-blue-500' : ''}`}
                            aria-label="Stel taal in op Nederlands"
                            title="Nederlands"
                        >
                            <svg viewBox="0 0 60 36" className="h-5 w-8" xmlns="http://www.w3.org/2000/svg">
                                <rect width="60" height="12" y="0" fill="#AE1C28"/>
                                <rect width="60" height="12" y="12" fill="#FFFFFF"/>
                                <rect width="60" height="12" y="24" fill="#21468B"/>
                            </svg>
                        </button>
                    </div>

                    <div className="relative">
                        <button onClick={() => setShowChangePassword(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label={t('changePasswordTitle')}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 dark:text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 1a4 4 0 00-4 4v3H7a2 2 0 00-2 2v9a2 2 0 002 2h10a2 2 0 002-2v-9a2 2 0 00-2-2h-1V5a4 4 0 00-4-4z" />
                                <path d="M8 11h8" />
                            </svg>
                        </button>
                        {user && (
                            <button onClick={logout} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Log out">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 dark:text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M10 17l5-5-5-5" />
                                    <path d="M3 12h12" />
                                    <path d="M21 19V5a2 2 0 00-2-2h-5" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Install banner */}
            {shouldShowBanner && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/40 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-blue-800 dark:text-blue-100">
                            {t('pwaInstallMessage')}
                        </p>
                        <div className="flex items-center gap-2">
                            <button onClick={handleInstallClick} className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700">
                                {t('pwaInstallButton')}
                            </button>
                            <button onClick={handleDismiss} className="px-3 py-1 text-sm rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">
                                {t('dismiss')}
                            </button>
                        </div>
                    </div>
                    {showMobileGuide && (
                        <div className="mt-2 text-xs text-blue-900 dark:text-blue-100">
                            <h4 className="font-semibold">{t('pwaMobileInstructionsTitle')}</h4>
                            <p>{t('pwaMobileInstructionsText')}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Change Password Modal */}
            {showChangePassword && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-4">{t('changePasswordTitle')}</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm mb-1">{t('newPasswordLabel')}</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => onPasswordChange(e.target.value)}
                                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                                />
                                {passwordStatus && (
                                    <p className="text-xs mt-1">{t('passwordStrength')}: {passwordStatus}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm mb-1">{t('confirmNewPasswordLabel')}</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <button onClick={() => setShowChangePassword(false)} className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">
                                    {t('close')}
                                </button>
                                <button onClick={handleChangePassword} disabled={changeLoading} className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                                    {t('savePasswordButton')}
                                </button>
                            </div>
                            {passwordStatus && (
                                <p className="text-xs text-red-600 dark:text-red-400">{passwordStatus}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;