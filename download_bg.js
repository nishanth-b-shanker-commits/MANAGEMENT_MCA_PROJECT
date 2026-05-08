const https = require('https');
const fs = require('fs');

const url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/New_Mangalore_Port_Trust.jpg/1200px-New_Mangalore_Port_Trust.jpg';
const dest = 'd:\\Download\\Port_Management_Website\\frontend\\public\\bg.jpg';

const file = fs.createWriteStream(dest);
https.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
}, (response) => {
  response.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Downloaded successfully');
  });
}).on('error', (err) => {
  fs.unlink(dest);
  console.error('Error downloading:', err.message);
});
