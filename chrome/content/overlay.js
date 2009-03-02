var searchy = new function() {

  var prefs = Cc['@mozilla.org/preferences-service;1']
    .getService(Ci.nsIPrefService)
    .getBranch('extensions.searchy.');

  prefs.QueryInterface(Ci.nsIPrefBranch2);

  var $ = function(x) { return document.getElementById(x); };

  var engines = {};
  var req = new Request();
  var current;
  var queried;
  var queryTimer;

  var searchyInputNode;

  function LoadEngine(path) {
    var engine = {};
    var loader = Cc["@mozilla.org/moz/jssubscript-loader;1"]
      .getService(Ci.mozIJSSubScriptLoader);
    loader.loadSubScript('chrome://searchy/content/engines/base.js', engine);
    loader.loadSubScript(path, engine);
    return engine;
  }

  ['google', 'twitter', 'nyt', 'video', 'friendfeed'].forEach(
    function(name) {
      engines[name] = LoadEngine('chrome://searchy/content/engines/' + name + '.js');
    });

  function currentHost() {
    try {
      return gBrowser.selectedBrowser.webNavigation.currentURI.host;
    }
    catch (e) {}
  }

  function init() {
    /* update search engine list */
    for (name in engines) {
      var label = document.createElement('label');
      label.setAttribute('value', '@' + name);
      label.setAttribute('style', 'font-weight:bold');
      $('searchy-engines').appendChild(label);
    }

    /* add an attribute so we can make sure not to crash on linux */

    var runtime = Cc['@mozilla.org/xre/app-info;1'].getService(Ci.nsIXULRuntime);
    $('searchy').setAttribute('OS', runtime.OS);

    /* don't leak */

    window.removeEventListener('load', init, false);

    /* pop a tab if there is anything to tell the user about */

    function welcome() {
      var version = Cc["@mozilla.org/extensions/manager;1"]
        .getService(Ci.nsIExtensionManager)
        .getItemForID("searchy@overstimulate.com")
        .version;

      var pageURL;
      var lastVersion;

      if (prefs.getPrefType('lastversion')) {
        lastVersion = prefs.getCharPref('lastversion');
      }

      if (!lastVersion) {
        pageURL = "http://overstimulate.com/projects/searchy/welcome?" + version;
      } else if (lastVersion != version) {
        pageURL = "http://overstimulate.com/projects/searchy/upgrade?" + version;
      }

      if (pageURL) {
        setTimeout(function(){ window.openUILinkIn(pageURL, "tab"); }, 500);
      }

      prefs.setCharPref("lastversion", version);
    }

    welcome();

    /* update key bindings */

    var updateShortcut = {
      observe: function() {
        function update(key_id, attribute) {
          try {
            if (prefs.getPrefType(attribute)) {
              var val = prefs.getCharPref(attribute);
              if (val && val.length > 0) {
                var binding = document.getElementById(key_id);
                binding.setAttribute(attribute, val);
              }
            }
          } catch (e) {dump(e)}
        }

        update('key_searchy', 'key');
        update('key_searchy', 'modifiers');
      }
    };

    updateShortcut.observe();

    /* and update the key whenever the prefs change */

/*    prefs.addObserver('', updateShortcut, false);

    function uninit() {
      prefs.removeObserver('', updateShortcut, false);
      window.removeEventListener('unload', uninit, false);
    }

    window.addEventListener('unload', uninit, false); */

    searchyInputNode = $('searchy-input');
  }

  window.addEventListener('load', init, false);

  this.show = function() {
    var panel = $('searchy');
    var width = Math.min(document.width - 40, 800);
    panel.setAttribute('width', width);
    panel.openPopup(null, 'overlap', (document.width-width)/2, 20);
    panel.focus();
  };

  this.about = function() {
    $('searchy').hidePopup();
    openUILinkIn('http://overstimulate.com/projects/searchy', 'tab');
  };

  this.input = function(aEvent) {
    req.abort();
    if (queryTimer) clearTimeout(queryTimer);

    if (searchyInputNode.value == '') {
      return help();
    }

    busy();

    queryTimer = setTimeout(
                   function() {
                     req.search(searchyInputNode.value);
                   }, 250);
  };

  function visit(node, aEvent) {
    select(node);

    var url = node.getAttribute('href');
    $('searchy').hidePopup();
    if (aEvent) {
      var where = whereToOpenLink(aEvent);
    }
    else {
      var where = 'current';
    }
    openUILinkIn(url, where);
  }

  function select(node) {
    if (current && node) {
      current.removeAttribute('current');
    }
    if (node) {
      current = node;
      current.setAttribute('current', true);
    }
  }

  function inputlistener(aEvent) {
    switch (aEvent.keyCode) {
      case aEvent.DOM_VK_RETURN:
        if (queried == searchyInputNode.value) {
          visit(current, aEvent);
        }
        break;
      case aEvent.DOM_VK_UP:
        if (current) { select(current.previousSibling); }
        break;
      case aEvent.DOM_VK_DOWN:
        if (current) { select(current.nextSibling); }
        break;
      default:
        return;
    }

    aEvent.stopPropagation();
    aEvent.preventDefault();
  };

  this.onFocus = function() {
    searchyInputNode.focus();
    searchyInputNode.setSelectionRange(0, searchyInputNode.value.length);
    window.addEventListener('keypress', inputlistener, true);
  };

  this.onHide = function() {
    req.abort();
    window.removeEventListener('keypress', inputlistener, true);

    /* because the MAC doesn't redraw xul that has a panel over it you are left with crap */
    var win = window;
    setTimeout(function() {
                 var wu = win.QueryInterface(Ci.nsIInterfaceRequestor)
                   .getInterface(Ci.nsIDOMWindowUtils);
                 wu.redraw();
               }, 10);

  };

  function noresults() {
    done();
    $('searchy-no-results').hidden = false;
    $('searchy-help').hidden = true;
    $('searchy-about-results').hidden = true;
  }

  function help() {
    done();
    $('searchy-no-results').hidden = true;
    $('searchy-help').hidden = false;
    $('searchy-about-results').hidden = true;
  }

  function busy() {
    searchyInputNode.setAttribute('busy', true);
    $('searchy-no-results').hidden = true;
    $('searchy-help').hidden = true;
    $('searchy-about-results').hidden = true;
  }

  function done() {
    searchyInputNode.removeAttribute('busy');
    $('searchy-no-results').hidden = true;
    $('searchy-help').hidden = true;
    $('searchy-about-results').value = '';
    $('searchy-about-results').hidden = false;
    var box = $('searchy-results');
    while (box.childNodes.length>0) {
      box.removeChild(box.firstChild);
    }
  }

  function Request()  {
    var inst = this;
    var engine;

    function process() {
      done();

      try {
        var nsJSON = Cc["@mozilla.org/dom/json;1"]
          .createInstance(Ci.nsIJSON);

        var json = nsJSON.decode(req.xhr.responseText);
      }
      catch (e) {
        return noresults();
      }

      current = null;
      // FIXME: not sure but perhaps queried should change even if noresults
      queried = req.input;

      var results = engine.process(json);
      if (results.length == 0) {
        return noresults();
      }

      var box = $('searchy-results');

      if (engine.details) {
        $('searchy-about-results').value = engine.details(json);
      }

      $('searchy-results-style').innerHTML = engine.css || '';

      results.forEach(
        function(result) {
          var node = engine.buildResultNode(result);
          box.appendChild(node);

          if (!current) {
            node.setAttribute('current', true);
            current = node;
          }

          node.onclick = function(event) { visit(this, event); };
        });
    }

    function urlFor(search) {
      engine = engines.google; // default

      if (search[0] == '@') {

        if (search[1] == ' ' && currentHost()) {
          search = search.slice(1) + " site:" + currentHost();
        }
        else {
          var engineName = search.slice(1).split(' ')[0].toLowerCase();
          if (engineName in engines) {
            engine = engines[engineName];
            search = search.slice(engineName.length+2);
          }
        }
      }

      if (search == '@' || search == '') return;

      return engine.queryUrl(search);
    }

    inst.search = function(query) {
      var url = urlFor(query);
      if (!url) return;
      inst.input = query; // hmm - this is ugly
      inst.abort();
      inst.xhr = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]
        .createInstance(Ci.nsIXMLHttpRequest);
      inst.xhr.mozBackgroundRequest = true;
      inst.xhr.open("GET", url);
      inst.xhr.setRequestHeader("Referer", "http://overstimulate.com/projects/searchy");
      inst.xhr.onload = process;
      inst.xhr.send(null);
    };

    inst.abort = function() { if (inst.xhr) { inst.xhr.abort();} };
  }
};
