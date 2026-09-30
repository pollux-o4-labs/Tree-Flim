import { execFileSync } from 'node:child_process';

// Scan the committed export, never print credentials or file contents.
const prefix = (process.argv[2] ?? '').replace(/\/$/, '');
const paths = execFileSync('git', ['ls-tree', '-r', '--name-only', 'HEAD', ...(prefix ? [prefix] : [])], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const violations = [];
for (const path of paths) {
  const relative = prefix ? path.slice(prefix.length + 1) : path;
  if (/^(server|firebase)(\/|$)/.test(relative) || /(^|\/)\.env(?:\..+)?$/.test(relative) && !relative.endsWith('.env.example') || /(^|\/)(?:service[-_]?account[^/]*|credentials)\.(?:json|pem|key)$/i.test(relative)) {
    violations.push(`${relative}: private/server file`); continue;
  }
  if (relative === 'scripts/check-public-boundary.mjs') continue;
  if (!/\.(?:[cm]?[jt]sx?|json|ya?ml|env|example|sh)$/.test(relative)) continue;
  const content = execFileSync('git', ['show', `HEAD:${path}`], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----|["']private_key["']\s*:|VITE_ADMIN_PASSWORD|firebase-admin/.test(content)) violations.push(`${relative}: secret or privileged browser dependency`);
}
if (violations.length) { console.error(violations.join('\n')); process.exit(1); }
console.log('PASS public frontend boundary');
