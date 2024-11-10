import express, { Request, Response } from 'express';

const app = express();
const PORT = 4000;
const PROTOCOL = process.env.PROTOCOL || 'HTTP'; // 'http' par défaut
const DOMAIN = process.env.DOMAIN || 'localhost'; // 'localhost' par défaut

const fs = require('fs');
const https = require('https');

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

if (PROTOCOL === 'HTTPS') {
  // Configuration du serveur HTTPS
  const sslOptions = {
    key: fs.readFileSync(`/etc/letsencrypt/live/${DOMAIN}/privkey.pem`, 'utf8'),
    cert: fs.readFileSync(`/etc/letsencrypt/live/${DOMAIN}/fullchain.pem`, 'utf8'),
  };

  // Créer un serveur HTTPS
  https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`🚀 Serveur HTTPS lancé sur https://${DOMAIN}:${PORT}`);
  });
} else {
  // Créer un serveur HTTP
  app.listen(PORT, () => {
    console.log(`🚀 Serveur HTTP lancé sur http://${DOMAIN}:${PORT}`);
  });
}