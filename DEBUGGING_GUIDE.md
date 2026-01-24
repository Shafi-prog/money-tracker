# 🔍 Debugging Guide - Money Tracker

## Critical Error: "All dashboard data received: null"

### Symptoms
- Homepage shows loading spinner forever
- Console shows: `All dashboard data received: null`
- Error: `Cannot read properties of null (reading 'dashboard')`

### Root Causes & Solutions

#### 1. **Apps Script Not Responding**
**Check:**
```javascript
// Open browser console (F12)
// Look for: "❌ خطأ: لا يمكن الاتصال بـ Google Apps Script"
```

**Fix:**
1. Verify web app URL is correct (should end with `/exec` not `/dev`)
2. Redeploy web app:
   ```bash
   npx clasp deploy --description "Fresh deployment"
   npx clasp deployments  # Get new URL
   ```
3. Make sure web app is set to "Anyone" access

---

#### 2. **Backend Authentication Failing**
**Check:**
```javascript
// In Apps Script Editor → Run SOV1_UI_getAllDashboardData
// If error "غير مصرح", authentication is failing
```

**Fix:**
1. Check `SOV1_UI_requireAuth_()` function in WebUI.js
2. Verify Config sheet has proper setup
3. Temporarily set `SOV1_UI_requireAuth_` to always return `true` for testing:
   ```javascript
   function SOV1_UI_requireAuth_(token) {
     return true; // TEMPORARY - for debugging
   }
   ```

---

#### 3. **Missing or Empty Google Sheets**
**Check:**
```javascript
// Open Google Sheets
// Verify these sheets exist:
// - Sheet1 (transactions)
// - Budgets
// - Config
// - Accounts
// - Ingress_Queue
```

**Fix:**
1. Run `DIAGNOSTIC_TEST.js` → `addSampleData()` to populate sheets
2. Or manually create sheets with proper structure:
   ```javascript
   // In Apps Script Editor, run:
   function createMissingSheets() {
     var ss = SpreadsheetApp.getActive();
     var requiredSheets = ['Sheet1', 'Budgets', 'Config', 'Accounts', 'Ingress_Queue'];
     
     requiredSheets.forEach(function(name) {
       if (!ss.getSheetByName(name)) {
         ss.insertSheet(name);
       }
     });
   }
   ```

---

#### 4. **SOV1_UI_getDashboard_() Throwing Error**
**Check:**
```javascript
// Apps Script Editor → Executions tab
// Look for errors in SOV1_UI_getDashboard_
// Common errors:
// - "Cannot read property 'getDataRange' of null"
// - "Sheet not found"
// - "Permission denied"
```

**Fix:**
1. Open WebUI.js, find `SOV1_UI_getDashboard_()` function
2. Add error handling around sheet operations:
   ```javascript
   function SOV1_UI_getDashboard_(token) {
     try {
       var s1 = _sheet('Sheet1');
       var sB = _sheet('Budgets');
       var sQ = _sheet('Ingress_Queue');
       
       // Check if sheets are actually valid
       if (!s1 || !sB || !sQ) {
         throw new Error('Required sheets not found');
       }
       
       // ... rest of function
     } catch (e) {
       Logger.log('Error in getDashboard: ' + e);
       return { kpi: { incomeM: 0, spendM: 0, netM: 0, totalRemain: 0 }, dup7d: [] };
     }
   }
   ```

---

#### 5. **CORS or Permissions Issue**
**Check:**
```javascript
// Browser console (F12)
// Look for:
// - "Access-Control-Allow-Origin" errors
// - "401 Unauthorized"
// - "403 Forbidden"
```

**Fix:**
1. Web app deployment settings:
   - Execute as: **Me** (your account)
   - Who has access: **Anyone**
2. Redeploy with new version:
   ```bash
   npx clasp deploy --description "Fix CORS"
   ```
3. If still failing, try opening web app in **incognito mode**

---

## Step-by-Step Debugging Process

### Step 1: Check Browser Console
```bash
1. Open web app in browser
2. Press F12 (Developer Tools)
3. Go to Console tab
4. Hard refresh: Ctrl+Shift+R
5. Look for error messages
```

**What to look for:**
- ✅ `🔷 SOV1_UI_getAllDashboardData called` - Backend is responding
- ✅ `✅ Authentication passed` - Auth working
- ✅ `📊 Getting dashboard data...` - Fetching data
- ❌ `All dashboard data received: null` - **PROBLEM HERE**

### Step 2: Check Apps Script Logs
```bash
1. Open Google Apps Script Editor
2. Click "Executions" (⏱️ icon on left)
3. Look for recent executions of SOV1_UI_getAllDashboardData
4. Click on execution to see detailed logs
```

**What to look for:**
- 🔷 Function started
- ✅ Each step completed (dashboard, transactions, budgets, accounts)
- ❌ Error messages with stack traces

### Step 3: Test Backend Directly
```bash
1. Apps Script Editor
2. Select function: SOV1_UI_getAllDashboardData
3. Click "Run" (▶️ button)
4. Check "Execution log" at bottom
```

**Expected output:**
```
🔷 SOV1_UI_getAllDashboardData called
✅ Authentication passed
📊 Getting dashboard data...
✅ Dashboard: {"kpi":{"incomeM":0,"spendM":0...
📝 Getting transactions...
✅ Transactions: 0
💰 Getting budgets...
✅ Budgets: 0
🏦 Getting accounts...
✅ Accounts: 0
✅ Returning result: {"success":true,"dashboard":{...
```

### Step 4: Test Diagnostic Function
```bash
1. Apps Script Editor
2. Open DIAGNOSTIC_TEST.js file
3. Select function: testDashboardData
4. Click "Run"
5. Check "Execution log"
```

**Expected output:**
```json
{
  "sheetsExist": {
    "Sheet1": true,
    "Budgets": true,
    "Config": true,
    "Classifier_Map": true
  },
  "rowCounts": {
    "Sheet1": 1,
    "Budgets": 1,
    "Config": 2
  },
  "apiTests": {
    "getLatest": { "success": true, "count": 0 },
    "getBudgets": { "success": true, "count": 0 },
    "getSettings": { "success": true, "data": {...} }
  }
}
```

### Step 5: Add Sample Data
If sheets are empty, populate with test data:

```bash
1. Apps Script Editor
2. Open DIAGNOSTIC_TEST.js
3. Select function: addSampleData
4. Click "Run"
5. Refresh web app
```

---

## Quick Fixes Checklist

- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Check browser console for errors
- [ ] Verify web app URL (should end with `/exec`)
- [ ] Check Apps Script Executions tab for errors
- [ ] Run `testDashboardData()` in Apps Script Editor
- [ ] Run `addSampleData()` if sheets are empty
- [ ] Verify all required sheets exist
- [ ] Check web app deployment settings (Anyone access)
- [ ] Test in incognito mode
- [ ] Redeploy web app with new version

---

## Common Error Messages & Fixes

### Error: "Cannot read properties of null (reading 'dashboard')"
**Cause:** Backend returning `null` instead of data object  
**Fix:** Check Apps Script logs, verify sheets exist, run diagnostic test

### Error: "انتهت مهلة التحميل (30 ثانية)"
**Cause:** Backend taking too long or not responding  
**Fix:** Check Apps Script quotas, verify no infinite loops, check sheet sizes

### Error: "غير مصرح - Authentication failed"
**Cause:** Authentication check failing  
**Fix:** Verify Config sheet setup, check `SOV1_UI_requireAuth_()` function

### Warning: "Unrecognized feature: 'ambient-light-sensor'"
**Cause:** Google Apps Script iframe permissions  
**Fix:** Safe to ignore - not breaking functionality

### Warning: "Alpine Warning: x-collapse plugin missing"
**Cause:** Using x-collapse without plugin (FIXED in Round 4)  
**Fix:** Already fixed - changed to x-transition

---

## When All Else Fails

### Nuclear Option: Full Reset
```bash
1. Apps Script Editor
2. Run: RESET_DATA.js → resetAllData()
3. Run: DIAGNOSTIC_TEST.js → addSampleData()
4. Redeploy:
   npx clasp push --force
   npx clasp deploy --description "Fresh start"
5. Hard refresh browser
```

### Contact Support
If issue persists, provide:
1. Screenshot of browser console (F12)
2. Screenshot of Apps Script Executions tab
3. Output of `testDashboardData()` function
4. Web app URL (without sensitive info)
5. Description of when error started

---

## Monitoring & Prevention

### Enable Detailed Logging
Already enabled in Round 4 - check console for:
- 🔷 Blue dots: Function starts
- ✅ Green checkmarks: Successful operations
- ⚠️ Yellow warnings: Non-critical issues
- ❌ Red X: Critical errors

### Regular Health Checks
Run weekly:
```javascript
// Apps Script Editor
function weeklyHealthCheck() {
  var result = testDashboardData();
  Logger.log('Health Check: ' + JSON.stringify(result));
  
  // Check for issues
  if (!result.sheetsExist.Sheet1) {
    Logger.log('⚠️ WARNING: Sheet1 missing!');
  }
  
  // Send Telegram notification if critical
}
```

### Set Up Alerts
Create trigger for daily check:
```javascript
function dailyHealthCheck() {
  try {
    var result = SOV1_UI_getAllDashboardData('OPEN');
    if (!result || result.success === false) {
      // Send Telegram alert
      sendTelegram_('⚠️ Dashboard API failing!');
    }
  } catch (e) {
    sendTelegram_('❌ Critical error: ' + e.message);
  }
}
```

---

**Last Updated:** January 24, 2026  
**Version:** Round 4 (Enhanced Error Handling)  
**Status:** Production Ready with Comprehensive Debugging
