/**
 * Vendor SaaS Licensing Engine - Express Server Runner
 */

const http = require("http");
const app = require("./app");

const PORT = process.env.EXPRESS_PORT || process.env.PORT || 5000;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log("==========================================================");
  console.log(`🚀 Vendor Express Server running on http://localhost:${PORT}`);
  console.log(`🔒 CORS Origins Allowed: http://localhost:5173, http://localhost:3000`);
  console.log(`📦 express.json() parser enabled for Heartbeat Payloads`);
  console.log("==========================================================");
});

module.exports = server;
