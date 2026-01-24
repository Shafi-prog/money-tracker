# Run System Test Script
# Opens Google Apps Script editor so you can run the test

Write-Host "🚀 Opening Google Apps Script Editor..." -ForegroundColor Cyan
Write-Host ""

# Get script ID and open in browser
$scriptId = (Get-Content .clasp.json | ConvertFrom-Json).scriptId
$url = "https://script.google.com/home/projects/$scriptId/edit"

Write-Host "📂 Opening: " -NoNewline
Write-Host $url -ForegroundColor Yellow
Write-Host ""

Start-Process $url

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  📝 In the Apps Script Editor that just opened:            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "1️⃣  Find the file: " -NoNewline
Write-Host "FULL_SYSTEM_TEST_AND_SETUP.js" -ForegroundColor Yellow
Write-Host ""
Write-Host "2️⃣  Select function: " -NoNewline
Write-Host "RUN_COMPLETE_SYSTEM_TEST" -ForegroundColor Yellow
Write-Host ""
Write-Host "3️⃣  Click the " -NoNewline
Write-Host "▶ Run" -ForegroundColor Yellow -NoNewline
Write-Host " button"
Write-Host ""
Write-Host "4️⃣  Check the " -NoNewline
Write-Host "Execution log" -ForegroundColor Yellow -NoNewline
Write-Host " at the bottom"
Write-Host ""
Write-Host "5️⃣  Check your " -NoNewline
Write-Host "Telegram" -ForegroundColor Cyan -NoNewline
Write-Host " for notifications!" -NoNewline
Write-Host " 📱" -ForegroundColor Cyan
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "💡 Alternative - Run step by step:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   STEP1_RESET_AND_SETUP()       " -ForegroundColor White -NoNewline
Write-Host "  # Setup system" -ForegroundColor DarkGray
Write-Host "   STEP4_TEST_GROK_AI()          " -ForegroundColor White -NoNewline
Write-Host "  # Test AI parsing" -ForegroundColor DarkGray
Write-Host "   STEP5_TEST_TELEGRAM()         " -ForegroundColor White -NoNewline
Write-Host "  # Test Telegram" -ForegroundColor DarkGray
Write-Host "   STEP2_TEST_SMS_TO_TELEGRAM()  " -ForegroundColor White -NoNewline
Write-Host "  # Test full flow" -ForegroundColor DarkGray
Write-Host "   STEP3_VERIFY_BALANCES()       " -ForegroundColor White -NoNewline
Write-Host "  # Check balances" -ForegroundColor DarkGray
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "📊 Expected Time: " -NoNewline
Write-Host "~30-45 seconds" -ForegroundColor Yellow
Write-Host "📱 Expected Output: " -NoNewline
Write-Host "6 Telegram notifications" -ForegroundColor Cyan
Write-Host "💰 Final Balances: " -NoNewline
Write-Host "33,629.50 SAR total" -ForegroundColor Green
Write-Host ""
