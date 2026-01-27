# Complete Setup Automation Script
# Run this after setting up API keys in Google Apps Script

param(
    [string]$WebAppUrl = "https://script.google.com/macros/s/AKfycbxLxyhp4sbOajYCTlaKvrVr1FQQ8N1msvdj1AZzBdFt2JFBS9dle9LOgJkiIbWO9Cdr/exec",
    [switch]$TestOnly,
    [switch]$FullSetup,
    [switch]$VerifyOnly
)

Write-Host "🚀 Money Tracker - Complete Setup Automation" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host ""

function Test-WebAppConnection {
    Write-Host "🔗 Testing Web App connection..." -ForegroundColor Cyan
    try {
        $response = Invoke-RestMethod -Uri "$WebAppUrl`?mode=test" -TimeoutSec 10 -ErrorAction Stop
        Write-Host "✅ Web App is responding" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Web App connection failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "💡 Make sure your Web App is deployed and the URL is correct" -ForegroundColor Yellow
        return $false
    }
}

function Run-CliCommand {
    param([string]$Command, [string]$Description)

    Write-Host "🔧 Running: $Description" -ForegroundColor Cyan
    try {
        $response = Invoke-RestMethod -Uri "$WebAppUrl`?mode=cli&cmd=$Command" -TimeoutSec 30 -ErrorAction Stop
        $result = $response.result

        if ($result -match "error" -or $result -match "not found") {
            Write-Host "❌ Failed: $result" -ForegroundColor Red
            return $false
        } else {
            Write-Host "✅ Success: $result" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "❌ Error executing $Command`: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Show-ManualInstructions {
    Write-Host "📋 MANUAL FUNCTIONS TO RUN IN APPS SCRIPT EDITOR:" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Since some functions aren't available via CLI, run these manually:" -ForegroundColor White
    Write-Host ""
    Write-Host "1. ENSURE_ALL_SHEETS()     → Setup.js" -ForegroundColor Green
    Write-Host "2. CLEAN_CATEGORIES_SHEET() → Setup.js" -ForegroundColor Green
    Write-Host "3. SETUP_BOT_COMMANDS()    → Setup.js" -ForegroundColor Green
    Write-Host "4. CLEAN_SYSTEM_SHEETS()   → Setup.js" -ForegroundColor Green
    Write-Host "5. RUN_MASTER_VERIFICATION() → SystemAudit.js" -ForegroundColor Green
    Write-Host "6. RUN_COMPLETE_SYSTEM_TEST() → FULL_SYSTEM_TEST_AND_SETUP.js" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 Apps Script Editor URL:" -ForegroundColor Cyan
    Write-Host "   https://script.google.com/home/projects/14j-0s---4TnGHNW5-UCF6CuLMTFJ1Zky2X-L34piH4fQqSgztj6--anU/edit" -ForegroundColor White
    Write-Host ""
    Write-Host "⚡ After running manual functions, use -VerifyOnly to check results" -ForegroundColor Magenta
}

# Main execution logic
if (-not (Test-WebAppConnection)) {
    Write-Host ""
    Write-Host "❌ Cannot proceed without working Web App connection" -ForegroundColor Red
    exit 1
}

Write-Host ""

if ($VerifyOnly) {
    Write-Host "🔍 VERIFICATION MODE" -ForegroundColor Blue
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue

    $successCount = 0
    $totalCount = 0

    # Test available CLI functions
    $tests = @(
        @{Cmd="RUN_AUTOMATED_CHECKLIST"; Desc="Automated system checklist"},
        @{Cmd="SETUP_QUEUE"; Desc="Queue system setup"}
    )

    foreach ($test in $tests) {
        $totalCount++
        if (Run-CliCommand -Command $test.Cmd -Description $test.Desc) {
            $successCount++
        }
        Start-Sleep -Seconds 1
    }

    Write-Host ""
    Write-Host "📊 Verification Results: $successCount/$totalCount tests passed" -ForegroundColor $(if ($successCount -eq $totalCount) { "Green" } else { "Yellow" })

    if ($successCount -eq $totalCount) {
        Write-Host "🎉 System is properly configured and working!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Some tests failed. Check manual setup instructions above." -ForegroundColor Yellow
    }

} elseif ($TestOnly) {
    Write-Host "🧪 TEST MODE - Running available CLI commands" -ForegroundColor Blue
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue

    Run-CliCommand -Command "RUN_AUTOMATED_CHECKLIST" -Description "System verification"
    Start-Sleep -Seconds 2
    Run-CliCommand -Command "SETUP_QUEUE" -Description "Queue system setup"

    Write-Host ""
    Show-ManualInstructions

} elseif ($FullSetup) {
    Write-Host "🚀 FULL SETUP MODE" -ForegroundColor Red
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red

    Write-Host "⚠️ Note: Full setup requires manual execution in Apps Script Editor" -ForegroundColor Yellow
    Write-Host "   CLI mode can only run a limited set of functions" -ForegroundColor Yellow
    Write-Host ""

    # Run what we can via CLI
    Run-CliCommand -Command "SETUP_QUEUE" -Description "Queue system setup"
    Start-Sleep -Seconds 2

    # Show manual instructions for the rest
    Show-ManualInstructions

} else {
    Write-Host "📖 USAGE:" -ForegroundColor Cyan
    Write-Host "   .\setup-automation.ps1 -TestOnly          # Test available functions" -ForegroundColor White
    Write-Host "   .\setup-automation.ps1 -VerifyOnly        # Verify system status" -ForegroundColor White
    Write-Host "   .\setup-automation.ps1 -FullSetup         # Show full setup instructions" -ForegroundColor White
    Write-Host "   .\setup-automation.ps1 -WebAppUrl 'URL'   # Use custom Web App URL" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 AFTER API SETUP:" -ForegroundColor Yellow
    Write-Host "   1. Set API keys in Apps Script → Project Settings → Script Properties" -ForegroundColor White
    Write-Host "   2. Run: .\setup-automation.ps1 -FullSetup" -ForegroundColor White
    Write-Host "   3. Execute manual functions in Apps Script Editor" -ForegroundColor White
    Write-Host "   4. Run: .\setup-automation.ps1 -VerifyOnly" -ForegroundColor White
}

Write-Host ""
Write-Host "💡 Need help? Check MANUAL_SETUP_GUIDE.md for detailed instructions" -ForegroundColor Gray