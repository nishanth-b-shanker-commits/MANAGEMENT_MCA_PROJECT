const { spawn } = require('child_process');

console.log("Starting Local Tunnel & Backend Server...");
console.log("Keep this window open. Your GitHub Pages website is now routing through your computer!");

// Start the backend server
const server = spawn('node', ['server.js'], { stdio: 'inherit', shell: true });

// Start localtunnel to expose the server to the internet
const lt = spawn('npx', ['localtunnel', '--port', '8000', '--subdomain', 'portsystemmca'], { stdio: 'inherit', shell: true });

server.on('close', () => lt.kill());
lt.on('close', () => server.kill());
