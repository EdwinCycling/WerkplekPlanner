
import React from 'react';
import { LocationId } from '../types';
import { LOCATIONS } from '../constants/data';
import { useAuth } from '../contexts/AppContext';

interface LocationPillProps {
    locationId: LocationId | undefined;
}

const LocationPill: React.FC<LocationPillProps> = ({ locationId }) => {
    const { t } = useAuth();
    const location = LOCATIONS.find(l => l.id === locationId);

    if (!location) {
        return <span className="text-xs text-gray-400">-</span>;
    }

    const className = `px-2 py-1 text-xs sm:text-sm font-semibold rounded-full inline-block text-center ${location.color} ${location.textColor}`;

    return (
        <span className={className}>
            {t(location.nameKey, 'locations')}
        </span>
    );
};

export default LocationPill;
