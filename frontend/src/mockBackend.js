import MockAdapter from 'axios-mock-adapter';

// Initialize mock data in localStorage
const initDb = () => {
    if (!localStorage.getItem('mock_users')) {
        localStorage.setItem('mock_users', JSON.stringify([
            {
                _id: '1',
                username: 'Admin',
                password: 'Admin@123', // In real app, this is hashed
                role: 'System Administrator',
                is2FAEnabled: false
            }
        ]));
    }
    if (!localStorage.getItem('mock_vessels')) {
        localStorage.setItem('mock_vessels', JSON.stringify([]));
    }
    if (!localStorage.getItem('mock_journeys')) {
        localStorage.setItem('mock_journeys', JSON.stringify([]));
    }
};

const getDb = (table) => JSON.parse(localStorage.getItem(`mock_${table}`)) || [];
const setDb = (table, data) => localStorage.setItem(`mock_${table}`, JSON.stringify(data));
const generateId = () => Math.random().toString(36).substr(2, 9);

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

        if (user.is2FAEnabled) {
            return [200, { requires2FA: true, userId: user._id }];
        }

        return [200, {
            token: `mock-token-${user._id}`,
            user: { username: user.username, role: user.role, _id: user._id }
        }];
    });

    // AUTH: Verify 2FA
    mock.onPost('/auth/verify-2fa').reply((config) => {
        const { userId, token } = JSON.parse(config.data);
        const users = getDb('users');
        const user = users.find(u => u._id === userId);

        if (!user) return [404, { error: 'User not found' }];
        if (token !== '123456') return [401, { error: 'Invalid 2FA token. Use 123456 for demo.' }];

        return [200, {
            token: `mock-token-${user._id}`,
            user: { username: user.username, role: user.role, _id: user._id }
        }];
    });

    // AUTH: Register
    mock.onPost('/auth/register').reply((config) => {
        const { username, password, role } = JSON.parse(config.data);
        const users = getDb('users');

        if (users.find(u => u.username === username)) {
            return [400, { error: 'User already exists' }];
        }

        const newUser = {
            _id: generateId(),
            username,
            password,
            role,
            is2FAEnabled: role !== 'System Administrator'
        };

        users.push(newUser);
        setDb('users', users);

        const qrCodeUrl = newUser.is2FAEnabled ? 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Demo2FA' : '';
        return [201, { message: 'User registered successfully', qrCodeUrl }];
    });

    // USERS: Get all
    mock.onGet('/users').reply((config) => {
        return [200, getDb('users').map(u => ({ ...u, password: undefined }))]; // Hide password
    });

    // USERS: Create (Admin)
    mock.onPost('/users').reply((config) => {
        const { username, password, role } = JSON.parse(config.data);
        const users = getDb('users');
        
        if (users.find(u => u.username === username)) {
            return [400, { error: 'User already exists' }];
        }

        const newUser = {
            _id: generateId(),
            username,
            password,
            role,
            is2FAEnabled: role !== 'System Administrator'
        };

        users.push(newUser);
        setDb('users', users);
        return [201, { message: 'User created' }];
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
        return [200, { message: 'User deleted' }];
    });

    // USERS: Reset 2FA
    mock.onPut(/\/users\/.+\/reset-2fa/).reply((config) => {
        const id = config.url.split('/')[2];
        const users = getDb('users');
        const userIndex = users.findIndex(u => u._id === id);
        if (userIndex !== -1) {
            users[userIndex].is2FAEnabled = true;
            setDb('users', users);
            return [200, { message: '2FA configured successfully', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Demo2FA' }];
        }
        return [404, { error: 'User not found' }];
    });

    // VESSELS: Get
    mock.onGet('/vessels').reply((config) => {
        // Normally we'd filter by user ID from token, but for demo we just return all
        return [200, getDb('vessels')];
    });

    // VESSELS: Create
    mock.onPost('/vessels').reply((config) => {
        const vessel = JSON.parse(config.data);
        const vessels = getDb('vessels');
        vessel._id = generateId();
        vessels.push(vessel);
        setDb('vessels', vessels);
        return [201, vessel];
    });

    // JOURNEYS: Get
    mock.onGet('/journeys').reply((config) => {
        return [200, getDb('journeys')];
    });

    // JOURNEYS: Create
    mock.onPost('/journeys').reply((config) => {
        const journey = JSON.parse(config.data);
        const journeys = getDb('journeys');
        journey._id = generateId();
        journey.clearanceStatus = {
            customs: 'Pending',
            health: 'Pending',
            portAuthority: 'Pending'
        };
        journeys.push(journey);
        setDb('journeys', journeys);
        return [201, journey];
    });

    // JOURNEYS: Update Clearance
    mock.onPut(/\/journeys\/.+\/clearance/).reply((config) => {
        const id = config.url.split('/')[2];
        const { status } = JSON.parse(config.data);
        
        // Try to infer role from token, but since we are mocking, we can cheat 
        // by looking at the Authorization header to find the user role
        const token = config.headers.Authorization?.replace('Bearer ', '');
        const userId = token?.replace('mock-token-', '');
        const user = getDb('users').find(u => u._id === userId);
        
        if (!user) return [401, { error: 'Unauthorized' }];

        const journeys = getDb('journeys');
        const journeyIndex = journeys.findIndex(j => j._id === id);
        
        if (journeyIndex === -1) return [404, { error: 'Journey not found' }];

        if (user.role === 'Customs Department') journeys[journeyIndex].clearanceStatus.customs = status;
        if (user.role === 'Health Department') journeys[journeyIndex].clearanceStatus.health = status;
        if (user.role === 'Port Authority Node') journeys[journeyIndex].clearanceStatus.portAuthority = status;

        setDb('journeys', journeys);
        return [200, journeys[journeyIndex]];
    });
};
