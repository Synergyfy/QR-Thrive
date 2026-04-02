const geoip = require('geoip-lite');

const ips = [
  '8.8.8.8', // Google DNS (USA)
  '1.1.1.1', // Cloudflare DNS (Australia)
  '203.0.113.195', // TEST-NET-3
  '2001:4860:4860::8888', // Google DNS IPv6
  '127.0.0.1', // Localhost
  '::1', // Localhost IPv6
  '203.0.113.195, 70.41.3.18', // Multiple IPs in X-Forwarded-For
];

ips.forEach(ip => {
  const geo = geoip.lookup(ip);
  console.log(`IP: ${ip}`);
  console.log(`Geo: ${JSON.stringify(geo, null, 2)}`);
  console.log('---');
});
