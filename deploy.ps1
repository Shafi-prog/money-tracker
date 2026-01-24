# Auto-deploy script that handles manifest prompts
# Usage: .\deploy.ps1

Write-Host "🚀 Deploying to Google Apps Script..." -ForegroundColor Cyan

# Pull first to sync manifest
Write-Host "📥 Syncing manifest from server..." -ForegroundColor Yellow
clasp pull --force | Out-Null

# Now push with auto-yes
Write-Host "📤 Pushing code to Apps Script..." -ForegroundColor Yellow
echo "y" | clasp push

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📱 To test:" -ForegroundColor Cyan
    Write-Host "   clasp open --webapp" -ForegroundColor White
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Run 'clasp push' manually to see detailed errors" -ForegroundColor Yellow
}
