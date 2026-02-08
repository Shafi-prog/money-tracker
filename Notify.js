/**
 * NOTIFICATION_SYSTEM.js - Respect User Notification Preferences
 * 
 * CRITICAL: This file ensures notifications respect user settings
 * Before sending any notification, check if user has enabled them.
 * (Verified V4)
 */

/**
 * Check if Telegram notifications are enabled
 * @returns {boolean} true if Telegram notifications enabled
 */
function areTelegramNotificationsEnabled() {
  try {
    var settings = getSettings();
    if (settings && settings.settings) {
      // Check both enable_notifications (master switch) and telegram_notifications
      var masterEnabled = settings.settings.enable_notifications !== false;
      var telegramEnabled = settings.settings.telegram_notifications !== false;
      return masterEnabled && telegramEnabled;
    }
    return true; // Default to enabled
  } catch (e) {
    Logger.log('Error checking Telegram notification settings: ' + e);
    return true;
  }
}

/**
 * Check if budget alerts are enabled
 * @returns {boolean} true if budget alerts enabled
 */
function areBudgetAlertsEnabled() {
  try {
    var settings = getSettings();
    if (settings && settings.settings) {
      // Check both enable_notifications (master switch) and budget_alerts
      var masterEnabled = settings.settings.enable_notifications !== false;
      var budgetAlertsEnabled = settings.settings.budget_alerts !== false;
      return masterEnabled && budgetAlertsEnabled;
    }
    return true; // Default to enabled
  } catch (e) {
    Logger.log('Error checking budget alert settings: ' + e);
    return true;
  }
}

/**
 * Check if notifications are enabled for current user
 * @returns {boolean} true if notifications enabled, false otherwise
 */
function areNotificationsEnabled() {
  try {
    var settings = getSettings();
    logIngressEvent_('INFO', 'areNotificationsEnabled', {settings: JSON.stringify(settings)}, 'check');
    if (settings && settings.settings && settings.settings.enable_notifications !== undefined) {
      return settings.settings.enable_notifications === true;
    }
    // Default to true if setting not found
    return true;
  } catch (e) {
    Logger.log('Error checking notification settings: ' + e);
    return true; // Fail open - send notifications on error
  }
}

/**
 * Send Telegram message only if notifications are enabled
 * @param {string} chatId - Telegram chat ID
 * @param {string} message - Message to send
 * @returns {Object} Result of send operation
 */
function sendTelegramIfEnabled(chatId, message) {
  if (!areTelegramNotificationsEnabled()) {
    Logger.log('Telegram notifications disabled - skipping message');
    return { ok: false, skipped: true, reason: 'telegram_notifications_disabled' };
  }
  
  // Use existing Telegram send function
  if (typeof sendTelegram_ === 'function') {
    return sendTelegram_(chatId, message);
  } else if (typeof sendTelegramLogged_ === 'function') {
    return sendTelegramLogged_(chatId, message, {});
  }
  
  return { ok: false, error: 'Telegram send function not found' };
}

/**
 * Check budget alerts and send notifications if enabled
 */
function checkBudgetAlertsAndNotify() {
  try {
    // Check if budget alerts are enabled
    if (!areBudgetAlertsEnabled()) {
      Logger.log('Budget alerts disabled by user settings');
      return { alerts: [], notifications_enabled: false };
    }
    
    var ss = _ss();
    var sheet = ss.getSheetByName('Budgets');
    
    if (!sheet || sheet.getLastRow() < 2) {
      return { alerts: [], notifications_enabled: true };
    }
    
    var data = sheet.getDataRange().getValues();
    var alerts = [];
    var chatId = getHubChatId_();
    
    // Check each budget
    for (var i = 1; i < data.length; i++) {
      var category = data[i][0];
      var budgeted = Number(data[i][1]) || 0;
      var spent = Number(data[i][2]) || 0;
      var threshold = Number(data[i][5]) || 80; // Alert threshold (default 80%)
      
      if (budgeted === 0) continue;
      
      var percentUsed = (spent / budgeted) * 100;
      
      // Alert if over threshold
      if (percentUsed >= threshold) {
        var alert = {
          category: category,
          budgeted: budgeted,
          spent: spent,
          percentUsed: percentUsed.toFixed(1),
          threshold: threshold,
          status: percentUsed >= 100 ? 'تجاوز' : 'تحذير'
        };
        alerts.push(alert);
        
        // Send Telegram notification
        if (chatId) {
          var icon = percentUsed >= 100 ? '🚨' : '⚠️';
          var msg = icon + ' تنبيه ميزانية: ' + category + '\n' +
                   'المخصص: ' + budgeted.toFixed(2) + ' SAR\n' +
                   'المصروف: ' + spent.toFixed(2) + ' SAR\n' +
                   'النسبة: ' + percentUsed.toFixed(1) + '%\n' +
                   'الحالة: ' + alert.status;
          
          sendTelegramIfEnabled(chatId, msg);
        }
      }
    }
    
    return { 
      alerts: alerts, 
      notifications_enabled: true,
      count: alerts.length 
    };
    
  } catch (e) {
    Logger.log('Error checking budget alerts: ' + e);
    return { alerts: [], error: e.message };
  }
}

/**
 * Send transaction notification if enabled
 * @param {Object} transaction - Transaction data
 */
function notifyTransactionIfEnabled(transaction) {
  if (!areNotificationsEnabled()) {
    return { sent: false, reason: 'notifications_disabled' };
  }
  
  var chatId = getHubChatId_();
  if (!chatId) {
    return { sent: false, reason: 'no_chat_id' };
  }
  
  var icon = transaction.isIncoming ? '💰' : '💸';
  var msg = icon + ' عملية جديدة\n' +
           'التاجر: ' + (transaction.merchant || 'غير محدد') + '\n' +
           'المبلغ: ' + (transaction.amount || 0).toFixed(2) + ' SAR\n' +
           'التصنيف: ' + (transaction.category || 'أخرى');
  
  return sendTelegramIfEnabled(chatId, msg);
}


/**
 * Report transaction to Telegram
 * Used by Flow.js to send notifications after processing
 * Enhanced with two notification types:
 * 1. Transfer/Debt notifications (حوالات، ديون، اقتراض)
 * 2. Purchase/Payment notifications (شراء، فواتير، مصاريف)
 * @param {Object} ai - The parsed/classified transaction data
 * @param {Object} sync - The synchronization result (e.g. contains new UUID)
 * @param {string} source - Source of the transaction (SMS, Manual, etc)
 * @param {string} rawText - The original text
 * @param {string} chatId - Target chat ID
 */
function sendTransactionReport(ai, sync, source, rawText, chatId) {
  // Check settings first using the robust checks already in this file
  if (!areNotificationsEnabled()) {
    Logger.log('Notifications disabled - skipping transaction report');
    return;
  }

  // Get chat ID if not provided
  chatId = chatId || getHubChatId_();
  if (!chatId) {
    Logger.log('No Chat ID available for notification');
    return;
  }

  // Determine transaction type
  var txType = detectTransactionType_(ai, rawText);
  
  // Build and send the appropriate notification
  var msg;
  if (txType === 'transfer') {
    msg = buildTransferNotification_(ai, source, rawText);
  } else {
    msg = buildPurchaseNotification_(ai, source);
  }
  
  // Send
  return sendTelegramIfEnabled(chatId, msg);
}

/**
 * Detect if transaction is transfer/debt type or purchase type
 */
function detectTransactionType_(ai, rawText) {
  var raw = String(rawText || '').toLowerCase();
  var category = String(ai.category || '').toLowerCase();
  var type = String(ai.type || '').toLowerCase();
  var merchant = String(ai.merchant || '').toLowerCase();
  
  // Transfer/Debt keywords
  var transferKeywords = [
    'حوالة', 'تحويل', 'transfer', 'سداد', 'قرض', 'دين', 'اقتراض',
    'lending', 'borrowing', 'owe', 'lent', 'loan', 'repay',
    'داخلية', 'صادرة', 'واردة', 'internal', 'outgoing', 'incoming'
  ];
  
  for (var i = 0; i < transferKeywords.length; i++) {
    if (raw.indexOf(transferKeywords[i]) !== -1 || 
        category.indexOf(transferKeywords[i]) !== -1 ||
        type.indexOf(transferKeywords[i]) !== -1 ||
        merchant.indexOf(transferKeywords[i]) !== -1) {
      return 'transfer';
    }
  }
  
  // Check if it's an incoming transaction (salary, deposit)
  if (ai.isIncoming) return 'transfer';
  
  return 'purchase';
}

/**
 * Build notification for transfer/debt transactions
 * 💸 حوالة | 💰 استلام | 📝 دين/قرض
 */
function buildTransferNotification_(ai, source, rawText) {
  var isIncoming = ai.isIncoming;
  var isDebt = /دين|قرض|اقتراض|سلف|loan|debt|owe|lent/i.test(String(rawText || '') + String(ai.category || ''));
  
  // Choose header based on type
  var header, icon;
  if (isDebt) {
    icon = isIncoming ? '📥' : '📤';
    header = isIncoming ? '📥 استلام سداد دين' : '📤 سداد دين / إقراض';
  } else if (isIncoming) {
    icon = '💰';
    header = '💰 حوالة واردة';
  } else {
    icon = '💸';
    header = '💸 حوالة صادرة';
  }
  
  var amtStr = (typeof ai.amount === 'number') ? ai.amount.toFixed(2) : ai.amount;
  var currency = ai.currency || 'SAR';
  
  var msg = '━━━━━━━━━━━━━━━━━━━\n';
  msg += header + '\n';
  msg += '━━━━━━━━━━━━━━━━━━━\n\n';
  
  // Transaction details
  if (ai.merchant) {
    var label = isDebt ? '👤 الشخص' : '🏦 الجهة';
    msg += label + ': ' + ai.merchant + '\n';
  }
  
  msg += '💵 المبلغ: ' + amtStr + ' ' + currency + '\n';
  
  // Account info with balance
  var accInfo = getAccountInfoForNotification_(ai || {});
  if (accInfo && accInfo.nameEn) {
    var accLine = '🏛️ الحساب: ' + accInfo.nameEn;
    if (accInfo.balance !== undefined && accInfo.balance !== null) {
      var balIcon = isIncoming ? '📈' : '📉';
      accLine += '\n' + balIcon + ' الرصيد: ' + Number(accInfo.balance).toFixed(2) + ' ' + currency;
    }
    msg += accLine + '\n';
  }
  
  if (ai.cardNum) msg += '💳 البطاقة: ****' + String(ai.cardNum).slice(-4) + '\n';
  
  // Debt tracking hint
  if (isDebt) {
    msg += '\n📋 تتبع الديون:\n';
    if (isIncoming) {
      msg += '   ✅ تم استلام السداد\n';
    } else {
      msg += '   📝 تم تسجيل الدين/القرض\n';
    }
  }
  
  // Source
  if (source) msg += '\n📱 ' + source;
  
  // All balances table
  var balancesTable = buildBalancesTable_();
  if (balancesTable) {
    msg += '\n\n' + balancesTable;
  }
  
  msg += '\n━━━━━━━━━━━━━━━━━━━';
  
  return msg;
}

/**
 * Build notification for purchase/payment transactions
 * 🛒 شراء | 🧾 فاتورة | 🍔 طعام | ⛽ وقود
 */
function buildPurchaseNotification_(ai, source) {
  var category = String(ai.category || '').toLowerCase();
  
  // Choose icon based on category
  var icon = '🛒';
  var header = '🛒 عملية شراء';
  
  if (/طعام|مطعم|food|restaurant|cafe/i.test(category)) {
    icon = '🍔'; header = '🍔 طعام ومطاعم';
  } else if (/بقالة|سوبر|grocery|supermarket/i.test(category)) {
    icon = '🛒'; header = '🛒 بقالة وتسوق';
  } else if (/وقود|بنزين|fuel|gas|petrol/i.test(category)) {
    icon = '⛽'; header = '⛽ وقود';
  } else if (/فاتورة|كهرباء|ماء|bill|utility/i.test(category)) {
    icon = '🧾'; header = '🧾 فواتير';
  } else if (/نقل|مواصلات|transport|uber|careem/i.test(category)) {
    icon = '🚗'; header = '🚗 مواصلات';
  } else if (/ترفيه|سينما|entertainment|movie/i.test(category)) {
    icon = '🎬'; header = '🎬 ترفيه';
  } else if (/صحة|طبي|دواء|health|medical|pharmacy/i.test(category)) {
    icon = '💊'; header = '💊 صحة ودواء';
  } else if (/ملابس|fashion|clothes/i.test(category)) {
    icon = '👕'; header = '👕 ملابس';
  } else if (/تقنية|electronics|tech/i.test(category)) {
    icon = '📱'; header = '📱 تقنية';
  } else if (/اشتراك|subscription/i.test(category)) {
    icon = '📺'; header = '📺 اشتراكات';
  }
  
  var amtStr = (typeof ai.amount === 'number') ? ai.amount.toFixed(2) : ai.amount;
  var currency = ai.currency || 'SAR';
  
  var msg = '┌─────────────────────┐\n';
  msg += '│  ' + header + '\n';
  msg += '└─────────────────────┘\n\n';
  
  // Merchant
  msg += '🏪 التاجر: ' + (ai.merchant || 'غير محدد') + '\n';
  msg += '💵 المبلغ: ' + amtStr + ' ' + currency + '\n';
  msg += '📂 التصنيف: ' + (ai.category || 'عام') + '\n';
  
  // Account info
  var accInfo = getAccountInfoForNotification_(ai || {});
  if (accInfo && accInfo.nameEn) {
    msg += '🏦 الحساب: ' + accInfo.nameEn + '\n';
    if (accInfo.balance !== undefined && accInfo.balance !== null) {
      msg += '📊 الرصيد: ' + Number(accInfo.balance).toFixed(2) + ' ' + currency + '\n';
    }
  }
  
  if (ai.cardNum) msg += '💳 البطاقة: ****' + String(ai.cardNum).slice(-4) + '\n';
  
  // Source
  if (source) msg += '\n📱 ' + source;
  
  // All balances table
  var balancesTable = buildBalancesTable_();
  if (balancesTable) {
    msg += '\n\n' + balancesTable;
  }
  
  return msg;
}

/**
 * Build a nice table showing all account balances
 * Uses monospace formatting for alignment
 */
function buildBalancesTable_() {
  try {
    if (typeof getAllBalances_ !== 'function') return '';
    var balances = getAllBalances_();
    if (!balances) return '';

    var idx = (typeof getAccountsIndex_ === 'function') ? getAccountsIndex_() : null;
    
    // Collect balance data
    var items = [];
    var totalBalance = 0;
    
    for (var key in balances) {
      if (!balances.hasOwnProperty(key)) continue;
      var b = balances[key] || {};
      var info = (idx && idx.byNumber && idx.byNumber[String(b.account || key).trim()]) 
                  ? idx.byNumber[String(b.account || key).trim()] : null;
      
      // Get display name
      var nameEn = pickEnglishAlias_(
        (info && info.aliases) || '', 
        (info && info.bank) || b.bank || '', 
        (info && info.name) || b.name || ''
      );
      
      var bal = Number(b.balance || 0);
      totalBalance += bal;
      
      // Choose icon based on bank
      var bankIcon = '🏦';
      var nameLower = String(nameEn || '').toLowerCase();
      if (/rajhi|الراجحي/i.test(nameLower)) bankIcon = '🏛️';
      else if (/stc|اس تي سي/i.test(nameLower)) bankIcon = '📱';
      else if (/tiqmo|تيكمو/i.test(nameLower)) bankIcon = '💳';
      else if (/saib|سايب/i.test(nameLower)) bankIcon = '🏦';
      else if (/d360|دي 360/i.test(nameLower)) bankIcon = '💰';
      
      items.push({
        icon: bankIcon,
        name: nameEn || key,
        balance: bal
      });
    }

    if (items.length === 0) return '';
    
    // Sort by balance descending
    items.sort(function(a, b) { return b.balance - a.balance; });
    
    // Build table
    var table = '╔═══════════════════════════╗\n';
    table += '║    💳 أرصدة الحسابات      ║\n';
    table += '╠═══════════════════════════╣\n';
    
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      // Truncate name if too long
      var displayName = String(item.name).substring(0, 12);
      var balStr = item.balance.toFixed(2);
      
      // Format: icon name ........ balance
      table += '║ ' + item.icon + ' ' + displayName;
      // Pad to align
      var padding = 16 - displayName.length;
      for (var p = 0; p < padding; p++) table += ' ';
      table += balStr + ' ║\n';
    }
    
    table += '╠═══════════════════════════╣\n';
    table += '║ 💰 الإجمالي: ' + totalBalance.toFixed(2) + ' SAR ║\n';
    table += '╚═══════════════════════════╝';
    
    return table;
  } catch (e) {
    Logger.log('buildBalancesTable_ error: ' + e);
    return '';
  }
}

function getAccountInfoForNotification_(ai) {
  try {
    var accNum = ai.accNum || (typeof extractAccountFromText_ === 'function' ? extractAccountFromText_(ai.raw) : null) || ai.cardNum || '';
    var nameCandidate = String(ai.accountName || '').toLowerCase();

    var info = null;
    if (typeof getAccountsIndex_ === 'function') {
      var idx = getAccountsIndex_();
      if (accNum && idx && idx.byNumber && idx.byNumber[String(accNum).trim()]) {
        info = idx.byNumber[String(accNum).trim()];
      } else if (nameCandidate && idx && idx.byName && idx.byName[nameCandidate]) {
        info = idx.byName[nameCandidate];
      }
    }

    var balance = null;
    if (typeof getAllBalances_ === 'function' && accNum) {
      var balances = getAllBalances_();
      if (balances && balances[String(accNum).trim()]) {
        balance = balances[String(accNum).trim()].balance;
      }
    }

    if (!info && accNum) {
      // Fallback: read Accounts sheet directly
      try {
        var sh = _sheet('Accounts');
        var last = sh.getLastRow();
        if (last >= 2) {
          var rows = sh.getRange(2, 1, last - 1, 10).getValues();
          for (var i = 0; i < rows.length; i++) {
            var num = String(rows[i][2] || '').trim();
            if (num && num === String(accNum).trim()) {
              info = {
                name: String(rows[i][0] || ''),
                bank: String(rows[i][3] || ''),
                aliases: String(rows[i][8] || ''),
                balance: rows[i][4]
              };
              if (balance === null || balance === undefined) balance = rows[i][4];
              break;
            }
          }
        }
      } catch (e) {}
    }

    if (!info) return null;

    var nameEn = pickEnglishAlias_(info.aliases, info.bank, info.name);
    return { nameEn: nameEn || info.name || '', balance: balance !== null && balance !== undefined ? balance : info.balance };
  } catch (e) {
    Logger.log('getAccountInfoForNotification_ error: ' + e);
    return null;
  }
}

function pickEnglishAlias_(aliases, bank, name) {
  var parts = String(aliases || '').split(/[;,]+/).map(function(s){ return s.trim(); }).filter(function(s){ return s.length > 0; });
  for (var i = 0; i < parts.length; i++) {
    if (/[A-Za-z]/.test(parts[i])) return parts[i];
  }
  if (bank && /[A-Za-z]/.test(bank)) return String(bank).trim();
  return String(name || '').trim();
}

function buildAllBalancesLine_() {
  try {
    if (typeof getAllBalances_ !== 'function') return '';
    var balances = getAllBalances_();
    if (!balances) return '';

    var idx = (typeof getAccountsIndex_ === 'function') ? getAccountsIndex_() : null;
    var parts = [];
    for (var key in balances) {
      if (!balances.hasOwnProperty(key)) continue;
      var b = balances[key] || {};
      var info = (idx && idx.byNumber && idx.byNumber[String(b.account || key).trim()]) ? idx.byNumber[String(b.account || key).trim()] : null;
      var nameEn = pickEnglishAlias_((info && info.aliases) || '', (info && info.bank) || b.bank || '', (info && info.name) || b.name || '');
      var bal = Number(b.balance || 0).toFixed(2);
      parts.push(nameEn + ': ' + bal + ' SAR');
    }

    if (parts.length === 0) return '';
    return '📊 *Balances:* ' + parts.join(' | ');
  } catch (e) {
    Logger.log('buildAllBalancesLine_ error: ' + e);
    return '';
  }
}

