/**
 * ENHANCED QUEUE PROCESSOR
 * With best practices: proper locking, error handling, monitoring, batch processing
 * 
 * Key Improvements:
 * - Better lock management
 * - Detailed logging and monitoring
 * - Retry logic with exponential backoff
 * - Performance metrics
 * - Error recovery
 * - Dead letter queue for failed items
 */

// ═══════════════════════════════════════════════════════════════════════
// QUEUE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════

var QUEUE_CONFIG = {
  BATCH_SIZE: 15,              // Process 15 items at once
  LOCK_TIMEOUT_MS: 20000,      // 20 second lock timeout
  MAX_RETRIES: 3,              // Retry failed items 3 times
  CLEANUP_DAYS: 14,            // Keep history for 14 days
  DEAD_LETTER_THRESHOLD: 5,    // Move to DLQ after 5 failures
  PROCESSING_TIMEOUT_MS: 60000 // 60 seconds max per batch
};

// ═══════════════════════════════════════════════════════════════════════
// ENHANCED BATCH PROCESSOR
// ═══════════════════════════════════════════════════════════════════════

/**
 * Process queue batch with enhanced error handling and monitoring
 * @returns {{success: boolean, processed: number, failed: number, skipped: number}}
 */
function processQueueBatchEnhanced() {
  var startTime = new Date().getTime();
  var stats = {
    processed: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };
  
  return withLock_('queue_processing', QUEUE_CONFIG.LOCK_TIMEOUT_MS, function() {
    try {
      log_(LOG_LEVEL.INFO, 'Queue', 'Starting batch processing');
      
      // Get queue sheet
      var sheet = getQueueSheet_();
      if (!sheet) {
        return {
          success: false,
          error: 'Queue sheet not found',
          stats: stats
        };
      }
      
      var lastRow = sheet.getLastRow();
      if (lastRow < 2) {
        log_(LOG_LEVEL.DEBUG, 'Queue', 'Queue is empty');
        return {
          success: true,
          message: 'Queue is empty',
          stats: stats
        };
      }
      
      // Read queue data (batch read)
      var data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
      
      // Process items
      for (var i = 0; i < data.length && stats.processed < QUEUE_CONFIG.BATCH_SIZE; i++) {
        var rowIndex = i + 2;
        var item = {
          timestamp: data[i][0],
          source: String(data[i][1] || ''),
          text: String(data[i][2] || ''),
          meta: parseJSON_(data[i][3]),
          status: String(data[i][4] || ''),
          fingerprint: String(data[i][5] || '')
        };
        
        // Skip if not NEW
        if (item.status !== 'NEW') {
          continue;
        }
        
        // Process item
        var result = processQueueItem_(item, rowIndex, sheet);
        
        if (result.success) {
          stats.processed++;
        } else if (result.skipped) {
          stats.skipped++;
        } else {
          stats.failed++;
          stats.errors.push({
            row: rowIndex,
            error: result.error
          });
        }
        
        // Check timeout
        var elapsed = new Date().getTime() - startTime;
        if (elapsed > QUEUE_CONFIG.PROCESSING_TIMEOUT_MS) {
          log_(LOG_LEVEL.WARN, 'Queue', 'Batch timeout reached, stopping');
          break;
        }
      }
      
      var duration = new Date().getTime() - startTime;
      
      log_(LOG_LEVEL.INFO, 'Queue', 'Batch completed', {
        duration: duration + 'ms',
        processed: stats.processed,
        failed: stats.failed,
        skipped: stats.skipped
      });
      
      // Log to monitoring sheet
      logQueueMetrics_(stats, duration);
      
      return {
        success: true,
        stats: stats,
        duration: duration
      };
      
    } catch (error) {
      log_(LOG_LEVEL.ERROR, 'Queue', 'Batch processing failed: ' + error.message);
      return {
        success: false,
        error: error.message,
        stats: stats
      };
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════
// ITEM PROCESSING
// ═══════════════════════════════════════════════════════════════════════

/**
 * Process single queue item
 * @param {Object} item - Queue item
 * @param {number} rowIndex - Row index in sheet
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Queue sheet
 * @returns {{success: boolean, skipped: boolean, error: string}}
 */
function processQueueItem_(item, rowIndex, sheet) {
  try {
    // Mark as running
    sheet.getRange(rowIndex, 5).setValue('RUN');
    
    // Generate fingerprint if missing
    if (!item.fingerprint && typeof SOV1_buildFingerprint_ === 'function') {
      item.fingerprint = SOV1_buildFingerprint_(item.text);
      sheet.getRange(rowIndex, 6).setValue(item.fingerprint);
    }
    
    // Check for duplicate (persistent dedup)
    if (item.fingerprint && typeof SOV1_isDuplicatePersistent_ === 'function') {
      if (SOV1_isDuplicatePersistent_(item.fingerprint, 72)) {
        sheet.getRange(rowIndex, 5).setValue('SKIP_DUP');
        log_(LOG_LEVEL.DEBUG, 'Queue', 'Skipped duplicate', { fingerprint: item.fingerprint });
        return { success: false, skipped: true, error: 'Duplicate' };
      }
    }
    
    // Execute flow
    var flowResult = executeFlowWithRetry_(item);
    
    if (flowResult.success) {
      sheet.getRange(rowIndex, 5).setValue('OK');
      log_(LOG_LEVEL.INFO, 'Queue', 'Item processed successfully', { row: rowIndex });
      return { success: true, skipped: false, error: '' };
    } else {
      // Handle failure
      return handleQueueItemFailure_(item, rowIndex, sheet, flowResult.error);
    }
    
  } catch (error) {
    log_(LOG_LEVEL.ERROR, 'Queue', 'Item processing failed: ' + error.message, { row: rowIndex });
    
    try {
      sheet.getRange(rowIndex, 5).setValue('ERR: ' + error.message.slice(0, 100));
    } catch (updateError) {
      // Ignore sheet update error
    }
    
    return {
      success: false,
      skipped: false,
      error: error.message
    };
  }
}

/**
 * Execute flow with retry logic
 * @param {Object} item - Queue item
 * @returns {{success: boolean, error: string}}
 */
function executeFlowWithRetry_(item) {
  var maxRetries = QUEUE_CONFIG.MAX_RETRIES;
  var delay = 1000; // Start with 1 second
  
  for (var attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Call the appropriate flow function
      var flowFn = typeof executeUniversalFlowEnhanced === 'function' ? 
        executeUniversalFlowEnhanced : 
        executeUniversalFlowV120;
      
      if (typeof flowFn !== 'function') {
        return {
          success: false,
          error: 'Flow function not available'
        };
      }
      
      var result = flowFn(item.text, item.source, item.meta.chatId || null);
      
      // Check if successful
      if (result && (result.success === true || result.uuid || result)) {
        return { success: true, error: '' };
      }
      
      // Failed but retryable
      if (attempt < maxRetries) {
        log_(LOG_LEVEL.WARN, 'Queue', 'Flow attempt ' + attempt + ' failed, retrying', {
          error: result.error
        });
        Utilities.sleep(delay);
        delay *= 2; // Exponential backoff
        continue;
      }
      
      return {
        success: false,
        error: result.error || 'Flow execution failed'
      };
      
    } catch (error) {
      if (attempt < maxRetries) {
        log_(LOG_LEVEL.WARN, 'Queue', 'Flow attempt ' + attempt + ' threw error, retrying', {
          error: error.message
        });
        Utilities.sleep(delay);
        delay *= 2;
        continue;
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  return {
    success: false,
    error: 'Max retries exceeded'
  };
}

/**
 * Handle failed queue item
 * @param {Object} item - Queue item
 * @param {number} rowIndex - Row index
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Queue sheet
 * @param {string} error - Error message
 * @returns {{success: boolean, skipped: boolean, error: string}}
 */
function handleQueueItemFailure_(item, rowIndex, sheet, error) {
  try {
    // Get retry count from meta
    var retryCount = (item.meta.retryCount || 0) + 1;
    
    if (retryCount >= QUEUE_CONFIG.DEAD_LETTER_THRESHOLD) {
      // Move to dead letter queue
      moveToDeadLetterQueue_(item, error);
      sheet.getRange(rowIndex, 5).setValue('DLQ');
      
      log_(LOG_LEVEL.ERROR, 'Queue', 'Item moved to DLQ after ' + retryCount + ' failures', {
        error: error
      });
      
      return {
        success: false,
        skipped: false,
        error: 'Moved to DLQ'
      };
    } else {
      // Mark for retry
      item.meta.retryCount = retryCount;
      item.meta.lastError = error;
      item.meta.lastAttempt = new Date().toISOString();
      
      sheet.getRange(rowIndex, 4).setValue(JSON.stringify(item.meta));
      sheet.getRange(rowIndex, 5).setValue('RETRY_' + retryCount);
      
      // Reset to NEW after delay (will be retried next batch)
      Utilities.sleep(retryCount * 1000); // Wait longer each retry
      sheet.getRange(rowIndex, 5).setValue('NEW');
      
      log_(LOG_LEVEL.WARN, 'Queue', 'Item marked for retry ' + retryCount, {
        error: error
      });
      
      return {
        success: false,
        skipped: false,
        error: 'Retry scheduled'
      };
    }
    
  } catch (handleError) {
    log_(LOG_LEVEL.ERROR, 'Queue', 'Failed to handle failure: ' + handleError.message);
    return {
      success: false,
      skipped: false,
      error: handleError.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// DEAD LETTER QUEUE
// ═══════════════════════════════════════════════════════════════════════

/**
 * Move failed item to dead letter queue for manual review
 * @param {Object} item - Failed queue item
 * @param {string} error - Error message
 */
function moveToDeadLetterQueue_(item, error) {
  try {
    var ss = _ss();
    var dlq = ss.getSheetByName('Dead_Letter_Queue');
    
    if (!dlq) {
      dlq = ss.insertSheet('Dead_Letter_Queue');
      dlq.appendRow([
        'Timestamp',
        'Source',
        'Text',
        'Error',
        'Retry Count',
        'Original Meta'
      ]);
      dlq.setFrozenRows(1);
      dlq.getRange('A1:F1').setFontWeight('bold').setBackground('#d32f2f').setFontColor('#ffffff');
    }
    
    dlq.appendRow([
      new Date(),
      item.source,
      item.text.slice(0, 1000),
      error.slice(0, 500),
      item.meta.retryCount || 0,
      JSON.stringify(item.meta).slice(0, 1000)
    ]);
    
    log_(LOG_LEVEL.ERROR, 'DLQ', 'Item added to dead letter queue', {
      source: item.source,
      error: error
    });
    
  } catch (dlqError) {
    log_(LOG_LEVEL.FATAL, 'DLQ', 'Failed to add to dead letter queue: ' + dlqError.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// MONITORING
// ═══════════════════════════════════════════════════════════════════════

/**
 * Log queue processing metrics
 * @param {Object} stats - Processing statistics
 * @param {number} duration - Processing duration in ms
 */
function logQueueMetrics_(stats, duration) {
  try {
    var ss = _ss();
    var metrics = ss.getSheetByName('Queue_Metrics');
    
    if (!metrics) {
      metrics = ss.insertSheet('Queue_Metrics');
      metrics.appendRow([
        'Timestamp',
        'Processed',
        'Failed',
        'Skipped',
        'Duration (ms)',
        'Items/sec'
      ]);
      metrics.setFrozenRows(1);
      metrics.getRange('A1:F1').setFontWeight('bold');
    }
    
    var itemsPerSec = duration > 0 ? (stats.processed / (duration / 1000)).toFixed(2) : 0;
    
    metrics.appendRow([
      new Date(),
      stats.processed,
      stats.failed,
      stats.skipped,
      duration,
      itemsPerSec
    ]);
    
    // Keep only last 1000 entries
    var lastRow = metrics.getLastRow();
    if (lastRow > 1001) {
      metrics.deleteRows(2, lastRow - 1001);
    }
    
  } catch (error) {
    log_(LOG_LEVEL.WARN, 'Metrics', 'Failed to log metrics: ' + error.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// QUEUE CLEANUP
// ═══════════════════════════════════════════════════════════════════════

/**
 * Clean up old processed items
 * @param {number} [keepDays=14] - Days to keep
 * @returns {{success: boolean, deleted: number}}
 */
function cleanupQueueEnhanced(keepDays) {
  keepDays = keepDays || QUEUE_CONFIG.CLEANUP_DAYS;
  
  try {
    log_(LOG_LEVEL.INFO, 'QueueCleanup', 'Starting cleanup, keeping last ' + keepDays + ' days');
    
    var sheet = getQueueSheet_();
    if (!sheet) {
      return { success: false, deleted: 0 };
    }
    
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return { success: true, deleted: 0 };
    }
    
    var cutoffDate = new Date(Date.now() - keepDays * 24 * 60 * 60 * 1000);
    var data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
    
    var deleted = 0;
    
    // Delete from bottom to top to avoid index issues
    for (var i = data.length - 1; i >= 0; i--) {
      var rowDate = data[i][0];
      var status = String(data[i][4] || '');
      
      // Delete if old and completed/skipped
      if (rowDate < cutoffDate && (status === 'OK' || status === 'SKIP_DUP' || status === 'DLQ')) {
        sheet.deleteRow(i + 2);
        deleted++;
      }
    }
    
    log_(LOG_LEVEL.INFO, 'QueueCleanup', 'Cleanup completed', { deleted: deleted });
    
    return {
      success: true,
      deleted: deleted
    };
    
  } catch (error) {
    log_(LOG_LEVEL.ERROR, 'QueueCleanup', 'Cleanup failed: ' + error.message);
    return {
      success: false,
      deleted: 0
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Get queue sheet safely
 */
function getQueueSheet_() {
  try {
    return SOV1_ensureQueueSheet_();
  } catch (error) {
    log_(LOG_LEVEL.ERROR, 'Queue', 'Failed to get queue sheet: ' + error.message);
    return null;
  }
}

/**
 * Parse JSON safely
 */
function parseJSON_(jsonString) {
  try {
    return JSON.parse(jsonString || '{}');
  } catch (e) {
    return {};
  }
}

// ═══════════════════════════════════════════════════════════════════════
// BACKWARD COMPATIBILITY
// ═══════════════════════════════════════════════════════════════════════

/**
 * Wrapper for backward compatibility
 */
function SOV1_processQueueBatch_() {
  var result = processQueueBatchEnhanced();
  
  log_(LOG_LEVEL.INFO, 'QueueBatch', 'Completed: processed=' + (result.processed || 0) + ', failed=' + (result.failed || 0));
}

/**
 * Wrapper for cleanup
 */
function SOV1_cleanupQueue_(keepDays) {
  return cleanupQueueEnhanced(keepDays);
}
