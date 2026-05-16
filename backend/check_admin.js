const mongoose = require('mongoose');
const User = require('./models/User');

const DB_URI = "mongodb+srv://Project:Welcome%401234@cluster0.liljhzc.mongodb.net/portsystem?retryWrites=true&w=majority";

mongoose.connect(DB_URI)
  .then(async () => {
    const admin = await User.findOne({ username: 'Admin' });
    if (admin) {
        console.log("Admin Details:");
        console.log("Username:", admin.username);
        console.log("Role:", admin.role);
        console.log("Status:", admin.status);
        console.log("is2FAEnabled:", admin.is2FAEnabled);
        console.log("Secret:", admin.twoFactorSecret);
    } else {
        console.log("Admin not found!");
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
