/********** CategoryManager.js - Category Management System **********/

/**
 * Category Management System
 * Provides hierarchical category management, cleanup, and validation
 */

/**
 * Ensure Categories sheet exists with proper structure
 */
function ensureCategoriesSheet_() {
  try {
    var ss = _ss();
    var sheet = ss.getSheetByName('Categories');

    if (!sheet) {
      Logger.log('Creating Categories sheet');
      sheet = ss.insertSheet('Categories');
      sheet.appendRow(['Category ID', 'Category Name', 'Parent Category', 'Type', 'Icon', 'Color', 'Description', 'Active']);
      sheet.setFrozenRows(1);
      sheet.getRange('A1:H1').setFontWeight('bold').setBackground('#2196F3').setFontColor('#FFFFFF');

      // Add default categories
      var defaultCategories = [
        ['food', 'طعام', '', 'expense', '🍔', '#FF5722', 'جميع المصروفات المتعلقة بالطعام والشراب', true],
        ['groceries', 'مواد غذائية', 'food', 'expense', '🛒', '#4CAF50', 'البقالة والسوبرماركت', true],
        ['restaurants', 'مطاعم ومقاهي', 'food', 'expense', '☕', '#FF9800', 'المطاعم والمقاهي', true],
        ['transport', 'مواصلات', '', 'expense', '🚗', '#2196F3', 'المواصلات والتنقل', true],
        ['fuel', 'مواصلات وبنزين', 'transport', 'expense', '⛽', '#607D8B', 'البنزين والوقود', true],
        ['bills', 'فواتير ورسوم', '', 'expense', '💡', '#9C27B0', 'الفواتير والخدمات', true],
        ['shopping', 'تسوق وملابس', '', 'expense', '🛍️', '#E91E63', 'التسوق والملابس', true],
        ['health', 'صحة وأدوية', '', 'expense', '🏥', '#F44336', 'الصحة والأدوية', true],
        ['entertainment', 'ترفيه', '', 'expense', '🎮', '#3F51B5', 'الترفيه والتسلية', true],
        ['education', 'تعليم', '', 'expense', '📚', '#009688', 'التعليم والدورات', true],
        ['transfers_in', 'حوالات واردة', '', 'income', '📥', '#4CAF50', 'الحوالات الواردة', true],
        ['transfers_out', 'حوالات صادرة', '', 'expense', '📤', '#F44336', 'الحوالات الصادرة', true],
        ['salary', 'راتب', '', 'income', '💰', '#4CAF50', 'الراتب والدخل', true],
        ['other', 'أخرى', '', 'expense', '📝', '#9E9E9E', 'مصروفات أخرى', true],
        ['income_other', 'دخل آخر', '', 'income', '💵', '#4CAF50', 'دخل آخر', true]
      ];

      for (var i = 0; i < defaultCategories.length; i++) {
        sheet.appendRow(defaultCategories[i]);
      }

      Logger.log('Categories sheet created with ' + defaultCategories.length + ' default categories');
    }

    return sheet;
  } catch (e) {
    Logger.log('Error ensuring Categories sheet exists: ' + e);
    return null;
  }
}

/**
 * Get all active categories
 */
function getCategories_() {
  try {
    var sheet = ensureCategoriesSheet_();
    if (!sheet) return [];

    var data = sheet.getDataRange().getValues();
    var categories = [];

    for (var i = 1; i < data.length; i++) {
      if (data[i][7] === true || data[i][7] === 'TRUE') { // Active
        categories.push({
          id: data[i][0],
          name: data[i][1],
          parent: data[i][2],
          type: data[i][3],
          icon: data[i][4],
          color: data[i][5],
          description: data[i][6],
          active: data[i][7]
        });
      }
    }

    return categories;
  } catch (e) {
    Logger.log('Error getting categories: ' + e);
    return [];
  }
}

/**
 * Get category by name (case insensitive)
 */
function getCategoryByName_(name) {
  var categories = getCategories_();
  var normalizedName = String(name || '').toLowerCase().trim();

  for (var i = 0; i < categories.length; i++) {
    if (categories[i].name.toLowerCase() === normalizedName) {
      return categories[i];
    }
  }

  return null;
}

/**
 * Validate category exists and is active
 */
function validateCategory_(categoryName) {
  return getCategoryByName_(categoryName) !== null;
}

/**
 * Clean up duplicate/invalid categories in transactions
 */
function cleanupTransactionCategories_() {
  try {
    var sheet = _sheet('Sheet1');
    if (!sheet) return { success: false, error: 'Sheet1 not found' };

    var data = sheet.getDataRange().getValues();
    var categories = getCategories_();
    var categoryMap = {};

    // Create lookup map
    for (var i = 0; i < categories.length; i++) {
      categoryMap[categories[i].name.toLowerCase()] = categories[i].name;
    }

    var updated = 0;
    var invalid = [];

    for (var row = 1; row < data.length; row++) {
      var currentCategory = String(data[row][10] || ''); // Category column (K)

      if (!currentCategory) continue;

      var normalized = currentCategory.toLowerCase().trim();
      var validCategory = categoryMap[normalized];

      if (!validCategory) {
        // Try to find closest match or map to "other"
        invalid.push(currentCategory);

        // Map common duplicates
        if (normalized.includes('طعام') || normalized.includes('food')) {
          validCategory = 'طعام';
        } else if (normalized.includes('بقال') || normalized.includes('grocer')) {
          validCategory = 'مواد غذائية';
        } else if (normalized.includes('مطعم') || normalized.includes('restaurant')) {
          validCategory = 'مطاعم ومقاهي';
        } else if (normalized.includes('نقل') || normalized.includes('transport')) {
          validCategory = 'مواصلات';
        } else if (normalized.includes('فاتور') || normalized.includes('bill')) {
          validCategory = 'فواتير ورسوم';
        } else {
          validCategory = 'أخرى';
        }

        sheet.getRange(row + 1, 11).setValue(validCategory); // Column K
        updated++;
      }
    }

    Logger.log('Category cleanup: ' + updated + ' transactions updated');
    if (invalid.length > 0) {
      Logger.log('Invalid categories found: ' + invalid.join(', '));
    }

    return {
      success: true,
      updated: updated,
      invalid: invalid,
      message: 'تم تنظيف ' + updated + ' معاملة'
    };

  } catch (e) {
    Logger.log('Error cleaning up categories: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Repair merchant names if they were overwritten by category cleanup
 */
function repairMerchantsFromRaw_() {
  try {
    var sheet = _sheet('Sheet1');
    if (!sheet) return { success: false, error: 'Sheet1 not found' };

    var data = sheet.getDataRange().getValues();
    var categories = getCategories_();
    var categorySet = {};
    for (var i = 0; i < categories.length; i++) {
      categorySet[String(categories[i].name || '').toLowerCase()] = true;
    }

    var repaired = 0;
    var skipped = 0;

    for (var row = 1; row < data.length; row++) {
      var merchant = String(data[row][9] || '').trim();
      var raw = String(data[row][12] || '').trim();
      if (!raw) continue;

      var isCategoryLike = !merchant || merchant === 'أخرى' || categorySet[merchant.toLowerCase()];
      if (!isCategoryLike) continue;

      var newMerchant = '';
      if (typeof parseBasicSMS_ === 'function') {
        try {
          var parsed = parseBasicSMS_(raw);
          if (parsed && parsed.merchant) newMerchant = String(parsed.merchant || '').trim();
        } catch (eP) {}
      }

      if (!newMerchant) {
        var m = raw.match(/من\s+(.+?)(?:\n|\s+عبر|\s+في|$)/i) || raw.match(/لدى[:،]?\s*(.+?)(?:\n|\s+عبر|\s+في|$)/i);
        if (m && m[1]) newMerchant = String(m[1]).trim();
      }

      if (!newMerchant || categorySet[newMerchant.toLowerCase()]) {
        skipped++;
        continue;
      }

      sheet.getRange(row + 1, 10).setValue(newMerchant); // Merchant column (J)
      repaired++;
    }

    return { success: true, repaired: repaired, skipped: skipped };
  } catch (e) {
    Logger.log('repairMerchantsFromRaw_ error: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Clean up budget categories
 */
function cleanupBudgetCategories_() {
  try {
    var budgetSheet = _sheet('Budgets');
    if (!budgetSheet) return { success: false, error: 'Budgets sheet not found' };

    var data = budgetSheet.getDataRange().getValues();
    var categories = getCategories_();
    var categoryMap = {};

    // Create lookup map
    for (var i = 0; i < categories.length; i++) {
      categoryMap[categories[i].name.toLowerCase()] = categories[i].name;
    }

    var updated = 0;
    var removed = 0;

    for (var row = data.length - 1; row >= 1; row--) {
      var currentCategory = String(data[row][0] || ''); // Category column (A)

      if (!currentCategory) continue;

      var normalized = currentCategory.toLowerCase().trim();
      var validCategory = categoryMap[normalized];

      if (!validCategory) {
        // Check if it's a test category
        if (normalized.includes('اختبار') || normalized.includes('test') ||
            normalized === 'unknown' || normalized === 'بحث' ||
            normalized.includes('حذف')) {
          budgetSheet.deleteRow(row + 1);
          removed++;
          continue;
        }

        // Try to map to valid category
        if (normalized.includes('طعام') || normalized.includes('food')) {
          validCategory = 'طعام';
        } else if (normalized.includes('بقال') || normalized.includes('grocer')) {
          validCategory = 'مواد غذائية';
        } else if (normalized.includes('مطعم') || normalized.includes('restaurant')) {
          validCategory = 'مطاعم ومقاهي';
        } else {
          validCategory = 'أخرى';
        }

        budgetSheet.getRange(row + 1, 1).setValue(validCategory);
        updated++;
      }
    }

    Logger.log('Budget cleanup: ' + updated + ' updated, ' + removed + ' removed');
    return {
      success: true,
      updated: updated,
      removed: removed,
      message: 'تم تنظيف الميزانيات: ' + updated + ' محدث، ' + removed + ' محذوف'
    };

  } catch (e) {
    Logger.log('Error cleaning up budget categories: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Get category suggestions for autocomplete
 */
function getCategorySuggestions_(query) {
  try {
    var categories = getCategories_();
    var suggestions = [];
    var q = String(query || '').toLowerCase();

    for (var i = 0; i < categories.length; i++) {
      if (categories[i].name.toLowerCase().includes(q)) {
        suggestions.push({
          name: categories[i].name,
          icon: categories[i].icon,
          type: categories[i].type
        });
      }
    }

    return suggestions;
  } catch (e) {
    Logger.log('Error getting category suggestions: ' + e);
    return [];
  }
}

/**
 * Add new category
 */
function addCategory_(categoryData) {
  try {
    var sheet = ensureCategoriesSheet_();
    if (!sheet) return { success: false, error: 'Categories sheet not available' };

    // Validate required fields
    if (!categoryData.name || !categoryData.type) {
      return { success: false, error: 'الاسم والنوع مطلوبان' };
    }

    // Check if category already exists
    if (getCategoryByName_(categoryData.name)) {
      return { success: false, error: 'التصنيف موجود بالفعل' };
    }

    // Generate ID
    var id = categoryData.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    var row = [
      id,
      categoryData.name,
      categoryData.parent || '',
      categoryData.type,
      categoryData.icon || '📝',
      categoryData.color || '#9E9E9E',
      categoryData.description || '',
      true
    ];

    sheet.appendRow(row);

    return { success: true, message: 'تم إضافة التصنيف بنجاح' };

  } catch (e) {
    Logger.log('Error adding category: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Update category
 */
function updateCategory_(categoryId, categoryData) {
  try {
    var sheet = ensureCategoriesSheet_();
    if (!sheet) return { success: false, error: 'Categories sheet not available' };

    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === categoryId) {
        // Update fields
        if (categoryData.name) sheet.getRange(i + 1, 2).setValue(categoryData.name);
        if (categoryData.parent !== undefined) sheet.getRange(i + 1, 3).setValue(categoryData.parent);
        if (categoryData.type) sheet.getRange(i + 1, 4).setValue(categoryData.type);
        if (categoryData.icon) sheet.getRange(i + 1, 5).setValue(categoryData.icon);
        if (categoryData.color) sheet.getRange(i + 1, 6).setValue(categoryData.color);
        if (categoryData.description !== undefined) sheet.getRange(i + 1, 7).setValue(categoryData.description);
        if (categoryData.active !== undefined) sheet.getRange(i + 1, 8).setValue(categoryData.active);

        return { success: true, message: 'تم تحديث التصنيف بنجاح' };
      }
    }

    return { success: false, error: 'التصنيف غير موجود' };

  } catch (e) {
    Logger.log('Error updating category: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Delete category (mark as inactive)
 */
function deleteCategory_(categoryId) {
  try {
    var sheet = ensureCategoriesSheet_();
    if (!sheet) return { success: false, error: 'Categories sheet not available' };

    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === categoryId) {
        sheet.getRange(i + 1, 8).setValue(false); // Mark as inactive
        return { success: true, message: 'تم حذف التصنيف بنجاح' };
      }
    }

    return { success: false, error: 'التصنيف غير موجود' };

  } catch (e) {
    Logger.log('Error deleting category: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Full system cleanup
 */
function performFullCategoryCleanup_() {
  try {
    Logger.log('Starting full category cleanup...');

    var transactionResult = cleanupTransactionCategories_();
    var budgetResult = cleanupBudgetCategories_();

    var message = 'تنظيف كامل للتصنيفات:\n';
    message += 'المعاملات: ' + (transactionResult.success ? transactionResult.message : transactionResult.error) + '\n';
    message += 'الميزانيات: ' + (budgetResult.success ? budgetResult.message : budgetResult.error);

    Logger.log('Full category cleanup completed');

    return {
      success: transactionResult.success && budgetResult.success,
      transactionResult: transactionResult,
      budgetResult: budgetResult,
      message: message
    };

  } catch (e) {
    Logger.log('Error in full category cleanup: ' + e);
    return { success: false, error: e.message };
  }
}