/**
 * Duo Sanctuary - Render Server Keep-Alive Daemon
 * 
 * Pings the production Render server every 10 minutes to prevent
 * the free-tier container from spinning down into sleep mode.
 */

const https = require('https');

const PING_URL = 'https://duo-16pf.onrender.com/login';
const INTERVAL_MS = 10 * 60 * 1000; // 10 minutes (Render sleeps after 15 mins)

function pingServer() {
  const time = new Date().toLocaleTimeString();
  
  const req = https.get(PING_URL, { timeout: 15000 }, (res) => {
    console.log(`[${time}] 🌸 Duo Keep-Alive Ping: HTTP ${res.statusCode} OK (Server is Awake)`);
    res.resume(); // Consume response data to free up memory
  });

  req.on('timeout', () => {
    console.warn(`[${time}] ⚠️ Duo Keep-Alive: Request timed out. Retrying on next tick...`);
    req.destroy();
  });

  req.on('error', (err) => {
    console.warn(`[${time}] ⚠️ Duo Keep-Alive error: ${err.message}`);
  });
}

console.log('---------------------------------------------------------');
console.log('🌸 Duo Sanctuary Keep-Alive Active');
console.log(`Target:   ${PING_URL}`);
console.log(`Interval: Every 10 minutes`);
console.log('---------------------------------------------------------');

// Immediate ping on launch
pingServer();

// Continuous interval
setInterval(pingServer, INTERVAL_MS);
