#!/usr/bin/env node

/**
 * PRE-DEPLOYMENT TEST SCRIPT
 * Run this before "clasp push" to catch issues automatically
 * 
 * Usage:
 *   node scripts/test-before-deploy.js
 * 
 * Or add to package.json:
 *   "scripts": {
 *     "deploy": "node scripts/test-before-deploy.js && clasp push"
 *   }
 */

const { execSync } = require('child_process');

console.log('🤖 Running pre-deployment tests...\n');

try {
  // Run automated tests
  const result = execSync('clasp run AUTO_TEST_ALL_PAGES', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });

  console.log(result);

  // Check if tests passed
  if (result.includes('❌ Failed:') && !result.includes('❌ Failed: 0')) {
    console.error('\n⛔ DEPLOYMENT BLOCKED: Tests failed!');
    console.error('Fix the errors above before deploying.\n');
    process.exit(1);
  }

  console.log('\n✅ All tests passed! Proceeding with deployment...\n');
  
  // Deploy
  execSync('clasp push', { stdio: 'inherit' });
  
  console.log('\n🎉 Deployment successful!\n');

} catch (error) {
  console.error('\n❌ Error during testing or deployment:');
  console.error(error.message);
  process.exit(1);
}
