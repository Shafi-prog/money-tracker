# PowerShell Automation for Money Tracker Setup
# Run this after manual setup is complete

param(
    [switch]$TestSystem,
    [switch]$CheckStatus,
    [switch]$RunAllTests
)

$webAppUrl = "https://script.google.com/macros/s/AKfycbxLxyhp4sbOajYCTlaKvrVr1FQQ8N1msvdj1AZzBdFt2JFBS9dle9LOgJkiIbWO9Cdr/exec"

function Test-WebAppConnection {
    Write-Host "🔗 Testing Web App connection..." -ForegroundColor Cyan
    try {
        $response = Invoke-RestMethod -Uri "$webAppUrl?mode=test" -TimeoutSec 10
        Write-Host "✅ Web App is responding" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Web App connection failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Run-AutomatedChecklist {
    Write-Host "📋 Running automated checklist..." -ForegroundColor Cyan
    try {
        $response = Invoke-RestMethod -Uri "$webAppUrl?mode=cli&cmd=RUN_AUTOMATED_CHECKLIST" -TimeoutSec 30
        $result = $response.result | ConvertFrom-Json

        if ($result.success) {
            Write-Host "✅ Automated checklist passed!" -ForegroundColor Green
            $passed = ($result.results | Where-Object { $_.success }).Count
            $total = $result.results.Count
            Write-Host "   Results: $passed/$total tests passed" -ForegroundColor Green

            # Show failed tests
            $failed = $result.results | Where-Object { -not $_.success }
            if ($failed) {
                Write-Host "   Failed tests:" -ForegroundColor Yellow
                $failed | ForEach-Object {
                    Write-Host "   - $($_.name): $($_.message)" -ForegroundColor Yellow
                }
            }
        } else {
            Write-Host "❌ Automated checklist failed" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Checklist execution failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Show-SystemStatus {
    Write-Host "📊 System Status Check" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

    # Test connection
    $connected = Test-WebAppConnection
    if (-not $connected) { return }

    # Run checklist
    Run-AutomatedChecklist

    Write-Host ""
    Write-Host "📝 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Complete manual setup in Apps Script editor" -ForegroundColor White
    Write-Host "2. Configure Telegram bot token and chat ID" -ForegroundColor White
    Write-Host "3. Set up Groq API key for AI categorization" -ForegroundColor White
    Write-Host "4. Test with real SMS transactions" -ForegroundColor White
    Write-Host "5. Deploy web app for production use" -ForegroundColor White
}

# Main execution
Write-Host "🚀 Money Tracker Setup Automation" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta

if ($CheckStatus) {
    Show-SystemStatus
} elseif ($TestSystem) {
    Write-Host "🧪 Running system tests..." -ForegroundColor Cyan
    Test-WebAppConnection
    Run-AutomatedChecklist
} elseif ($RunAllTests) {
    Write-Host "🧪 Running all available tests..." -ForegroundColor Cyan
    Test-WebAppConnection
    Run-AutomatedChecklist
    # Could add more tests here
} else {
    Write-Host "💡 Usage:" -ForegroundColor Yellow
    Write-Host "   .\setup-automation.ps1 -CheckStatus    # Check current system status" -ForegroundColor White
    Write-Host "   .\setup-automation.ps1 -TestSystem     # Run basic system tests" -ForegroundColor White
    Write-Host "   .\setup-automation.ps1 -RunAllTests    # Run comprehensive tests" -ForegroundColor White
    Write-Host ""
    Show-SystemStatus
}

Write-Host ""
Write-Host "🎯 For manual setup instructions, see MANUAL_SETUP_GUIDE.md" -ForegroundColor Cyan