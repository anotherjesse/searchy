var searchy = new function() {
  var $ = function(x) { return document.getElementById(x); };

  var req;

  this.go = function() {
    var panel = $('searchy');
    panel.openPopup($('urlbar'), 'after_start', -1, 50);
    panel.focus();
  };

  this.input = function(aEvent) {
    query($('searchy-input').value);
  };

  function inputlistener(aEvent) {
    switch (aEvent.keyCode) {

    case aEvent.DOM_VK_RETURN:
      var url = current.getAttribute('href');
      $('searchy').hidePopup();
      var where = whereToOpenLink(aEvent);
      openUILinkIn(url, where);
      break;
    case aEvent.DOM_VK_UP:
      if (current && current.previousSibling) {
        current.removeAttribute('current');
        current = current.previousSibling;
        current.setAttribute('current', true);
      }
      break;
    case aEvent.DOM_VK_DOWN:
      if (current && current.nextSibling) {
        current.removeAttribute('current');
        current = current.nextSibling;
        current.setAttribute('current', true);
      }
      break;
    default:
      return;
    }

    aEvent.stopPropagation();
    aEvent.preventDefault();
  };

  this.focused = function() {
    $('searchy-input').focus();
    $('searchy-input').setSelectionRange(0, $('searchy-input').value.length);
    window.addEventListener('keypress', inputlistener, true);
  };

  this.hidden = function() {
    if (req) { req.abort(); }
    window.removeEventListener('keypress', inputlistener, true);
  };

  function currentHost() {
    return gBrowser.selectedBrowser.webNavigation.currentURI.host;
  }

  function urlFor(search) {
    var base = "http://boss.yahooapis.com/ysearch/web/v1/%QUERY%?start=0&count=10&filter=-hate-porn&appid=" +
      "QyNODEPV34HR033oKtxhT739.BxdON8LsJp7ZavlLzMA2MwaozRCruycKu8FAVjA";

    if (search[0] == '.') {
      search = search.slice(1) + " site:" + currentHost();
    }

    return base.replace('%QUERY%', encodeURIComponent(search));
  }

  function query(input) {
    if (req) {
      req.abort();
    }

    req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]
      .createInstance(Ci.nsIXMLHttpRequest);
    req.mozBackgroundRequest = true;
    req.open("GET", urlFor(input));
    req.onreadystatechange = process;
    req.send(null);
  }

  var current;

  function process() {
    if ((req.readyState == 4) && (req.status == 200)) {
      var nsJSON = Cc["@mozilla.org/dom/json;1"]
        .createInstance(Ci.nsIJSON);

      var json = nsJSON.decode(req.responseText);

      var box = $('searchy-results');
      while (box.firstChild) {
        box.removeChild(box.firstChild);
      }

      current = null;

      json.ysearchresponse.resultset_web.forEach(
        function(result) {
          var vbox = document.createElement('vbox');
          vbox.setAttribute('class', 'result');
          vbox.setAttribute('href', result.clickurl);
          var label = document.createElement('label');
          label.setAttribute('value', result.title);
          vbox.appendChild(label);
          var description = document.createElement('description');
          description.appendChild(document.createTextNode(result.abstract));
          vbox.appendChild(description);
          box.appendChild(vbox);
          if (!current) {
            vbox.setAttribute('current', true);
            current = vbox;
          }
        });

    }
  }

};
