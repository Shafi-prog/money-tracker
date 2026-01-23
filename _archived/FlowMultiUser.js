/********** SJA-V1 | FlowMultiUser.js – Multi-User Flow with Account Detection **********/

/**
 * تدفق موحد يدعم المستخدمين المتعددين مع كشف تلقائي للحسابات
 */
function executeUniversalFlowV1(smsText, source, destChatId, userId) {
  var ss = _ss();
  
  try {
    // 1. كشف الحساب من SMS (أولوية قصوى)
    var account = null;
    if (typeof SJA_detectAccountFromSMS === 'function') {
      account = SJA_detectAccountFromSMS(smsText);
      
      // إذا تم التعرف على الحساب، استخدم userId منه
      if (account && account.userId) {
        userId = account.userId;
        Logger.log('✅ تم تحديد المستخدم من الحساب: ' + userId);
      }
    }
    
    // 2. تحليل AI
    var ai = callAiHybridV120(smsText);
    
    // 3. إضافة معلومات الحساب لـ AI output
    if (account) {
      ai.account = account.accountId;
      ai.accountType = account.type;
      ai.bankName = account.bankName;
      ai.detectedBy = account.matchedBy;
    }
    
    // 4. تطبيق التصنيف (مع دعم userId إن وجد)
    if (userId) {
      ai = applyUserClassifierMap_(smsText, ai, userId);
    } else {
      ai = applyClassifierMap_(smsText, ai);
    }

    // 5. تحديد المستخدم من رقم الحساب/البطاقة إن لم يكن معروفاً
    if (!userId && (ai.accNum || ai.cardNum)) {
      userId = getUserIdByAccount(ai.accNum || ai.cardNum);
    }
    
    // 6. Fallback إلى USER1 إذا لم يتم التحديد
    if (!userId) {
      userId = 'USER1';
      Logger.log('⚠️ لم يتم تحديد المستخدم، استخدام USER1');
    }

    // 7. مزامنة البيانات
    var sync = syncQuadV1(ai, smsText, source, userId);

    // 8. إرسال التقرير
    sendSJAReportV1(ai, sync, source, smsText, destChatId, userId);
    
    return {ok: true, account: account, userId: userId};

  } catch (err) {
    Logger.log('❌ خطأ في FlowMultiUser: ' + err);
    try {
      ss.getSheetByName('Sheet1').appendRow([
        new Date(), 'FLOW_ERROR', '-', '-', source, '-', '-', '-', '-', '-', '-', err.toString(), userId || ''
      ]);
    } catch (_) {}
    
    return {ok: false, error: err.toString()};
  }
}

/**
 * مزامنة رباعية مع دعم المستخدمين المتعددين + Account Info
 */
function syncQuadV1(data, raw, source, userId) {
  var now = new Date();
  var s1 = _sheet('Sheet1');

  // 1) Sheet1 الرئيسي (يحتوي على جميع العمليات)
  s1.appendRow([
    now,                           // Timestamp
    data.merchant || '',           // Merchant
    Number(data.amount) || 0,      // Amount
    data.category || '',           // Category
    data.type || '',               // Type
    source || '',                  // Source
    data.account || data.accNum || data.cardNum || '',  // Account/Card (محدّث)
    data.bankName || '',           // Bank Name (جديد)
    data.accountType || '',        // Account Type (جديد)
    JSON.stringify(data),          // AI Details
    raw,                           // Raw SMS
    '',                            // Budget Used (سيتم حسابه)
    '',                            // Debt Impact
    '',                            // Balance (formula)
    userId || 'SHARED'             // User ID
  ]);

  var bRem = 0;
  var dBal = 0;

  // 2) إذا كان لدينا userId، نحفظ أيضاً في User_userId
  if (userId) {
    try {
      var sUser = _sheet('User_' + userId);
      if (!sUser || sUser.getLastRow() === 0) {
        createUserSheets_(userId);
        sUser = _sheet('User_' + userId);
      }

      sUser.appendRow([
        now, 'V1_AUTO', 'اليوم', 'الأسبوع', source,
        data.accNum || '',
        data.cardNum || '',
        Number(data.amount) || 0,
        data.merchant || '',
        data.category || '',
        data.type || '',
        raw
      ]);

      // تحديث ميزانية المستخدم
      bRem = updateUserBudget_(userId, data);
      
      // تحديث ديون المستخدم
      if (isInternalTransfer_(data)) {
        updateDebtIndexMultiUser_(data, userId);
      }
    } catch (e) {
      logIngressEvent_('ERROR', 'syncUserData', { error: String(e), userId: userId }, raw);
    }
  }

  // 3) Budgets العام
  try {
    ensureBudgetRowExists_(data.category);

    var sB = _sheet('Budgets');
    var bData = sB.getDataRange().getValues();
    for (var i = 1; i < bData.length; i++) {
      if (String(bData[i][0] || '') === String(data.category || '')) {
        var current = Number(bData[i][2]) || 0;
        var delta = data.isIncoming ? -(Number(data.amount) || 0) : (Number(data.amount) || 0);

        sB.getRange(i + 1, 3).setValue(current + delta);
        SpreadsheetApp.flush();
        if (!bRem) bRem = Number(sB.getRange(i + 1, 4).getValue()) || 0;
        break;
      }
    }
  } catch (_) {}

  // 4) Debt_Ledger العام
  try {
    var internal = isInternalTransfer_(data);

    if (internal) {
      var sD = _sheet('Debt_Ledger');
      var amt = Number(data.amount) || 0;
      var party = data.merchant || 'تحويل داخلي';
      var debtor = data.isIncoming ? amt : 0;
      var creditor = data.isIncoming ? 0 : amt;
      var desc = (data.isIncoming ? 'حوالة داخلية واردة' : 'حوالة داخلية صادرة') + ' - ' + party;

      sD.appendRow([now, party, debtor, creditor, '', desc]);
      SpreadsheetApp.flush();
      try { dBal = Number(sD.getRange(sD.getLastRow(), 5).getValue()) || 0; } catch (e1) {}
    }
  } catch (_) {}

  // 5) Dashboard raw
  try {
    var sDash = _sheet('Dashboard');
    sDash.appendRow([now, data.merchant || '', Number(data.amount) || 0, data.category || '', source, userId || 'SHARED']);
  } catch (_) {}

  return { debt: dBal, budget: bRem };
}

/**
 * تحديث ميزانية المستخدم
 */
function updateUserBudget_(userId, data) {
  try {
    var sBudget = _sheet('Budget_' + userId);
    if (!sBudget || sBudget.getLastRow() === 0) {
      createUserSheets_(userId);
      sBudget = _sheet('Budget_' + userId);
    }

    // التأكد من وجود التصنيف
    var vals = sBudget.getDataRange().getValues();
    var found = false;
    var row = -1;

    for (var i = 1; i < vals.length; i++) {
      if (String(vals[i][0] || '') === String(data.category || '')) {
        found = true;
        row = i + 1;
        break;
      }
    }

    if (!found) {
      row = sBudget.getLastRow() + 1;
      sBudget.getRange(row, 1, 1, 4).setValues([[data.category, 0, 0, '=B' + row + '-C' + row]]);
    }

    // تحديث المصروف
    var current = Number(sBudget.getRange(row, 3).getValue()) || 0;
    var delta = data.isIncoming ? -(Number(data.amount) || 0) : (Number(data.amount) || 0);
    sBudget.getRange(row, 3).setValue(current + delta);

    SpreadsheetApp.flush();
    return Number(sBudget.getRange(row, 4).getValue()) || 0;
  } catch (e) {
    return 0;
  }
}

/**
 * إرسال تقرير SJA مع معلومات المستخدم والحساب - محسّن
 */
function sendSJAReportV1(ai, sync, src, raw, destChatId, userId) {
  var hub = String(destChatId || getHubChatId_() || '');
  if (!hub) return;

  var amount = Number(ai && ai.amount ? ai.amount : 0);
  var merchant = (ai && ai.merchant) ? String(ai.merchant) : 'غير محدد';
  var category = (ai && ai.category) ? String(ai.category) : 'أخرى';
  var type = (ai && ai.type) ? String(ai.type) : 'حوالة';
  var isIncoming = !!(ai && ai.isIncoming);
  var budgetRem = Number(sync && sync.budget ? sync.budget : 0);
  
  // معلومات الحساب
  var accountInfo = '';
  if (ai && ai.account) {
    accountInfo = '\n🆔 الحساب: ' + ai.account;
    if (ai.bankName) {
      accountInfo += ' (' + ai.bankName + ')';
    }
  }

  // تنسيق التاريخ
  var dateStr = Utilities.formatDate(new Date(), 'Asia/Riyadh', 'dd/MM/yyyy');

  // رسالة محسّنة بتصميم أجمل
  var text = '✅ *رصـد مـالـي*\n';
  text += '━━━━━━━━━━━━━━\n';
  text += '📅 التاريخ: ' + dateStr + '\n';
  text += '💰 المبلغ: ' + Math.abs(amount).toFixed(2) + ' SAR';
  text += isIncoming ? ' *(وارد)*' : '';
  text += accountInfo + '\n';
  text += '🛒 المتجر: ' + merchant + '\n';
  text += '🏷️ التصنيف: ' + category;
  
  // إضافة معلومات الميزانية إذا كانت متاحة
  if (budgetRem > 0) {
    text += '\n📊 المتبقي من الميزانية: ' + budgetRem.toFixed(2) + ' SAR';
  }
  
  text += '\n━━━━━━━━━━━━━━\n';
  text += '📝 النص الكامل:\n' + (raw || '');

  // الأزرار التفاعلية - قائمة رئيسية
  var keyboard = {
    inline_keyboard: [
      [
        { text: '📊 اليوم', callback_data: 'cmd_today' },
        { text: '📅 الأسبوع', callback_data: 'cmd_week' },
        { text: '📆 الشهر', callback_data: 'cmd_month' }
      ],
      [
        { text: '💰 الميزانيات', callback_data: 'cmd_budgets' },
        { text: '🔄 الحوالات', callback_data: 'cmd_transfers' }
      ],
      [
        { text: '💳 الحسابات', callback_data: 'cmd_accounts' },
        { text: '📈 الإحصائيات', callback_data: 'cmd_stats' }
      ],
      [
        { text: '❓ المساعدة', callback_data: 'cmd_help' }
      ]
    ]
  };

  // إرسال الرسالة مع الأزرار
  sendTelegramWithKeyboard_(hub, text, keyboard);

  // أرشفة اختيارية
  var arch = getArchiveChatId_();
  if (arch && arch !== hub) {
    sendTelegramLogged_(arch, text, { parse_mode: 'Markdown' });
  }
}

/**
 * إرسال رسالة Telegram مع لوحة مفاتيح
 */
function sendTelegramWithKeyboard_(chatId, text, keyboard) {
  try {
    var botToken = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      Logger.log('⚠️ TELEGRAM_BOT_TOKEN غير موجود');
      return;
    }
    
    var url = 'https://api.telegram.org/bot' + botToken + '/sendMessage';
    var payload = {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown',
      reply_markup: keyboard
    };
    
    var options = {
      method: /** @type {const} */ ('post'),
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    var response = UrlFetchApp.fetch(url, options);
    var result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      Logger.log('✅ تم إرسال رسالة Telegram مع الأزرار');
    } else {
      Logger.log('⚠️ خطأ في Telegram: ' + result.description);
    }
    
  } catch (e) {
    Logger.log('❌ خطأ في sendTelegramWithKeyboard_: ' + e.message);
  }
}
