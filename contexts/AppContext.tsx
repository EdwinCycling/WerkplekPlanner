import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { User, Schedule, LocationId } from '../types';
import { translations } from '../utils/translations';
import * as api from '../services/api';

type Theme = 'light' | 'dark';
type Language = 'en' | 'nl';

interface AppContextType {
    user: User | null;
    teamMembers: User[]; // Add team members to context
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<User>;
    logout: () => Promise<void>;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, section?: string) => string;
    schedule: Schedule;
    updateSchedule: (userId: string, date: string, locationId: LocationId) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [theme, setTheme] = useLocalStorage<Theme>('theme', 'light');
    const [language, setLanguage] = useLocalStorage<Language>('language', 'nl');
    const [schedule, setSchedule] = useState<Schedule>({});
    
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
    }, [theme]);

    useEffect(() => {
        // Listen for auth state changes
        const unsubscribe = api.onAuthStateChanged(authUser => {
            setUser(authUser);
            if (authUser) {
                // When a user logs in, fetch all team & schedule data
                const fetchData = async () => {
                    setIsLoading(true);
                    const members = await api.fetchTeamMembers();
                    setTeamMembers(members);
                    const initialSchedule = await api.fetchSchedule(members);
                    setSchedule(initialSchedule);
                    setIsLoading(false);
                };
                fetchData();
            } else {
                // User is logged out, clear data and stop loading
                setTeamMembers([]);
                setSchedule({});
                setIsLoading(false);
            }
        });
        
        return () => unsubscribe(); // Cleanup subscription on unmount
    }, []);


    const t = (key: string, section?: string): string => {
        const langDict = translations[language];
        if (section) {
            return (langDict as any)[section]?.[key] || key;
        }
        return (langDict as any)[key] || key;
    };

    const updateSchedule = async (userId: string, date: string, locationId: LocationId) => {
        // Optimistic UI update
        setSchedule(prev => ({
            ...prev,
            [userId]: {
                ...prev[userId],
                [date]: locationId,
            }
        }));
        try {
            // Update the backend
            await api.updateScheduleEntry(userId, date, locationId);
        } catch (error) {
            console.error("Failed to update schedule:", error);
            // In a real app, you would revert the optimistic update here.
            // For simplicity, we'll log the error. You might show a toast notification.
        }
    };

    const value = { 
        user,
        teamMembers,
        isLoading,
        login: api.login, 
        logout: api.logout, 
        theme, 
        setTheme, 
        language, 
        setLanguage, 
        t, 
        schedule, 
        updateSchedule 
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AppProvider');
    }
    return context;
};