
import React, { useState } from 'react';
import { useAuth } from '../contexts/AppContext';
import { getWeekNumber, getWorkdaysOfWeek, formatDate, addWeeks, subWeeks, getStartOfWeek } from '../utils/dateUtils';
import { LOCATIONS } from '../constants/data';
import { LocationId } from '../types';

const SetWorkplace: React.FC = () => {
    const { t, language, user, schedule, updateSchedule } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [copySuccess, setCopySuccess] = useState(false);

    const workdays = getWorkdaysOfWeek(currentDate);
    const weekNum = getWeekNumber(currentDate, language);

    const today = new Date();
    const thisWeekStart = getStartOfWeek(today);
    const maxFutureWeekStart = addWeeks(thisWeekStart, 13);
    const nextDisabled = getStartOfWeek(currentDate).getTime() >= maxFutureWeekStart.getTime();

    const handleLocationChange = (date: Date, locationId: LocationId) => {
        if (user) {
            updateSchedule(user.id, formatDate(date, 'yyyy-MM-dd'), locationId);
        }
    };

    const copyFromLastWeek = () => {
        if (!user) return;
        const lastWeekStartDate = subWeeks(currentDate, 1);
        const lastWorkdays = getWorkdaysOfWeek(lastWeekStartDate);

        lastWorkdays.forEach((lastDay, index) => {
            const lastDateStr = formatDate(lastDay, 'yyyy-MM-dd');
            const location = schedule[user.id]?.[lastDateStr];
            if (location) {
                const currentDay = workdays[index];
                const currentDateStr = formatDate(currentDay, 'yyyy-MM-dd');
                updateSchedule(user.id, currentDateStr, location);
            }
        });
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const setWeekAsVacation = () => {
        if (!user) return;
        workdays.forEach(day => {
            updateSchedule(user.id, formatDate(day, 'yyyy-MM-dd'), 'off');
        });
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
                <h2 className="text-2xl font-bold">{t('setWorkplaceTitle')}</h2>
                 <div className="flex items-center space-x-2">
                    <button onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <span className="font-semibold text-center w-24">{t('week')} {weekNum}</span>
                    <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} disabled={nextDisabled} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>

             <div className="mb-4 flex space-x-2">
                <button onClick={copyFromLastWeek} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors">
                    {copySuccess ? t('copied') : t('copyLastWeek')}
                </button>
                <button onClick={setWeekAsVacation} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 transition-colors">
                    {t('vacationButton')}
                </button>
            </div>

            <div className="space-y-4">
                {workdays.map(day => {
                    const dateStr = formatDate(day, 'yyyy-MM-dd');
                    const selectedLocation = user ? schedule[user.id]?.[dateStr] : undefined;
                    return (
                        <div key={dateStr} className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                            <div className="font-semibold">
                                <div>{formatDate(day, 'eeee', language)}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{formatDate(day, 'd MMMM', language)}</div>
                            </div>
                            <div className="sm:col-span-2">
                                <select
                                    value={selectedLocation || ''}
                                    onChange={(e) => handleLocationChange(day, e.target.value as LocationId)}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="" disabled>{t('selectLocation')}</option>
                                    {LOCATIONS.map(loc => (
                                        <option key={loc.id} value={loc.id}>
                                            {t(loc.nameKey, 'locations')}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SetWorkplace;