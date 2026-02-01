/**
 * NOTIFICATION_SYSTEM.js - Respect User Notification Preferences
 * 
 * CRITICAL: This file ensures notifications respect user settings
 * Before sending any notification, check if user has enabled them
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

  // Determine icon based on transaction type/direction
  var icon = '💳'; // Default
  if (ai.isIncoming) icon = '💰';
  else if (ai.category && ai.category.indexOf('طعام') > -1) icon = '🍔';
  else if (ai.category && ai.category.indexOf('بقالة') > -1) icon = '🛒';
  else if (ai.category && ai.category.indexOf('نقل') > -1) icon = '🚕';
  else if (ai.category && ai.category.indexOf('حوالات') > -1) icon = '↔️';

  // Format amount
  var amtStr = (typeof ai.amount === 'number') ? ai.amount.toFixed(2) : ai.amount;
  
  // Build message
  var msg = icon + ' *عملية جديدة*\n';
  msg    += '🏪 *التاجر:* ' + (ai.merchant || 'غير محدد') + '\n';
  msg    += '💸 *المبلغ:* ' + amtStr + ' ' + (ai.currency || 'SAR') + '\n';
  msg    += '📂 *التصنيف:* ' + (ai.category || 'عام') + '\n';

  // Account (English name + balance if available)
  var accInfo = getAccountInfoForNotification_(ai || {});
  if (accInfo && accInfo.nameEn) {
    if (accInfo.balance !== undefined && accInfo.balance !== null && accInfo.balance !== '') {
      msg += '🏦 *Account:* ' + accInfo.nameEn + ' (Balance: ' + Number(accInfo.balance).toFixed(2) + ' ' + (ai.currency || 'SAR') + ')\n';
    } else {
      msg += '🏦 *Account:* ' + accInfo.nameEn + '\n';
    }
  }
  
  if (ai.cardNum) msg += '💳 *البطاقة:* ' + ai.cardNum + '\n';
  if (source)     msg += '📱 *المصدر:* ' + source;

  // Append all account balances
  var balancesLine = buildAllBalancesLine_();
  if (balancesLine) {
    msg += '\n\n' + balancesLine;
  }
  
  // Send
  return sendTelegramIfEnabled(chatId, msg);
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

