const fs = require('fs');
const path = require('path');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const result = {};
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eqIdx = line.indexOf('=');
      if (eqIdx > 0) {
        const key = line.slice(0, eqIdx).trim();
        let val = line.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        result[key] = val;
      }
    }
    return result;
  } catch (err) {
    console.warn(`[envHelper] Không thể đọc file: ${filePath}`, err.message);
    return {};
  }
}

function getSystemPorts(rootDir = path.resolve(__dirname, '..')) {
  const rootEnv = parseEnvFile(path.join(rootDir, '.env'));
  const backendEnv = parseEnvFile(path.join(rootDir, 'backend', '.env'));
  const frontendEnv = parseEnvFile(path.join(rootDir, 'frontend', '.env'));
  const adminEnv = parseEnvFile(path.join(rootDir, 'admin-frontend', '.env'));

  const backendPort = parseInt(
    process.env.BACKEND_PORT || process.env.PORT || rootEnv.BACKEND_PORT || rootEnv.PORT || backendEnv.PORT || '5000',
    10
  );

  const orderPort = parseInt(
    process.env.ORDER_PORT || rootEnv.ORDER_PORT || frontendEnv.PORT || '3000',
    10
  );

  const adminPort = parseInt(
    process.env.ADMIN_PORT || rootEnv.ADMIN_PORT || adminEnv.PORT || '3001',
    10
  );

  return {
    backendPort,
    orderPort,
    adminPort,
    rootEnv,
    backendEnv,
    frontendEnv,
    adminEnv
  };
}

module.exports = {
  parseEnvFile,
  getSystemPorts
};
