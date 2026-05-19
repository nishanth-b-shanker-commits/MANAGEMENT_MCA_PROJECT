import React, { createContext, useState, useEffect, useRef } from 'react';
import api from './api';

export const AuthContext = createContext(null);

const DEFAULT_NOTIFICATIONS = [
    {
        id: 'default-1',
        title: 'System Update',
        message: 'NMPA Port Management System successfully updated to v1.2.',
        type: 'info',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        read: false
    },
    {
        id: 'default-2',
        title: 'Clearance Approval',
        message: 'Vessel MV Ocean Express cleared customs department.',
        type: 'success',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        read: false
    }
];

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState(() => {
        const saved = localStorage.getItem('nmpa_notifications');
        return saved ? JSON.parse(saved) : DEFAULT_NOTIFICATIONS;
    });
    const [toasts, setToasts] = useState([]);

    const prevJourneys = useRef([]);
    const prevVessels = useRef([]);
    const hasLoadedBaseline = useRef(false);

    const login = (userData, token) => {
        window.__TEMP_TOKEN__ = token; 
        setUser(userData);
        hasLoadedBaseline.current = false;
    };

    const logout = () => {
        window.__TEMP_TOKEN__ = null;
        setUser(null);
        hasLoadedBaseline.current = false;
    };

    const addToast = (title, message, type = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, title, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4500);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const addNotification = (title, message, type = 'info') => {
        const newNotif = {
            id: Math.random().toString(36).substring(2, 9),
            title,
            message,
            type,
            timestamp: new Date().toISOString(),
            read: false
        };
        setNotifications(prev => {
            const updated = [newNotif, ...prev];
            localStorage.setItem('nmpa_notifications', JSON.stringify(updated));
            return updated;
        });
        addToast(title, message, type);
    };

    const markAsRead = (id) => {
        setNotifications(prev => {
            const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
            localStorage.setItem('nmpa_notifications', JSON.stringify(updated));
            return updated;
        });
    };

    const markAllAsRead = () => {
        setNotifications(prev => {
            const updated = prev.map(n => ({ ...n, read: true }));
            localStorage.setItem('nmpa_notifications', JSON.stringify(updated));
            return updated;
        });
    };

    const deleteNotification = (id) => {
        setNotifications(prev => {
            const updated = prev.filter(n => n.id !== id);
            localStorage.setItem('nmpa_notifications', JSON.stringify(updated));
            return updated;
        });
    };

    const clearAllNotifications = () => {
        setNotifications([]);
        localStorage.setItem('nmpa_notifications', JSON.stringify([]));
    };

    // Smart background detector for changes
    useEffect(() => {
        if (!user) return;

        const pollData = async () => {
            try {
                const [vRes, jRes] = await Promise.all([
                    api.get('/vessels'),
                    api.get('/journeys')
                ]);

                const currentVessels = vRes.data;
                const currentJourneys = jRes.data;

                if (!hasLoadedBaseline.current) {
                    prevVessels.current = currentVessels;
                    prevJourneys.current = currentJourneys;
                    hasLoadedBaseline.current = true;
                    return;
                }

                // Check for new vessels
                currentVessels.forEach(v => {
                    const exists = prevVessels.current.some(pv => pv._id === v._id);
                    if (!exists) {
                        addNotification(
                            'New Vessel Registered',
                            `Vessel '${v.name}' (${v.vesselType}) has been registered by ship agent.`,
                            'info'
                        );
                    }
                });

                // Check for journey updates
                currentJourneys.forEach(j => {
                    const prevJ = prevJourneys.current.find(pj => pj._id === j._id);
                    if (!prevJ) {
                        // New journey submitted
                        addNotification(
                            'New Entry Application',
                            `New port entry application submitted for Vessel '${j.vessel?.name || 'Unknown'}'.`,
                            'info'
                        );
                    } else {
                        // Check clearances health
                        if (j.clearances.health !== prevJ.clearances.health && j.clearances.health !== 'Pending') {
                            addNotification(
                                'Health Clearance Update',
                                `Vessel '${j.vessel?.name}' health clearance has been ${j.clearances.health.toLowerCase()} by Health Department.`,
                                j.clearances.health === 'Approved' ? 'success' : 'danger'
                            );
                        }
                        // Check clearances customs
                        if (j.clearances.customs !== prevJ.clearances.customs && j.clearances.customs !== 'Pending') {
                            addNotification(
                                'Customs Clearance Update',
                                `Vessel '${j.vessel?.name}' customs clearance has been ${j.clearances.customs.toLowerCase()} by Customs Department.`,
                                j.clearances.customs === 'Approved' ? 'success' : 'danger'
                            );
                        }
                        // Check clearances traffic
                        if (j.clearances.traffic !== prevJ.clearances.traffic && j.clearances.traffic !== 'Pending') {
                            addNotification(
                                'Traffic Clearance Update',
                                `Vessel '${j.vessel?.name}' traffic clearance has been ${j.clearances.traffic.toLowerCase()} by Port Authority Node.`,
                                j.clearances.traffic === 'Approved' ? 'success' : 'danger'
                            );
                        }
                        // Check overall status
                        if (j.status !== prevJ.status) {
                            if (j.status === 'Cleared') {
                                addNotification(
                                    'Vessel Fully Cleared',
                                    `Vessel '${j.vessel?.name}' has been fully cleared for port entry! Certificate is ready.`,
                                    'success'
                                );
                            } else if (j.status === 'Rejected') {
                                addNotification(
                                    'Vessel Entry Rejected',
                                    `Vessel '${j.vessel?.name}' port entry has been rejected. Check clearance notes.`,
                                    'danger'
                                );
                            }
                        }
                    }
                });

                prevVessels.current = currentVessels;
                prevJourneys.current = currentJourneys;

            } catch (err) {
                console.error("Background notification checker error:", err);
            }
        };

        pollData(); // Run initially
        const interval = setInterval(pollData, 6000); // Poll every 6s

        return () => clearInterval(interval);
    }, [user]);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <AuthContext.Provider value={{ 
            user, 
            login, 
            logout, 
            notifications, 
            unreadCount, 
            toasts, 
            removeToast, 
            addNotification, 
            markAsRead, 
            markAllAsRead, 
            deleteNotification, 
            clearAllNotifications 
        }}>
            {children}
        </AuthContext.Provider>
    );
};
