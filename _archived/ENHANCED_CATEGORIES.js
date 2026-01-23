/**
 * ENHANCED_CATEGORIES.js
 * نظام تصنيفات شامل - أساسي وفرعي
 * Based on user requirements for comprehensive categorization
 */

/**
 * التصنيفات الأساسية والفرعية الشاملة
 */
var CATEGORIES_ENHANCED = {
  // 1. الطعام والشراب
  'Food & Dining': {
    icon: '🍽️',
    subcategories: [
      'مطاعم',
      'كافيهات',
      'وجبات سريعة',
      'بقالة',
      'سوبر ماركت',
      'مخابز',
      'حلويات',
      'توصيل طعام'
    ]
  },
  
  // 2. النقل والمواصلات
  'Transportation': {
    icon: '🚗',
    subcategories: [
      'وقود (بنزين)',
      'أوبر/كريم',
      'صيانة السيارة',
      'قطع غيار',
      'غسيل السيارة',
      'مواقف',
      'تأمين السيارة',
      'رسوم طرق'
    ]
  },
  
  // 3. التسوق
  'Shopping': {
    icon: '🛍️',
    subcategories: [
      'ملابس',
      'أحذية',
      'إكسسوارات',
      'إلكترونيات',
      'أثاث',
      'ديكور منزلي',
      'هدايا',
      'كتب',
      'ألعاب'
    ]
  },
  
  // 4. الفواتير والخدمات
  'Bills & Utilities': {
    icon: '📄',
    subcategories: [
      'كهرباء',
      'ماء',
      'جوال (STC/Zain/Mobily)',
      'إنترنت منزلي',
      'رسوم حكومية',
      'رسوم بنكية',
      'اشتراكات',
      'صيانة منزل'
    ]
  },
  
  // 5. الترفيه
  'Entertainment': {
    icon: '🎬',
    subcategories: [
      'سينما',
      'ألعاب إلكترونية',
      'اشتراكات رقمية (Netflix/Shahid)',
      'رحلات ترفيهية',
      'حفلات ومناسبات',
      'هوايات',
      'رياضة',
      'سفر وسياحة'
    ]
  },
  
  // 6. الصحة
  'Healthcare': {
    icon: '🏥',
    subcategories: [
      'مستشفيات',
      'عيادات',
      'أدوية',
      'صيدليات',
      'تأمين صحي',
      'تحاليل طبية',
      'نظارات',
      'أسنان'
    ]
  },
  
  // 7. التعليم
  'Education': {
    icon: '📚',
    subcategories: [
      'رسوم دراسية',
      'دورات تدريبية',
      'كتب دراسية',
      'قرطاسية',
      'دروس خصوصية',
      'شهادات احترافية'
    ]
  },
  
  // 8. العائلة والأطفال
  'Family & Kids': {
    icon: '👨‍👩‍👧‍👦',
    subcategories: [
      'حفاضات',
      'ألعاب أطفال',
      'ملابس أطفال',
      'حضانة',
      'مصروف أطفال',
      'أنشطة أطفال'
    ]
  },
  
  // 9. الجمال والعناية الشخصية
  'Personal Care': {
    icon: '💅',
    subcategories: [
      'صالون حلاقة',
      'مستحضرات تجميل',
      'عطور',
      'عناية بالبشرة',
      'عناية بالشعر',
      'منتجات صحية'
    ]
  },
  
  // 10. المنزل
  'Home & Garden': {
    icon: '🏠',
    subcategories: [
      'إيجار',
      'أدوات منزلية',
      'نباتات',
      'تنظيف',
      'مستلزمات مطبخ',
      'فرش وسجاد'
    ]
  },
  
  // 11. الأقساط
  'Installments': {
    icon: '💳',
    subcategories: [
      'تابي (Tabby)',
      'تمارا (Tamara)',
      'أقساط بنكية',
      'تمويل شخصي',
      'تقسيط متجر'
    ]
  },
  
  // 12. التبرعات والزكاة
  'Charity & Donations': {
    icon: '🤲',
    subcategories: [
      'زكاة',
      'صدقة',
      'جمعيات خيرية',
      'وقف',
      'كفالة يتيم',
      'مساعدات'
    ]
  },
  
  // 13. الاستثمار والادخار
  'Investment & Savings': {
    icon: '💰',
    subcategories: [
      'ادخار شهري',
      'أسهم',
      'عقارات',
      'ذهب',
      'صناديق استثمارية',
      'تأمين ادخاري'
    ]
  },
  
  // 14. العمل والمهنة
  'Work & Business': {
    icon: '💼',
    subcategories: [
      'أدوات عمل',
      'اجتماعات عمل',
      'تطوير مهني',
      'تراخيص عمل',
      'مصاريف مكتب',
      'استشارات'
    ]
  },
  
  // 15. التأمينات
  'Insurance': {
    icon: '🛡️',
    subcategories: [
      'تأمين طبي',
      'تأمين سيارة',
      'تأمين منزل',
      'تأمين على الحياة',
      'تأمينات أخرى'
    ]
  },
  
  // 16. الحوالات - جديد
  'Transfers': {
    icon: '🔄',
    subcategories: [
      'حوالة لأحد الأقارب',
      'حوالة لصديق',
      'سلفة (قرض)',
      'استرجاع مبلغ',
      'حوالة بين حساباتي',
      'مصاريف مشتركة'
    ]
  },
  
  // 17. أخرى
  'Other': {
    icon: '📦',
    subcategories: [
      'غير مصنف',
      'نثريات',
      'طوارئ',
      'متنوعة'
    ]
  }
};

/**
 * إنشاء ورقة التصنيفات في Google Sheets
 */
function createCategoriesSheet() {
  var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!sheetId) {
    throw new Error('SHEET_ID not found');
  }
  
  var ss = SpreadsheetApp.openById(sheetId);
  
  // حذف الورقة القديمة إن وجدت
  var existingSheet = ss.getSheetByName('Categories');
  if (existingSheet) {
    ss.deleteSheet(existingSheet);
  }
  
  // إنشاء ورقة جديدة
  var sheet = ss.insertSheet('Categories');
  
  // إعداد الرأس
  var headers = ['Main Category', 'Icon', 'Subcategory', 'Is Active', 'Notes'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // تنسيق الرأس
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#667eea')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  
  // إضافة البيانات
  var data = [];
  var categories = Object.keys(CATEGORIES_ENHANCED);
  
  categories.forEach(function(mainCat) {
    var catInfo = CATEGORIES_ENHANCED[mainCat];
    var subcats = catInfo.subcategories || [];
    
    if (subcats.length === 0) {
      data.push([mainCat, catInfo.icon, '', 'نعم', '']);
    } else {
      subcats.forEach(function(subcat, index) {
        data.push([
          index === 0 ? mainCat : '',
          index === 0 ? catInfo.icon : '',
          subcat,
          'نعم',
          ''
        ]);
      });
    }
  });
  
  if (data.length > 0) {
    sheet.getRange(2, 1, data.length, 5).setValues(data);
  }
  
  // تنسيق الأعمدة
  sheet.setColumnWidth(1, 200); // Main Category
  sheet.setColumnWidth(2, 60);  // Icon
  sheet.setColumnWidth(3, 200); // Subcategory
  sheet.setColumnWidth(4, 100); // Is Active
  sheet.setColumnWidth(5, 250); // Notes
  
  // تجميد الصف الأول
  sheet.setFrozenRows(1);
  
  // إضافة حدود
  var lastRow = sheet.getLastRow();
  sheet.getRange(1, 1, lastRow, 5).setBorder(
    true, true, true, true, true, true,
    '#e0e0e0', SpreadsheetApp.BorderStyle.SOLID
  );
  
  // RTL direction
  sheet.setRightToLeft(true);
  
  Logger.log('✅ Categories sheet created with ' + categories.length + ' main categories');
  return sheet;
}

/**
 * الحصول على جميع التصنيفات
 */
function getAllCategories() {
  return Object.keys(CATEGORIES_ENHANCED);
}

/**
 * الحصول على التصنيفات الفرعية لتصنيف رئيسي
 */
function getSubcategories(mainCategory) {
  if (CATEGORIES_ENHANCED[mainCategory]) {
    return CATEGORIES_ENHANCED[mainCategory].subcategories || [];
  }
  return [];
}

/**
 * الحصول على أيقونة التصنيف
 */
function getCategoryIcon(mainCategory) {
  if (CATEGORIES_ENHANCED[mainCategory]) {
    return CATEGORIES_ENHANCED[mainCategory].icon || '📦';
  }
  return '📦';
}

/**
 * تصنيف تلقائي بناءً على اسم التاجر
 */
function autoClassifyMerchant(merchantName) {
  var merchant = String(merchantName || '').toLowerCase();
  
  // Food & Dining
  if (merchant.match(/starbucks|مقهى|coffee|cafe|restaurant|مطعم|burger|pizza|kfc|mcdon|subway|herfy|بيك|الباشا/)) {
    return { main: 'Food & Dining', sub: merchant.match(/starbucks|coffee|cafe|مقهى/) ? 'كافيهات' : 'مطاعم' };
  }
  
  // Transportation
  if (merchant.match(/petro|بترو|وقود|benzin|fuel|uber|careem|كريم|أوبر/)) {
    return { main: 'Transportation', sub: merchant.match(/uber|careem|كريم|أوبر/) ? 'أوبر/كريم' : 'وقود (بنزين)' };
  }
  
  // Shopping
  if (merchant.match(/panda|carrefour|كارفور|danube|tamimi|عثيم|lulu|mall|سنتر|center/)) {
    return { main: 'Shopping', sub: 'سوبر ماركت' };
  }
  
  // Bills
  if (merchant.match(/stc|mobily|zain|jawwy|electricity|كهرباء|sec|saudi electric/)) {
    return { main: 'Bills & Utilities', sub: merchant.match(/stc|mobily|zain|jawwy/) ? 'جوال (STC/Zain/Mobily)' : 'كهرباء' };
  }
  
  // Entertainment
  if (merchant.match(/cinema|سينما|vox|muvi|netflix|shahid|osn|playstation|xbox|steam/)) {
    return { main: 'Entertainment', sub: merchant.match(/netflix|shahid|osn/) ? 'اشتراكات رقمية (Netflix/Shahid)' : 'سينما' };
  }
  
  // Healthcare
  if (merchant.match(/pharmacy|صيدلية|nahdi|دواء|hospital|مستشفى|clinic|عيادة/)) {
    return { main: 'Healthcare', sub: merchant.match(/pharmacy|صيدلية|nahdi|دواء/) ? 'صيدليات' : 'عيادات' };
  }
  
  // Charity
  if (merchant.match(/خيري|صدقة|زكاة|charity|donation|وقف/)) {
    return { main: 'Charity & Donations', sub: 'صدقة' };
  }
  
  // Installments
  if (merchant.match(/tabby|tamara|تابي|تمارا/)) {
    return { main: 'Installments', sub: merchant.match(/tabby|تابي/) ? 'تابي (Tabby)' : 'تمارا (Tamara)' };
  }
  
  return { main: 'Other', sub: 'غير مصنف' };
}
