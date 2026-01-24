# PowerShell Script to Test Google Apps Script Functions
# Usage: .\test-gas-api.ps1 -FunctionName "testDashboardAPI"

param(
    [Parameter(Mandatory=$false)]
    [string]$FunctionName = "testDashboardAPI",
    
    [Parameter(Mandatory=$false)]
    [string[]]$Params = @()
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Google Apps Script Function Tester" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Build the clasp run command
$claspCmd = "clasp run-function '$FunctionName'"

if ($Params.Count -gt 0) {
    $paramsJson = ($Params | ConvertTo-Json -Compress)
    $claspCmd += " --params '$paramsJson'"
}

Write-Host "Running function: $FunctionName" -ForegroundColor Yellow
Write-Host "Command: $claspCmd" -ForegroundColor Gray
Write-Host ""

# Execute the command
try {
    $output = Invoke-Expression $claspCmd 2>&1
    
    Write-Host "=== EXECUTION RESULT ===" -ForegroundColor Green
    Write-Host $output
    Write-Host ""
    
    # Check for common error patterns
    if ($output -match "Error") {
        Write-Host "⚠️  Errors detected in execution" -ForegroundColor Red
    } elseif ($output -match "✅|SUCCESS|passed") {
        Write-Host "✅ Function executed successfully!" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Failed to execute function" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
