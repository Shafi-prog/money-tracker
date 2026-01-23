/**
 * ============================================
 * SJA-V1 | Account Registry & Detection
 * ============================================
 * 
 * نظام تعريف وتتبع البطاقات والحسابات البنكية
 * By: Shafi Jahz Almutiry
 */

// ================================
// 1. إنشاء جدول Account Registry
// ================================

function SJA_setupAccountRegistry() {
  var ss = _ss();
  
  // إنشاء ورقة Account_Registry إن لم تكن موجودة
  var sheet = ss.getSheetByName('Account_Registry');
  if (!sheet) {
    sheet = ss.insertSheet('Account_Registry');
    
    // Headers
    var headers = [
      'Account ID',      // مثال: "9767"
      'نوع الحساب',      // بطاقة ائتمان | حساب جاري | محفظة رقمية
      'اسم البنك',       // مثال: "البنك الأهلي"
      'آخر 4 أرقام',     // مثال: "9767"
      'Phone Pattern',  // مثال: "920001000|NCB|AlAhli"
      'SMS Pattern',    // مثال: "9767|xxxx9767|***9767"
      'User ID',        // مثال: "USER1"
      'حالة',           // نشط | معطل
      'ملاحظات',        // أي ملاحظات إضافية
      'تاريخ التسجيل'   // تاريخ إضافة الحساب
    ];
    
    sheet.appendRow(headers);
    
    // تنسيق الـ Headers
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#667eea')
      .setFontColor('#ffffff')
      .setFontWeight('bold')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');
    
    sheet.setFrozenRows(1);
    
    // تنسيق الأعمدة
    sheet.setColumnWidth(1, 120);  // Account ID
    sheet.setColumnWidth(2, 150);  // نوع الحساب
    sheet.setColumnWidth(3, 150);  // اسم البنك
    sheet.setColumnWidth(4, 120);  // آخر 4 أرقام
    sheet.setColumnWidth(5, 200);  // Phone Pattern
    sheet.setColumnWidth(6, 250);  // SMS Pattern
    sheet.setColumnWidth(7, 100);  // User ID
    sheet.setColumnWidth(8, 100);  // حالة
    sheet.setColumnWidth(9, 250);  // ملاحظات
    sheet.setColumnWidth(10, 150); // تاريخ التسجيل
    
    Logger.log('✅ Account_Registry تم إنشاؤه');
  } else {
    Logger.log('⚠️ Account_Registry موجود مسبقاً');
  }
  
  return {ok: true, message: 'Account Registry ready'};
}

// ================================
// 2. تسجيل بطاقة/حساب جديد
// ================================

function SJA_registerAccount(config) {
  var ss = _ss();
  var sheet = ss.getSheetByName('Account_Registry');
  
  if (!sheet) {
    throw new Error('⚠️ يجب تشغيل SJA_setupAccountRegistry() أولاً');
  }
  
  // التحقق من عدم وجود نفس Account ID
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === config.accountId) {
      Logger.log('⚠️ Account ID موجود مسبقاً: ' + config.accountId);
      return {ok: false, error: 'Duplicate Account ID'};
    }
  }
  
  var row = [
    config.accountId || '',           // Account ID
    config.type || 'بطاقة ائتمان',    // نوع الحساب
    config.bankName || '',            // اسم البنك
    config.last4 || config.accountId, // آخر 4 أرقام
    config.phonePattern || '',        // Phone Pattern
    config.smsPattern || '',          // SMS Pattern
    config.userId || 'USER1',         // User ID
    config.status || 'نشط',           // حالة
    config.notes || '',               // ملاحظات
    new Date()                        // تاريخ التسجيل
  ];
  
  sheet.appendRow(row);
  
  Logger.log('✅ تم تسجيل الحساب: ' + config.accountId + ' (' + config.bankName + ')');
  
  return {
    ok: true, 
    accountId: config.accountId,
    bankName: config.bankName,
    userId: config.userId
  };
}

// ================================
// 3. أمثلة لتسجيل البطاقات
// ================================

function SJA_registerSampleCards() {
  Logger.log('🚀 بدء تسجيل بطاقات تجريبية...');
  
  // بطاقة 1: البنك الأهلي
  SJA_registerAccount({
    accountId: '9767',
    type: 'بطاقة ائتمان',
    bankName: 'البنك الأهلي',
    last4: '9767',
    phonePattern: '920001000|NCB|AlAhli|الأهلي',
    smsPattern: '9767|xxxx9767|***9767|xx9767',
    userId: 'USER1',
    notes: 'بطاقة فيزا الرئيسية - حد ائتماني 50,000'
  });
  
  // بطاقة 2: بنك ساب
  SJA_registerAccount({
    accountId: '1234',
    type: 'حساب جاري',
    bankName: 'بنك ساب',
    last4: '1234',
    phonePattern: '920005588|SABB|ساب',
    smsPattern: '1234|xxxx1234|***1234|xx1234',
    userId: 'USER1',
    notes: 'حساب الراتب الرئيسي'
  });
  
  // بطاقة 3: بنك الراجحي
  SJA_registerAccount({
    accountId: '5678',
    type: 'بطاقة مدى',
    bankName: 'بنك الراجحي',
    last4: '5678',
    phonePattern: '920003344|Rajhi|الراجحي',
    smsPattern: '5678|xxxx5678|***5678|xx5678',
    userId: 'USER1',
    notes: 'بطاقة مدى للمشتريات اليومية'
  });
  
  // بطاقة 4: stc pay
  SJA_registerAccount({
    accountId: 'STC001',
    type: 'محفظة رقمية',
    bankName: 'stc pay',
    last4: 'STC001',
    phonePattern: 'stcpay|STC',
    smsPattern: 'stc pay|stcpay',
    userId: 'USER1',
    notes: 'محفظة رقمية للمدفوعات السريعة'
  });
  
  // بطاقة 5: مستخدم آخر (USER2)
  SJA_registerAccount({
    accountId: '4321',
    type: 'بطاقة ائتمان',
    bankName: 'بنك الإنماء',
    last4: '4321',
    phonePattern: '920001222|ALINMA|الإنماء',
    smsPattern: '4321|xxxx4321|***4321',
    userId: 'USER2',
    notes: 'بطاقة للمستخدم الثاني'
  });
  
  Logger.log('✅ تم تسجيل 5 بطاقات/حسابات بنجاح');
  
  return {ok: true, count: 5};
}

// ================================
// 4. اكتشاف الحساب من SMS
// ================================

function SJA_detectAccountFromSMS(smsText) {
  var ss = _ss();
  var sheet = ss.getSheetByName('Account_Registry');
  
  if (!sheet) {
    Logger.log('⚠️ Account_Registry غير موجود');
    return null;
  }
  
  var data = sheet.getDataRange().getValues();
  
  // تخطي الـ header
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var accountId = row[0];
    var type = row[1];
    var bankName = row[2];
    var phonePattern = row[4];
    var smsPattern = row[5];
    var userId = row[6];
    var status = row[7];
    
    // تجاهل الحسابات المعطلة
    if (status !== 'نشط') continue;
    
    // البحث بـ SMS Pattern أولاً (أعلى دقة)
    if (smsPattern) {
      var patterns = smsPattern.split('|');
      for (var p = 0; p < patterns.length; p++) {
        var pattern = patterns[p].trim();
        if (pattern && smsText.indexOf(pattern) !== -1) {
          Logger.log('✅ تم التعرف على الحساب: ' + accountId + ' (' + bankName + ') عبر SMS: ' + pattern);
          return {
            accountId: accountId,
            type: type,
            bankName: bankName,
            userId: userId,
            matchedBy: 'SMS Pattern: ' + pattern
          };
        }
      }
    }
    
    // البحث بـ Phone Pattern (احتياطي)
    if (phonePattern) {
      var phonePatterns = phonePattern.split('|');
      for (var pp = 0; pp < phonePatterns.length; pp++) {
        var phoneP = phonePatterns[pp].trim();
        if (phoneP && smsText.indexOf(phoneP) !== -1) {
          Logger.log('✅ تم التعرف على الحساب: ' + accountId + ' (' + bankName + ') عبر Phone: ' + phoneP);
          return {
            accountId: accountId,
            type: type,
            bankName: bankName,
            userId: userId,
            matchedBy: 'Phone Pattern: ' + phoneP
          };
        }
      }
    }
  }
  
  Logger.log('⚠️ لم يتم التعرف على الحساب من SMS');
  return null;
}

// ================================
// 5. الحصول على جميع حسابات مستخدم
// ================================

function SJA_getUserAccounts(userId) {
  var ss = _ss();
  var sheet = ss.getSheetByName('Account_Registry');
  
  if (!sheet) {
    return [];
  }
  
  var data = sheet.getDataRange().getValues();
  var accounts = [];
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][6] === userId && data[i][7] === 'نشط') {
      accounts.push({
        accountId: data[i][0],
        type: data[i][1],
        bankName: data[i][2],
        last4: data[i][3],
        notes: data[i][8]
      });
    }
  }
  
  Logger.log('✅ تم العثور على ' + accounts.length + ' حساب للمستخدم ' + userId);
  
  return accounts;
}

// ================================
// 6. تحديث حالة حساب
// ================================

function SJA_updateAccountStatus(accountId, newStatus) {
  var ss = _ss();
  var sheet = ss.getSheetByName('Account_Registry');
  
  if (!sheet) {
    return {ok: false, error: 'Account_Registry not found'};
  }
  
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === accountId) {
      sheet.getRange(i + 1, 8).setValue(newStatus); // عمود "حالة"
      Logger.log('✅ تم تحديث حالة الحساب ' + accountId + ' إلى: ' + newStatus);
      return {ok: true, accountId: accountId, status: newStatus};
    }
  }
  
  return {ok: false, error: 'Account not found'};
}

// ================================
// 7. اختبار النظام
// ================================

function SJA_testAccountDetection() {
  Logger.log('🧪 بدء اختبار Account Detection...');
  
  // أمثلة SMS حقيقية
  var testMessages = [
    'مشترياتك بمبلغ 150.50 ريال في ستاربكس باستخدام بطاقة xxxx9767',
    'حوالة وارده بمبلغ 5000 ريال لحسابك المنتهي بـ 1234 من البنك',
    'عملية سحب نقدي بمبلغ 300 ريال من بطاقة مدى xxxx5678',
    'تم خصم 99 ريال من محفظة stc pay',
    'عملية شراء بمبلغ 450 ريال باستخدام بطاقة xxxx4321'
  ];
  
  var expectedAccounts = ['9767', '1234', '5678', 'STC001', '4321'];
  
  for (var i = 0; i < testMessages.length; i++) {
    Logger.log('\n--- اختبار ' + (i + 1) + ' ---');
    Logger.log('SMS: ' + testMessages[i]);
    
    var detected = SJA_detectAccountFromSMS(testMessages[i]);
    
    if (detected) {
      Logger.log('✅ نجح: ' + detected.accountId + ' (' + detected.bankName + ')');
      if (detected.accountId === expectedAccounts[i]) {
        Logger.log('✅ مطابق للمتوقع!');
      } else {
        Logger.log('⚠️ غير متوقع! توقع: ' + expectedAccounts[i]);
      }
    } else {
      Logger.log('❌ فشل: لم يتم التعرف');
    }
  }
  
  Logger.log('\n✅ انتهى الاختبار');
}

// ================================
// 8. Quick Setup - كل شيء دفعة واحدة
// ================================

function SJA_quickSetupAccounts() {
  Logger.log('🚀 بدء Quick Setup للحسابات...');
  
  // 1. إنشاء الجدول
  SJA_setupAccountRegistry();
  
  // 2. تسجيل بطاقات تجريبية
  SJA_registerSampleCards();
  
  // 3. اختبار النظام
  SJA_testAccountDetection();
  
  Logger.log('\n✅ تم إعداد نظام الحسابات بنجاح!');
  Logger.log('📋 افتح Google Sheets → Account_Registry للمراجعة');
  
  return {ok: true, message: 'Setup complete'};
}
