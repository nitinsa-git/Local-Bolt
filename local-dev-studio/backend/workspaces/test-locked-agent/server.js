const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  const filePath = path.join(__dirname, 'index.html');
  fs.readFile(filePath, 'utf8', (err, html) => {
    if (err) {
      res.writeHead(500);
      res.end('Error loading index.html');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`[DevServer] Ready on http://0.0.0.0:${port}`);
});
