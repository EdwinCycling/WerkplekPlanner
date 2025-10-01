import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged as _onAuthStateChanged,
    type User as FirebaseUser,
    sendPasswordResetEmail,
    updatePassword,
} from 'firebase/auth';
import {
    doc,
    getDoc,
    collection,
    getDocs,
    setDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { User, Schedule, LocationId } from '../types';
import { getDutchHolidays } from '../utils/dateUtils';

// --- Auth Functions ---

const getUserProfile = async (firebaseUser: FirebaseUser): Promise<User> => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
            id: firebaseUser.uid,
            name: userData.name || firebaseUser.email!,
            email: userData.email || firebaseUser.email!,
        };
    }

    // If no profile exists, create a minimal one to ensure team listing works
    const fallbackProfile: User = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email!,
        email: firebaseUser.email!,
    };

    await setDoc(userDocRef, { name: fallbackProfile.name, email: fallbackProfile.email }, { merge: true });

    return fallbackProfile;
};


export const login = async (email: string, pass: string): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    return getUserProfile(userCredential.user);
};

export const logout = (): Promise<void> => {
    return signOut(auth);
};

export const onAuthStateChanged = (callback: (user: User | null) => void) => {
    return _onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
            const userProfile = await getUserProfile(firebaseUser);
            callback(userProfile);
        } else {
            callback(null);
        }
    });
};

// --- Data Functions ---

export const fetchTeamMembers = async (): Promise<User[]> => {
    const usersCollection = collection(db, 'users');
    const userSnapshot = await getDocs(usersCollection);
    const userList = userSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        email: doc.data().email,
    }));
    return userList;
};


export const fetchSchedule = async (teamMembers: User[]): Promise<Schedule> => {
    // Minimize reads: perform one getDoc per team member (avoids reading unrelated docs)
    const schedulePromises = teamMembers.map(async (member) => {
        const scheduleDocRef = doc(db, 'schedules', member.id);
        const scheduleDoc = await getDoc(scheduleDocRef);
        return { userId: member.id, data: scheduleDoc.exists() ? scheduleDoc.data() : {} };
    });

    const results = await Promise.all(schedulePromises);
    const schedule: Schedule = {};

    results.forEach(result => {
        schedule[result.userId] = result.data as Record<string, LocationId>;
    });

    // Pre-fill holidays for all users (client-side, does not write to DB)
    for (let year = 2024; year <= 2030; year++) {
        const holidays = getDutchHolidays(year);
        holidays.forEach((_holidayName, dateStr) => {
            const holidayDate = new Date(dateStr + 'T12:00:00');
            const dayOfWeek = holidayDate.getDay();
            if (dayOfWeek > 0 && dayOfWeek < 6) {
                teamMembers.forEach(member => {
                    if (!schedule[member.id]) {
                        schedule[member.id] = {};
                    }
                    if (!schedule[member.id][dateStr]) {
                        schedule[member.id][dateStr] = 'off';
                    }
                });
            }
        });
    }

    return schedule;
};

export const updateScheduleEntry = async (userId: string, date: string, locationId: LocationId): Promise<void> => {
    // Basic runtime validation for safety
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error(`Invalid date format: ${date}`);
    }

    const allowed: LocationId[] = ['home', 'delft', 'eindhoven', 'gent', 'utrecht', 'zwolle', 'other', 'off', 'scheduled_off', 'event'];
    if (!allowed.includes(locationId)) {
        throw new Error(`Invalid locationId: ${locationId}`);
    }

    // Ensure user can only write to their own schedule document
    const currentUid = auth.currentUser?.uid;
    if (!currentUid || currentUid !== userId) {
        throw new Error('Unauthorized write: users may only update their own schedule');
    }

    const scheduleDocRef = doc(db, 'schedules', userId);

    // Single write that also auto-creates the document if it doesn't exist
    await setDoc(scheduleDocRef, { [date]: locationId }, { merge: true });
};

// --- Password Functions ---

export const resetPassword = async (email: string): Promise<void> => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Error: Invalid email address');
    }
    await sendPasswordResetEmail(auth, email);
};

export const changePassword = async (newPassword: string): Promise<void> => {
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
        throw new Error('Error: Password must be at least 8 characters');
    }
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error('Error: Not authenticated');
    }
    await updatePassword(currentUser, newPassword);
};
