const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vessels', require('./routes/vessels'));
app.use('/api/journeys', require('./routes/journeys'));
app.use('/api/users', require('./routes/users'));

// Database Connection
const connectDB = async () => {
    let uri = process.env.MONGODB_URI;
    
    if (!uri) {
        console.log('No MONGODB_URI found in env. Starting in-memory MongoDB instance...');
        const mongoServer = await MongoMemoryServer.create();
        uri = mongoServer.getUri();
    }

    try {
        await mongoose.connect(uri);
        console.log('MongoDB connected successfully');
        
        // Seed Default Admin User
        const adminExists = await User.findOne({ username: 'Admin' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('Admin@123', 10);
            await User.create({
                username: 'Admin',
                password: hashedPassword,
                role: 'System Administrator',
                is2FAEnabled: false
            });
            console.log('Default Admin user seeded successfully');
        }

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
};

connectDB();
