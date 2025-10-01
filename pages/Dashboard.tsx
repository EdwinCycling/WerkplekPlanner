import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AppContext';
import LocationPill from '../components/LocationPill';
import { User } from '../types';
import { formatDate, addWorkday, subWorkday, getUserDisplayName, getRelativeDayName, getStartOfWeek, subWeeks, addWeeks, addDays, getWorkdaysOfWeek, startOfDay, getDutchHolidays } from '../utils/dateUtils';

interface DashboardProps {
    setPage: (page: 'dashboard' | 'set-workplace' | 'team-overview' | 'vacation-planner' | 'insights') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setPage }) => {
    const { t, schedule, language, teamMembers } = useAuth(); // Get teamMembers from context
    const [currentDate, setCurrentDate] = useState(new Date());

    const dateString = formatDate(currentDate, 'yyyy-MM-dd');
    const displayDate = getRelativeDayName(currentDate, language, (key) => t(key));

    const sortedTeamMembers = useMemo(() => {
        return [...teamMembers].sort((a, b) =>
            getUserDisplayName(a).localeCompare(getUserDisplayName(b), undefined, { sensitivity: 'base' })
        );
    }, [teamMembers]);
    const today = startOfDay(new Date());
    const startOfThisWeek = getStartOfWeek(today);
    const endOfNextWeek = addDays(getStartOfWeek(addWeeks(today, 1)), 4);

    const isPrevDisabled = startOfDay(subWorkday(currentDate)) < startOfDay(startOfThisWeek);
    const isNextDisabled = startOfDay(addWorkday(currentDate)) > startOfDay(endOfNextWeek);

    const vacationingUsers = useMemo(() => {
        const weekWorkdays = getWorkdaysOfWeek(currentDate);
        return teamMembers.filter(user => {
            if (weekWorkdays.length < 5) return false;
            return weekWorkdays.every(day => {
                const dayStr = formatDate(day, 'yyyy-MM-dd');
                const location = schedule[user.id]?.[dayStr];
                return location === 'off' || location === 'scheduled_off';
            });
        });
    }, [currentDate, schedule, teamMembers]);
    
    const upcomingOffDays = useMemo(() => {
        const today = startOfDay(new Date());
        const upcoming: { user: User; date: Date }[] = [];

        // Get holidays for current and next year to avoid missing any in the 90-day window
        const currentYear = today.getFullYear();
        const holidays = new Map([
            ...getDutchHolidays(currentYear),
            ...getDutchHolidays(currentYear + 1)
        ]);


        teamMembers.forEach(user => {
            let firstOffDay: Date | null = null;
            // Search for the next 90 days
            for (let i = 0; i < 90; i++) {
                const checkDate = addDays(today, i);
                const dateStr = formatDate(checkDate, 'yyyy-MM-dd');
                const location = schedule[user.id]?.[dateStr];

                // Check if it's a 'vrij' day AND not a public holiday
                if (location === 'off' && !holidays.has(dateStr)) {
                    firstOffDay = checkDate;
                    break; // Found the first one for this user
                }
            }

            if (firstOffDay) {
                upcoming.push({ user, date: firstOffDay });
            }
        });

        // Sort by date ascending
        return upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [schedule, teamMembers]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                    onClick={() => setPage('set-workplace')}
                    className="p-6 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-lg ring-1 ring-blue-100 dark:ring-blue-900/30 text-left hover:shadow-xl hover:scale-105 transition-all"
                >
                    <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                        {t('setWorkplace')}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" /></svg>
                    </h2>
                </button>
                <button
                    onClick={() => setPage('team-overview')}
                    className="p-6 bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-lg ring-1 ring-green-100 dark:ring-green-900/30 text-left hover:shadow-xl hover:scale-105 transition-all"
                >
                    <h2 className="text-xl font-bold text-green-600 dark:text-green-400 flex items-center gap-2">
                        {t('teamOverview')}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" /></svg>
                    </h2>
                </button>
                <button
                    onClick={() => setPage('vacation-planner')}
                    className="p-6 bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-lg ring-1 ring-purple-100 dark:ring-purple-900/30 text-left hover:shadow-xl hover:scale-105 transition-all"
                >
                    <h2 className="text-xl font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                        {t('vacationPlanner')}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M3 11h18M5 19h14a2 2 0 002-2v-6H3v6a2 2 0 002 2z" /></svg>
                    </h2>
                </button>
                <button
                    onClick={() => setPage('insights')}
                    className="p-6 bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-lg ring-1 ring-indigo-100 dark:ring-indigo-900/30 text-left hover:shadow-xl hover:scale-105 transition-all"
                >
                    <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                        {t('insights')}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18M7 15l4-4 3 3 4-6" /></svg>
                    </h2>
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <h2 className="text-xl font-bold">{t('todaysOverview')} {displayDate}</h2>
                    <div className="flex items-center space-x-2">
                         <button onClick={() => setCurrentDate(subWorkday(currentDate))} disabled={isPrevDisabled} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <span className="font-semibold text-center px-2 whitespace-nowrap">{formatDate(currentDate, 'PPPP', language)}</span>
                         <button onClick={() => setCurrentDate(addWorkday(currentDate))} disabled={isNextDisabled} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <div className="space-y-3 min-w-[300px]">
                        {sortedTeamMembers.map(user => {
                            const loc = schedule[user.id]?.[dateString];
                            const isOff = loc === 'off' || loc === 'scheduled_off';
                            return (
                                <div key={user.id} className={`grid grid-cols-2 gap-4 items-center p-3 rounded-lg ${isOff ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                                    <span className="font-medium truncate text-gray-900 dark:text-gray-100">
                                        {getUserDisplayName(user)}
                                        {isOff && (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="inline h-4 w-4 text-yellow-500 ml-1 align-middle" fill="currentColor" aria-hidden="true">
                                                <path d="M12 18a6 6 0 100-12 6 6 0 000 12z" />
                                            </svg>
                                        )}
                                    </span>
                                    <div className="text-right">
                                        <LocationPill locationId={loc} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                 {vacationingUsers.length > 0 && (
                    <div className="mt-6 border-t pt-4 border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold mb-2">{t('onVacation')}</h3>
                        <div className="flex flex-wrap gap-2">
                            {vacationingUsers.map(user => (
                                <span key={user.id} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                                    {getUserDisplayName(user)}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                {upcomingOffDays.length > 0 && (
                    <div className="mt-6 border-t pt-4 border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 text-yellow-500" fill="currentColor">
                                <path d="M12 18a6 6 0 100-12 6 6 0 000 12z" />
                            </svg>
                            {t('upcomingOffDays')}
                        </h3>
                        <div className="space-y-2">
                            {upcomingOffDays.map(({ user, date }) => (
                                <div key={user.id} className="flex items-center gap-3 p-2 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-lg border border-yellow-100 dark:border-gray-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-6 w-6 text-yellow-500 flex-shrink-0" fill="currentColor">
                                        <path d="M12 18a6 6 0 100-12 6 6 0 000 12z" />
                                    </svg>
                                    <div className="flex-grow">
                                        <span className="font-medium text-gray-900 dark:text-gray-100">{getUserDisplayName(user)}</span>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(date, 'PPPP', language)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;