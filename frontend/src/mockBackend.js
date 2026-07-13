import MockAdapter from 'axios-mock-adapter';
import { TOTP } from 'totp-generator';

const generateSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 16; i++) {
        secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
};

const getOtpAuthUrl = (username, secret) => {
    return `otpauth://totp/NMPA:${username}?secret=${secret}&issuer=NMPA`;
};

// Initialize mock data in localStorage
const DB_VERSION = 'v5_clear_and_add_duplicate_dummy_data'; // bump this to force-reset stale localStorage

const initDb = () => {
    // Clear old data if DB version has changed (ensures clean slate for duplicate dummy data)
    if (localStorage.getItem('mock_db_version') !== DB_VERSION) {
        localStorage.removeItem('mock_users');
        localStorage.removeItem('mock_vessels');
        localStorage.removeItem('mock_journeys');
        localStorage.removeItem('mock_audit_trails');
        localStorage.setItem('mock_db_version', DB_VERSION);
    }

    let existingUsers = JSON.parse(localStorage.getItem('mock_users'));
    if (!existingUsers) {
        localStorage.setItem('mock_users', JSON.stringify([
            {
                _id: '1',
                username: 'Admin',
                password: 'Welcome@1234',
                role: 'System Administrator',
                status: 'approved',
                twoFactorSecret: generateSecret(),
                is2FAEnabled: false,
                createdAt: new Date('2024-01-15T09:00:00').toISOString()
            },
            {
                _id: '2',
                username: 'Agent',
                password: 'Welcome@1234',
                role: 'Ship Agent Account',
                status: 'approved',
                twoFactorSecret: generateSecret(),
                is2FAEnabled: false,
                createdAt: new Date('2024-02-10T11:30:00').toISOString()
            },
            {
                _id: '3',
                username: 'Hel',
                password: 'Welcome@1234',
                role: 'Health Department',
                status: 'approved',
                twoFactorSecret: generateSecret(),
                is2FAEnabled: false,
                createdAt: new Date('2024-06-01T16:20:00').toISOString()
            }
        ]));
    } else {
        const seedDates = {
            'Admin': '2024-01-15T09:00:00',
            'Agent': '2024-02-10T11:30:00',
            'Hel': '2024-06-01T16:20:00'
        };
        const initialUsers = [
            { username: 'Admin', role: 'System Administrator' },
            { username: 'Agent', role: 'Ship Agent Account' },
            { username: 'Hel', role: 'Health Department' }
        ];
        initialUsers.forEach((u, i) => {
            const index = existingUsers.findIndex(item => item.username === u.username && item.role === u.role);
            if (index !== -1) {
                existingUsers[index].password = 'Welcome@1234';
                existingUsers[index].status = 'approved';
                existingUsers[index].is2FAEnabled = false;
                // Backfill createdAt for users created before this field existed
                if (!existingUsers[index].createdAt) {
                    existingUsers[index].createdAt = new Date(seedDates[u.username] || '2024-01-01T00:00:00').toISOString();
                }
            } else {
                existingUsers.push({
                    _id: String(existingUsers.length + 1),
                    username: u.username,
                    password: 'Welcome@1234',
                    role: u.role,
                    status: 'approved',
                    twoFactorSecret: generateSecret(),
                    is2FAEnabled: false,
                    createdAt: new Date(seedDates[u.username] || '2024-01-01T00:00:00').toISOString()
                });
            }
        });
        localStorage.setItem('mock_users', JSON.stringify(existingUsers));
    }

    // Seed duplicate vessels (MV Narmada, MT Swarajya)
    if (!localStorage.getItem('mock_vessels') || JSON.parse(localStorage.getItem('mock_vessels')).length === 0) {
        localStorage.setItem('mock_vessels', JSON.stringify([
            { _id: 'v1', name: 'MV Narmada', imoNumber: '9123456', flagState: 'IN', vesselType: 'Container Ship', ownerDetails: 'India Shipping Line', grt: 28450, nrt: 16100, userId: '2' },
            { _id: 'v2', name: 'MV Narmada', imoNumber: '9123457', flagState: 'PA', vesselType: 'Container Ship', ownerDetails: 'Panama Ocean Ltd', grt: 28450, nrt: 16100, userId: '2' }, // Duplicate Name
            { _id: 'v3', name: 'MT Swarajya', imoNumber: '9876543', flagState: 'IN', vesselType: 'Oil Tanker', ownerDetails: 'Indian Oil Corp', grt: 85000, nrt: 51000, userId: '2' },
            { _id: 'v4', name: 'MT Swarajya', imoNumber: '9876544', flagState: 'SG', vesselType: 'Oil Tanker', ownerDetails: 'Singapore Tankers Ltd', grt: 85000, nrt: 51000, userId: '2' } // Duplicate Name
        ]));
    }

    // Seed corresponding journeys with duplicate vessels
    if (!localStorage.getItem('mock_journeys') || JSON.parse(localStorage.getItem('mock_journeys')).length === 0) {
        localStorage.setItem('mock_journeys', JSON.stringify([
            {
                _id: 'j1',
                vesselId: 'v1',
                vessel: { _id: 'v1', name: 'MV Narmada', imoNumber: '9123456', flagState: 'IN', vesselType: 'Container Ship', ownerDetails: 'India Shipping Line', grt: 28450, nrt: 16100, userId: '2' },
                lastPortOfCall: 'Singapore',
                eta: new Date('2026-07-20T10:00:00Z').toISOString(),
                etd: new Date('2026-07-25T18:00:00Z').toISOString(),
                status: 'In Progress',
                clearances: { customs: 'Pending', health: 'Approved', traffic: 'Pending' },
                notes: { customs: '', health: 'All crew vaccination cards verified.', traffic: '' },
                documents: ['IGM_File.pdf', 'Crew_List.pdf', 'Receipt_ILH.pdf'],
                captainName: 'Capt. R. K. Singh',
                destinationPort: 'Mangalore Port',
                cargoType: 'CONTAINER',
                crewCount: 24,
                passengerCount: 0,
                ilhReceiptNo: 'ILH-2026-0091',
                ilhPaidDate: new Date('2026-07-10T12:00:00Z').toISOString(),
                ilhAmount: 48900,
                ilhValidFrom: new Date('2026-07-10T00:00:00Z').toISOString(),
                ilhValidTo: new Date('2026-10-10T23:59:59Z').toISOString(),
                userId: '2'
            },
            {
                _id: 'j2',
                vesselId: 'v2',
                vessel: { _id: 'v2', name: 'MV Narmada', imoNumber: '9123457', flagState: 'PA', vesselType: 'Container Ship', ownerDetails: 'Panama Ocean Ltd', grt: 28450, nrt: 16100, userId: '2' },
                lastPortOfCall: 'Colombo',
                eta: new Date('2026-07-21T08:30:00Z').toISOString(),
                etd: new Date('2026-07-26T20:00:00Z').toISOString(),
                status: 'In Progress',
                clearances: { customs: 'Pending', health: 'Pending', traffic: 'Pending' },
                notes: { customs: '', health: '', traffic: '' },
                documents: ['IGM_File.pdf', 'Crew_List.pdf'],
                captainName: 'Capt. S. Jayawardene',
                destinationPort: 'Mangalore Port',
                cargoType: 'CONTAINER',
                crewCount: 22,
                passengerCount: 0,
                ilhReceiptNo: '',
                ilhAmount: 0,
                userId: '2'
            },
            {
                _id: 'j3',
                vesselId: 'v3',
                vessel: { _id: 'v3', name: 'MT Swarajya', imoNumber: '9876543', flagState: 'IN', vesselType: 'Oil Tanker', ownerDetails: 'Indian Oil Corp', grt: 85000, nrt: 51000, userId: '2' },
                lastPortOfCall: 'Jebel Ali',
                eta: new Date('2026-07-15T06:00:00Z').toISOString(),
                etd: new Date('2026-07-18T12:00:00Z').toISOString(),
                status: 'Cleared',
                clearances: { customs: 'Approved', health: 'Approved', traffic: 'Approved' },
                notes: { 
                  customs: 'Duty fees and ILH dues fully paid.', 
                  health: 'PHO sanitation checklist complete.', 
                  traffic: 'Berth 11 assigned.' 
                },
                documents: ['Manifest.pdf', 'Sanitation_Cert.pdf', 'Receipt_ILH.pdf'],
                captainName: 'Capt. Ahmed Al-Mansoori',
                destinationPort: 'Mangalore Port',
                cargoType: 'CRUDE',
                crewCount: 28,
                passengerCount: 2,
                ilhReceiptNo: 'ILH-2026-0044',
                ilhPaidDate: new Date('2026-07-12T14:30:00Z').toISOString(),
                ilhAmount: 125000,
                ilhValidFrom: new Date('2026-07-12T00:00:00Z').toISOString(),
                ilhValidTo: new Date('2026-10-12T23:59:59Z').toISOString(),
                userId: '2'
            }
        ]));
    }

    if (!localStorage.getItem('mock_audit_trails') || JSON.parse(localStorage.getItem('mock_audit_trails')).length === 0) {
        localStorage.setItem('mock_audit_trails', JSON.stringify([
            { _id: 'a1', action: 'System Database fully cleared and reset', user: 'Admin', timestamp: new Date(Date.now() - 120000).toISOString() },
            { _id: 'a2', action: 'Dummy data seeded with duplicate vessels', user: 'Admin', timestamp: new Date(Date.now() - 60000).toISOString() }
        ]));
    }
};

const addAuditTrail = (action, user) => {
    const trails = getDb('audit_trails');
    trails.unshift({ _id: generateId(), action, user, timestamp: new Date().toISOString() });
    setDb('audit_trails', trails.slice(0, 50)); // Keep last 50
};

const getDb = (table) => JSON.parse(localStorage.getItem(`mock_${table}`)) || [];

// Write to localStorage AND fire a custom event so any listener gets instant notification
const setDb = (table, data) => {
    localStorage.setItem(`mock_${table}`, JSON.stringify(data));
    // Dispatch a custom event on window so same-tab subscribers (AdminPanel, etc.) react immediately
    window.dispatchEvent(new CustomEvent('nmpa:db-changed', { detail: { table } }));
};
const generateId = () => Math.random().toString(36).substr(2, 9);

const getCurrentUser = (config) => {
    const authHeader = config.headers?.Authorization || config.headers?.authorization;
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return null;
    const userId = token.replace('mock-token-', '');
    return getDb('users').find(u => u._id === userId);
};

export const setupMockBackend = (axiosInstance) => {
    initDb();
    const mock = new MockAdapter(axiosInstance, { delayResponse: 500 });

    // AUTH: Login
    mock.onPost('/auth/login').reply((config) => {
        const { username, password, role } = JSON.parse(config.data);
        const users = getDb('users');
        const user = users.find(u => u.username === username && u.role === role);

        if (!user || user.password !== password) {
            return [401, { error: 'Invalid credentials or role' }];
        }

        if (user.status === 'pending') {
            return [401, { error: 'Your account is pending approval by the System Administrator.' }];
        }
        if (user.status === 'rejected') {
            return [401, { error: 'Your account registration has been rejected.' }];
        }

        if (user.is2FAEnabled) {
            return [200, { requires2FA: true, userId: user._id }];
        }

        return [200, {
            token: `mock-token-${user._id}`,
            user: { username: user.username, role: user.role, _id: user._id }
        }];
    });

    // AUTH: Verify 2FA
    mock.onPost('/auth/verify-2fa').reply(async (config) => {
        const { userId, token } = JSON.parse(config.data);
        const users = getDb('users');
        const user = users.find(u => u._id === userId);

        if (!user) return [404, { error: 'User not found' }];
        
        // Real-time TOTP validation
        try {
            const { otp: currentToken } = await TOTP.generate(user.twoFactorSecret);
            // Allow for a bit of time drift (current and previous 30s window)
            const { otp: prevToken } = await TOTP.generate(user.twoFactorSecret, { timestamp: Date.now() - 30000 });
            
            if (token !== currentToken && token !== prevToken) {
                return [401, { error: 'Invalid 2FA token. Please check your authenticator app.' }];
            }
        } catch (e) {
            console.error("2FA Error:", e);
            return [500, { error: '2FA Validation Error' }];
        }

        return [200, {
            token: `mock-token-${user._id}`,
            user: { username: user.username, role: user.role, _id: user._id }
        }];
    });

    // AUTH: Register
    mock.onPost('/auth/register').reply((config) => {
        const { username, password, email, role } = JSON.parse(config.data);
        const users = getDb('users');
        const normalizedUsername = (username || '').trim().toLowerCase();
        const normalizedEmail    = (email    || '').trim().toLowerCase();

        if (users.find(u => (u.username || '').toLowerCase() === normalizedUsername)) {
            return [400, { error: `Username "${username}" is already taken. Please choose a different username.` }];
        }
        if (normalizedEmail && users.find(u => (u.email || '').toLowerCase() === normalizedEmail)) {
            return [400, { error: `Email address "${email}" is already registered. Please use a different email.` }];
        }

        const newUser = {
            _id: generateId(),
            username,
            password,
            email,
            role,
            status: 'pending',
            twoFactorSecret: generateSecret(),
            is2FAEnabled: true,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        setDb('users', users);

        const qrCodeUrl = newUser.is2FAEnabled ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(getOtpAuthUrl(username, newUser.twoFactorSecret))}` : '';
        const secret = newUser.is2FAEnabled ? newUser.twoFactorSecret : ''; 
        return [201, { message: 'User registered successfully', qrCodeUrl, secret }];
    });

    // USERS: Update Status
    mock.onPut(/\/users\/.+\/status/).reply((config) => {
        const id = config.url.split('/')[2];
        const { status } = JSON.parse(config.data);
        const users = getDb('users');
        const userIndex = users.findIndex(u => u._id === id);
        
        if (userIndex !== -1) {
            users[userIndex].status = status;
            setDb('users', users);
            addAuditTrail(`User ${users[userIndex].username} status updated to ${status}`, 'System Administrator');
            return [200, { message: 'Status updated', user: users[userIndex] }];
        }
        return [404, { error: 'User not found' }];
    });

    // USERS: Get all
    mock.onGet('/users').reply(() => {
        return [200, getDb('users').map(u => ({ ...u, password: undefined }))]; // Hide password
    });

    // USERS: Create (Admin)
    mock.onPost('/users').reply((config) => {
        const { username, password, email, role } = JSON.parse(config.data);
        const users = getDb('users');
        const normalizedUsername = (username || '').trim().toLowerCase();
        const normalizedEmail    = (email    || '').trim().toLowerCase();

        if (users.find(u => (u.username || '').toLowerCase() === normalizedUsername)) {
            return [400, { error: `Username "${username}" is already taken. Please choose a different username.` }];
        }
        if (normalizedEmail && users.find(u => (u.email || '').toLowerCase() === normalizedEmail)) {
            return [400, { error: `Email address "${email}" is already registered. Please use a different email.` }];
        }

        const newUser = {
            _id: generateId(),
            username,
            password,
            email,
            role,
            status: 'approved',
            twoFactorSecret: generateSecret(),
            is2FAEnabled: true,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        setDb('users', users);
        
        const qrCodeUrl = newUser.is2FAEnabled ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(getOtpAuthUrl(username, newUser.twoFactorSecret))}` : '';
        const secret = newUser.is2FAEnabled ? newUser.twoFactorSecret : '';
        
        return [201, { message: 'User created', qrCodeUrl, secret }];
    });

    // USERS: Delete
    mock.onDelete(/\/users\/.+/).reply((config) => {
        const id = config.url.split('/').pop();
        const users = getDb('users');
        const userToDelete = users.find(u => u._id === id);

        if (userToDelete && userToDelete.role === 'System Administrator') {
            return [403, { error: 'System Administrator accounts cannot be deleted.' }];
        }

        const filteredUsers = users.filter(u => u._id !== id);
        setDb('users', filteredUsers);
        addAuditTrail(`User Deleted: ${userToDelete?.username}`, 'System Administrator');
        return [200, { message: 'User deleted' }];
    });

    // USERS: Reset 2FA
    mock.onPut(/\/users\/.+\/reset-2fa/).reply((config) => {
        const id = config.url.split('/')[2];
        const users = getDb('users');
        const userIndex = users.findIndex(u => u._id === id);
        if (userIndex !== -1) {
            users[userIndex].is2FAEnabled = true;
            users[userIndex].twoFactorSecret = generateSecret();
            setDb('users', users);
            return [200, { 
                message: '2FA configured successfully', 
                qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(getOtpAuthUrl(users[userIndex].username, users[userIndex].twoFactorSecret))}`,
                secret: users[userIndex].twoFactorSecret
            }];
        }
        return [404, { error: 'User not found' }];
    });

    // VESSELS: Get
    mock.onGet('/vessels').reply((config) => {
        const user = getCurrentUser(config);
        let vessels = getDb('vessels');
        if (user && user.role === 'Ship Agent Account') {
            vessels = vessels.filter(v => v.userId === user._id);
        }
        return [200, vessels];
    });

    // VESSELS: Create
    mock.onPost('/vessels').reply((config) => {
        const vessel = JSON.parse(config.data);
        const vessels = getDb('vessels');
        const user = getCurrentUser(config);
        vessel._id = generateId();
        if (user) {
            vessel.userId = user._id;
        }
        vessels.push(vessel);
        setDb('vessels', vessels);
        return [201, vessel];
    });

    // JOURNEYS: Get
    mock.onGet('/journeys').reply((config) => {
        const user = getCurrentUser(config);
        let journeys = getDb('journeys');
        if (user && user.role === 'Ship Agent Account') {
            journeys = journeys.filter(j => j.userId === user._id);
        }
        return [200, journeys];
    });

    // JOURNEYS: Create
    mock.onPost('/journeys').reply((config) => {
        const journey = JSON.parse(config.data);
        const journeys = getDb('journeys');
        const vessels = getDb('vessels');
        const vessel = vessels.find(v => v._id === journey.vesselId);
        const user = getCurrentUser(config);

        journey._id = generateId();
        journey.vessel = vessel;
        if (user) {
            journey.userId = user._id;
        }
        journey.status = 'In Progress';
        journey.clearances = {
            customs: 'Pending',
            health: 'Pending',
            traffic: 'Pending'
        };
        journey.notes = {
            customs: '',
            health: '',
            traffic: ''
        };
        journey.documents = journey.documents || ['Registry_Copy.pdf', 'Manifest.pdf'];
        
        journeys.push(journey);
        setDb('journeys', journeys);
        addAuditTrail(`New Journey Registry: ${vessel?.name}`, 'Ship Agent');
        return [201, journey];
    });

    // JOURNEYS: Update Clearance
    mock.onPut(/\/journeys\/.+\/clearance/).reply((config) => {
        const id = config.url.split('/')[2];
        const { status, note } = JSON.parse(config.data);
        
        // Try to infer role from token, but since we are mocking, we can cheat 
        // by looking at the Authorization header to find the user role
        const token = config.headers.Authorization?.replace('Bearer ', '');
        const userId = token?.replace('mock-token-', '');
        const user = getDb('users').find(u => u._id === userId);
        
        if (!user) return [401, { error: 'Unauthorized' }];

        const journeys = getDb('journeys');
        const journeyIndex = journeys.findIndex(j => j._id === id);
        
        if (journeyIndex === -1) return [404, { error: 'Journey not found' }];

        if (user.role === 'Customs Department') { journeys[journeyIndex].clearances.customs = status; journeys[journeyIndex].notes.customs = note; }
        if (user.role === 'Health Department') { journeys[journeyIndex].clearances.health = status; journeys[journeyIndex].notes.health = note; }
        if (user.role === 'Port Authority Node') { journeys[journeyIndex].clearances.traffic = status; journeys[journeyIndex].notes.traffic = note; }

        // Auto-complete overall status
        const c = journeys[journeyIndex].clearances;
        if (c.customs === 'Approved' && c.health === 'Approved' && c.traffic === 'Approved') {
            journeys[journeyIndex].status = 'Cleared';
        } else if (c.customs === 'Rejected' || c.health === 'Rejected' || c.traffic === 'Rejected') {
            journeys[journeyIndex].status = 'Rejected';
        }

        setDb('journeys', journeys);
        addAuditTrail(`Clearance ${status}: ${journeys[journeyIndex].vessel?.name}`, user.role);
        return [200, journeys[journeyIndex]];
    });

    // AUDIT TRAILS: Get
    mock.onGet('/audit-trails').reply(() => [200, getDb('audit_trails')]);

    // NMPA Live Berths
    mock.onGet('/journeys/nmpa-live-berths').reply(() => {
        const liveBerths = [
            { id: 1, name: "Berth No. 1 (General Cargo)", occupied: true, vessel: "MV Mangalore Star", flag: "IN", grt: 18450, status: "Cleared - Docked" },
            { id: 2, name: "Berth No. 2 (General / Acid Terminal)", occupied: true, vessel: "MT Swarna Krishna", flag: "IN", grt: 22100, status: "Cleared - Docked" },
            { id: 3, name: "Berth No. 3 (General Cargo)", occupied: true, vessel: "MV Star Bright", flag: "PA", grt: 15400, status: "Cleared - Docked" },
            { id: 4, name: "Berth No. 4 (General Cargo)", occupied: false, vessel: "", flag: "", grt: 0, status: "Available" },
            { id: 5, name: "Berth No. 5 (General Cargo)", occupied: true, vessel: "MV Sagar Deep", flag: "IN", grt: 34500, status: "Cleared - Docked" },
            { id: 6, name: "Berth No. 6 (General Cargo)", occupied: false, vessel: "", flag: "", grt: 0, status: "Available" },
            { id: 7, name: "Berth No. 7 (Liquid POL / Oil Jetty)", occupied: true, vessel: "MT Ocean Grace", flag: "SG", grt: 42100, status: "Cleared - Docked" },
            { id: 8, name: "Berth No. 8 (Mechanized Coal Quay)", occupied: true, vessel: "MV Aravali", flag: "IN", grt: 48900, status: "Cleared - Docked" },
            { id: 9, name: "Berth No. 9 (Container Quay Terminal)", occupied: true, vessel: "MV Express Kaveri", flag: "IN", grt: 28400, status: "Cleared - Docked" },
            { id: 10, name: "Berth No. 10 (Dry Bulk / Coal Cargo)", occupied: true, vessel: "MV Port Master", flag: "LR", grt: 31200, status: "Cleared - Docked" },
            { id: 11, name: "Berth No. 11 (POL & Crude Jetty)", occupied: true, vessel: "MT LPG Maharaja", flag: "IN", grt: 26500, status: "Cleared - Docked" },
            { id: 12, name: "Berth No. 12 (Crude Oil Terminal)", occupied: false, vessel: "", flag: "", grt: 0, status: "Available" },
            { id: 13, name: "Berth No. 13 (POL Product Jetty)", occupied: false, vessel: "", flag: "", grt: 0, status: "Available" },
            { id: 14, name: "Berth No. 14 (Mechanized Bulk Cargo)", occupied: true, vessel: "MV Deccan Queen", flag: "IN", grt: 52100, status: "Cleared - Docked" },
            { id: 15, name: "Berth No. 15 (Deep Draft SPM)", occupied: true, vessel: "MT Swarajya", flag: "IN", grt: 85000, status: "Cleared - Docked" },
            { id: 16, name: "Berth No. 16 (Multipurpose Heavy Cargo)", occupied: true, vessel: "MV Konkan Pride", flag: "IN", grt: 19800, status: "Cleared - Docked" }
        ];
        const minute = new Date().getMinutes();
        if (minute % 2 === 0) {
            liveBerths[3] = { id: 4, name: "Berth No. 4 (General Cargo)", occupied: true, vessel: "MV Malabar King", flag: "IN", grt: 14200, status: "Cleared - Docked" };
            liveBerths[11] = { id: 12, name: "Berth No. 12 (Crude Oil Terminal)", occupied: true, vessel: "MT Swarna Kamal", flag: "IN", grt: 41200, status: "Cleared - Docked" };
        }
        return [200, liveBerths];
    });

    // Weather & Tide
    mock.onGet('/journeys/weather-tide').reply(() => {
        const now = new Date();
        const hour = now.getHours();
        
        const baseTemp = 28;
        const tempVar = Math.sin(((hour - 8) / 24) * 2 * Math.PI) * 4;
        const temp = Math.round(baseTemp + tempVar + 2);
        
        const windSpeed = Math.round(11 + Math.sin((hour / 24) * 2 * Math.PI) * 5 + (now.getMinutes() % 3));
        
        let visibilityCond = "Good";
        let visibilityVal = "8 NM";
        if (windSpeed > 15) {
            visibilityCond = "Moderate";
            visibilityVal = "6 NM";
        }
        
        const day = now.getDate();
        const highTideMin = (14 * 60 + 15 + (day * 50)) % 1440;
        const lowTideMin = (20 * 60 + 45 + (day * 50)) % 1440;
        
        const formatMinToTime = (totalMin) => {
            const h = Math.floor(totalMin / 60);
            const m = Math.floor(totalMin % 60);
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        };
        
        const highTideTime = formatMinToTime(highTideMin);
        const lowTideTime = formatMinToTime(lowTideMin);
        
        const highTideHeight = (3.0 + Math.sin(day) * 0.4).toFixed(1);
        const lowTideHeight = (0.8 + Math.cos(day) * 0.2).toFixed(1);
        
        let safetyAdvisoryCode = "safe";
        if (windSpeed > 17) {
            safetyAdvisoryCode = "caution";
        }
        
        return [200, {
            temp,
            windSpeed,
            visibilityVal,
            visibilityCond,
            highTideHeight,
            highTideTime,
            lowTideHeight,
            lowTideTime,
            safetyAdvisoryCode
        }];
    });

    // HEALTH CHECK: Always return healthy so the login error handler never falsely reports server down
    mock.onGet('/health').reply(() => [200, { status: 'ok', database: 'connected', version: 'mock-v3' }]);

    // CATCH-ALL: Any unmocked route returns 404 instead of falling through to the real network
    // This prevents "Unable to reach server" for any forgotten endpoint
    mock.onAny().reply((config) => {
        console.warn('[MockBackend] Unhandled route:', config.method?.toUpperCase(), config.url);
        return [404, { error: `Mock: route not found — ${config.method?.toUpperCase()} ${config.url}` }];
    });
};
