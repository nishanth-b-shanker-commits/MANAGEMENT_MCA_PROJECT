const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const DB_URI = "mongodb+srv://Project:Welcome%401234@cluster0.liljhzc.mongodb.net/portsystem?retryWrites=true&w=majority";

mongoose.connect(DB_URI)
  .then(async () => {
    console.log('MongoDB Connected successfully!');
    
    const hashedPassword = await bcrypt.hash('Welcome@1234', 10);
    
    const usersToSeed = [
        { username: 'Admin', role: 'System Administrator', email: 'admin-nmpa@gov.in' },
        { username: 'Agent', role: 'Ship Agent Account', email: 'agent-nmpa@gov.in' },
        { username: 'Traffic', role: 'Port Authority Node', email: 'traffic-nmpa@gov.in' },
        { username: 'Customs', role: 'Customs Department', email: 'customs-nmpa@gov.in' },
        { username: 'Health', role: 'Health Department', email: 'health-nmpa@gov.in' },
        { username: 'Hel', role: 'Health Department', email: 'hel-nmpa@gov.in' }
    ];

    for (const u of usersToSeed) {
        let existingUser = await User.findOne({ username: u.username });
        if (existingUser) {
            existingUser.password = hashedPassword;
            existingUser.role = u.role;
            existingUser.email = u.email;
            existingUser.status = 'approved';
            existingUser.is2FAEnabled = false;
            await existingUser.save();
            console.log(`Updated pre-seeded user: ${u.username}`);
        } else {
            const base32_chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
            let rawSecret = '';
            for(let i = 0; i < 16; i++) {
                rawSecret += base32_chars.charAt(Math.floor(Math.random() * 32));
            }
            const newUser = new User({
                username: u.username,
                password: hashedPassword,
                email: u.email,
                role: u.role,
                status: 'approved',
                twoFactorSecret: rawSecret,
                is2FAEnabled: false
            });
            await newUser.save();
            console.log(`Created pre-seeded user: ${u.username}`);
        }
    }

    console.log("Database seeding completed successfully!");
    process.exit(0);
  })
  .catch(err => {
    console.log('MongoDB Error:', err);
    process.exit(1);
  });
