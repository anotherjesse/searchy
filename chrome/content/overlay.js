var searchy = new function() {

  var prefs = Cc['@mozilla.org/preferences-service;1']
    .getService(Ci.nsIPrefService)
    .getBranch('extensions.searchy.');

  prefs.QueryInterface(Ci.nsIPrefBranch2);

  var $ = function(x) { return document.getElementById(x); };

  var req = new Request();
  var current;
  var queried;
  var queryTimer;

  var searchyInputNode;

  function init() {
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

  this.focused = function() {
    searchyInputNode.focus();
    searchyInputNode.setSelectionRange(0, searchyInputNode.value.length);
    window.addEventListener('keypress', inputlistener, true);
  };

  this.hidden = function() {
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
    $('searchy-about-results').hidden = false;
    var box = $('searchy-results');
    while (box.childNodes.length>0) {
      box.removeChild(box.firstChild);
    }
  }

  function process() {
    if (req && (req.xhr.readyState == 4) && (req.xhr.status == 200)) {
      done();

      try {
        var nsJSON = Cc["@mozilla.org/dom/json;1"]
          .createInstance(Ci.nsIJSON);

        var json = nsJSON.decode(req.xhr.responseText);

        if (!json.results) {
          return noresults();
        }
      }
      catch (e) {
        return noresults();
      }

      current = null;
      queried = req.input;

      if (json.results.length == 0) {
        return noresults();
      }

      var box = $('searchy-results');
      // $('searchy-about-results').value = "Estimated Results: " + json.responseData.cursor.estimatedResultCount;

      json.results.forEach(
        function(result) {
/*
          var sample = {
            "text": "Writing maths- Test today... but looking forward to continuing my 3D- Project in Maya afterwards ;-)",
            "to_user_id": null,
            "from_user": "Omme",
            "id": 1214632968,
            "from_user_id": 3991046,
            "iso_language_code": "en",
            "profile_image_url": "http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/73361113\/mypictr_150x150_normal.jpg",
            "created_at": "Mon, 16 Feb 2009 07:36:39 +0000"
          };
*/

          var vbox = document.createElement('hbox');
          vbox.setAttribute('class', 'result twitter');
          vbox.setAttribute('href', 'http://twitter.com/' + result.from_user + '/status/' + result.id);
          var avatar = document.createElementNS("http://www.w3.org/1999/xhtml", "html:img");
          avatar.setAttribute('src', result.profile_image_url);
          vbox.appendChild(avatar);
          var title = document.createElementNS("http://www.w3.org/1999/xhtml", "html:div");
          title.setAttribute('class', 'title');
          title.setAttribute('flex', 1);
          appendHTMLtoXUL(result.text, title);
          vbox.appendChild(title);
          box.appendChild(vbox);

          if (!current) {
            vbox.setAttribute('current', true);
            current = vbox;
          }

          vbox.onclick = function(event) { visit(this, event); };
        });

    }
  }

  function Request()  {
    var inst = this;

    function currentHost() {
      try {
        return gBrowser.selectedBrowser.webNavigation.currentURI.host;
      }
      catch (e) {}
    }

    function urlFor(search) {
      var base = "http://search.twitter.com/search.json?q=%QUERY%";

/*      if ((search[0] == '@') && currentHost()) {
        search = search.slice(1) + " site:" + currentHost();
      }
*/

      return base.replace('%QUERY%', encodeURIComponent(search));
    }

    inst.search = function(query) {
      inst.input = query; // hmm - this is ugly
      inst.abort();
      inst.xhr = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]
        .createInstance(Ci.nsIXMLHttpRequest);
      inst.xhr.mozBackgroundRequest = true;
      inst.xhr.open("GET", urlFor(query));
      inst.xhr.setRequestHeader("Referer", "http://overstimulate.com/projects/searchy");
      inst.xhr.onreadystatechange = process;
      inst.xhr.send(null);
    };

    inst.abort = function() { if (inst.xhr) { inst.xhr.abort();} };
  }


  function appendHTMLtoXUL(html, node) {
    html.split(/<b>(.*?<\/b>)|([^<]*)/).forEach(
      function(text) {
        var span = document.createElementNS("http://www.w3.org/1999/xhtml", "html:span");
        if (text.match(/<\/b>$/)) {
          span.setAttribute('class', 'bold');
          text = text.slice(0, text.length - 4);
        }

        /* FIXME: instead of deleting <wbr>, instead create multiple spans
         *        so the layout engine can wrap the layout - JA
         */

        text = text.replace(/<wbr>/g, "");

        /* convert XML UTF-16 entities to string characters */
        text = text.replace(/&#(\d+);/g, function() { return String.fromCharCode(RegExp.$1); });

        /* convert some of the more popular XML entities in text */
        text = text.replace(/&quot;/g, '"');
        text = text.replace(/&gt;/g, '>');
        text = text.replace(/&lt;/g, '<');
        text = text.replace(/&amp;/g, '&');

        span.appendChild(document.createTextNode(text));
        node.appendChild(span);
      });
  }
};
