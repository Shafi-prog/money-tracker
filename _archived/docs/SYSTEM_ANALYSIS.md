# 📊 MoneyTracker System Analysis & Multi-Tenant Setup Guide

## 🔗 System URLs

### 1. Web App Deployment URL
```
https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
https://script.google.com/macros/s/{DEPLOYMENT_ID}/dev
```

**URL Parameters Supported:**
- `?page=index` - Modern Wafeer UI (default)
- `?page=dashboard` - Legacy Dashboard  
- `?page=details` - Details page
- `?page=reports` - Reports page
- `?page=settings` - Settings page
- `?ui=classic` - Force classic UI
- `?mode=cli` - CLI/Debug mode

**CLI Commands:**
- `?mode=cli&cmd=DEBUG_SHEETS_INFO`
- `?mode=cli&cmd=DEBUG_TELEGRAM_STATUS`
- `?mode=cli&cmd=RUN_MASTER_TESTS`
- `?mode=cli&cmd=SETUP_TELEGRAM_WEBHOOK&url={WEBAPP_URL}`
- `?mode=cli&cmd=SETUP_QUEUE`

### 2. Script Editor URL
```
https://script.google.com/home/projects/{PROJECT_ID}
```

### 3. Telegram Webhook URL
```
https://api.telegram.org/bot{BOT_TOKEN}/setWebhook?url={WEBAPP_URL}&secret_token={TG_SECRET_TOKEN}
```

### 4. POST Endpoint for SMS/Data Ingress
```
POST {WEBAPP_URL}?secret={INGRESS_SECRET}
Content-Type: application/json

{
  "text": "SMS message here",
  "source": "web_dashboard|telegram|sms_forward"
}
```

---

## ✅ ZERO LocalStorage / Hardcoded Data Guarantee

### Confirmation: ✅ 100% Clean
**Search Results:**
- ❌ NO `localStorage` found
- ❌ NO `sessionStorage` found  
- ❌ NO hardcoded credentials in HTML/JS files

**All Configuration Stored In:**
1. **Google Script Properties** (PropertiesService)
   - TELEGRAM_BOT_TOKEN
   - TELEGRAM_CHAT_ID
   - GROQ_KEY / GEMINI_KEY
   - SHEET_ID
   - INGRESS_SECRET
   - TG_SECRET_TOKEN

2. **Google Sheets** (Data Storage)
   - Sheet1 (Main Transactions)
   - Budgets
   - Classifier_Map
   - Ingress_Queue
   - Dashboard
   - Debt

---

## 🔐 Authentication System

### Current Setup: OPEN ACCESS (No Login Required)

**Why No Login?**
- System uses `SOV1_UI_auth_('OPEN')` token
- Designed for personal/family use
- Authentication via:
  - Telegram Bot (chatId verification)
  - Google Sheets ownership
  - URL obscurity (deployment URL is secret)

**Optional Password Protection:**
```javascript
// Set in Script Properties:
UI_PASSWORD = "your_password_here"

// Users must provide password in UI to get token
```

---

## 👥 Multi-User / Multi-Tenant Setup Guide

### Current Limitation: Single User/Family
The system is designed for **ONE Google Sheet = ONE User/Family**

### 🚀 Solution: Multi-Tenant SaaS Model

#### Option 1: One Script, Multiple Sheets (Recommended)
```javascript
// Add to Config.js - Multi-tenant support
const TENANT_MAP = {
  '123456789': { // Telegram Chat ID
    sheetId: 'SHEET_ID_FOR_USER_1',
    name: 'User 1',
    telegramToken: 'BOT_TOKEN_1'
  },
  '987654321': {
    sheetId: 'SHEET_ID_FOR_USER_2',
    name: 'User 2',
    telegramToken: 'BOT_TOKEN_1' // Same bot, different sheet
  }
};

function getTenantConfig_(chatId) {
  return TENANT_MAP[String(chatId)] || null;
}
```

**Implementation Steps:**
1. Create template Google Sheet
2. For each new customer:
   - Copy template sheet
   - Record their Telegram chatId
   - Add to TENANT_MAP
3. Modify `_sheet()` function to route by chatId
4. One webhook URL handles all users

#### Option 2: Separate Deployment Per Customer
```
Customer 1: Own Google Apps Script + Own Sheet
Customer 2: Own Google Apps Script + Own Sheet
```

**Pros:**
- Complete isolation
- Customers own their data
- Easy to sell/transfer

**Cons:**
- Harder to maintain updates
- Must deploy separately for each

---

## 📱 Telegram Multi-Bot Setup

### Scenario 1: Customer Has Existing Bot
```javascript
// Customer provides:
1. Their Bot Token
2. Their Chat ID

// Add to Script Properties:
PropertiesService.getScriptProperties().setProperties({
  'TELEGRAM_BOT_TOKEN': 'customer_bot_token',
  'TELEGRAM_CHAT_ID': 'customer_chat_id'
});

// Set webhook:
?mode=cli&cmd=SETUP_TELEGRAM_WEBHOOK&url={WEBAPP_URL}
```

### Scenario 2: Multiple Groups (Family + Business)
```javascript
// Multi-Chat Support
const CHAT_CONFIGS = {
  'FAMILY_CHAT_ID': {
    sheetId: 'FAMILY_SHEET_ID',
    categories: ['طعام', 'ترفيه', 'فواتير']
  },
  'BUSINESS_CHAT_ID': {
    sheetId: 'BUSINESS_SHEET_ID',
    categories: ['مشتريات', 'رواتب', 'مصاريف']
  }
};
```

---

## 🤖 AI Classification Issues & Solutions

### Problem 1: Bank Account Detection Failure

**Root Cause:**
```javascript
// AI models don't receive bank context
// SMS: "خصم 500 من حساب 1234"
// AI receives: Just the text, no previous account history
```

**Solution: Pre-seed Bank Accounts**
```javascript
// Add to Config.js or Script Properties
OWN_ACCOUNTS = "1234,5678,9999" // Your account numbers

// Update AI.js to check against known accounts
function preParseFallback(text) {
  var ownAccounts = (ENV.OWN_ACCOUNTS || '').split(',');
  
  var accMatch = text.match(/حساب(?:\s*رقم)?\s*(\d{3,})/i);
  if (accMatch && ownAccounts.indexOf(accMatch[1]) >= 0) {
    // This is YOUR account
  }
  
  // Extract other account (merchant's account)
  var toAccMatch = text.match(/إلى\s*حساب\s*(\d{3,})/i);
  if (toAccMatch) {
    ai.merchantAccount = toAccMatch[1];
  }
}
```

**Update Classifier_Map Sheet:**
| Keyword | Category | Type | IsIncoming | AccNum | CardNum | Bank |
|---------|----------|------|------------|--------|---------|------|
| 1234 | مشتريات | خصم | false | 1234 | | الراجحي |
| 5678 | | | | 5678 | | الأهلي |

### Problem 2: SMS Origin (Bank Name) Detection

**Solution: Add Bank Keywords**
```javascript
// Add to Classifier.js
function detectBank_(text) {
  var t = text.toLowerCase();
  
  if (/alrajhi|الراجحي|رقم\s*1234/i.test(t)) return 'الراجحي';
  if (/alinma|الإنماء|رقم\s*5678/i.test(t)) return 'الإنماء';
  if (/alahli|الأهلي/i.test(t)) return 'الأهلي';
  if (/riyadbank|الرياض/i.test(t)) return 'الرياض';
  if (/bsf|البلاد/i.test(t)) return 'البلاد';
  if (/sab|ساب/i.test(t)) return 'ساب';
  if (/samba|سامبا/i.test(t)) return 'سامبا';
  
  return 'غير محدد';
}

// Add bank column to Sheet1
function enhanceParsing_(text, ai) {
  ai.bank = detectBank_(text);
  return ai;
}
```

### Problem 3: SMS Timestamp vs Processing Timestamp

**Current Issue:**
```javascript
// System uses: new Date() = Time SMS reached GAS
// Needed: Actual time FROM SMS content
```

**Solution: Extract Date from SMS**
```javascript
function parseSmsDate_(text) {
  var now = new Date();
  
  // Pattern 1: "بتاريخ 22/01/2026 الساعة 10:30"
  var m1 = text.match(/بتاريخ\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s*الساعة\s*(\d{1,2}):(\d{2})/i);
  if (m1) {
    return new Date(m1[3], m1[2] - 1, m1[1], m1[4], m1[5]);
  }
  
  // Pattern 2: "22 يناير 2026 10:30"
  var m2 = text.match(/(\d{1,2})\s+(يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر)\s+(\d{4})\s+(\d{1,2}):(\d{2})/i);
  if (m2) {
    var months = {يناير:0, فبراير:1, مارس:2, أبريل:3, مايو:4, يونيو:5, 
                  يوليو:6, أغسطس:7, سبتمبر:8, أكتوبر:9, نوفمبر:10, ديسمبر:11};
    return new Date(m2[3], months[m2[2]], m2[1], m2[4], m2[5]);
  }
  
  // Pattern 3: "22-Jan-2026 10:30 AM"
  var m3 = text.match(/(\d{1,2})-(\w{3})-(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (m3) {
    var monthMap = {Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, 
                    Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11};
    var hour = parseInt(m3[4]);
    if (m3[6] === 'PM' && hour < 12) hour += 12;
    if (m3[6] === 'AM' && hour === 12) hour = 0;
    return new Date(m3[3], monthMap[m3[2]], m3[1], hour, m3[5]);
  }
  
  // Pattern 4: Relative time "منذ 5 دقائق"
  var m4 = text.match(/منذ\s+(\d+)\s+(دقيقة|دقائق|ساعة|ساعات)/i);
  if (m4) {
    var offset = parseInt(m4[1]);
    if (m4[2].includes('ساعة')) offset *= 60;
    return new Date(now.getTime() - offset * 60 * 1000);
  }
  
  // Fallback: Use current time
  return now;
}

// Update Flow.js
function SOV1_parseSms_(text) {
  var ai = callAiHybridV120(text);
  ai = applyClassifierMap_(text, ai);
  
  // ✅ Extract date from SMS content
  ai.transactionDate = parseSmsDate_(text);
  
  return {
    parsed: ai,
    timestamp: ai.transactionDate || new Date()
  };
}
```

---

## 💰 How to Sell This System

### Pricing Models

#### Model 1: SaaS Subscription
```
Basic: $5/month - 100 transactions
Pro: $10/month - 500 transactions  
Business: $25/month - Unlimited + Multi-user
```

#### Model 2: One-Time Setup Fee
```
Setup: $50 - Deploy + Configure
Support: $10/month - Updates & Support
```

#### Model 3: White Label License
```
Agency License: $500 - Sell to unlimited clients
Include: Source code + Documentation + Support
```

### Target Markets
1. **Families** - Track household expenses together
2. **Small Businesses** - Expense tracking without accounting software
3. **Freelancers** - Invoice tracking + expense management
4. **Couples** - Joint finance management
5. **Roommates** - Shared expenses splitting

### Sales Package Includes:
- ✅ Google Apps Script deployment
- ✅ Telegram bot setup
- ✅ AI classification training
- ✅ Custom categories setup
- ✅ Mobile-friendly dashboard
- ✅ Monthly reports
- ✅ 30-day support

---

## 🔧 Enhanced AI Prompts for Better Recognition

### Updated Groq/Gemini Prompt
```javascript
function callAiHybridV120(text, knownAccounts) {
  var systemPrompt = `You are a Saudi banking SMS parser. Extract:
  
  IMPORTANT RULES:
  1. If account number matches [${knownAccounts}], it's the USER'S account
  2. Any OTHER account number is the MERCHANT'S account
  3. Extract date/time FROM the SMS text if present
  4. If "وارد|إيداع|استلام" = isIncoming:true
  5. If "خصم|شراء|صادر" = isIncoming:false
  6. Currency detection: ريال=SAR, دولار=USD, يورو=EUR
  
  SMS SENDER PATTERNS:
  - AlRajhi/الراجحي = bank:"الراجحي"
  - Alinma/الإنماء = bank:"الإنماء"  
  - AlAhli/الأهلي = bank:"الأهلي"
  
  Return ONLY JSON:
  {
    "merchant": "string",
    "amount": number,
    "currency": "SAR",
    "category": "string",
    "type": "string",
    "isIncoming": boolean,
    "userAccount": "string (your account)",
    "merchantAccount": "string (other account)",
    "bank": "string (sender bank)",
    "transactionDate": "ISO8601 if found in SMS, else null"
  }`;

  // Continue with API call...
}
```

---

## 📋 Setup Checklist for New Customer

### Step 1: Create Customer Instance
```javascript
// 1. Copy template sheet
var template = SpreadsheetApp.openById('TEMPLATE_SHEET_ID');
var newSheet = template.copy('Customer_' + customerName);
var newSheetId = newSheet.getId();

// 2. Set Script Properties
PropertiesService.getScriptProperties().setProperties({
  'SHEET_ID': newSheetId,
  'TELEGRAM_BOT_TOKEN': customerBotToken,
  'TELEGRAM_CHAT_ID': customerChatId,
  'GROQ_KEY': 'shared_groq_key',
  'OWN_ACCOUNTS': '1234,5678,9999', // Customer's account numbers
  'INGRESS_SECRET': Utilities.getUuid()
});

// 3. Run initial setup
initialsystem();

// 4. Set webhook
setWebhook_DIRECT_no302();

// 5. Seed classifier with customer's banks
seedCustomerBanks_(customerBankList);
```

### Step 2: Customer Onboarding
1. Share deployment URL
2. Add bot to customer's Telegram
3. Send /start command
4. Forward first SMS to bot
5. Verify transaction appears in sheet
6. Train classifier with corrections

---

## 🎯 Next Steps to Improve AI Accuracy

1. **Add Bank Account Registry**
   - Create OWN_ACCOUNTS config
   - Add bank detection logic
   - Update Classifier_Map with account numbers

2. **Implement SMS Date Extraction**
   - Add `parseSmsDate_()` function
   - Update Flow.js to use extracted dates
   - Handle timezone conversions

3. **Multi-Tenant Support**
   - Add TENANT_MAP in Config.js
   - Route by chatId
   - Isolate data per customer

4. **Enhanced Classifier Training**
   - Add feedback loop from UI
   - Let users correct AI predictions
   - Auto-update Classifier_Map

5. **Testing Suite**
   - Create test SMS messages
   - Validate 100% accuracy on known patterns
   - Add regression tests

---

## 📞 Support & Contact

For implementation assistance or custom development, contact:
- Email: shafi@example.com
- Telegram: @ShafiAlmutiry
- GitHub: [Your Repo URL]

---

**Last Updated:** January 22, 2026
**Version:** 2.0 (Unified Modern UI)
