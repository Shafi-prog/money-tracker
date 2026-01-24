# PowerShell Script to Test Web App Data Loading
# Usage: .\test-webapp-data.ps1

param(
    [Parameter(Mandatory=$false)]
    [string]$WebAppUrl = "https://script.google.com/macros/s/AKfycbzV1iy2z15qQyUVGbuNI3ZiGay9COHqCe4tQprOwKr1a5NtOQUtKJIIR3cVOcJQYZG_/exec"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Web App Data Tester" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Testing URL: $WebAppUrl" -ForegroundColor Yellow
Write-Host ""

try {
    # Make HTTP request
    Write-Host "Making HTTP request..." -ForegroundColor Gray
    $response = Invoke-WebRequest -Uri $WebAppUrl -UseBasicParsing -TimeoutSec 30
    
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor $(if ($response.StatusCode -eq 200) { "Green" } else { "Red" })
    Write-Host "Content Length: $($response.Content.Length) bytes" -ForegroundColor Gray
    Write-Host ""
    
    # Extract and check for debugLog
    if ($response.Content -match 'debugLog\s*:\s*\[(.*?)\]') {
        Write-Host "=== DEBUG LOG FOUND ===" -ForegroundColor Cyan
        $debugSection = $matches[1]
        
        # Extract each log line
        $logLines = [regex]::Matches($debugSection, '"([^"]+)"') | ForEach-Object { $_.Groups[1].Value }
        
        foreach ($line in $logLines) {
            if ($line -match "passed|SUCCESS|Function started") {
                Write-Host $line -ForegroundColor Green
            } elseif ($line -match "ERROR|failed") {
                Write-Host $line -ForegroundColor Red
            } else {
                Write-Host $line -ForegroundColor White
            }
        }
        Write-Host ""
    }
    
    # Check for null data
    if ($response.Content -match '"data"\s*:\s*null') {
        Write-Host "[ERROR] Dashboard data is NULL!" -ForegroundColor Red
        Write-Host ""
        
        # Try to extract error message
        if ($response.Content -match '"error"\s*:\s*"([^"]+)"') {
            Write-Host "Error message: $($matches[1])" -ForegroundColor Yellow
        }
        
        return $false
    } else {
        Write-Host "[SUCCESS] Dashboard data loaded!" -ForegroundColor Green
        Write-Host ""
        
        # Try to extract data counts
        if ($response.Content -match '"transactions"\s*:\s*\[') {
            $txnMatch = [regex]::Matches($response.Content, '"id"\s*:\s*"[^"]*"')
            Write-Host "Transactions found: $($txnMatch.Count)" -ForegroundColor Cyan
        }
        
        if ($response.Content -match '"budgets"\s*:\s*\[') {
            $budgetMatch = [regex]::Matches($response.Content, '"budget_id"\s*:\s*"[^"]*"')
            Write-Host "Budgets found: $($budgetMatch.Count)" -ForegroundColor Cyan
        }
        
        return $true
    }
    
} catch {
    Write-Host "[FAILED] Request Failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    return $false
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
