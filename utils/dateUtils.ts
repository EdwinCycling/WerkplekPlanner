
import { format, getWeek, startOfWeek, addDays, subDays, addWeeks, subWeeks, isToday, isYesterday, isTomorrow, isSameDay, startOfDay } from 'date-fns';
import { enUS, nl } from 'date-fns/locale';
import { User } from '../types';

export const getLocale = (lang: 'en' | 'nl') => (lang === 'nl' ? nl : enUS);

export const getWeekNumber = (date: Date, lang: 'en' | 'nl' = 'en'): number => {
    return getWeek(date, { locale: getLocale(lang), weekStartsOn: 1 });
};

export const getStartOfWeek = (date: Date): Date => {
    return startOfWeek(date, { weekStartsOn: 1 });
};

export const getWorkdaysOfWeek = (startDate: Date): Date[] => {
    const start = getStartOfWeek(startDate);
    return Array.from({ length: 5 }).map((_, i) => addDays(start, i));
};

export const formatDate = (date: Date, formatStr: string, lang: 'en' | 'nl' = 'en'): string => {
    return format(date, formatStr, { locale: getLocale(lang) });
};

export const addWorkday = (date: Date): Date => {
    let newDate = addDays(date, 1);
    const day = newDate.getDay();
    if (day === 6) { // Saturday
        newDate = addDays(newDate, 2);
    } else if (day === 0) { // Sunday
        newDate = addDays(newDate, 1);
    }
    return newDate;
};

export const subWorkday = (date: Date): Date => {
    let newDate = subDays(date, 1);
    const day = newDate.getDay();
    if (day === 0) { // Sunday
        newDate = subDays(newDate, 2);
    } else if (day === 6) { // Saturday
        newDate = subDays(newDate, 1);
    }
    return newDate;
};

export const getUserDisplayName = (user: User): string => {
    const namePart = user.email.split('@')[0].split('.')[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
};

const getEaster = (year: number): Date => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export const getDutchHolidays = (year: number): Map<string, string> => {
    const holidays = new Map<string, string>();
    const easterSunday = getEaster(year);

    // Nieuwjaarsdag
    holidays.set(format(new Date(year, 0, 1), 'yyyy-MM-dd'), 'newYearsDay');
    
    // Goede Vrijdag (optioneel, niet altijd een vrije dag)
    // holidays.set(format(subDays(easterSunday, 2), 'yyyy-MM-dd'), 'goodFriday');

    // Pasen
    holidays.set(format(addDays(easterSunday, 1), 'yyyy-MM-dd'), 'easterMonday');
    
    // Koningsdag
    const kingsDay = new Date(year, 3, 27);
    if (kingsDay.getDay() === 0) { // Zondag
        kingsDay.setDate(26);
    }
    holidays.set(format(kingsDay, 'yyyy-MM-dd'), 'kingsDay');
    
    // Hemelvaart
    holidays.set(format(addDays(easterSunday, 39), 'yyyy-MM-dd'), 'ascensionDay');
    
    // Pinksteren
    holidays.set(format(addDays(easterSunday, 50), 'yyyy-MM-dd'), 'whitMonday');
    
    // Kerstmis
    holidays.set(format(new Date(year, 11, 25), 'yyyy-MM-dd'), 'christmasDay');
    holidays.set(format(new Date(year, 11, 26), 'yyyy-MM-dd'), 'secondChristmasDay');

    return holidays;
}

export const getRelativeDayName = (date: Date, lang: 'en' | 'nl', t: (key: string) => string): string => {
    const today = new Date();
    if (isToday(date)) return t('today');
    if (isYesterday(date)) return t('yesterday');
    if (isTomorrow(date)) return t('tomorrow');
    
    const dayBeforeYesterday = subDays(today, 2);
    if (isSameDay(date, dayBeforeYesterday)) return t('dayBeforeYesterday');

    const dayAfterTomorrow = addDays(today, 2);
    if (isSameDay(date, dayAfterTomorrow)) return t('dayAfterTomorrow');

    return formatDate(date, 'PPPP', lang); // fallback
}


export { addDays, subDays, addWeeks, subWeeks, startOfDay };