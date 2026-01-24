# ✅ MANUAL TESTING CHECKLIST
**System:** SJA Money Tracker v2.0  
**Testing Date:** January 22, 2026

---

## 🎯 HOW TO TEST

### Step 1: Open Apps Script Editor
1. Go to https://script.google.com
2. Open your "MoneyTracker" project
3. Click "Deploy" → "Test deployments"
4. Copy the Web App URL

### Step 2: Open System
1. Paste URL in browser
2. Should see modern SJA interface (NOT old Wafeer)
3. Should load without infinite "جاري التحميل..."

---

## 📋 TEST CHECKLIST

### ✅ INITIAL LOAD (Priority 1)
- [ ] Page loads within 5 seconds
- [ ] No errors in browser console (press F12)
- [ ] Logo says "SJA" not "Wafeer"
- [ ] Dashboard shows real numbers (not 0 0 0 0)
- [ ] Recent transactions appear
- [ ] No infinite loading spinner

### ✅ NAVIGATION TABS (Priority 1)
- [ ] Dashboard tab works
- [ ] Transactions tab works
- [ ] Budgets tab works
- [ ] Reports tab works (shows report buttons)
- [ ] Accounts tab works (shows accounts or "no accounts" message)
- [ ] Settings tab works

### ✅ DASHBOARD PAGE (Priority 1)
- [ ] Shows 4 KPI cards (Balance, Income, Expenses, Savings)
- [ ] "تحديث" button works
- [ ] "+ عملية جديدة" button opens modal
- [ ] Recent transactions list shows last 10 transactions
- [ ] Budget summary shows top 3 budgets

### ✅ ADD TRANSACTION (Priority 1)
Test the "+ عملية جديدة" button:
- [ ] Modal opens when clicked
- [ ] Can enter amount (e.g., 50)
- [ ] Can enter merchant name (e.g., Subway)
- [ ] Can select category dropdown
- [ ] Can toggle income/expense
- [ ] "إضافة" button works
- [ ] Success message appears: "✅ تمت إضافة العملية بنجاح"
- [ ] Page refreshes and shows new transaction
- [ ] New transaction appears in Sheet1 (check Google Sheets)

### ✅ TRANSACTIONS PAGE (Priority 2)
- [ ] Shows table with all transactions
- [ ] Has 5 columns: Date, Merchant, Category, Amount, Actions
- [ ] Each row shows transaction details correctly
- [ ] "تحديث القائمة" button refreshes data
- [ ] Edit button (✏️) shows alert (not implemented yet)
- [ ] Delete button (🗑️) asks for confirmation
- [ ] After confirming delete, transaction is removed
- [ ] Deleted transaction disappears from Sheet1

### ✅ BUDGETS PAGE (Priority 2)
- [ ] Shows all budget categories
- [ ] Each budget card shows:
  - Category name and icon
  - Spent amount / Total limit
  - Progress bar with color (green/yellow/red)
  - Remaining or exceeded amount
- [ ] Progress bar color changes based on usage:
  - Green: 0-79%
  - Yellow: 80-99%
  - Red: 100%+

### ✅ REPORTS PAGE (Priority 2)
- [ ] Shows 3 report buttons (Daily, Weekly, Monthly)
- [ ] Clicking "تقرير اليوم" loads today's data
- [ ] Clicking "تقرير الأسبوع" loads week data
- [ ] Clicking "تقرير الشهر" loads month data
- [ ] Report shows:
  - Income, Expenses, Savings, Transaction count
  - Category breakdown with bars
  - Correct calculations

### ✅ ACCOUNTS PAGE (Priority 2)
- [ ] If ENV.OWN_ACCOUNTS configured: shows account cards
- [ ] If not configured: shows "لا توجد حسابات" message
- [ ] Each account card shows:
  - Account number (last 4 digits)
  - Bank name
  - Account type
  - Balance (currently 0)

### ✅ SETTINGS PAGE (Priority 2)
- [ ] Name field loads from backend (should be "شافي المطيري" or saved value)
- [ ] Email field loads (if previously saved)
- [ ] Notifications toggle exists
- [ ] Can edit name
- [ ] Can edit email
- [ ] "💾 حفظ التغييرات" button works
- [ ] Success message: "✅ تم حفظ الإعدادات بنجاح"
- [ ] After refresh, settings are still saved

### ✅ ERROR HANDLING (Priority 3)
- [ ] If internet disconnects, shows error message
- [ ] If function fails, shows red error banner
- [ ] Loading spinner appears during operations
- [ ] Timeout protection works (operations don't hang forever)

---

## 🔧 BACKEND VERIFICATION

### Test in Apps Script Editor
Run these functions in Apps Script Editor to verify backend:

```javascript
// Test 1: Check Dashboard Data
function TEST_DASHBOARD() {
  var data = SOV1_UI_getDashboard_('OPEN');
  Logger.log(JSON.stringify(data));
  // Should return: {kpi: {incomeM, spendM, netM, totalRemain}, dup7d: [...]}
}

// Test 2: Check Latest Transactions
function TEST_TRANSACTIONS() {
  var txns = SOV1_UI_getLatest_('OPEN', 10);
  Logger.log(JSON.stringify(txns));
  // Should return array of transactions
}

// Test 3: Check Budgets
function TEST_BUDGETS() {
  var budgets = SOV1_UI_getBudgets_('OPEN');
  Logger.log(JSON.stringify(budgets));
  // Should return array of {category, limit, spent, remaining}
}

// Test 4: Check Settings
function TEST_SETTINGS() {
  var settings = SOV1_UI_getSettings_();
  Logger.log(JSON.stringify(settings));
  // Should return {name, email, notifications}
}

// Test 5: Check Report Data
function TEST_REPORT() {
  var report = SOV1_UI_getReportData_('OPEN', 'monthly');
  Logger.log(JSON.stringify(report));
  // Should return {income, expenses, savings, transactionCount, byCategory, chartData}
}

// Test 6: Check Accounts
function TEST_ACCOUNTS() {
  var accounts = SOV1_UI_getAccounts_();
  Logger.log(JSON.stringify(accounts));
  // Should return array of accounts or empty array
}

// Test 7: Add Transaction
function TEST_ADD_TRANSACTION() {
  var result = SOV1_UI_addManualTransaction_('أضف: 50 | Subway | طعام');
  Logger.log(JSON.stringify(result));
  // Should process and add to Sheet1
}

// Test 8: Save Settings
function TEST_SAVE_SETTINGS() {
  var result = SOV1_UI_saveSettings_({
    name: 'شافي المطيري',
    email: 'test@example.com',
    notifications: true
  });
  Logger.log(JSON.stringify(result));
  // Should save to Script Properties
}
```

### Run All Tests at Once
```javascript
function RUN_ALL_UI_TESTS() {
  Logger.log('=== TESTING DASHBOARD ===');
  TEST_DASHBOARD();
  
  Logger.log('=== TESTING TRANSACTIONS ===');
  TEST_TRANSACTIONS();
  
  Logger.log('=== TESTING BUDGETS ===');
  TEST_BUDGETS();
  
  Logger.log('=== TESTING SETTINGS ===');
  TEST_SETTINGS();
  
  Logger.log('=== TESTING REPORT ===');
  TEST_REPORT();
  
  Logger.log('=== TESTING ACCOUNTS ===');
  TEST_ACCOUNTS();
  
  Logger.log('✅ All backend tests complete. Check logs above.');
}
```

---

## 📊 EXPECTED RESULTS

### What Should Work Perfectly
✅ Page loads without errors  
✅ All 6 tabs are accessible  
✅ Dashboard shows real data from sheets  
✅ Add transaction button works  
✅ Settings save button works  
✅ Reports generate when period selected  
✅ Accounts load (if configured)  
✅ Delete transaction works  
✅ Budgets display correctly  

### What's Still Placeholder
⚠️ Edit transaction (shows alert, not implemented yet)  
⚠️ Add/Edit budgets (view-only currently)  
⚠️ Search/filter transactions  
⚠️ Export to CSV/Excel  
⚠️ Notification system  
⚠️ Multi-user support  

### What Requires Configuration
🔧 Accounts page needs ENV.OWN_ACCOUNTS in Config.js  
🔧 Telegram needs TELEGRAM_TOKEN and TELEGRAM_CHAT_ID  
🔧 AI needs GROQ_API_KEY or GEMINI_API_KEY  

---

## 🐛 COMMON ISSUES & FIXES

### Issue 1: "جاري التحميل..." Never Stops
**Fix:** Clear browser cache and reload

### Issue 2: "فشل تحميل الإحصائيات"
**Fix:** Check ENV.SHEET_ID is correct in Config.js

### Issue 3: Transactions Don't Appear
**Fix:** Check Sheet1 exists and has data in column H (amount)

### Issue 4: Budgets Empty
**Fix:** Check Budgets sheet exists with columns: Category, Limit, Spent

### Issue 5: Settings Don't Save
**Fix:** Check script permissions, may need to reauthorize

### Issue 6: Add Transaction Timeout
**Fix:** Check executeUniversalFlowV120 function exists in Flow.js

---

## ✅ PASS CRITERIA

System is considered **WORKING** if:
1. ✅ All 6 tabs load without errors
2. ✅ Dashboard shows real data (not all zeros)
3. ✅ Add transaction succeeds and appears in Sheet1
4. ✅ Settings save successfully
5. ✅ Reports generate data
6. ✅ No infinite loading spinners
7. ✅ No console errors (except warnings)

System is **FULLY FUNCTIONAL** if:
8. ✅ Budgets display correctly from Sheets
9. ✅ Accounts load (if ENV configured)
10. ✅ Delete transaction works
11. ✅ All buttons respond appropriately

---

## 📝 TEST RESULTS TEMPLATE

```
Date Tested: _______________
Tester: ___________________

Initial Load: ✅ / ❌
Navigation: ✅ / ❌
Dashboard: ✅ / ❌
Add Transaction: ✅ / ❌
Transactions Page: ✅ / ❌
Budgets Page: ✅ / ❌
Reports Page: ✅ / ❌
Accounts Page: ✅ / ❌
Settings Page: ✅ / ❌
Delete Transaction: ✅ / ❌

Issues Found:
1. _____________________
2. _____________________
3. _____________________

Overall Status: PASS / FAIL
Notes: ___________________
```

---

**Status:** System is now ready for comprehensive testing. All core features implemented.
