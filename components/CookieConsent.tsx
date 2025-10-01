
import React, { useState, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { useAuth } from '../contexts/AppContext';

const CookieConsent: React.FC = () => {
    const { t } = useAuth();
    const [consent, setConsent] = useLocalStorage<boolean | null>('cookie-consent', null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (consent === null) {
            setVisible(true);
        }
    }, [consent]);

    const handleContinue = () => {
        setConsent(true);
        setVisible(false);
    };

    const handleCancel = () => {
        setConsent(false);
        setVisible(false);
        // Optionally, you can restrict functionality if they cancel
    };

    if (!visible) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-lg w-full">
                <h2 className="text-2xl font-bold mb-4">{t('cookieConsentTitle')}</h2>
                <p className="mb-6 text-gray-600 dark:text-gray-300">{t('cookieConsentText')}</p>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                        {t('cookieConsentCancel')}
                    </button>
                    <button
                        onClick={handleContinue}
                        className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                        {t('cookieConsentContinue')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CookieConsent;
