# 🧪 Testing Guide - Complete System Test
**iPhone SMS → Google Apps Script → GROK AI → Telegram**

## 🚀 Quick Start

### Option 1: Automated Complete Test
```javascript
RUN_COMPLETE_SYSTEM_TEST()
```
This will:
- ✅ Reset and setup system
- ✅ Configure default categories
- ✅ Set initial balances
- ✅ Test GROK AI parsing
- ✅ Test Telegram integration
- ✅ Run 5 real transaction tests
- ✅ Verify account balances

### Option 2: Step-by-Step Testing
```javascript
// Step 1: Reset and prepare
STEP1_RESET_AND_SETUP()

// Step 2: Test GROK AI
STEP4_TEST_GROK_AI()

// Step 3: Test Telegram
STEP5_TEST_TELEGRAM()

// Step 4: Test full SMS flow
STEP2_TEST_SMS_TO_TELEGRAM()

// Step 5: Check balances
STEP3_VERIFY_BALANCES()
```

---

## 📋 Default Categories Setup

The system will create these reasonable categories:

| Category | Budget | Icon |
|----------|--------|------|
| مواد غذائية | 1500 SAR | 🛒 |
| مطاعم ومقاهي | 800 SAR | 🍽️ |
| مواصلات وبنزين | 600 SAR | 🚗 |
| فواتير ورسوم | 500 SAR | 📄 |
| تسوق وملابس | 700 SAR | 🛍️ |
| صحة وأدوية | 400 SAR | 💊 |
| ترفيه | 500 SAR | 🎮 |
| تعليم | 300 SAR | 📚 |
| حوالات واردة | 0 SAR | 💰 |
| حوالات صادرة | 0 SAR | 💸 |
| راتب | 0 SAR | 💵 |
| أخرى | 200 SAR | 📦 |

**Total Budget: 5,500 SAR/month**

---

## 💰 Initial Account Balances

| Account | Starting Balance |
|---------|-----------------|
| AlrajhiBank | 15,000 SAR |
| Tiqmo | 5,000 SAR |
| Alinma | 3,000 SAR |
| **Total** | **23,000 SAR** |

---

## 🧪 Test Scenarios

The automated test will run these 5 scenarios:

### Test 1: Grocery Purchase
```
SMS: عملية شراء بمبلغ SAR 125.50 لدى كارفور بطاقة **9767
Expected Result:
  ✓ Type: مشتريات
  ✓ Category: مواد غذائية
  ✓ Amount: 125.50 SAR
  ✓ Telegram notification sent
  ✓ Balance updated: AlrajhiBank -125.50
```

### Test 2: Restaurant
```
SMS: عملية شراء بمبلغ SAR 45.00 لدى البيك عبر Apple Pay
Expected Result:
  ✓ Type: مشتريات
  ✓ Category: مطاعم ومقاهي
  ✓ Amount: 45.00 SAR
```

### Test 3: Gas Station
```
SMS: عملية شراء بمبلغ SAR 200.00 لدى أرامكو محطة الوقود
Expected Result:
  ✓ Type: مشتريات
  ✓ Category: مواصلات وبنزين
  ✓ Amount: 200.00 SAR
```

### Test 4: Salary Deposit
```
SMS: تم إيداع مبلغ 10000.00 ريال في حسابك من الشركة راتب
Expected Result:
  ✓ Type: حوالة
  ✓ Category: راتب
  ✓ Amount: 10,000.00 SAR
  ✓ Balance updated: AlrajhiBank +10,000
```

### Test 5: Internal Transfer
```
SMS: حوالة داخلية صادر بمبلغ 1000.00 ريال من حساب 9767 إلى تقمو
Expected Result:
  ✓ Type: تحويل داخلي
  ✓ Two notifications (sender + receiver)
  ✓ AlrajhiBank: -1,000 SAR
  ✓ Tiqmo: +1,000 SAR
```

---

## 📱 What to Expect in Telegram

After running tests, you should receive:

1. **Test Message** (from STEP5):
   ```
   🧪 System Test Message
   ✅ Money Tracker is working!
   ```

2. **Transaction Notifications** (5 messages):
   - Each with transaction details
   - New account balance after each transaction

3. **Final Balances** (after Test 5):
   ```
   AlrajhiBank: 24,629.50 SAR
   Tiqmo: 6,000 SAR
   Alinma: 3,000 SAR
   Total: 33,629.50 SAR
   ```

---

## 🔍 Verification Checklist

After testing, verify:

- [ ] All 5 test transactions appear in Sheet1
- [ ] Account_Balances sheet shows updated balances
- [ ] Budgets sheet shows spending per category
- [ ] Telegram received all notifications
- [ ] `/balances` command works in Telegram
- [ ] GROK AI correctly parsed all SMS

---

## 🛠️ Manual Reset (if needed)

If you need to reset manually:

```javascript
// 1. Reset transaction data
RESET_ALL_TRANSACTION_DATA()  // Requires manual confirmation

// 2. Clear balances
setBalance_('AlrajhiBank', 0)
setBalance_('Tiqmo', 0)
setBalance_('Alinma', 0)

// 3. Clear cache
CacheService.getScriptCache().removeAll(['BUDGET_SNAP', 'SUM_today', 'SUM_week', 'SUM_month'])
```

---

## 📊 Expected Final State

After running `RUN_COMPLETE_SYSTEM_TEST()`:

### Sheet1 (Transactions)
- 5 new transactions
- UUID for each transaction
- Correct categories assigned

### Account_Balances
| Account | Balance |
|---------|---------|
| AlrajhiBank | 24,629.50 |
| Tiqmo | 6,000.00 |
| Alinma | 3,000.00 |

### Budgets
| Category | Spent |
|----------|-------|
| مواد غذائية | 125.50 |
| مطاعم ومقاهي | 45.00 |
| مواصلات وبنزين | 200.00 |
| راتب | -10,000.00 |

---

## 🔧 Troubleshooting

### GROK AI not working?
```javascript
// Check API key
Logger.log(ENV.GROK_API_KEY ? 'API Key exists' : 'API Key missing')

// Test directly
STEP4_TEST_GROK_AI()
```

### Telegram not working?
```javascript
// Check bot token
Logger.log(ENV.TELEGRAM_TOKEN ? 'Token exists' : 'Token missing')

// Check chat ID
Logger.log(ENV.CHAT_ID || ENV.CHANNEL_ID || 'No chat ID')

// Test directly
STEP5_TEST_TELEGRAM()
```

### Balances not updating?
```javascript
// Check function availability
Logger.log(typeof applyTxnToBalance_ === 'function' ? 'Balance function OK' : 'Missing')

// Check account key determination
var testData = { accNum: 'AlrajhiBank 9767', cardNum: '9767' }
Logger.log(determineAccountKey_(testData))
```

---

## 🎯 Next Steps

After successful testing:

1. **Deploy to production:**
   ```powershell
   .\deploy.ps1
   ```

2. **Setup iPhone SMS forwarding:**
   - Create Shortcut: SMS → HTTP Request
   - URL: Your GAS Web App URL
   - Method: POST
   - Body: JSON with SMS content

3. **Test with real SMS:**
   - Make a purchase with your card
   - Wait for bank SMS
   - SMS auto-forwards to GAS
   - Check Telegram for notification

4. **Monitor and adjust:**
   - Check categories are correctly assigned
   - Adjust budgets as needed
   - Add more merchant mappings in Classifier.js

---

**Ready to test? Run:** `RUN_COMPLETE_SYSTEM_TEST()`
