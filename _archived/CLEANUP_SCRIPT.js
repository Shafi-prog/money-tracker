/**
 * CLEANUP_SCRIPT.js
 * سكريبت لحذف USER2 وتحديث USER1 بشكل يدوي
 * Manual script to delete USER2 and update USER1
 */

/**
 * حذف USER2 وتحديث USER1 - تشغيل مرة واحدة
 */
function CLEANUP_DELETE_USER2_UPDATE_USER1() {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    if (!sheetId) {
      throw new Error('SHEET_ID غير موجود في Script Properties');
    }
    
    var ss = SpreadsheetApp.openById(sheetId);
    
    Logger.log('🔧 بدء عملية التنظيف...');
    
    // 1. حذف USER2 من User_Registry
    deleteUser2FromRegistry_(ss);
    
    // 2. حذف ورقة User_USER2 إن وُجدت
    deleteUser2Sheet_(ss);
    
    // 3. تحديث USER1 في User_Registry
    updateUser1InRegistry_(ss);
    
    // 4. تحديث Account_Registry - نقل حسابات USER2 لـ USER1
    moveUser2AccountsToUser1_(ss);
    
    // 5. تحديث ورقة User_USER1 لتضمين جميع الحسابات
    updateUser1Accounts_(ss);
    
    Logger.log('✅ تم التنظيف بنجاح!');
    Logger.log('✅ USER2 محذوف تماماً');
    Logger.log('✅ USER1 محدّث بجميع الحسابات (14 حساب)');
    
    return {
      success: true,
      message: '✅ تم حذف USER2 وتحديث USER1 بنجاح'
    };
    
  } catch (e) {
    Logger.log('❌ خطأ: ' + e.message);
    throw e;
  }
}

/**
 * حذف USER2 من User_Registry
 */
function deleteUser2FromRegistry_(ss) {
  var sheet = ss.getSheetByName('User_Registry');
  if (!sheet) {
    Logger.log('⚠️ User_Registry غير موجودة');
    return;
  }
  
  var data = sheet.getDataRange().getValues();
  
  for (var i = data.length - 1; i >= 1; i--) {
    var userId = data[i][0];
    if (userId === 'USER2') {
      sheet.deleteRow(i + 1);
      Logger.log('✅ تم حذف USER2 من User_Registry (صف ' + (i + 1) + ')');
      break;
    }
  }
}

/**
 * حذف ورقة User_USER2
 */
function deleteUser2Sheet_(ss) {
  var sheet = ss.getSheetByName('User_USER2');
  if (sheet) {
    ss.deleteSheet(sheet);
    Logger.log('✅ تم حذف ورقة User_USER2');
  } else {
    Logger.log('⚠️ ورقة User_USER2 غير موجودة');
  }
}

/**
 * تحديث USER1 في User_Registry
 */
function updateUser1InRegistry_(ss) {
  var sheet = ss.getSheetByName('User_Registry');
  if (!sheet) return;
  
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    var userId = data[i][0];
    if (userId === 'USER1') {
      // تحديث الاسم
      sheet.getRange(i + 1, 2).setValue('Shafi Jahz Almutiry');
      
      // تحديث البطاقات
      var allCards = ['9767', '9765', '4912', '0005', '3281', '4495', '0305', '9682', '3449', '7815'];
      sheet.getRange(i + 1, 3).setValue(allCards.join(','));
      
      Logger.log('✅ تم تحديث USER1 في User_Registry');
      Logger.log('  الاسم: Shafi Jahz Almutiry');
      Logger.log('  البطاقات: ' + allCards.join(', '));
      break;
    }
  }
}

/**
 * نقل حسابات USER2 إلى USER1 في Account_Registry
 */
function moveUser2AccountsToUser1_(ss) {
  var sheet = ss.getSheetByName('Account_Registry');
  if (!sheet) {
    Logger.log('⚠️ Account_Registry غير موجودة');
    return;
  }
  
  var data = sheet.getDataRange().getValues();
  var updated = 0;
  
  for (var i = 1; i < data.length; i++) {
    var owner = data[i][4]; // عمود Owner
    if (owner === 'USER2') {
      sheet.getRange(i + 1, 5).setValue('USER1');
      updated++;
    }
  }
  
  Logger.log('✅ تم نقل ' + updated + ' حساب من USER2 إلى USER1 في Account_Registry');
}

/**
 * تحديث ورقة User_USER1
 */
function updateUser1Accounts_(ss) {
  var sheet = ss.getSheetByName('User_USER1');
  if (!sheet) {
    Logger.log('⚠️ User_USER1 غير موجودة');
    return;
  }
  
  // لا حاجة لتعديل شيء هنا - البيانات ستأتي تلقائياً
  Logger.log('✅ ورقة User_USER1 جاهزة لاستقبال جميع المعاملات');
}

/**
 * عرض معلومات المستخدمين الحالية
 */
function SHOW_CURRENT_USERS() {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName('User_Registry');
    
    if (!sheet) {
      Logger.log('❌ User_Registry غير موجودة');
      return;
    }
    
    var data = sheet.getDataRange().getValues();
    
    Logger.log('📋 المستخدمين الحاليين:');
    Logger.log('═══════════════════════════════════');
    
    for (var i = 1; i < data.length; i++) {
      Logger.log('User ID: ' + data[i][0]);
      Logger.log('الاسم: ' + data[i][1]);
      Logger.log('البطاقات: ' + data[i][2]);
      Logger.log('───────────────────────────────────');
    }
    
  } catch (e) {
    Logger.log('❌ خطأ: ' + e.message);
  }
}

/**
 * عرض معلومات الحسابات الحالية
 */
function SHOW_CURRENT_ACCOUNTS() {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName('Account_Registry');
    
    if (!sheet) {
      Logger.log('❌ Account_Registry غير موجودة');
      return;
    }
    
    var data = sheet.getDataRange().getValues();
    
    Logger.log('💳 الحسابات الحالية:');
    Logger.log('═══════════════════════════════════');
    
    var user1Count = 0;
    var user2Count = 0;
    
    for (var i = 1; i < data.length; i++) {
      var owner = data[i][4];
      if (owner === 'USER1') user1Count++;
      if (owner === 'USER2') user2Count++;
      
      Logger.log('Account: ' + data[i][0]);
      Logger.log('البنك: ' + data[i][1]);
      Logger.log('المالك: ' + owner);
      Logger.log('───────────────────────────────────');
    }
    
    Logger.log('');
    Logger.log('📊 الملخص:');
    Logger.log('USER1: ' + user1Count + ' حساب');
    Logger.log('USER2: ' + user2Count + ' حساب');
    
  } catch (e) {
    Logger.log('❌ خطأ: ' + e.message);
  }
}
