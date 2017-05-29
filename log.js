'use strict';

const CurrentExtension = imports.misc.extensionUtils.getCurrentExtension();

/* exported log */
function log(msg) {
  global.log('[' + CurrentExtension.uuid + '] ' + msg);
}

/* exported debug */
function debug(msg) {
  if (settings.get_boolean('debug')) {
    log('DEBUG: ' + msg);
  }
}
