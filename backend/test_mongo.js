const mongoose = require('mongoose');

const URI = "mongodb+srv://Project:Welcome%401234@cluster0.liljhzc.mongodb.net/portsystem?retryWrites=true&w=majority";

console.log("Testing connection...");
mongoose.connect(URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log("SUCCESS");
    process.exit(0);
  })
  .catch(err => {
    console.log("ERROR:", err.message);
    process.exit(1);
  });
