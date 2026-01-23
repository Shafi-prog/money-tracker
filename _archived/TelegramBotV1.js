/**
 * ============================================
 * Telegram Bot V1.0 - واجهة تفاعلية كاملة
 * ============================================
 * 
 * الميزات:
 * ✅ قوائم تفاعلية (Inline Keyboards)
 * ✅ أوامر كاملة للاستعلام والتقارير
 * ✅ تعديل التصنيفات
 * ✅ إدارة الميزانيات
 * ✅ تنبيهات ذكية
 */

// ================================
// 1. معالج الرسائل الرئيسي
// ================================

function processTelegramUpdate(update) {
  try {
    // معالجة الرسائل النصية
    if (update.message) {
      var message = update.message;
      var chatId = message.chat.id;
      var text = message.text || '';
      
      // تحقق من الأوامر
      if (text.startsWith('/')) {
        return handleCommand(chatId, text, message);
      }
      
      // معالجة النص العادي (إضافة عملية)
      return handleTextMessage(chatId, text, message);
    }
    
    // معالجة Callback من Inline Buttons
    if (update.callback_query) {
      return handleCallbackQuery(update.callback_query);
    }
    
    return {ok: true};
  } catch (e) {
    Logger.log('Error in processTelegramUpdate: ' + e);
    return {ok: false, error: String(e)};
  }
}

// ================================
// 2. معالج الأوامر
// ================================

function handleCommand(chatId, text, message) {
  var cmd = text.split(' ')[0].toLowerCase();
  var args = text.substring(cmd.length).trim();
  
  var userId = message.from ? message.from.id : null;
  
  switch(cmd) {
    case '/start':
      return sendWelcomeMessage(chatId, userId);
      
    case '/menu':
      return sendMainMenu(chatId);
      
    case '/report':
    case '/تقرير':
      return sendMonthlyReport(chatId, userId);
      
    case '/today':
    case '/اليوم':
      return sendTodayReport(chatId, userId);
      
    case '/week':
    case '/الأسبوع':
      return sendWeekReport(chatId, userId);
      
    case '/budgets':
    case '/ميزانيات':
      return sendBudgetsStatus(chatId, userId);
      
    case '/categories':
    case '/تصنيفات':
      return sendCategoriesList(chatId);
      
    case '/last':
    case '/آخر':
      var count = parseInt(args) || 10;
      return sendLastTransactions(chatId, userId, count);
      
    case '/search':
    case '/بحث':
      return sendSearchPrompt(chatId, args);
      
    case '/add':
    case '/أضف':
      return processManualAdd(chatId, args, userId);
      
    case '/edit':
    case '/تعديل':
      return sendEditOptions(chatId);
      
    case '/delete':
    case '/حذف':
      return sendDeleteConfirmation(chatId, args);
      
    case '/export':
    case '/تصدير':
      return exportToExcel(chatId, userId);
      
    case '/settings':
    case '/إعدادات':
      return sendSettings(chatId, userId);
      
    case '/help':
    case '/مساعدة':
      return sendHelpMessage(chatId);
      
    default:
      return sendMessage(chatId, '❌ أمر غير معروف. استخدم /menu لعرض القائمة الرئيسية');
  }
}

// ================================
// 3. رسالة الترحيب
// ================================

function sendWelcomeMessage(chatId, userId) {
  var userName = 'عزيزي المستخدم';
  
  // جلب معلومات المستخدم إن وجدت
  if (userId && typeof getUserInfo === 'function') {
    try {
      var user = getUserInfo(userId);
      if (user && user.userName) {
        userName = user.userName;
      }
    } catch (e) {}
  }
  
  var welcomeText = [
    '🎉 *مرحباً ' + userName + '!*',
    '',
    '💰 *MoneyTracker V1.0*',
    'نظام إدارة مالية ذكي ومتقدم',
    '',
    '✨ *الميزات الرئيسية:*',
    '• 📊 تتبع تلقائي للمصاريف',
    '• 🤖 تصنيف ذكي بالذكاء الاصطناعي',
    '• 📈 تقارير تفصيلية وتحليلات',
    '• 💳 دعم حسابات وبطاقات متعددة',
    '• ⏰ تنبيهات ذكية',
    '• 📱 واجهة سهلة عبر Telegram',
    '',
    '🚀 *ابدأ الآن:*',
    'استخدم /menu لعرض القائمة الرئيسية'
  ].join('\n');
  
  return sendMessage(chatId, welcomeText, {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [
        ['📊 تقرير الشهر', '📅 تقرير اليوم'],
        ['💰 الميزانيات', '📜 آخر 10 عمليات'],
        ['➕ إضافة عملية', '🔍 بحث'],
        ['⚙️ الإعدادات', '❓ المساعدة']
      ],
      resize_keyboard: true
    }
  });
}

// ================================
// 4. القائمة الرئيسية
// ================================

function sendMainMenu(chatId) {
  var menuText = [
    '📋 *القائمة الرئيسية*',
    '',
    '📊 *التقارير:*',
    '/report - تقرير الشهر الحالي',
    '/today - ملخص اليوم',
    '/week - ملخص الأسبوع',
    '',
    '💰 *الميزانيات:*',
    '/budgets - حالة الميزانيات',
    '/categories - التصنيفات المتاحة',
    '',
    '📝 *العمليات:*',
    '/add - إضافة عملية جديدة',
    '/last 10 - آخر 10 عمليات',
    '/search - البحث في العمليات',
    '',
    '✏️ *الإدارة:*',
    '/edit - تعديل عملية',
    '/delete - حذف عملية',
    '/export - تصدير البيانات',
    '',
    '⚙️ *الإعدادات:*',
    '/settings - إعدادات الحساب',
    '/help - المساعدة',
    '',
    '💡 *نصيحة:* يمكنك أيضاً إرسال نص مباشر لإضافة عملية:',
    '`أضف: 50 | مطعم | مطاعم`'
  ].join('\n');
  
  return sendMessage(chatId, menuText, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          {text: '📊 تقرير شهري', callback_data: 'report_month'},
          {text: '📅 تقرير اليوم', callback_data: 'report_today'}
        ],
        [
          {text: '💰 الميزانيات', callback_data: 'budgets'},
          {text: '📜 آخر العمليات', callback_data: 'last_10'}
        ],
        [
          {text: '➕ إضافة عملية', callback_data: 'add_transaction'},
          {text: '🔍 بحث', callback_data: 'search'}
        ],
        [
          {text: '⚙️ الإعدادات', callback_data: 'settings'},
          {text: '❓ مساعدة', callback_data: 'help'}
        ]
      ]
    }
  });
}

// ================================
// 5. تقرير شهري كامل
// ================================

function sendMonthlyReport(chatId, userId) {
  try {
    var sheet = _sheet('Sheet1');
    var data = sheet.getDataRange().getValues();
    
    var now = new Date();
    var thisMonth = now.getMonth();
    var thisYear = now.getFullYear();
    
    var totalIncome = 0;
    var totalExpense = 0;
    var transactions = [];
    var categoryExpenses = {};
    
    // تصفية حسب المستخدم والشهر
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var timestamp = new Date(row[0]);
      var rowUserId = row[12] || null; // Column M: User ID
      
      // تحقق من المستخدم والشهر
      if (timestamp.getMonth() === thisMonth && 
          timestamp.getFullYear() === thisYear &&
          (!userId || !rowUserId || rowUserId === userId)) {
        
        var merchant = row[1] || 'غير محدد';
        var amount = parseFloat(row[2]) || 0;
        var category = row[3] || 'أخرى';
        var type = row[4] || '';
        
        transactions.push({
          merchant: merchant,
          amount: amount,
          category: category,
          type: type,
          date: timestamp
        });
        
        // حساب الإجماليات
        if (amount < 0) {
          totalIncome += Math.abs(amount);
        } else {
          totalExpense += amount;
          
          // تجميع حسب التصنيف
          if (!categoryExpenses[category]) {
            categoryExpenses[category] = 0;
          }
          categoryExpenses[category] += amount;
        }
      }
    }
    
    var balance = totalIncome - totalExpense;
    var balanceIcon = balance >= 0 ? '✅' : '❌';
    
    // ترتيب التصنيفات حسب الإنفاق
    var topCategories = Object.keys(categoryExpenses)
      .sort(function(a, b) { return categoryExpenses[b] - categoryExpenses[a]; })
      .slice(0, 5);
    
    var reportText = [
      '📊 *تقرير شهر ' + getMonthName(thisMonth) + ' ' + thisYear + '*',
      '',
      '💵 *الإجماليات:*',
      '✅ الدخل: ' + formatMoney(totalIncome) + ' SAR',
      '❌ المصروفات: ' + formatMoney(totalExpense) + ' SAR',
      balanceIcon + ' الصافي: ' + formatMoney(balance) + ' SAR',
      '',
      '📈 *أكبر 5 تصنيفات:*'
    ];
    
    topCategories.forEach(function(cat, idx) {
      var percent = ((categoryExpenses[cat] / totalExpense) * 100).toFixed(1);
      reportText.push((idx + 1) + '. ' + cat + ': ' + formatMoney(categoryExpenses[cat]) + ' SAR (' + percent + '%)');
    });
    
    reportText.push('');
    reportText.push('📝 *إجمالي العمليات:* ' + transactions.length);
    reportText.push('💳 *متوسط العملية:* ' + formatMoney(totalExpense / transactions.length) + ' SAR');
    
    // إضافة تنبيهات الميزانية
    var alerts = checkBudgetAlertsForUser(userId);
    if (alerts && alerts.length > 0) {
      reportText.push('');
      reportText.push('⚠️ *تنبيهات الميزانية:*');
      alerts.forEach(function(alert) {
        reportText.push('• ' + alert);
      });
    }
    
    return sendMessage(chatId, reportText.join('\n'), {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {text: '📥 تصدير Excel', callback_data: 'export_excel'},
            {text: '📊 رسم بياني', callback_data: 'chart_month'}
          ],
          [
            {text: '🔙 القائمة الرئيسية', callback_data: 'main_menu'}
          ]
        ]
      }
    });
    
  } catch (e) {
    Logger.log('Error in sendMonthlyReport: ' + e);
    return sendMessage(chatId, '❌ خطأ في إنشاء التقرير: ' + e);
  }
}

// ================================
// 6. تقرير اليوم
// ================================

function sendTodayReport(chatId, userId) {
  try {
    var sheet = _sheet('Sheet1');
    var data = sheet.getDataRange().getValues();
    
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    
    var todayIncome = 0;
    var todayExpense = 0;
    var todayTransactions = [];
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var timestamp = new Date(row[0]);
      timestamp.setHours(0, 0, 0, 0);
      var rowUserId = row[12] || null;
      
      if (timestamp.getTime() === today.getTime() &&
          (!userId || !rowUserId || rowUserId === userId)) {
        
        var amount = parseFloat(row[2]) || 0;
        var merchant = row[1] || 'غير محدد';
        var category = row[3] || 'أخرى';
        
        todayTransactions.push({
          merchant: merchant,
          amount: amount,
          category: category,
          time: new Date(row[0])
        });
        
        if (amount < 0) {
          todayIncome += Math.abs(amount);
        } else {
          todayExpense += amount;
        }
      }
    }
    
    var reportText = [
      '📅 *ملخص اليوم (' + formatDate(today) + ')*',
      '',
      '💵 *الإجماليات:*',
      '✅ الدخل: ' + formatMoney(todayIncome) + ' SAR',
      '❌ المصروفات: ' + formatMoney(todayExpense) + ' SAR',
      '📊 الصافي: ' + formatMoney(todayIncome - todayExpense) + ' SAR',
      '',
      '📝 *عدد العمليات:* ' + todayTransactions.length
    ];
    
    if (todayTransactions.length > 0) {
      reportText.push('');
      reportText.push('📜 *آخر العمليات اليوم:*');
      
      todayTransactions.slice(-5).reverse().forEach(function(t) {
        var time = t.time.getHours() + ':' + ('0' + t.time.getMinutes()).slice(-2);
        var sign = t.amount < 0 ? '+' : '-';
        reportText.push('• ' + time + ' | ' + t.merchant + ' | ' + sign + formatMoney(Math.abs(t.amount)) + ' SAR');
      });
    }
    
    return sendMessage(chatId, reportText.join('\n'), {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {text: '📊 تقرير الشهر', callback_data: 'report_month'},
            {text: '🔙 القائمة', callback_data: 'main_menu'}
          ]
        ]
      }
    });
    
  } catch (e) {
    Logger.log('Error in sendTodayReport: ' + e);
    return sendMessage(chatId, '❌ خطأ في إنشاء التقرير: ' + e);
  }
}

// ================================
// 7. حالة الميزانيات
// ================================

function sendBudgetsStatus(chatId, userId) {
  try {
    var budgetSheet = _sheet('Budgets');
    var budgetData = budgetSheet.getDataRange().getValues();
    
    var reportText = [
      '💰 *حالة الميزانيات*',
      ''
    ];
    
    for (var i = 1; i < budgetData.length; i++) {
      var row = budgetData[i];
      var category = row[0];
      var budgeted = parseFloat(row[1]) || 0;
      var spent = parseFloat(row[2]) || 0;
      var remaining = budgeted - spent;
      var percentage = budgeted > 0 ? (spent / budgeted * 100).toFixed(1) : 0;
      var percentNum = Number(percentage);
      
      var statusIcon = '✅';
      if (percentNum >= 100) statusIcon = '🔴';
      else if (percentNum >= 80) statusIcon = '⚠️';
      else if (percentNum >= 50) statusIcon = '🟡';
      
      var bar = createProgressBar(percentage);
      
      reportText.push(statusIcon + ' *' + category + '*');
      reportText.push(bar + ' ' + percentage + '%');
      reportText.push('المستخدم: ' + formatMoney(spent) + ' / ' + formatMoney(budgeted) + ' SAR');
      reportText.push('المتبقي: ' + formatMoney(remaining) + ' SAR');
      reportText.push('');
    }
    
    return sendMessage(chatId, reportText.join('\n'), {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {text: '➕ إضافة ميزانية', callback_data: 'add_budget'},
            {text: '✏️ تعديل', callback_data: 'edit_budgets'}
          ],
          [
            {text: '🔙 القائمة الرئيسية', callback_data: 'main_menu'}
          ]
        ]
      }
    });
    
  } catch (e) {
    Logger.log('Error in sendBudgetsStatus: ' + e);
    return sendMessage(chatId, '❌ خطأ في جلب الميزانيات: ' + e);
  }
}

// ================================
// 8. معالج Callback Queries
// ================================

function handleCallbackQuery(query) {
  var chatId = query.message.chat.id;
  var data = query.data;
  var userId = query.from ? query.from.id : null;
  
  // استخدام المعالج السريع الجديد
  if (typeof handleCallbackQueryFast === 'function') {
    return handleCallbackQueryFast(query);
  }
  
  // إرسال إشعار للمستخدم
  answerCallbackQuery(query.id, 'جاري التحميل...');
  
  // استخدام المعالج المحسّن من TELEGRAM_COMMANDS_ENHANCED.js
  if (data.startsWith('cmd_')) {
    var command = data.replace('cmd_', '');
    if (typeof handleTelegramCommand === 'function') {
      var fakeMessage = {
        text: '/' + command,
        chat: { id: chatId },
        from: query.from
      };
      return handleTelegramCommand(fakeMessage);
    }
  }
  
  switch(data) {
    case 'report_month':
      return sendMonthlyReport(chatId, userId);
      
    case 'report_today':
      return sendTodayReport(chatId, userId);
      
    case 'report_week':
      return sendWeekReport(chatId, userId);
      
    case 'budgets':
      return sendBudgetsStatus(chatId, userId);
      
    case 'last_10':
      return sendLastTransactions(chatId, userId, 10);
      
    case 'add_transaction':
      return sendMessage(chatId, '➕ *إضافة عملية جديدة*\n\nأرسل بالصيغة:\n`أضف: المبلغ | الجهة | التصنيف`\n\nمثال:\n`أضف: 50 | ماكدونالدز | مطاعم`', {parse_mode: 'Markdown'});
      
    case 'search':
      return sendSearchPrompt(chatId, '');
      
    case 'settings':
      return sendSettings(chatId, userId);
      
    case 'help':
      return sendHelpMessage(chatId);
      
    case 'main_menu':
      return sendMainMenu(chatId);
      
    case 'export_excel':
      return exportToExcel(chatId, userId);
      
    default:
      return sendMessage(chatId, '❌ خيار غير معروف');
  }
}

// ================================
// 9. وظائف مساعدة
// ================================

function formatMoney(amount) {
  if (isNaN(amount)) return '0.00';
  return Math.abs(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatDate(date) {
  var months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  return date.getDate() + ' ' + months[date.getMonth()] + ' ' + date.getFullYear();
}

function getMonthName(monthIndex) {
  var months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  return months[monthIndex];
}

function createProgressBar(percentage) {
  var total = 10;
  var filled = Math.round(percentage / 10);
  var empty = total - filled;
  
  return '█'.repeat(Math.max(0, filled)) + '░'.repeat(Math.max(0, empty));
}

function sendMessage(chatId, text, options) {
  if (typeof sendTelegram_ === 'function') {
    // sendTelegram_ expects only 2 params: chatId and text
    return sendTelegram_(chatId, text);
  }
  Logger.log('sendTelegram_ not available');
  return {ok: false};
}

function answerCallbackQuery(queryId, text) {
  var url = 'https://api.telegram.org/bot' + ENV.TELEGRAM_TOKEN + '/answerCallbackQuery';
  
  var payload = {
    callback_query_id: queryId,
    text: text
  };
  
  try {
    UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload)
    });
  } catch (e) {
    Logger.log('Error answering callback: ' + e);
  }
}

function checkBudgetAlertsForUser(userId) {
  // استدعاء من MarketingFeatures.js إذا كان موجود
  if (typeof checkBudgetAlerts === 'function') {
    try {
      // checkBudgetAlerts expects no params
      return checkBudgetAlerts();
    } catch (e) {
      Logger.log('Error checking alerts: ' + e);
    }
  }
  return [];
}

// ================================
// 10. وظائف إضافية (placeholder)
// ================================

function sendWeekReport(chatId, userId) {
  return sendMessage(chatId, '📊 تقرير الأسبوع قيد التطوير...', {
    reply_markup: {
      inline_keyboard: [[{text: '🔙 القائمة', callback_data: 'main_menu'}]]
    }
  });
}

function sendLastTransactions(chatId, userId, count) {
  return sendMessage(chatId, '📜 آخر ' + count + ' عمليات قيد التطوير...', {
    reply_markup: {
      inline_keyboard: [[{text: '🔙 القائمة', callback_data: 'main_menu'}]]
    }
  });
}

function sendCategoriesList(chatId) {
  return sendMessage(chatId, '📁 قائمة التصنيفات قيد التطوير...');
}

function sendSearchPrompt(chatId, query) {
  return sendMessage(chatId, '🔍 البحث قيد التطوير...');
}

function processManualAdd(chatId, text, userId) {
  return sendMessage(chatId, '➕ إضافة عملية يدوية قيد التطوير...');
}

function sendEditOptions(chatId) {
  return sendMessage(chatId, '✏️ تعديل العمليات قيد التطوير...');
}

function sendDeleteConfirmation(chatId, args) {
  return sendMessage(chatId, '🗑️ حذف العمليات قيد التطوير...');
}

function exportToExcel(chatId, userId) {
  return sendMessage(chatId, '📥 تصدير البيانات قيد التطوير...');
}

function sendSettings(chatId, userId) {
  return sendMessage(chatId, '⚙️ الإعدادات قيد التطوير...');
}

function sendHelpMessage(chatId) {
  var helpText = [
    '❓ *المساعدة - MoneyTracker V1.0*',
    '',
    '📋 *الأوامر المتاحة:*',
    '',
    '*التقارير:*',
    '/report - تقرير الشهر',
    '/today - ملخص اليوم',
    '/week - ملخص الأسبوع',
    '',
    '*الميزانيات:*',
    '/budgets - حالة الميزانيات',
    '/categories - التصنيفات',
    '',
    '*العمليات:*',
    '/add - إضافة عملية',
    '/last 10 - آخر 10 عمليات',
    '/search - بحث',
    '',
    '*الإدارة:*',
    '/edit - تعديل',
    '/delete - حذف',
    '/export - تصدير',
    '',
    '*أخرى:*',
    '/settings - الإعدادات',
    '/help - المساعدة',
    '/menu - القائمة الرئيسية',
    '',
    '💡 *نصيحة:* يمكنك الإضافة المباشرة بإرسال:',
    '`أضف: 50 | مطعم | مطاعم`'
  ].join('\n');
  
  return sendMessage(chatId, helpText, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[{text: '🔙 القائمة الرئيسية', callback_data: 'main_menu'}]]
    }
  });
}

function handleTextMessage(chatId, text, message) {
  // معالجة النص كإضافة عملية
  if (text.match(/أضف[:：]\s*.+/i)) {
    return processManualAdd(chatId, text, message.from ? message.from.id : null);
  }
  
  return sendMessage(chatId, '💬 استخدم /menu لعرض الخيارات المتاحة');
}
