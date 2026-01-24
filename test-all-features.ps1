# PowerShell Script - Comprehensive Web App Test
# Tests all major functionality of the Money Tracker app

param(
    [Parameter(Mandatory=$false)]
    [string]$WebAppUrl = "https://script.google.com/macros/s/AKfycbzV1iy2z15qQyUVGbuNI3ZiGay9COHqCe4tQprOwKr1a5NtOQUtKJIIR3cVOcJQYZG_/exec"
)

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Money Tracker - Comprehensive Test Suite" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$testResults = @()
$passedTests = 0
$failedTests = 0

# Test 1: HTTP Response
Write-Host "[Test 1] HTTP Response Test" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $WebAppUrl -UseBasicParsing -TimeoutSec 30
    
    if ($response.StatusCode -eq 200) {
        Write-Host "  [PASS] Status Code: 200 OK" -ForegroundColor Green
        $passedTests++
        $testResults += @{Test="HTTP Response"; Result="PASS"; Details="200 OK"}
    } else {
        Write-Host "  [FAIL] Status Code: $($response.StatusCode)" -ForegroundColor Red
        $failedTests++
        $testResults += @{Test="HTTP Response"; Result="FAIL"; Details="Status $($response.StatusCode)"}
    }
    
    Write-Host "  Content Size: $($response.Content.Length) bytes" -ForegroundColor Gray
} catch {
    Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $failedTests++
    $testResults += @{Test="HTTP Response"; Result="FAIL"; Details=$_.Exception.Message}
}
Write-Host ""

# Test 2: JavaScript Data Presence
Write-Host "[Test 2] JavaScript Data Structure" -ForegroundColor Yellow
if ($response -and $response.Content) {
    if ($response.Content -match 'var dataFromServer') {
        Write-Host "  [PASS] dataFromServer variable found" -ForegroundColor Green
        $passedTests++
        $testResults += @{Test="JS Data Structure"; Result="PASS"; Details="Variable exists"}
        
        # Extract data section
        if ($response.Content -match 'var dataFromServer = \{([^}]+success[^}]+)\}') {
            $dataSection = $matches[0]
            
            # Check for null data
            if ($dataSection -match '"data":\s*null') {
                Write-Host "  [FAIL] data field is NULL" -ForegroundColor Red
                $failedTests++
                
                # Check for error message
                if ($dataSection -match '"error":"([^"]+)"') {
                    Write-Host "  Error: $($matches[1])" -ForegroundColor Yellow
                }
            } else {
                Write-Host "  [PASS] data field is populated" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "  [FAIL] dataFromServer variable not found" -ForegroundColor Red
        $failedTests++
        $testResults += @{Test="JS Data Structure"; Result="FAIL"; Details="Missing variable"}
    }
} else {
    Write-Host "  [SKIP] No response to check" -ForegroundColor Gray
}
Write-Host ""

# Test 3: Success Flag
Write-Host "[Test 3] Success Flag Check" -ForegroundColor Yellow
if ($response.Content -match '"success":\s*(true|false)') {
    $successValue = $matches[1]
    if ($successValue -eq "true") {
        Write-Host "  [PASS] success: true" -ForegroundColor Green
        $passedTests++
        $testResults += @{Test="Success Flag"; Result="PASS"; Details="success=true"}
    } else {
        Write-Host "  [FAIL] success: false" -ForegroundColor Red
        $failedTests++
        $testResults += @{Test="Success Flag"; Result="FAIL"; Details="success=false"}
    }
} else {
    Write-Host "  [WARN] success flag not found" -ForegroundColor Yellow
}
Write-Host ""

# Test 4: Transactions Array
Write-Host "[Test 4] Transactions Data" -ForegroundColor Yellow
if ($response.Content -match '"transactions":\s*\[') {
    # Count transaction objects
    $txnMatches = [regex]::Matches($response.Content, '"id"\s*:\s*"TX_[^"]*"')
    $txnCount = $txnMatches.Count
    
    Write-Host "  [PASS] Transactions array found" -ForegroundColor Green
    Write-Host "  Count: $txnCount transactions" -ForegroundColor Cyan
    $passedTests++
    $testResults += @{Test="Transactions"; Result="PASS"; Details="$txnCount items"}
} else {
    Write-Host "  [FAIL] Transactions array not found" -ForegroundColor Red
    $failedTests++
    $testResults += @{Test="Transactions"; Result="FAIL"; Details="Missing array"}
}
Write-Host ""

# Test 5: Budgets Array
Write-Host "[Test 5] Budgets Data" -ForegroundColor Yellow
if ($response.Content -match '"budgets":\s*\[') {
    # Count budget objects
    $budgetMatches = [regex]::Matches($response.Content, '"budget_id"\s*:\s*"[^"]*"')
    $budgetCount = $budgetMatches.Count
    
    Write-Host "  [PASS] Budgets array found" -ForegroundColor Green
    Write-Host "  Count: $budgetCount budgets" -ForegroundColor Cyan
    $passedTests++
    $testResults += @{Test="Budgets"; Result="PASS"; Details="$budgetCount items"}
} else {
    Write-Host "  [FAIL] Budgets array not found" -ForegroundColor Red
    $failedTests++
    $testResults += @{Test="Budgets"; Result="FAIL"; Details="Missing array"}
}
Write-Host ""

# Test 6: Dashboard KPI
Write-Host "[Test 6] Dashboard KPI Data" -ForegroundColor Yellow
if ($response.Content -match '"dashboard":\s*\{') {
    Write-Host "  [PASS] Dashboard object found" -ForegroundColor Green
    
    # Check for KPI fields
    if ($response.Content -match '"spendM":\s*([0-9.]+)') {
        $spendM = $matches[1]
        Write-Host "  Monthly Spend: $spendM SAR" -ForegroundColor Cyan
    }
    if ($response.Content -match '"incomeM":\s*([0-9.]+)') {
        $incomeM = $matches[1]
        Write-Host "  Monthly Income: $incomeM SAR" -ForegroundColor Cyan
    }
    
    $passedTests++
    $testResults += @{Test="Dashboard KPI"; Result="PASS"; Details="KPI data present"}
} else {
    Write-Host "  [FAIL] Dashboard object not found" -ForegroundColor Red
    $failedTests++
    $testResults += @{Test="Dashboard KPI"; Result="FAIL"; Details="Missing object"}
}
Write-Host ""

# Test 7: Debug Log
Write-Host "[Test 7] Debug Logging" -ForegroundColor Yellow
if ($response.Content -match '"debugLog":\s*\[') {
    Write-Host "  [PASS] Debug log found" -ForegroundColor Green
    
    # Extract debug messages
    if ($response.Content -match '"debugLog":\[(.*?)\]') {
        $debugSection = $matches[1]
        $debugLines = [regex]::Matches($debugSection, '"([^"]+)"') | ForEach-Object { $_.Groups[1].Value }
        
        Write-Host "  Debug messages:" -ForegroundColor Gray
        $debugLines | Select-Object -First 5 | ForEach-Object {
            if ($_ -match "passed|SUCCESS|Function started") {
                Write-Host "    $_" -ForegroundColor Green
            } elseif ($_ -match "ERROR|failed") {
                Write-Host "    $_" -ForegroundColor Red
            } else {
                Write-Host "    $_" -ForegroundColor White
            }
        }
        
        if ($debugLines.Count -gt 5) {
            Write-Host "    ... ($($debugLines.Count - 5) more lines)" -ForegroundColor Gray
        }
    }
    
    $passedTests++
    $testResults += @{Test="Debug Logging"; Result="PASS"; Details="$($debugLines.Count) log entries"}
} else {
    Write-Host "  [WARN] Debug log not found (optional)" -ForegroundColor Yellow
}
Write-Host ""

# Test 8: Accounts Array
Write-Host "[Test 8] Accounts Data" -ForegroundColor Yellow
if ($response.Content -match '"accounts":\s*\[') {
    $accountMatches = [regex]::Matches($response.Content, '"name"\s*:\s*"[^"]*",\s*"type"')
    $accountCount = $accountMatches.Count
    
    Write-Host "  [PASS] Accounts array found" -ForegroundColor Green
    Write-Host "  Count: $accountCount accounts" -ForegroundColor Cyan
    $passedTests++
    $testResults += @{Test="Accounts"; Result="PASS"; Details="$accountCount items"}
} else {
    Write-Host "  [FAIL] Accounts array not found" -ForegroundColor Red
    $failedTests++
    $testResults += @{Test="Accounts"; Result="FAIL"; Details="Missing array"}
}
Write-Host ""

# Summary
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Test Results Summary" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Total Tests:  $($passedTests + $failedTests)" -ForegroundColor White
Write-Host "  Passed:       $passedTests" -ForegroundColor Green
Write-Host "  Failed:       $failedTests" -ForegroundColor $(if ($failedTests -gt 0) { "Red" } else { "Gray" })
Write-Host ""

if ($failedTests -eq 0) {
    Write-Host "  STATUS: ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "  The web app is fully functional." -ForegroundColor Green
} else {
    Write-Host "  STATUS: SOME TESTS FAILED" -ForegroundColor Red
    Write-Host "  Please review failed tests above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Return exit code
if ($failedTests -eq 0) {
    exit 0
} else {
    exit 1
}
