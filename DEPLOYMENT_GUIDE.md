# 🚀 Deployment Guide - Money Tracker Web App

## ⚠️ Critical: Clasp 3.x Command Changes

### OLD Command (Broken ❌)
```bash
clasp deploy -i <deployment-id>
```

### NEW Command (Use This ✅)
```bash
clasp update-deployment <deployment-id>
```

**Why it changed**: Clasp 3.x renamed `deploy -i` to `update-deployment` for clarity.

---

## 📋 Current Deployment Info

- **Script ID**: `14j-0s---4TnGHNW5-UCF6CuLMTFJ1Zky2X-L34piH4fQqSgztj6--anU`
- **Sheet ID**: `1-_yM5c7bt2ALoSnpDfO1yBhqqof8tyAZv5JlsYxUZ0A`
- **Current Production URL**: https://script.google.com/macros/s/AKfycbz_eOUbsnRNfC66AP5ZeyFF4boH9sX9kWP7llo8rZQdr484sjzNuCM6WYL_aVzERnOa/exec
- **Deployment ID**: `AKfycbz_eOUbsnRNfC66AP5ZeyFF4boH9sX9kWP7llo8rZQdr484sjzNuCM6WYL_aVzERnOa`
- **Current Version**: @102

---

## 🔄 Standard Deployment Workflow

### 1. Check Current Deployments
```powershell
clasp list-deployments
```

### 2. Push Your Code Changes
```powershell
clasp push
```

### 3. Update Existing Deployment (Correct Method)
```powershell
clasp update-deployment AKfycbz_eOUbsnRNfC66AP5ZeyFF4boH9sX9kWP7llo8rZQdr484sjzNuCM6WYL_aVzERnOa
```

**OR** with version and description:
```powershell
clasp update-deployment AKfycbz_eOUbsnRNfC66AP5ZeyFF4boH9sX9kWP7llo8rZQdr484sjzNuCM6WYL_aVzERnOa -V 103 -d "Bug fixes"
```

### 4. Test the Deployment
```powershell
# Option A: Test via browser
start https://script.google.com/macros/s/AKfycbz_eOUbsnRNfC66AP5ZeyFF4boH9sX9kWP7llo8rZQdr484sjzNuCM6WYL_aVzERnOa/exec

# Option B: Test via PowerShell script
.\test-webapp-data.ps1

# Option C: Quick HTTP test
Invoke-WebRequest "https://script.google.com/macros/s/AKfycbz_eOUbsnRNfC66AP5ZeyFF4boH9sX9kWP7llo8rZQdr484sjzNuCM6WYL_aVzERnOa/exec" -UseBasicParsing
```

---

## 🧪 Testing Commands (PowerShell)

### Test Web App Data
```powershell
.\test-webapp-data.ps1
```
**Output**: Shows if data loads, transaction/budget counts, debug logs

### Test GAS Function Directly
```powershell
.\test-gas-api.ps1 -FunctionName "testDashboardAPI"
```
**Output**: Executes function in Apps Script and shows results

### Quick HTTP Test
```powershell
$resp = Invoke-WebRequest "https://script.google.com/macros/s/AKfycbz_eOUbsnRNfC66AP5ZeyFF4boH9sX9kWP7llo8rZQdr484sjzNuCM6WYL_aVzERnOa/exec" -UseBasicParsing
Write-Host "Status: $($resp.StatusCode)"
if ($resp.Content -match '"data":\s*null') { 
    Write-Host "[ERROR] Data is NULL" -ForegroundColor Red 
} else { 
    Write-Host "[SUCCESS] Data loaded!" -ForegroundColor Green 
}
```

---

## 📊 View Execution Logs

### Option 1: Browser
```powershell
start https://script.google.com/home/projects/14j-0s---4TnGHNW5-UCF6CuLMTFJ1Zky2X-L34piH4fQqSgztj6--anU/executions
```

### Option 2: Command Line (Advanced)
```powershell
# Requires setup - see https://github.com/google/clasp#advanced-commands
clasp tail-logs
clasp tail-logs --watch  # Live monitoring
clasp tail-logs --simplified  # Remove timestamps
```

---

## 🎯 Clasp 3.x Command Reference

| Old (2.x) | New (3.x) | Purpose |
|-----------|-----------|---------|
| `clasp open` | `clasp open-script` | Open script editor |
| `clasp open --web` | `clasp open-web-app` | Open deployed web app |
| `clasp logs --open` | `clasp open-logs` | Open execution logs |
| `clasp apis enable <api>` | `clasp enable-api <api>` | Enable Google API |
| **`clasp deploy -i <id>`** | **`clasp update-deployment <id>`** | **Update deployment** |

---

## ⚙️ Script Properties Configuration

The app requires `SHEET_ID` in Script Properties. This only needs to be done once:

```javascript
// Run this in Apps Script Editor (Tools > Script Editor):
function setupSpreadsheetID() {
  PropertiesService.getScriptProperties().setProperty(
    'SHEET_ID', 
    '1-_yM5c7bt2ALoSnpDfO1yBhqqof8tyAZv5JlsYxUZ0A'
  );
  Logger.log('✅ SHEET_ID configured');
}
```

To verify:
```javascript
function checkProperties() {
  var props = PropertiesService.getScriptProperties().getProperties();
  Logger.log(JSON.stringify(props, null, 2));
}
```

---

## 🔍 Troubleshooting

### "All dashboard data received: null"
**Cause**: SHEET_ID not configured in Script Properties  
**Fix**: Run `setupSpreadsheetID()` in Apps Script Editor

### "clasp deploy -i command failed"
**Cause**: Using deprecated 2.x command syntax  
**Fix**: Use `clasp update-deployment <id>` instead

### "Deployment URL changes after redeploy"
**Cause**: Creating new deployment instead of updating existing  
**Fix**: Always use `update-deployment` with existing deployment ID

### "Permission denied" errors
**Cause**: Manual browser deployment required for "Anyone" access  
**Solution**: 
1. Open Apps Script Editor: `clasp open-script`
2. Click "Deploy" > "Manage deployments"
3. Edit deployment > "Execute as: Me" + "Who has access: Anyone"
4. Save and copy new URL

---

## 📝 Version History

- **v102** (Current): SHEET_ID fix applied, data loading successfully
- **v101**: Incorrect deployment command caused issues
- **v100**: Enhanced error logging
- **v98-99**: Initial SHEET_ID configuration attempts

---

## 🔗 Quick Links

- **Apps Script Editor**: https://script.google.com/home/projects/14j-0s---4TnGHNW5-UCF6CuLMTFJ1Zky2X-L34piH4fQqSgztj6--anU/edit
- **Production Web App**: https://script.google.com/macros/s/AKfycbz_eOUbsnRNfC66AP5ZeyFF4boH9sX9kWP7llo8rZQdr484sjzNuCM6WYL_aVzERnOa/exec
- **Execution Logs**: https://script.google.com/home/projects/14j-0s---4TnGHNW5-UCF6CuLMTFJ1Zky2X-L34piH4fQqSgztj6--anU/executions
- **Spreadsheet**: https://docs.google.com/spreadsheets/d/1-_yM5c7bt2ALoSnpDfO1yBhqqof8tyAZv5JlsYxUZ0A/edit
- **Clasp 3.x Docs**: https://github.com/google/clasp

---

## ✅ Current Status

✅ Web app is **LIVE and WORKING**  
✅ Data loads successfully (verified via PowerShell test)  
✅ SHEET_ID configured in Script Properties  
✅ Deployment v102 active  
✅ Testing tools created (test-webapp-data.ps1, test-gas-api.ps1)

**Last Updated**: January 24, 2026, 4:25 AM  
**Last Test Result**: ✅ SUCCESS (124,647 bytes response, data loaded)
