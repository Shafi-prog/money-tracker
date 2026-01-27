/**
 * BEST PRACTICES UTILITIES
 * Professional helper functions following industry standards
 * Based on patterns from Firefly III, Laravel, and enterprise apps
 */

// ═══════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════

var APP_CONFIG = {
  // Queue Management
  QUEUE: {
    BATCH_SIZE: 15,
    LOCK_TIMEOUT_MS: 20000,
    MAX_RETRIES: 3,
    CLEANUP_DAYS: 14,
    PRIORITY_HIGH_DELAY_MS: 100,
    PRIORITY_NORMAL_DELAY_MS: 60000
  },
  
  // Caching Strategy
  CACHE: {
    SHORT_TTL_SEC: 60,        // 1 minute - dynamic data
    MEDIUM_TTL_SEC: 300,      // 5 minutes - semi-static data
    LONG_TTL_SEC: 3600,       // 1 hour - static data
    DAY_TTL_SEC: 86400        // 24 hours - rarely changing data
  },
  
  // Sheet Operations
  SHEETS: {
    MAX_ROWS_BATCH: 1000,
    RETRY_DELAY_MS: 1000,
    MAX_RETRIES: 3
  },
  
  // API Limits
  TELEGRAM: {
    MAX_MESSAGE_LENGTH: 4096,
    RETRY_DELAY_MS: 3000,
    MAX_RETRIES: 3
  },
  
  // Security
  SECURITY: {
    MAX_REQUESTS_PER_MINUTE: 10,
    RATE_LIMIT_WINDOW_SEC: 60,
    MAX_LOGIN_ATTEMPTS: 5
  },
  
  // Environment
  ENV: {
    SPREADSHEET_ID: '1-_yM5c7bt2ALoSnpDfO1yBhqqof8tyAZv5JlsYxUZ0A'
  },

  // Logging
  LOG: {
    MAX_LOG_ROWS: 10000,
    RETENTION_DAYS: 30,
    ENABLE_DEBUG: false
  }
};

/**
 * Get the active spreadsheet safely, supporting both bound and API execution
 * @return {GoogleAppsScript.Spreadsheet.Spreadsheet}
 */
function getSpreadsheet() {
  try {
    return SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(APP_CONFIG.ENV.SPREADSHEET_ID);
  } catch (e) {
    return SpreadsheetApp.openById(APP_CONFIG.ENV.SPREADSHEET_ID);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// LOGGING WITH LEVELS
// ═══════════════════════════════════════════════════════════════════════

var LOG_LEVEL = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4
};

var CURRENT_LOG_LEVEL = LOG_LEVEL.INFO;

/**
 * Structured logging with levels
 * @param {number} level - Log level (LOG_LEVEL.DEBUG, INFO, WARN, ERROR, FATAL)
 * @param {string} component - Component name (e.g., 'Flow', 'Telegram', 'Queue')
 * @param {string} message - Log message
 * @param {Object} [data] - Additional data to log
 */
function log_(level, component, message, data) {
  if (level < CURRENT_LOG_LEVEL) return;
  
  var levels = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
  var timestamp = new Date().toISOString();
  var logMessage = '[' + timestamp + '] [' + levels[level] + '] [' + component + '] ' + message;
  
  // Always log to Logger
  Logger.log(logMessage);
  
  // For ERROR and FATAL, also persist to sheet
  if (level >= LOG_LEVEL.ERROR) {
    try {
      logToSystemLogs_(timestamp, levels[level], component, message, data);
    } catch (e) {
      Logger.log('[Logging] Failed to write to sheet: ' + e.message);
    }
  }
}

/**
 * Log to System_Logs sheet
 */
function logToSystemLogs_(timestamp, level, component, message, data) {
  var ss = _ss();
  var sheet = ss.getSheetByName('System_Logs');
  
  if (!sheet) {
    sheet = ss.insertSheet('System_Logs');
    sheet.appendRow(['Timestamp', 'Level', 'Component', 'Message', 'Data']);
    sheet.setFrozenRows(1);
    sheet.getRange('A1:E1').setFontWeight('bold').setBackground('#333333').setFontColor('#FFFFFF');
  }
  
  var dataStr = '';
  if (data) {
    try {
      dataStr = JSON.stringify(sanitizeForLogging_(data));
    } catch (e) {
      dataStr = String(data);
    }
  }
  
  sheet.appendRow([timestamp, level, component, message, dataStr.slice(0, 1000)]);
  
  // Cleanup old logs
  cleanupSystemLogs_(sheet);
}

/**
 * Remove old log entries
 */
function cleanupSystemLogs_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow > APP_CONFIG.LOG.MAX_LOG_ROWS) {
    var rowsToDelete = lastRow - APP_CONFIG.LOG.MAX_LOG_ROWS;
    sheet.deleteRows(2, rowsToDelete);  // Keep header, delete oldest
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════════

/**
 * Standard error response
 * @param {string} component - Component name
 * @param {Error} error - Error object
 * @param {Object} [context] - Additional context
 * @returns {Object} Standardized error response
 */
function handleError_(component, error, context) {
  log_(LOG_LEVEL.ERROR, component, error.message, context);
  
  return {
    success: false,
    error: error.message,
    timestamp: new Date().toISOString(),
    component: component
  };
}

/**
 * Try-catch wrapper with logging
 * @param {string} functionName - Name of function being wrapped
 * @param {Function} callback - Function to execute
 * @param {*} [fallbackValue] - Value to return on error
 * @returns {*} Result or fallback value
 */
function tryCatch_(functionName, callback, fallbackValue) {
  try {
    return callback();
  } catch (error) {
    log_(LOG_LEVEL.ERROR, functionName, error.message);
    return fallbackValue !== undefined ? fallbackValue : null;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════════════

/**
 * Validate transaction data
 * @param {Object} data - Transaction data
 * @returns {{valid: boolean, errors: Array<string>}}
 */
function validateTransaction_(data) {
  var errors = [];
  
  if (!data) {
    return { valid: false, errors: ['Data object is required'] };
  }
  
  // Amount validation
  if (data.amount === undefined || data.amount === null) {
    errors.push('Amount is required');
  } else if (typeof data.amount !== 'number') {
    errors.push('Amount must be a number');
  } else if (data.amount <= 0) {
    errors.push('Amount must be positive');
  } else if (data.amount > 1000000) {
    errors.push('Amount exceeds maximum limit (1,000,000)');
  }
  
  // Merchant validation
  if (!data.merchant) {
    errors.push('Merchant is required');
  } else if (typeof data.merchant !== 'string') {
    errors.push('Merchant must be a string');
  } else if (data.merchant.length > 100) {
    errors.push('Merchant name too long (max 100 characters)');
  }
  
  // Category validation
  if (data.category && typeof data.category !== 'string') {
    errors.push('Category must be a string');
  }
  
  // Date validation
  if (data.date && !(data.date instanceof Date)) {
    errors.push('Date must be a Date object');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Sanitize input data
 * @param {Object} data - Raw input data
 * @returns {Object} Sanitized data
 */
function sanitizeTransactionData_(data) {
  return {
    amount: Number(data.amount) || 0,
    merchant: String(data.merchant || '').trim().slice(0, 100),
    category: String(data.category || 'أخرى').trim().slice(0, 50),
    type: String(data.type || 'مشتريات').trim().slice(0, 50),
    date: data.date instanceof Date ? data.date : new Date(),
    source: String(data.source || 'يدوي').trim().slice(0, 50),
    notes: String(data.notes || '').trim().slice(0, 500)
  };
}

// ═══════════════════════════════════════════════════════════════════════
// CACHING
// ═══════════════════════════════════════════════════════════════════════

/**
 * Get from cache with fallback
 * @param {string} key - Cache key
 * @param {Function} fetchFunction - Function to fetch data if cache miss
 * @param {number} [ttl] - Time to live in seconds
 * @returns {*} Cached or fresh data
 */
function getCached_(key, fetchFunction, ttl) {
  ttl = ttl || APP_CONFIG.CACHE.MEDIUM_TTL_SEC;
  
  var cache = CacheService.getScriptCache();
  var cached = cache.get(key);
  
  if (cached) {
    try {
      log_(LOG_LEVEL.DEBUG, 'Cache', 'HIT: ' + key);
      return JSON.parse(cached);
    } catch (e) {
      log_(LOG_LEVEL.WARN, 'Cache', 'Parse error for key: ' + key);
    }
  }
  
  log_(LOG_LEVEL.DEBUG, 'Cache', 'MISS: ' + key);
  
  // Fetch fresh data
  var data = fetchFunction();
  
  // Cache it
  try {
    cache.put(key, JSON.stringify(data), ttl);
  } catch (e) {
    log_(LOG_LEVEL.WARN, 'Cache', 'Failed to cache: ' + e.message);
  }
  
  return data;
}

/**
 * Invalidate cache keys
 * @param {Array<string>} keys - Keys to invalidate
 */
function invalidateCache_(keys) {
  var cache = CacheService.getScriptCache();
  if (!Array.isArray(keys)) keys = [keys]; // Handle single key string
  keys.forEach(function(key) {
    cache.remove(key);
    log_(LOG_LEVEL.DEBUG, 'Cache', 'Invalidated: ' + key);
  });
}

// ═══════════════════════════════════════════════════════════════════════
// LOCK MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

/**
 * Execute function with lock
 * @param {string} lockName - Lock identifier
 * @param {number} maxWait - Maximum wait time in milliseconds
 * @param {Function} callback - Function to execute
 * @returns {Object} Result with success flag
 */
function withLock_(lockName, maxWait, callback) {
  var lock = LockService.getScriptLock();
  var acquired = false;
  
  try {
    log_(LOG_LEVEL.DEBUG, 'Lock', 'Attempting to acquire: ' + lockName);
    acquired = lock.tryLock(maxWait);
    
    if (!acquired) {
      log_(LOG_LEVEL.WARN, 'Lock', 'Failed to acquire: ' + lockName);
      return { 
        success: false, 
        error: 'System busy, please try again',
        locked: true
      };
    }
    
    log_(LOG_LEVEL.DEBUG, 'Lock', 'Acquired: ' + lockName);
    var result = callback();
    
    return result;
    
  } catch (error) {
    log_(LOG_LEVEL.ERROR, 'Lock', 'Error in locked section: ' + error.message);
    return { success: false, error: error.message };
    
  } finally {
    if (acquired) {
      try {
        lock.releaseLock();
        log_(LOG_LEVEL.DEBUG, 'Lock', 'Released: ' + lockName);
      } catch (e) {
        log_(LOG_LEVEL.WARN, 'Lock', 'Failed to release: ' + e.message);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SECURITY
// ═══════════════════════════════════════════════════════════════════════

/**
 * Check rate limit for user/IP
 * @param {string} identifier - User ID or IP address
 * @returns {boolean} True if within limit
 */
function checkRateLimit_(identifier) {
  var cache = CacheService.getScriptCache();
  var key = 'rate_limit_' + identifier;
  var count = parseInt(cache.get(key) || '0');
  
  if (count >= APP_CONFIG.SECURITY.MAX_REQUESTS_PER_MINUTE) {
    log_(LOG_LEVEL.WARN, 'RateLimit', 'Exceeded for: ' + identifier);
    return false;
  }
  
  cache.put(key, String(count + 1), APP_CONFIG.SECURITY.RATE_LIMIT_WINDOW_SEC);
  return true;
}

/**
 * Sanitize data for logging (remove sensitive info)
 * @param {Object} data - Data to sanitize
 * @returns {Object} Sanitized data
 */
function sanitizeForLogging_(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  var sanitized = {};
  var sensitiveKeys = ['token', 'password', 'key', 'secret', 'api', 'auth'];
  
  for (var key in data) {
    if (data.hasOwnProperty(key)) {
      var keyLower = key.toLowerCase();
      var isSensitive = sensitiveKeys.some(function(sensitive) {
        return keyLower.indexOf(sensitive) !== -1;
      });
      
      if (isSensitive) {
        sanitized[key] = '***REDACTED***';
      } else if (keyLower.indexOf('card') !== -1) {
        // Show last 4 digits only
        var value = String(data[key]);
        sanitized[key] = value.length > 4 ? '****' + value.slice(-4) : value;
      } else if (typeof data[key] === 'object') {
        sanitized[key] = sanitizeForLogging_(data[key]);
      } else {
        sanitized[key] = data[key];
      }
    }
  }
  
  return sanitized;
}

// ═══════════════════════════════════════════════════════════════════════
// BATCH OPERATIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Read sheet data in batches
 * @param {string} sheetName - Sheet name
 * @param {number} [startRow=2] - Start row (default 2, skip header)
 * @param {number} [maxRows] - Max rows to read
 * @returns {Array<Array>} Sheet data
 */
function batchReadSheet_(sheetName, startRow, maxRows) {
  startRow = startRow || 2;
  
  try {
    var sheet = _sheet(sheetName);
    var lastRow = sheet.getLastRow();
    
    if (lastRow < startRow) {
      return [];
    }
    
    var rowsToRead = maxRows ? 
      Math.min(maxRows, lastRow - startRow + 1) : 
      lastRow - startRow + 1;
    
    if (rowsToRead <= 0) {
      return [];
    }
    
    var lastCol = sheet.getLastColumn();
    var data = sheet.getRange(startRow, 1, rowsToRead, lastCol).getValues();
    
    log_(LOG_LEVEL.DEBUG, 'BatchRead', 'Read ' + rowsToRead + ' rows from ' + sheetName);
    
    return data;
    
  } catch (error) {
    log_(LOG_LEVEL.ERROR, 'BatchRead', error.message, { sheetName: sheetName });
    return [];
  }
}

/**
 * Write data in batches
 * @param {string} sheetName - Sheet name
 * @param {Array<Array>} data - Data to write
 * @returns {{success: boolean, rowsWritten: number}}
 */
function batchWriteSheet_(sheetName, data) {
  if (!data || data.length === 0) {
    return { success: true, rowsWritten: 0 };
  }
  
  try {
    var sheet = _sheet(sheetName);
    var numCols = data[0].length;
    
    // Append all rows at once
    var startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, data.length, numCols).setValues(data);
    
    log_(LOG_LEVEL.INFO, 'BatchWrite', 'Wrote ' + data.length + ' rows to ' + sheetName);
    
    return { 
      success: true, 
      rowsWritten: data.length 
    };
    
  } catch (error) {
    return handleError_('BatchWrite', error, { sheetName: sheetName });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// RETRY LOGIC
// ═══════════════════════════════════════════════════════════════════════

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} [maxRetries] - Maximum retry attempts
 * @param {number} [delay] - Initial delay in milliseconds
 * @returns {*} Function result
 */
function retryWithBackoff_(fn, maxRetries, delay) {
  maxRetries = maxRetries || APP_CONFIG.SHEETS.MAX_RETRIES;
  delay = delay || APP_CONFIG.SHEETS.RETRY_DELAY_MS;
  
  var attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      return fn();
    } catch (error) {
      attempt++;
      
      if (attempt >= maxRetries) {
        log_(LOG_LEVEL.ERROR, 'Retry', 'Failed after ' + maxRetries + ' attempts: ' + error.message);
        throw error;
      }
      
      log_(LOG_LEVEL.WARN, 'Retry', 'Attempt ' + attempt + ' failed, retrying in ' + delay + 'ms');
      
      Utilities.sleep(delay);
      delay *= 2;  // Exponential backoff
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Check if value is empty
 */
function isEmpty_(value) {
  return value === null || 
         value === undefined || 
         value === '' || 
         (Array.isArray(value) && value.length === 0) ||
         (typeof value === 'object' && Object.keys(value).length === 0);
}

/**
 * Deep clone object
 */
function deepClone_(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    log_(LOG_LEVEL.WARN, 'DeepClone', 'Failed: ' + e.message);
    return obj;
  }
}

/**
 * Format number with thousands separator
 */
function formatNumber_(num, decimals) {
  decimals = decimals !== undefined ? decimals : 2;
  return Number(num).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Get execution time
 */
function measureExecutionTime_(fn, label) {
  var start = new Date().getTime();
  var result = fn();
  var end = new Date().getTime();
  var duration = end - start;
  
  log_(LOG_LEVEL.DEBUG, 'Performance', label + ' took ' + duration + 'ms');
  
  return result;
}
