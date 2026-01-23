const chokidar = require('chokidar');
const { exec } = require('child_process');
const path = require('path');

console.log('🚀 MoneyTracker V1 - Auto Push Script Started');
console.log('📂 Watching for changes in .gs files...\n');

// تتبع الملفات
const watcher = chokidar.watch('*.gs', {
  ignored: /(^|[\/\\])\../, // تجاهل الملفات المخفية
  persistent: true,
  ignoreInitial: true
});

let pushTimeout;
let changedFiles = new Set();

function doPush() {
  const files = Array.from(changedFiles);
  changedFiles.clear();
  
  console.log(`\n⏳ Pushing ${files.length} file(s) to Google Apps Script...`);
  files.forEach(file => console.log(`   📄 ${file}`));
  
  exec('clasp push', (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Push failed: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`⚠️  Warning: ${stderr}`);
    }
    console.log(`✅ Push successful!\n${stdout}`);
    console.log('👂 Listening for more changes...\n');
  });
}

// عند تغيير ملف
watcher
  .on('add', filePath => {
    const fileName = path.basename(filePath);
    console.log(`➕ File added: ${fileName}`);
    changedFiles.add(fileName);
    
    clearTimeout(pushTimeout);
    pushTimeout = setTimeout(doPush, 2000); // انتظر ثانيتين قبل الرفع
  })
  .on('change', filePath => {
    const fileName = path.basename(filePath);
    console.log(`📝 File changed: ${fileName}`);
    changedFiles.add(fileName);
    
    clearTimeout(pushTimeout);
    pushTimeout = setTimeout(doPush, 2000);
  })
  .on('unlink', filePath => {
    const fileName = path.basename(filePath);
    console.log(`🗑️  File deleted: ${fileName}`);
    changedFiles.add(fileName);
    
    clearTimeout(pushTimeout);
    pushTimeout = setTimeout(doPush, 2000);
  })
  .on('error', error => console.error(`❌ Watcher error: ${error}`));

// معالجة الإيقاف النظيف
process.on('SIGINT', () => {
  console.log('\n\n👋 Stopping auto-push script...');
  watcher.close();
  process.exit(0);
});

console.log('✅ Auto-push is ready!');
console.log('💡 Edit any .gs file and it will be pushed automatically after 2 seconds');
console.log('🛑 Press Ctrl+C to stop\n');
