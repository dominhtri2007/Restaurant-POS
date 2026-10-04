const path = require('path');
const concurrently = require('concurrently');
const { getSystemPorts } = require('./envHelper');

const rootDir = path.resolve(__dirname, '..');
const { backendPort, orderPort, adminPort, rootEnv } = getSystemPorts(rootDir);

const domainBackend = rootEnv.BACKEND_URL || `http://localhost:${backendPort}`;
const domainOrder = rootEnv.FRONTEND_URL || `http://localhost:${orderPort}`;
const domainAdmin = rootEnv.ADMIN_URL || `http://localhost:${adminPort}`;

console.log('=========================================================================');
console.log('   KHOI DONG HE THONG POS RESTAURANT (DYNAMIC PORTS & DOMAINS TU .ENV)  ');
console.log('=========================================================================');
console.log(` 1. Backend API:            Cong [${backendPort}]  ->  ${domainBackend}`);
console.log(` 2. Web Order Khach:        Cong [${orderPort}]  ->  ${domainOrder}`);
console.log(` 3. Web Admin POS:          Cong [${adminPort}]  ->  ${domainAdmin}`);
console.log('=========================================================================');
console.log(' * Cac cong duoc lay tu dong tu file .env, khong bi gan cung.');
console.log(' * Nhan to hop phim [Ctrl + C] de dung tat ca dich vu.');
console.log('=========================================================================\n');

const commands = [
  {
    command: 'node backend/src/server.js',
    name: 'BACKEND',
    prefixColor: 'blue',
    env: { ...process.env, PORT: String(backendPort) }
  },
  {
    command: `npx serve -s frontend/build -l ${orderPort} -n`,
    name: 'ORDER',
    prefixColor: 'green'
  },
  {
    command: `npx serve -s admin-frontend/build -l ${adminPort} -n`,
    name: 'ADMIN',
    prefixColor: 'magenta'
  }
];

const { result } = concurrently(commands, {
  killOthers: ['failure', 'success'],
  restartTries: 0
});

result.then(
  () => process.exit(0),
  () => process.exit(1)
);
