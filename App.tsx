import React, { useState, useEffect, useMemo } from 'react';
import { AppProvider, useAuth } from './contexts/AppContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SetWorkplace from './pages/SetWorkplace';
import TeamOverview from './pages/TeamOverview';
import Header from './components/Header';
import CookieConsent from './components/CookieConsent';
import CookiePolicyModal from './components/CookiePolicyModal';
import { formatDate, getUserDisplayName, getDutchHolidays } from './utils/dateUtils';
import { LOCATIONS } from './constants/data';

type Page = 'dashboard' | 'set-workplace' | 'team-overview' | 'vacation-planner' | 'insights';

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

// Insights dashboard inline (geen nieuw bestand aangemaakt)
const InsightsDashboard: React.FC = () => {
    const { t, language, schedule } = useAuth();
    const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
    const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
    const [wfhChartType, setWfhChartType] = useState<'bar' | 'pie'>('bar');
    type CountMap = Record<string, number>;

    const availableYears = useMemo(() => {
        const years = new Set<number>();
        Object.values(schedule).forEach(dates => {
            Object.keys(dates).forEach(dateStr => {
                const y = Number(dateStr.slice(0, 4));
                if (!Number.isNaN(y)) years.add(y);
            });
        });
        const arr = Array.from(years).sort((a, b) => b - a);
        return arr.length ? arr : [selectedYear];
    }, [schedule]);

    const {
        locationCounts,
        monthlyVacationCounts,
        topVacationDays,
        wfhWeekdayCounts,
        maxLocationCount
    } = useMemo(() => {
        const locCounts: CountMap = {};
        const monthVacCounts: number[] = Array.from({ length: 12 }, () => 0);
        const dayVacCounts: Map<string, number> = new Map();
        const weekdayCounts: number[] = Array.from({ length: 7 }, () => 0);
        const holidays = getDutchHolidays(selectedYear);

        Object.keys(schedule).forEach((userId) => {
            const dates = schedule[userId];
            Object.keys(dates).forEach((dateStr) => {
                if (!dateStr.startsWith(String(selectedYear))) return;
                const loc = dates[dateStr];
                const d = new Date(dateStr);
                const monthIdx = d.getMonth();
                const weekday = d.getDay();

                // Popular locations: exclude non-working markers
                if (loc && loc !== 'off' && loc !== 'scheduled_off' && loc !== 'holiday') {
                    locCounts[loc] = (locCounts[loc] ?? 0) + 1;
                }

                // Monthly vacation distribution (exclude public holidays)
                if (loc === 'off' && !holidays.has(dateStr)) {
                    monthVacCounts[monthIdx] += 1;
                    const prev = dayVacCounts.get(dateStr) ?? 0;
                    dayVacCounts.set(dateStr, prev + 1);
                }

                // Popular WFH per weekday (Mon-Fri)
                if (loc === 'home' && weekday >= 1 && weekday <= 5) {
                    weekdayCounts[weekday] += 1;
                }
            });
        });

        const sortedTopDays = Array.from(dayVacCounts.entries())
            .sort((a, b) => b[1] - a[1] || new Date(a[0]).getTime() - new Date(b[0]).getTime())
            .slice(0, 10);

        const maxLoc = Object.values(locCounts).reduce((m, v) => Math.max(m, v), 0);

        return {
            locationCounts: locCounts,
            monthlyVacationCounts: monthVacCounts,
            topVacationDays: sortedTopDays,
            wfhWeekdayCounts: weekdayCounts,
            maxLocationCount: maxLoc,
        };
    }, [schedule, selectedYear]);

    const locationEntries = (Object.entries(locationCounts) as [string, number][]) 
        .sort((a, b) => b[1] - a[1]);
    const maxMonthVac = monthlyVacationCounts.reduce((m, v) => Math.max(m, v), 0) || 1;
    const maxWfh = Math.max(...wfhWeekdayCounts.slice(1, 6)) || 1;

    const monthLabels = Array.from({ length: 12 }, (_, i) => formatDate(new Date(selectedYear, i, 1), 'LLL', language));
    const weekdayLabels = [t('monday', 'dayNames'), t('tuesday', 'dayNames'), t('wednesday', 'dayNames'), t('thursday', 'dayNames'), t('friday', 'dayNames')];

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Popular locations chart (bar/pie toggle) */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">{t('popularLocationsTitle')}</h2>
                        <div className="flex items-center gap-2">
                            <div className="inline-flex rounded-md shadow-sm" role="group">
                                <button onClick={() => setChartType('bar')} className={`px-2 py-1 text-xs font-medium border rounded-l ${chartType === 'bar' ? 'bg-blue-600 text-white border-blue-600' : 'bg-transparent text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}>Bar</button>
                                <button onClick={() => setChartType('pie')} className={`px-2 py-1 text-xs font-medium border rounded-r ${chartType === 'pie' ? 'bg-blue-600 text-white border-blue-600' : 'bg-transparent text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}>Pie</button>
                            </div>
                            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                {availableYears.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {locationEntries.length === 0 ? (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('noDataAvailable')}</p>
                    ) : (
                        chartType === 'bar' ? (
                            <div className="space-y-3">
                                {locationEntries.map(([loc, count]) => (
                                    <div key={loc} className="flex items-center gap-3">
                                        <span className="w-28 shrink-0 text-sm text-gray-700 dark:text-gray-300 truncate">{t(loc, 'locations')}</span>
                                        <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded">
                                            <div
                                                className="h-6 rounded bg-gradient-to-r from-blue-500 to-indigo-600"
                                                style={{ width: `${maxLocationCount ? Math.round((count / maxLocationCount) * 100) : 0}%` }}
                                                title={`${count}`}
                                            />
                                        </div>
                                        <span className="w-10 text-right text-sm text-gray-700 dark:text-gray-300">{count}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center gap-6">
                                {(() => {
                                    const total = locationEntries.reduce((s, [, c]) => s + (c as number), 0);
                                    if (!total) return <p className="text-sm text-gray-600 dark:text-gray-400">{t('noDataAvailable')}</p>;
                                    const R = 60;
                                    const C = 2 * Math.PI * R;
                                    let offset = 0;
                                    return (
                                        <>
                                            <svg width="160" height="160" viewBox="0 0 160 160" className="flex-shrink-0">
                                                <circle cx="80" cy="80" r={R} strokeWidth="24" stroke="#e5e7eb" fill="none" transform="rotate(-90 80 80)" />
                                                {locationEntries.map(([loc, count]) => {
                                                    const dash = ((count as number) / total) * C;
                                                    const locCfg = LOCATIONS.find(l => l.id === (loc as any));
                                                    const textClass = locCfg ? locCfg.color.split(' ')[0].replace('bg-', 'text-') : 'text-blue-500';
                                                    const seg = (
                                                        <circle key={loc}
                                                            cx="80" cy="80" r={R} strokeWidth="24" fill="none"
                                                            stroke="currentColor"
                                                            className={textClass}
                                                            strokeDasharray={`${dash} ${C}`}
                                                            strokeDashoffset={offset}
                                                            transform="rotate(-90 80 80)"
                                                        />
                                                    );
                                                    offset += dash;
                                                    return seg;
                                                })}
                                            </svg>
                                            <div className="space-y-2">
                                                {locationEntries.map(([loc, count]) => {
                                                    const locCfg = LOCATIONS.find(l => l.id === (loc as any));
                                                    const textClass = locCfg ? locCfg.color.split(' ')[0].replace('bg-', 'text-') : 'text-blue-500';
                                                    return (
                                                        <div key={loc} className="flex items-center gap-2 text-sm">
                                                            <span className={`${textClass} inline-block w-3 h-3 rounded-full`} style={{ backgroundColor: 'currentColor' }} />
                                                            <span className="truncate">{t(loc, 'locations')}</span>
                                                            <span className="ml-auto text-gray-700 dark:text-gray-300">{count}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        )
                    )}
                </div>

                {/* Monthly vacation distribution */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-green-600 dark:text-green-400">{t('monthlyVacationTitle')}</h2>
                        <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                            {availableYears.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-12 gap-2 items-end">
                        {monthlyVacationCounts.map((val, idx) => (
                            <div key={idx} className="flex flex-col items-center">
                                <div
                                    className="w-5 sm:w-6 bg-gradient-to-t from-green-500 to-emerald-400 rounded"
                                    style={{ height: `${val ? Math.max(8, Math.round((val / maxMonthVac) * 120)) : 8}px` }}
                                    title={`${monthLabels[idx]}: ${val}`}
                                />
                                <span className="mt-2 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">{monthLabels[idx]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top 10 vacation days */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{t('topVacationDaysTitle')}</h2>
                        <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                            {availableYears.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    {topVacationDays.length === 0 ? (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('noDataAvailable')}</p>
                    ) : (
                        <ul className="space-y-2">
                            {topVacationDays.map(([dateStr, cnt]) => (
                                <li key={dateStr} className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-gray-700/50 rounded">
                                    <span className="text-sm text-gray-800 dark:text-gray-100">{formatDate(new Date(dateStr), 'PP', language)}</span>
                                    <span className="px-2 py-1 text-xs rounded bg-yellow-200 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100">{cnt}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Popular WFH per weekday */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-purple-600 dark:text-purple-400">{t('popularWfhTitle')}</h2>
                        <div className="flex items-center gap-2">
                            <div className="inline-flex rounded-md shadow-sm" role="group">
                                <button onClick={() => setWfhChartType('bar')} className={`px-2 py-1 text-xs font-medium border rounded-l ${wfhChartType === 'bar' ? 'bg-purple-600 text-white border-purple-600' : 'bg-transparent text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}>Bar</button>
                                <button onClick={() => setWfhChartType('pie')} className={`px-2 py-1 text-xs font-medium border rounded-r ${wfhChartType === 'pie' ? 'bg-purple-600 text-white border-purple-600' : 'bg-transparent text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}>Pie</button>
                            </div>
                            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                {availableYears.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {wfhWeekdayCounts.slice(1, 6).reduce((s, c) => s + c, 0) === 0 ? (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('noDataAvailable')}</p>
                    ) : (
                        wfhChartType === 'bar' ? (
                            <div className="grid grid-cols-5 gap-2 items-end">
                                {weekdayLabels.map((name, i) => (
                                    <div key={name} className="flex flex-col items-center">
                                        <div
                                            className="w-6 bg-gradient-to-t from-purple-500 to-fuchsia-400 rounded"
                                            style={{ height: `${wfhWeekdayCounts[i + 1] ? Math.max(8, Math.round((wfhWeekdayCounts[i + 1] / maxWfh) * 120)) : 8}px` }}
                                            title={`${name}: ${wfhWeekdayCounts[i + 1] || 0}`}
                                        />
                                        <span className="mt-2 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">{name}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center gap-6">
                                {(() => {
                                    const total = wfhWeekdayCounts.slice(1, 6).reduce((s, c) => s + c, 0);
                                    const R = 60;
                                    const C = 2 * Math.PI * R;
                                    const weekdayColors = ['text-purple-500','text-fuchsia-500','text-indigo-500','text-violet-500','text-pink-500'];
                                    let offset = 0;
                                    return (
                                        <>
                                            <svg width="160" height="160" viewBox="0 0 160 160" className="flex-shrink-0">
                                                <circle cx="80" cy="80" r={R} strokeWidth="24" stroke="#e5e7eb" fill="none" transform="rotate(-90 80 80)" />
                                                {weekdayLabels.map((_, i) => {
                                                    const count = wfhWeekdayCounts[i + 1] || 0;
                                                    if (!count) return null;
                                                    const dash = (count / total) * C;
                                                    const seg = (
                                                        <circle key={i}
                                                            cx="80" cy="80" r={R} strokeWidth="24" fill="none"
                                                            stroke="currentColor"
                                                            className={weekdayColors[i % weekdayColors.length]}
                                                            strokeDasharray={`${dash} ${C}`}
                                                            strokeDashoffset={offset}
                                                            transform="rotate(-90 80 80)"
                                                        />
                                                    );
                                                    offset += dash;
                                                    return seg;
                                                })}
                                            </svg>
                                            <div className="space-y-2">
                                                {weekdayLabels.map((name, i) => (
                                                    <div key={name} className="flex items-center gap-2 text-sm">
                                                        <span className={`${weekdayColors[i % weekdayColors.length]} inline-block w-3 h-3 rounded-full`} style={{ backgroundColor: 'currentColor' }} />
                                                        <span className="truncate">{name}</span>
                                                        <span className="ml-auto text-gray-700 dark:text-gray-300">{wfhWeekdayCounts[i + 1] || 0}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        )
                    )}
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
            case 'insights':
                return <InsightsDashboard />;
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