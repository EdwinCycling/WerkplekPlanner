export type LocationId = 'home' | 'delft' | 'eindhoven' | 'gent' | 'utrecht' | 'zwolle' | 'other' | 'off' | 'scheduled_off';

export interface Location {
    id: LocationId;
    nameKey: string;
    color: string;
    textColor: string;
}

export interface User {
    id: string; // This will be the Firebase UID
    name: string;
    email: string;
}

export type Schedule = Record<string, Record<string, LocationId>>; // { [userId]: { [dateString]: LocationId } }