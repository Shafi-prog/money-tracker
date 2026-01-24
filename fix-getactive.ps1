# PowerShell Script to Replace SpreadsheetApp.getActive() with _ss()
# This fixes web app compatibility issues

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Fixing getActive() → _ss() for Web App" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$files = Get-ChildItem -Path . -Filter "*.js" -File | Where-Object { 
    $_.Name -notlike "test-*" -and 
    $_.Name -notlike "COMPLETE_*" -and
    $_.Name -notlike "MASTER_TEST*" 
}

$totalFixed = 0
$filesModified = @()

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Count occurrences
    $matches = [regex]::Matches($content, 'SpreadsheetApp\.getActive\(\)')
    
    if ($matches.Count -gt 0) {
        Write-Host "Processing: $($file.Name)" -ForegroundColor Yellow
        Write-Host "  Found $($matches.Count) occurrence(s)" -ForegroundColor Gray
        
        # Replace getActive() with _ss()
        $content = $content -replace 'SpreadsheetApp\.getActive\(\)', '_ss()'
        
        # Verify change was made
        if ($content -ne $originalContent) {
            # Backup original
            $backupPath = $file.FullName + ".bak"
            $originalContent | Out-File $backupPath -Encoding UTF8 -NoNewline
            
            # Save fixed file
            $content | Out-File $file.FullName -Encoding UTF8 -NoNewline
            
            Write-Host "  [OK] Fixed $($matches.Count) occurrence(s)" -ForegroundColor Green
            $totalFixed += $matches.Count
            $filesModified += $file.Name
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Files modified: $($filesModified.Count)" -ForegroundColor Green
Write-Host "  Total fixes: $totalFixed" -ForegroundColor Green
Write-Host "`nModified files:" -ForegroundColor Yellow
$filesModified | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "[NEXT STEP] Run: clasp push" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan
