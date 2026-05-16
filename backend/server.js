const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
// Forcing hardcoded URI to bypass any broken environment variables set in Render
const DB_URI = "mongodb+srv://Project:Welcome%401234@cluster0.liljhzc.mongodb.net/portsystem?retryWrites=true&w=majority";

mongoose.connect(DB_URI)
  .then(() => console.log('MongoDB Connected successfully!'))
  .catch(err => console.log('MongoDB Error:', err));

const path = require('path');

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));
app.use('/vessels', require('./routes/vessels'));
app.use('/journeys', require('./routes/journeys'));
app.use('/audit-trails', require('./routes/auditTrails'));

// Serve Frontend Static Files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Catch-all to serve index.html for React Router
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
