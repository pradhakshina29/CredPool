import { useState, useEffect } from 'react';
import { User } from '../types';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = () => {
            const savedUser = localStorage.getItem('trustpool_user');
            if (savedUser) {
                try {
                    setUser(JSON.parse(savedUser));
                } catch (e) {
                    console.error("Failed to parse user from localStorage", e);
                }
            }
            setLoading(false);
        };

        fetchUser();

        // Simple event listener for storage changes (handles same-domain multi-tab)
        const handleStorageChange = () => fetchUser();
        window.addEventListener('storage', handleStorageChange);

        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return { user, loading };
};
