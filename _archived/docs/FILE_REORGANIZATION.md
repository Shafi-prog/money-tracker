# 📁 File Reorganization Plan

## Current State Analysis

### Root Directory (39 JS files → Reduce to ~25)

---

## 🗑️ FILES TO DELETE (6 files)

| File | Size | Reason |
|------|------|--------|
| `code.js` | 45 B | Empty placeholder, just a comment |
| `الرمز.js` | 2 B | Empty Arabic placeholder |
| `Utils.js` | 1.6 KB | **DUPLICATE** - functions exist in `Core_Utils.js` |

### Utils.js vs Core_Utils.js Comparison:
- `safeNotify()` → Exists in both (Core_Utils is better)
- `_parseIncoming_()` → Move to Core_Utils if needed
- `isDuplicateV120()` → Old version, already in DataIntegrity.js

---

## 📦 FILES TO MOVE TO `_tests/` (5 files)

| File | Size | New Location |
|------|------|--------------|
| `TEST_BALANCES.js` | 3.9 KB | `_tests/TEST_BALANCES.js` |
| `TEST_CATEGORIZATION.js` | 14.4 KB | `_tests/TEST_CATEGORIZATION.js` |
| `TEST_REAL_BANK_SMS.js` | 31.9 KB | `_tests/TEST_REAL_BANK_SMS.js` |
| `FULL_SYSTEM_TEST_AND_SETUP.js` | 14.6 KB | `_tests/FULL_SYSTEM_TEST_AND_SETUP.js` |
| `SHEET_STRUCTURE.js` | 16.7 KB | `_tests/SHEET_STRUCTURE.js` (cleanup utility) |

---

## 📚 MARKDOWN FILES - CONSOLIDATE (9 → 3)

### Keep:
| File | Purpose |
|------|---------|
| `README.md` | Main documentation |
| `اقرأني_أولاً.md` | Arabic getting started |
| `دليل_التطبيق.md` | Arabic app guide |

### Move to `_archived/docs/`:
| File | Reason |
|------|--------|
| `ACCOUNT_BALANCES_FEATURE.md` | Feature complete, archive |
| `FILE_STRUCTURE_CLEANUP.md` | Temporary planning doc |
| `FRONTEND_BACKEND_COMPLETE.md` | Feature complete, archive |
| `TESTING_GUIDE_COMPLETE.md` | Move to _tests |
| `UPDATE_JANUARY_24_2026.md` | Changelog, archive |
| `UPDATES_JAN_24_2026.md` | Duplicate, archive |

---

## 📂 RECOMMENDED FOLDER STRUCTURE

```
money-tracker/
├── 📄 Core System (Keep in root - for Google Apps Script)
│   ├── Config.js            # ENV, _sheet(), settings
│   ├── Core_Utils.js        # _prop_, jsonOut_, safeNotify
│   ├── Setup.js             # Initial setup
│   ├── Webhook.js           # doGet/doPost
│   ├── WebUI.js             # Web interface handlers
│   ├── Flow.js              # Main processing flow
│   └── Ingress.js           # SMS ingress processing
│
├── 📄 Feature Modules (Keep in root)
│   ├── Accounts.js          # Account CRUD
│   ├── Accounts_Management.js
│   ├── AI.js                # AI classification
│   ├── AI_AccountExtractor.js
│   ├── Balances.js          # Balance tracking
│   ├── BankSMS_Patterns.js  # Bank SMS patterns (NEW)
│   ├── Budget_Management.js
│   ├── Classifier.js        # Transaction categorization
│   ├── DataIntegrity.js     # Deduplication
│   ├── DataLinkage.js       # Fast API (NEW)
│   ├── Debt.js              # Debt tracking
│   ├── EnhancedParser.js    # SMS parsing
│   ├── Notification_System.js
│   ├── Queue.js             # Queue management
│   ├── Settings.js          # User settings
│   ├── Templates.js         # SMS templates
│   ├── Transaction_Management.js
│   └── Triggers.js          # Time triggers
│
├── 📄 Telegram (Keep in root)
│   ├── Telegram.js          # Main bot
│   ├── Telegram_Actions.js  # Bot actions
│   └── Telegram_Commands.js # Bot commands
│
├── 📄 Dashboard (Keep in root)
│   ├── AdvancedDashboard.js # Dashboard logic
│   └── ONBOARDING_WIZARD.js # Onboarding
│
├── 📄 Best Practices
│   └── BestPractices_Utils.js # Professional utilities
│
├── 🌐 HTML Pages (Keep in root)
│   ├── index.html           # Main dashboard
│   ├── Dashboard.html       # Alternative dashboard
│   ├── settings.html        # Settings page
│   ├── reports.html         # Reports
│   ├── details.html         # Transaction details
│   ├── features.html        # Features showcase
│   └── onboarding.html      # Onboarding wizard
│
├── 📋 Documentation
│   ├── README.md
│   ├── اقرأني_أولاً.md
│   └── دليل_التطبيق.md
│
├── 🧪 _tests/               # All test files
│   ├── TEST_BALANCES.js
│   ├── TEST_CATEGORIZATION.js
│   ├── TEST_REAL_BANK_SMS.js
│   ├── MASTER_TEST_SUITE.js
│   └── ... (other test files)
│
├── 📦 _archived/            # Old/unused files
│   ├── docs/                # Archived documentation
│   ├── backups/             # .bak files
│   └── scripts/             # Old scripts
│
└── ⚙️ Config Files
    ├── appsscript.json
    ├── .clasp.json
    ├── package.json
    └── jsconfig.json
```

---

## 🔄 MERGE RECOMMENDATIONS

### 1. Utils.js → Core_Utils.js
Move unique functions from Utils.js to Core_Utils.js:
- `_parseIncoming_()` - useful, keep
- Delete duplicate `safeNotify()` 

### 2. Consolidate Archived Test Files
Move from `_tests/` to `_archived/`:
- `DIAGNOSTIC_TEST.js.bak`
- `QUICK_DEBUG.js.bak`
- Files that are superseded by newer tests

---

## 📋 EXECUTION SCRIPT

```powershell
# Run this in PowerShell to reorganize

$root = "C:\Users\Shafi\Desktop\money-tracker"

# 1. Delete empty files
Remove-Item "$root\code.js" -Force
Remove-Item "$root\الرمز.js" -Force

# 2. Move test files to _tests
Move-Item "$root\TEST_BALANCES.js" "$root\_tests\" -Force
Move-Item "$root\TEST_CATEGORIZATION.js" "$root\_tests\" -Force  
Move-Item "$root\TEST_REAL_BANK_SMS.js" "$root\_tests\" -Force
Move-Item "$root\FULL_SYSTEM_TEST_AND_SETUP.js" "$root\_tests\" -Force
Move-Item "$root\SHEET_STRUCTURE.js" "$root\_tests\" -Force

# 3. Move old docs to archive
Move-Item "$root\ACCOUNT_BALANCES_FEATURE.md" "$root\_archived\docs\" -Force
Move-Item "$root\FILE_STRUCTURE_CLEANUP.md" "$root\_archived\docs\" -Force
Move-Item "$root\FRONTEND_BACKEND_COMPLETE.md" "$root\_archived\docs\" -Force
Move-Item "$root\UPDATE_JANUARY_24_2026.md" "$root\_archived\docs\" -Force
Move-Item "$root\UPDATES_JAN_24_2026.md" "$root\_archived\docs\" -Force
Move-Item "$root\TESTING_GUIDE_COMPLETE.md" "$root\_tests\" -Force

# 4. Merge Utils into Core_Utils (manual - see below)
# Then delete: Remove-Item "$root\Utils.js" -Force
```

---

## ⚠️ IMPORTANT NOTES

1. **Google Apps Script Limitation**: All `.js` files in root are deployed together. The `_archived` and `_tests` folders are excluded via `.claspignore`.

2. **Don't delete archived files**: They contain reference code and documentation history.

3. **After reorganization**: Update `.claspignore` if needed:
```
_archived/**
_tests/**
node_modules/**
*.md
*.txt
*.pdf
*.xlsx
```

---

## Summary

| Category | Before | After |
|----------|--------|-------|
| Root JS files | 39 | ~28 |
| Test files | 5 in root | 0 in root |
| Empty files | 2 | 0 |
| MD files | 9 | 3 |
| Archived | 53 | 60+ |

**Total reduction: ~14 files moved/deleted from root**
