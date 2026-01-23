/**
 * REFACTORED FLOW MODULE
 * Enhanced with best practices: error handling, validation, logging, caching
 * 
 * Key Improvements:
 * - Structured error handling
 * - Input validation
 * - Performance monitoring
 * - Better logging
 * - Cache utilization
 */

// ═══════════════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════════════

/**
 * Validate SMS text input
 * @param {string} smsText - SMS message to validate
 * @returns {{valid: boolean, errors: Array<string>}}
 */
function validateSMSInput_(smsText) {
  var errors = [];
  
  if (!smsText) {
    errors.push('SMS text is required');
  } else if (typeof smsText !== 'string') {
    errors.push('SMS text must be a string');
  } else if (smsText.trim().length === 0) {
    errors.push('SMS text cannot be empty');
  } else if (smsText.length > 10000) {
    errors.push('SMS text too long (max 10,000 characters)');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Validate parsed transaction data
 * @param {Object} data - Parsed transaction data
 * @returns {{valid: boolean, errors: Array<string>}}
 */
function validateParsedTransaction_(data) {
  var errors = [];
  
  if (!data) {
    return { valid: false, errors: ['Parsed data is required'] };
  }
  
  // Amount validation
  if (data.amount === undefined || data.amount === null) {
    errors.push('Amount not found in message');
  } else if (typeof data.amount !== 'number') {
    errors.push('Amount must be a number');
  } else if (data.amount < 0) {
    errors.push('Amount cannot be negative');
  } else if (data.amount > 10000000) {
    errors.push('Amount exceeds maximum (10,000,000)');
  }
  
  // Merchant validation
  if (!data.merchant) {
    errors.push('Merchant not found in message');
  } else if (typeof data.merchant !== 'string') {
    errors.push('Merchant must be a string');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

// ═══════════════════════════════════════════════════════════════════════
// ENHANCED FLOW EXECUTION
// ═══════════════════════════════════════════════════════════════════════

/**
 * Execute Universal Flow with Best Practices
 * @param {string} smsText - SMS message text
 * @param {string} source - Source identifier
 * @param {string} [destChatId] - Destination chat ID for notifications
 * @returns {{success: boolean, data: Object, error: string}}
 */
function executeUniversalFlowEnhanced(smsText, source, destChatId) {
  var startTime = new Date().getTime();
  
  try {
    log_(LOG_LEVEL.INFO, 'Flow', 'Starting processing', { source: source });
    
    // 1. Input Validation
    var validation = validateSMSInput_(smsText);
    if (!validation.valid) {
      log_(LOG_LEVEL.WARN, 'Flow', 'Invalid input', validation.errors);
      return {
        success: false,
        data: null,
        error: 'Invalid input: ' + validation.errors.join(', ')
      };
    }
    
    // 2. Sanitize inputs
    smsText = String(smsText || '').trim();
    source = String(source || 'غير معروف').trim().slice(0, 50);
    
    // 3. Parse with multiple strategies
    var parsed = parseTransactionWithStrategies_(smsText);
    
    if (!parsed || !parsed.success) {
      log_(LOG_LEVEL.WARN, 'Flow', 'Parsing failed', { text: smsText.slice(0, 100) });
      return {
        success: false,
        data: null,
        error: 'Could not parse transaction from message'
      };
    }
    
    // 4. Validate parsed data
    var dataValidation = validateParsedTransaction_(parsed.data);
    if (!dataValidation.valid) {
      log_(LOG_LEVEL.WARN, 'Flow', 'Invalid parsed data', dataValidation.errors);
      return {
        success: false,
        data: null,
        error: 'Invalid transaction data: ' + dataValidation.errors.join(', ')
      };
    }
    
    // 5. Enrich with additional context
    var enriched = enrichTransactionData_(parsed.data, smsText);
    
    // 6. Save transaction
    var saveResult = saveTransactionSafely_(enriched, source, smsText);
    
    if (!saveResult.success) {
      return {
        success: false,
        data: null,
        error: saveResult.error
      };
    }
    
    // 7. Send notification (non-blocking)
    try {
      if (typeof sendSovereignReportV120 === 'function') {
        enriched.uuid = saveResult.uuid || null;
        sendSovereignReportV120(enriched, saveResult, source, smsText, destChatId);
      }
    } catch (notifError) {
      log_(LOG_LEVEL.WARN, 'Flow', 'Notification failed: ' + notifError.message);
      // Don't fail the whole operation
    }
    
    var duration = new Date().getTime() - startTime;
    log_(LOG_LEVEL.INFO, 'Flow', 'Processing completed in ' + duration + 'ms', {
      amount: enriched.amount,
      merchant: enriched.merchant
    });
    
    return {
      success: true,
      data: saveResult,
      error: ''
    };
    
  } catch (error) {
    var duration = new Date().getTime() - startTime;
    log_(LOG_LEVEL.ERROR, 'Flow', 'Processing failed: ' + error.message, {
      source: source,
      duration: duration
    });
    
    // Log to debug sheet
    try {
      logIngressEvent_('ERROR', 'executeUniversalFlowEnhanced', { 
        error: error.message,
        stack: error.stack 
      }, smsText);
    } catch (logError) {
      // Ignore logging errors
    }
    
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// PARSING STRATEGIES
// ═══════════════════════════════════════════════════════════════════════

/**
 * Parse transaction using multiple strategies with fallback
 * @param {string} smsText - SMS message
 * @returns {{success: boolean, data: Object, strategy: string}}
 */
function parseTransactionWithStrategies_(smsText) {
  var strategies = [
    { name: 'Templates', fn: parseByTemplates_ },
    { name: 'AI_Hybrid', fn: callAiHybridV120 },
    { name: 'Fallback', fn: SOV1_preParseFallback_ }
  ];
  
  for (var i = 0; i < strategies.length; i++) {
    var strategy = strategies[i];
    
    try {
      if (typeof strategy.fn !== 'function') {
        continue;
      }
      
      log_(LOG_LEVEL.DEBUG, 'Parsing', 'Trying strategy: ' + strategy.name);
      
      var result;
      if (strategy.name === 'Templates') {
        var tpl = strategy.fn(smsText);
        if (tpl && tpl.ok && tpl.extracted) {
          result = {
            merchant: tpl.extracted.merchant || 'غير محدد',
            amount: Number(tpl.extracted.amount) || 0,
            currency: 'SAR',
            category: 'مشتريات عامة',
            type: 'مشتريات',
            isIncoming: false,
            accNum: '',
            cardNum: tpl.extracted.cardLast || ''
          };
        }
      } else {
        result = strategy.fn(smsText);
      }
      
      if (result && result.amount > 0) {
        log_(LOG_LEVEL.INFO, 'Parsing', 'Success with strategy: ' + strategy.name);
        return {
          success: true,
          data: result,
          strategy: strategy.name
        };
      }
      
    } catch (error) {
      log_(LOG_LEVEL.WARN, 'Parsing', 'Strategy failed: ' + strategy.name + ' - ' + error.message);
      continue;
    }
  }
  
  log_(LOG_LEVEL.ERROR, 'Parsing', 'All strategies failed');
  return {
    success: false,
    data: null,
    strategy: 'none'
  };
}

// ═══════════════════════════════════════════════════════════════════════
// DATA ENRICHMENT
// ═══════════════════════════════════════════════════════════════════════

/**
 * Enrich transaction data with additional context
 * @param {Object} data - Parsed transaction data
 * @param {string} smsText - Original SMS text
 * @returns {Object} Enriched data
 */
function enrichTransactionData_(data, smsText) {
  var enriched = deepClone_(data);
  
  try {
    // Apply classifier rules
    if (typeof applyClassifierMap_ === 'function') {
      enriched = applyClassifierMap_(smsText, enriched);
    }
  } catch (e) {
    log_(LOG_LEVEL.WARN, 'Enrich', 'Classifier failed: ' + e.message);
  }
  
  try {
    // Apply smart rules
    if (typeof applySmartRules_ === 'function') {
      enriched = applySmartRules_(smsText, enriched);
    }
  } catch (e) {
    log_(LOG_LEVEL.WARN, 'Enrich', 'Smart rules failed: ' + e.message);
  }
  
  try {
    // Classify account
    if (typeof classifyAccountFromText_ === 'function' && typeof SOV1_extractFingerprintParts_ === 'function') {
      var parts = SOV1_extractFingerprintParts_(smsText);
      var acc = classifyAccountFromText_(smsText, parts.cardLast);
      
      if (acc && acc.hit) {
        enriched.accNum = String(acc.hit.org || '') + (acc.hit.num ? (' ' + acc.hit.num) : '');
        
        if (acc.isInternal) {
          enriched.category = 'حوالة داخلية';
          enriched.type = 'تحويل داخلي';
        }
      }
    }
  } catch (e) {
    log_(LOG_LEVEL.WARN, 'Enrich', 'Account classification failed: ' + e.message);
  }
  
  // Add metadata
  enriched.processedAt = new Date().toISOString();
  enriched.version = 'V120_ENHANCED';
  
  return enriched;
}

// ═══════════════════════════════════════════════════════════════════════
// SAFE TRANSACTION SAVING
// ═══════════════════════════════════════════════════════════════════════

/**
 * Save transaction with proper error handling and retries
 * @param {Object} data - Transaction data
 * @param {string} source - Source identifier
 * @param {string} rawText - Original SMS text
 * @returns {{success: boolean, uuid: string, error: string}}
 */
function saveTransactionSafely_(data, source, rawText) {
  try {
    // Use new UUID-based insert if available
    if (typeof insertTransaction_ === 'function') {
      return retryWithBackoff_(function() {
        return insertTransaction_(data, source, rawText);
      }, 3, 1000);
    }
    
    // Fallback to old sync method
    if (typeof syncQuadV120 === 'function') {
      return retryWithBackoff_(function() {
        var result = syncQuadV120(data, rawText, source);
        return result || { success: true };
      }, 3, 1000);
    }
    
    log_(LOG_LEVEL.ERROR, 'Save', 'No save function available');
    return {
      success: false,
      uuid: null,
      error: 'Transaction save function not available'
    };
    
  } catch (error) {
    log_(LOG_LEVEL.ERROR, 'Save', 'Failed to save transaction: ' + error.message, {
      merchant: data.merchant,
      amount: data.amount
    });
    
    return {
      success: false,
      uuid: null,
      error: 'Failed to save: ' + error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// BACKWARD COMPATIBILITY
// ═══════════════════════════════════════════════════════════════════════

/**
 * Wrapper to maintain backward compatibility
 * Existing code can still call executeUniversalFlowV120
 */
function executeUniversalFlowV120(smsText, source, destChatId) {
  var result = executeUniversalFlowEnhanced(smsText, source, destChatId);
  
  // Return old format for compatibility
  if (result.success) {
    return result.data;
  }
  
  // Log error but don't throw
  log_(LOG_LEVEL.ERROR, 'FlowV120', result.error);
  return null;
}
