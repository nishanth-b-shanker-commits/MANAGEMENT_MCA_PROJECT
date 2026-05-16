import React, { createContext, useState, useEffect } from 'react';
import api from './api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    // Removed useEffect that restores from localStorage to ensure logout on refresh

    const login = (userData, token) => {
        // We only store in sessionStorage if you want it to survive 'some' things, 
        // but for TRUE logout on refresh, we just use React state.
        // However, to make the API interceptor work, we need a way to pass the token.
        // We will use a temporary in-memory variable for the API.
        window.__TEMP_TOKEN__ = token; 
        setUser(userData);
    };

    const logout = () => {
        window.__TEMP_TOKEN__ = null;
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
