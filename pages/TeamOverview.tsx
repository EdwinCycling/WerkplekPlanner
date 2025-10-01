import React, { useState } from 'react';
import { useAuth } from '../contexts/AppContext';
import { getWeekNumber, getWorkdaysOfWeek, formatDate, addWeeks, subWeeks, getUserDisplayName } from '../utils/dateUtils';
import LocationPill from '../components/LocationPill';

const TeamOverview: React.FC = () => {
    const { t, language, schedule, teamMembers } = useAuth(); // Get teamMembers from context
    const [currentDate, setCurrentDate] = useState(new Date());
    const [copySuccess, setCopySuccess] = useState(false);

    const workdays = getWorkdaysOfWeek(currentDate);
    const weekNum = getWeekNumber(currentDate, language);
    const dayNames = [t('monday', 'dayNames'), t('tuesday', 'dayNames'), t('wednesday', 'dayNames'), t('thursday', 'dayNames'), t('friday', 'dayNames')];

    const copyToClipboard = () => {
        let text = `${t('teamOverviewTitle')} - ${t('week')} ${weekNum}\n\n`;
        text += `\t${workdays.map(d => formatDate(d, 'eee dd/MM', language)).join('\t')}\n`;
        
        teamMembers.forEach(user => {
            text += `${getUserDisplayName(user)}\t`;
            text += workdays.map(day => {
                const dateStr = formatDate(day, 'yyyy-MM-dd');
                const locationId = schedule[user.id]?.[dateStr];
                const locationData = locationId ? t(locationId, 'locations') : '-';
                return locationData;
            }).join('\t');
            text += '\n';
        });

        navigator.clipboard.writeText(text).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
                <h2 className="text-2xl font-bold">{t('teamOverviewTitle')}</h2>
                 <div className="flex items-center space-x-2">
                    <button onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <span className="font-semibold text-center w-24">{t('week')} {weekNum}</span>
                    <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>

            <div className="mb-4">
                <button onClick={copyToClipboard} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                    {copySuccess ? t('copied') : t('copyToClipboard')}
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] border-collapse">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700/50">
                            <th className="p-3 text-left font-semibold text-sm text-gray-700 dark:text-gray-300">Team Member</th>
                            {workdays.map((day, index) => (
                                <th key={index} className="p-3 text-center font-semibold text-sm text-gray-700 dark:text-gray-300">
                                    <div>{dayNames[index]}</div>
                                    <div className="font-normal text-xs text-gray-500 dark:text-gray-400">{formatDate(day, 'dd/MM', language)}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {teamMembers.map(user => (
                             <tr key={user.id} className="border-b border-gray-200 dark:border-gray-700">
                                <td className="p-3 font-medium text-gray-900 dark:text-gray-100">{getUserDisplayName(user)}</td>
                                {workdays.map(day => {
                                    const dateStr = formatDate(day, 'yyyy-MM-dd');
                                    return (
                                        <td key={dateStr} className="p-3 text-center">
                                            <LocationPill locationId={schedule[user.id]?.[dateStr]} />
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TeamOverview;