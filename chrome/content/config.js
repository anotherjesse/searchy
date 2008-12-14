const Cc = Components.classes;
const Ci = Components.interfaces;

var $ = function(x) { return document.getElementById(x); };
var prefs = Cc['@mozilla.org/preferences-service;1']
  .getService(Ci.nsIPrefService)
  .getBranch('extensions.searchy.');

function getChar(prefName, defaultValue) {
  if (prefs.getPrefType(prefName)){
    var rval = prefs.getCharPref(prefName);
    if (rval != '') {
      return rval;
    }
  }

  return defaultValue;
}

//  prefs.setCharPref(prefName, val);

function init() {
  /* too bad there isn't a entity we can use like &keys.accel; */

  var mac = navigator.appVersion.match(/mac/i);
  $('modifier-accel').label = (mac) ? 'Command' : 'Control';

  /* populate with the current settings */
  var key = getChar('key', 'K');
  $('key').value = key;

  /* populate with the current settings */
  var modifiers = getChar('modifiers', 'accel shift');
  ['accel', 'shift', 'alt'].forEach(
    function(modifier) {
      $('modifier-'+modifier).checked = !!modifiers.match(modifier);
    });

}

function save() {
  var key = $('key').value;
  if (key != '') {
    prefs.setCharPref('key', key);
  }

  var modifiers = '';
  ['accel', 'shift', 'alt'].forEach(
    function(modifier) {
      if ($('modifier-'+modifier).checked) {
        if (modifiers != '') {
          modifiers += ' ';
        }
        modifiers += modifier;
      }
    });

  if (modifiers != '') {
    prefs.setCharPref('modifiers', modifiers);
  }
}
