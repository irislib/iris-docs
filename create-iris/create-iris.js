#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import prompts from 'prompts';

import config from './config.json' assert { type: 'json' };

const cwd = process.cwd();

const defaultName = 'my-iris-app';

const excludedFiles = ['create-iris', 'node_modules', '.git', 'package-lock.json'];

const scriptDir = path.dirname(fileURLToPath(import.meta.url)); // Directory of the script

async function init() {
  try {
    const { packageName } = await prompts({
      type: 'text',
      name: 'packageName',
      message: 'Package name:',
      validate: (name) => isValidPackageName(name) || 'Invalid package name',
      initial: defaultName,
    });

    // Then, use the package name as the default for the target directory
    const { targetDir } = await prompts({
      type: 'text',
      name: 'targetDir',
      message: 'Target directory:',
      initial: packageName || 'default-directory-name',
      validate: (dir) => {
        if (dir === '') {
          return 'Directory is required';
        }
        const targetDir = path.resolve(cwd, dir);
        if (fs.existsSync(targetDir)) {
          return `Directory ${targetDir} already exists`;
        }
        return true;
      },
    });

    const root = path.join(cwd, targetDir);

    if (!fs.existsSync(root)) {
      fs.mkdirSync(root, { recursive: true });
    }

    console.log(`\nCreating project in ${root}...`);

    const templateDir = path.resolve(scriptDir, '..');
    copyDir(templateDir, root);

    // copy ./README.md to root
    const readmeSrc = path.join(scriptDir, 'README.md');
    const readmeDest = path.join(root, 'README.md');
    copy(readmeSrc, readmeDest);

    const pkgPath = path.join(root, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    pkg.name = packageName;
    pkg.private = true;
    pkg.version = '0.1.0';
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

    const configPath = path.join(root, 'src/config.json');
    config.appTitle = packageName;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

    console.log(`\nDone. Now run:\n`);
    console.log(`  cd ${path.relative(cwd, root)}`);
    console.log('  npm install');
    console.log('  npm run dev');
    console.log();
  } catch (cancelled) {
    console.log(cancelled.message);
    return;
  }
}

function isValidPackageName(name) {
  return /^(?:@[a-z\d\-_][a-z\d\-_]*\/)?[a-z\d\-_][a-z\d\-_.]*$/i.test(name);
}

function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of fs.readdirSync(srcDir)) {
    if (excludedFiles.includes(file)) {
      continue;
    }
    const srcFile = path.resolve(srcDir, file);
    const destFile = path.resolve(destDir, file);
    copy(srcFile, destFile);
  }
}

function copy(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    copyDir(src, dest);
  } else {
    fs.copyFileSync(src, dest);
  }
}

init().catch(console.error);
