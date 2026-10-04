const { execSync } = require('child_process');
const path = require('path');
const { getSystemPorts } = require('./envHelper');

const rootDir = path.resolve(__dirname, '..');
const { backendPort, orderPort, adminPort } = getSystemPorts(rootDir);
const ports = [backendPort, orderPort, adminPort];

console.log('=========================================================================');
console.log('            DANG DUNG CAC DICH VU THEO CONG TRONG .ENV                   ');
console.log('=========================================================================');
console.log(`Cac cong can giai phong: ${ports.join(', ')}`);

const isWin = process.platform === 'win32';

ports.forEach((port) => {
  try {
    if (isWin) {
      const output = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
      const lines = output.trim().split('\n');
      const pids = new Set();
      lines.forEach((line) => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid)) pids.add(pid);
      });

      pids.forEach((pid) => {
        console.log(`[INFO] Giai phong cong ${port} (PID: ${pid})...`);
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        } catch {}
      });
    } else {
      execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' });
      console.log(`[INFO] Da tat tien trinh tren cong ${port}.`);
    }
  } catch (err) {

  }
});

console.log('=========================================================================');
console.log(' [OK] Da giai phong thanh cong tat ca cac cong!');
console.log('=========================================================================');
