import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const migrations = [
  'migrations/0001_init.sql',
  'migrations/0002_interaction_events.sql',
];

const __dirname = dirname(fileURLToPath(import.meta.url));

const runMigration = (file) => {
  const result = spawnSync('psql', ['-f', resolve(__dirname, '..', file)], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    throw new Error(`Migration failed for ${file}`);
  }
};

for (const file of migrations) {
  runMigration(file);
}

console.log('Migrations completed successfully.');
