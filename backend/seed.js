const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('./models/User');

const DB_URI = "mongodb+srv://Project:Welcome%401234@cluster0.liljhzc.mongodb.net/portsystem?retryWrites=true&w=majority";

mongoose.connect(DB_URI)
  .then(async () => {
    console.log('MongoDB Connected successfully!');
    
    // Check if user exists
    const existingUser = await User.findOne({ username: 'Admin' });
    if (existingUser) {
        console.log("User Admin already exists!");
        process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('Welcome@1234', 10);
    const rawSecret = crypto.randomBytes(20).toString('hex').slice(0, 16).toUpperCase();

    const admin = new User({
        username: 'Admin',
        password: hashedPassword,
        email: 'nishanthpoojary.b@gmail.com',
        role: 'System Administrator',
        status: 'approved',
        twoFactorSecret: rawSecret,
        is2FAEnabled: true
    });

    await admin.save();
    console.log("Admin user created successfully!");
    console.log("2FA Secret:", rawSecret);
    process.exit(0);
  })
  .catch(err => {
    console.log('MongoDB Error:', err);
    process.exit(1);
  });
