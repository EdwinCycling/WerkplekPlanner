import React, { useState, useEffect, useMemo } from 'react';
import { AppProvider, useAuth } from './contexts/AppContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SetWorkplace from './pages/SetWorkplace';
import TeamOverview from './pages/TeamOverview';
import Header from './components/Header';
import CookieConsent from './components/CookieConsent';
import CookiePolicyModal from './components/CookiePolicyModal';
import { formatDate, getUserDisplayName } from './utils/dateUtils';

type Page = 'dashboard' | 'set-workplace' | 'team-overview' | 'vacation-planner';

// Vakantieplanner component inline (geen nieuw bestand aangemaakt)
const VacationPlanner: React.FC = () => {
    const { t, language, schedule, teamMembers } = useAuth();
    const [monthDate, setMonthDate] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });

    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const sortedTeamMembers = useMemo(() => {
        return [...teamMembers].sort((a, b) =>
            getUserDisplayName(a).localeCompare(getUserDisplayName(b), undefined, { sensitivity: 'base' })
        );
    }, [teamMembers]);

    const today = new Date();
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const minMonthStart = new Date(thisMonthStart.getFullYear(), thisMonthStart.getMonth() - 1, 1);
    const maxMonthStart = new Date(thisMonthStart.getFullYear(), thisMonthStart.getMonth() + 3, 1);

    const prevDisabled = monthDate.getTime() <= minMonthStart.getTime();
    const nextDisabled = monthDate.getTime() >= maxMonthStart.getTime();

    const goPrevMonth = () => {
        if (!prevDisabled) {
            setMonthDate(new Date(year, month - 1, 1));
        }
    };

    const goNextMonth = () => {
        if (!nextDisabled) {
            setMonthDate(new Date(year, month + 1, 1));
        }
    };

    const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
                <h2 className="text-2xl font-bold">{t('vacationPlanner')}</h2>
                <div className="flex items-center space-x-2">
                    <button onClick={goPrevMonth} disabled={prevDisabled} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed" aria-label={t('previousMonth')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <span className="font-semibold text-center px-2 whitespace-nowrap">{formatDate(monthDate, 'LLLL yyyy', language)}</span>
                    <button onClick={goNextMonth} disabled={nextDisabled} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed" aria-label={t('nextMonth')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-[700px]">
                    {/* Header rij met dagen van de maand */}
                    <div className="grid" style={{ gridTemplateColumns: `200px repeat(${daysInMonth}, minmax(28px, 1fr))` }}>
                        <div className="p-2 font-semibold text-gray-700 dark:text-gray-300">{t('teamMember')}</div>
                        {dayNumbers.map((d) => {
                            const dateObj = new Date(year, month, d);
                            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                            return (
                                <div key={`header-${d}`} className={`p-2 text-center text-xs font-semibold ${isWeekend ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                                    {d}
                                </div>
                            );
                        })}
                    </div>

                    {/* Rijen per teamlid */}
                    {sortedTeamMembers.map((user) => (
                        <div key={user.id} className="grid" style={{ gridTemplateColumns: `200px repeat(${daysInMonth}, minmax(28px, 1fr))` }}>
                            <div className="p-2 font-medium truncate text-gray-900 dark:text-gray-100">{getUserDisplayName(user)}</div>
                            {dayNumbers.map((d) => {
                                const dateObj = new Date(year, month, d);
                                const dateStr = formatDate(dateObj, 'yyyy-MM-dd');
                                const loc = schedule[user.id]?.[dateStr];
                                const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                                let cellClass = 'p-2 text-center text-xs';
                                let content: string | null = null;

                                if (loc === 'off') {
                                    cellClass += ' bg-green-700 text-white';
                                    content = '';
                                } else if (loc === 'scheduled_off') {
                                    cellClass += ' bg-green-200 text-green-800';
                                    content = '';
                                } else if (loc === 'holiday') {
                                    cellClass += ' bg-green-300 text-green-900';
                                    content = '';
                                } else if (isWeekend) {
                                    cellClass += ' bg-red-50';
                                    content = '';
                                } else {
                                    cellClass += ' bg-white dark:bg-gray-800';
                                }

                                return (
                                    <div key={`${user.id}-${d}`} className={cellClass} aria-label={isWeekend ? 'Weekend' : loc ?? ''}>
                                        {content}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

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
            case 'vacation-planner':
                return <VacationPlanner />;
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