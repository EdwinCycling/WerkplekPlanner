import React, { useState, useEffect, useMemo } from 'react';
import { AppProvider, useAuth } from './contexts/AppContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SetWorkplace from './pages/SetWorkplace';
import TeamOverview from './pages/TeamOverview';
import Header from './components/Header';
import CookieConsent from './components/CookieConsent';
import CookiePolicyModal from './components/CookiePolicyModal';

type Page = 'dashboard' | 'set-workplace' | 'team-overview';

const AppContent: React.FC = () => {
    const { user, isLoading } = useAuth();
    const [page, setPage] = useState<Page>('dashboard');
    const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }

    if (!user) {
        return <Login />;
    }

    const renderPage = () => {
        switch (page) {
            case 'dashboard':
                return <Dashboard setPage={setPage} />;
            case 'set-workplace':
                return <SetWorkplace />;
            case 'team-overview':
                return <TeamOverview />;
            default:
                return <Dashboard setPage={setPage} />;
        }
    };
    
    return (
        <div className="min-h-screen text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
            <Header setPage={setPage} />
            <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
                {renderPage()}
            </main>
            <footer className="text-center p-4 text-xs text-gray-500">
                <button onClick={() => setIsCookieModalOpen(true)} className="underline hover:text-blue-500">
                    Cookie Policy
                </button>
            </footer>
            <CookieConsent />
            <CookiePolicyModal isOpen={isCookieModalOpen} onClose={() => setIsCookieModalOpen(false)} />
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
};

export default App;