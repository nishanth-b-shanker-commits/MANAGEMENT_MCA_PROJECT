const axios = require('axios');
const { spawn } = require('child_process');

async function testLogin() {
    console.log("Starting server for test...");
    const server = spawn('node', ['server.js'], { cwd: './backend' });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
        console.log("Attempting login as Admin...");
        const res = await axios.post('http://localhost:8000/auth/login', {
            username: 'Admin',
            password: 'Welcome@1234',
            role: 'System Administrator'
        });
        
        console.log("Response Status:", res.status);
        console.log("Response Data:", JSON.stringify(res.data, null, 2));
        
        if (res.data.token && !res.data.requires2FA) {
            console.log("SUCCESS: Admin logged in directly without 2FA!");
        } else if (res.data.requires2FA) {
            console.log("FAILURE: Admin still required 2FA!");
        } else {
            console.log("FAILURE: Unexpected response.");
        }
    } catch (err) {
        console.error("Login Failed:", err.response?.data || err.message);
    } finally {
        server.kill();
        process.exit(0);
    }
}

testLogin();
