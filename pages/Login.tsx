import React, { useState } from 'react';
import { useAuth } from '../contexts/AppContext';

const MAX_FAILED_ATTEMPTS = 5;
const SESSION_FAIL_KEY = 'login_failed_count';

const Login: React.FC = () => {
    const [email, setEmail] = useState('edwin.dingjan@exact.com');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [resetMessage, setResetMessage] = useState('');
    const { login, t, resetPassword } = useAuth();

    const getFailedCount = (): number => {
        try {
            const raw = sessionStorage.getItem(SESSION_FAIL_KEY);
            return raw ? parseInt(raw, 10) || 0 : 0;
        } catch (_) {
            return 0;
        }
    };

    const setFailedCount = (n: number) => {
        try {
            sessionStorage.setItem(SESSION_FAIL_KEY, String(n));
        } catch (_) {
            // silently ignore sessionStorage errors
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Block if too many failed attempts in this session
        const currentFails = getFailedCount();
        if (currentFails >= MAX_FAILED_ATTEMPTS) {
            setError(t('tooManyAttempts'));
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
            // Reset counter on successful login
            setFailedCount(0);
        } catch (err: any) {
            // Increase failed counter on auth error
            const nextFails = currentFails + 1;
            setFailedCount(nextFails);

            // Handle Firebase auth errors
            if (err.code) {
                switch (err.code) {
                    case 'auth/user-not-found':
                    case 'auth/wrong-password':
                    case 'auth/invalid-credential':
                        setError(t('loginError'));
                        break;
                    default:
                        setError('Error: Unexpected authentication error');
                        break;
                }
            } else {
                setError(t('loginError'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        setError('');
        setResetMessage('');
        try {
            await resetPassword(email);
            setResetMessage(t('resetEmailSent'));
        } catch (e: any) {
            setError(e?.message || 'Error: Failed to send reset email');
        }
    };

    return (
        <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/team.png')" }}>
            <div className="min-h-screen flex items-center justify-center bg-black/30">
                <div className="max-w-md w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-xl p-8 shadow-xl space-y-8">
                    <div className="flex flex-col items-center space-y-4">
                        <img src="/werkplekplanner.png" alt="Werkplek Planner" className="w-24 h-24 rounded-xl shadow-md" />
                        <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                            {t('loginTitle')}
                        </h2>
                        <p className="text-center text-sm text-gray-700 dark:text-gray-300 max-w-sm">
                            {t('loginSubtitle')}
                        </p>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label htmlFor="email-address" className="sr-only">{t('emailLabel')}</label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder={t('emailLabel')}
                                    disabled={loading}
                                />
                            </div>
                            <div className="relative">
                                <label htmlFor="password" className="sr-only">{t('passwordLabel')}</label>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder={t('passwordLabel')}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute inset-y-0 right-2 flex items-center"
                                    aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 text-gray-500 dark:text-gray-300" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        {resetMessage && <p className="text-green-600 text-sm text-center">{resetMessage}</p>}

                        <div className="flex items-center justify-between">
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative flex-1 justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Logging in...' : t('loginButton')}
                            </button>
                            <button
                                type="button"
                                onClick={handleResetPassword}
                                disabled={loading}
                                className="ml-2 text-sm text-blue-600 hover:text-blue-700 underline"
                            >
                                {t('forgotPassword')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;