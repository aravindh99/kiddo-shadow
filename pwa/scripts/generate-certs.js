#!/usr/bin/env node

/**
 * HTTPS Certificate Generation Script for PWA Development
 * 
 * This script generates self-signed certificates for local HTTPS development.
 * HTTPS is required for PWA features like service workers and push notifications.
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const certsDir = join(projectRoot, 'certs');

function generateCertificates() {
  console.log('🔐 Generating HTTPS certificates for PWA development...');
  
  // Create certs directory if it doesn't exist
  if (!existsSync(certsDir)) {
    mkdirSync(certsDir, { recursive: true });
    console.log('📁 Created certs directory');
  }
  
  const keyPath = join(certsDir, 'localhost-key.pem');
  const certPath = join(certsDir, 'localhost.pem');
  
  // Check if certificates already exist
  if (existsSync(keyPath) && existsSync(certPath)) {
    console.log('✅ Certificates already exist');
    return;
  }
  
  try {
    // Check if mkcert is installed
    try {
      execSync('mkcert -version', { stdio: 'ignore' });
    } catch (error) {
      console.log('❌ mkcert is not installed. Please install it first:');
      console.log('');
      console.log('macOS: brew install mkcert');
      console.log('Windows: choco install mkcert');
      console.log('Linux: https://github.com/FiloSottile/mkcert#installation');
      console.log('');
      console.log('After installation, run: mkcert -install');
      console.log('Then run this script again.');
      process.exit(1);
    }
    
    // Generate certificates using mkcert
    console.log('🔑 Generating certificates with mkcert...');
    execSync(`mkcert -key-file "${keyPath}" -cert-file "${certPath}" localhost 127.0.0.1 ::1`, {
      cwd: certsDir,
      stdio: 'inherit'
    });
    
    console.log('✅ HTTPS certificates generated successfully!');
    console.log(`📄 Certificate: ${certPath}`);
    console.log(`🔑 Private key: ${keyPath}`);
    console.log('');
    console.log('🚀 You can now run the development server with HTTPS:');
    console.log('   npm run dev');
    
  } catch (error) {
    console.error('❌ Failed to generate certificates:', error.message);
    console.log('');
    console.log('🔧 Manual certificate generation:');
    console.log('If mkcert fails, you can generate certificates manually with OpenSSL:');
    console.log('');
    console.log('openssl req -x509 -newkey rsa:4096 -keyout localhost-key.pem -out localhost.pem -days 365 -nodes -subj "/CN=localhost"');
    console.log('');
    console.log('Note: Manual certificates will show security warnings in browsers.');
    process.exit(1);
  }
}

// Alternative OpenSSL certificate generation
function generateWithOpenSSL() {
  console.log('🔐 Generating certificates with OpenSSL...');
  
  try {
    const opensslCmd = `openssl req -x509 -newkey rsa:4096 -keyout "${join(certsDir, 'localhost-key.pem')}" -out "${join(certsDir, 'localhost.pem')}" -days 365 -nodes -subj "/CN=localhost"`;
    
    execSync(opensslCmd, {
      cwd: certsDir,
      stdio: 'inherit'
    });
    
    console.log('✅ OpenSSL certificates generated successfully!');
    console.log('⚠️  Note: These certificates will show security warnings in browsers.');
    console.log('   For better development experience, consider using mkcert.');
    
  } catch (error) {
    console.error('❌ Failed to generate certificates with OpenSSL:', error.message);
    console.log('');
    console.log('Please ensure OpenSSL is installed on your system.');
    process.exit(1);
  }
}

// Main execution
if (process.argv.includes('--openssl')) {
  generateWithOpenSSL();
} else {
  generateCertificates();
}