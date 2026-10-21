/**
 * STORIUM Pakistan — Automated Git Deployment Script
 * Compiles the production bundle and pushes the production-ready build to the `deploy` branch.
 *
 * This allows Hostinger's Git integration to pull pre-compiled HTML/JS/CSS/PHP
 * without needing Node.js or a build step on Hostinger shared hosting.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

function run(command, cwd = rootDir) {
  console.log(`\n> ${command}`);
  return execSync(command, { cwd, stdio: 'inherit' });
}

async function main() {
  console.log('=== Step 1: Compiling production bundle with Vite ===');
  run('npm run build');

  console.log('\n=== Step 2: Ensuring all API config files are in dist/api ===');
  const publicApiDir = path.join(rootDir, 'public', 'api');
  const distApiDir = path.join(distDir, 'api');
  if (!fs.existsSync(distApiDir)) {
    fs.mkdirSync(distApiDir, { recursive: true });
  }

  // Copy all PHP files from public/api to dist/api (including config files)
  const apiFiles = fs.readdirSync(publicApiDir);
  for (const file of apiFiles) {
    if (file.endsWith('.php') || file.endsWith('.json')) {
      const src = path.join(publicApiDir, file);
      const dest = path.join(distApiDir, file);
      fs.copyFileSync(src, dest);
    }
  }

  // Ensure .htaccess is in dist
  const htaccessSrc = path.join(rootDir, 'public', '.htaccess');
  const htaccessDest = path.join(distDir, '.htaccess');
  if (fs.existsSync(htaccessSrc)) {
    fs.copyFileSync(htaccessSrc, htaccessDest);
  }

  console.log('\n=== Step 3: Preparing deploy branch commit ===');
  // Initialize a temporary git repository inside dist/
  const tempGitDir = path.join(distDir, '.git');
  if (fs.existsSync(tempGitDir)) {
    fs.rmSync(tempGitDir, { recursive: true, force: true });
  }

  run('git init', distDir);
  run('git config user.name "STORIUM Automated Deployer"', distDir);
  run('git config user.email "deploy@storium.online"', distDir);
  run('git checkout -b deploy', distDir);
  run('git add -A', distDir);

  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  run(`git commit -m "Production release: ${timestamp}"`, distDir);

  console.log('\n=== Step 4: Pushing to GitHub origin/deploy branch ===');
  const remoteUrl = execSync('git config --get remote.origin.url', { cwd: rootDir }).toString().trim();
  run(`git remote add origin ${remoteUrl}`, distDir);
  run('git push -f origin deploy', distDir);

  // Clean up the temporary git folder inside dist
  if (fs.existsSync(tempGitDir)) {
    fs.rmSync(tempGitDir, { recursive: true, force: true });
  }

  console.log('\n======================================================');
  console.log('✅ SUCCESS! Production build pushed to GitHub branch: deploy');
  console.log('======================================================');
  console.log('In Hostinger hPanel > Git:');
  console.log('1. Set Branch to: deploy');
  console.log('2. Click Deploy (or Auto-Deploy)');
  console.log('Hostinger will now pull the ready-to-run compiled website!');
}

main().catch((err) => {
  console.error('\n❌ Deployment failed:', err.message);
  process.exit(1);
});
