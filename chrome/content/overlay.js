var searchy = new function() {
  var $ = function(x) { return document.getElementById(x); };

  var req;

  this.go = function() {
    var panel = $('searchy');
    var width = Math.min(document.width - 40, 800);
    panel.setAttribute('width', width);
    panel.openPopup(null, 'overlap', (document.width-width)/2, 20);
    panel.focus();
  };

  var timer;

  this.input = function(aEvent) {
    if (req) {
      req.abort();
    }
    if (timer) {
      clearTimeout(timer);
    }

    $('searchy-input').setAttribute('busy', 'true');

    timer = setTimeout(
              function() {
                query($('searchy-input').value);
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
        visit(current, aEvent);
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
    $('searchy-input').focus();
    $('searchy-input').setSelectionRange(0, $('searchy-input').value.length);
    window.addEventListener('keypress', inputlistener, true);
  };

  this.hidden = function() {
    if (req) { req.abort(); }
    window.removeEventListener('keypress', inputlistener, true);

    /* because the MAC doesn't redraw xul that has a panel over it you are left with crap */
    var win = window;
    setTimeout(function() {
                 var wu = win.QueryInterface(Ci.nsIInterfaceRequestor)
                   .getInterface(Ci.nsIDOMWindowUtils);
                 wu.redraw();
               }, 10);

  };

  function currentHost() {
    return gBrowser.selectedBrowser.webNavigation.currentURI.host;
  }

  function urlFor(search) {
    var base = "http://boss.yahooapis.com/ysearch/web/v1/%QUERY%?start=0&count=10&filter=-hate-porn&appid=" +
      "QyNODEPV34HR033oKtxhT739.BxdON8LsJp7ZavlLzMA2MwaozRCruycKu8FAVjA";

    if (search[0] == '@') {
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

      $('searchy-input').removeAttribute('busy');
      var box = $('searchy-results');
      while (box.firstChild) {
        box.removeChild(box.firstChild);
      }

      try {
        var nsJSON = Cc["@mozilla.org/dom/json;1"]
          .createInstance(Ci.nsIJSON);

        var json = nsJSON.decode(req.responseText);
      }
      catch (e) {
        return;
      }

      current = null;

      json.ysearchresponse.resultset_web.forEach(
        function(result) {
          var vbox = document.createElement('vbox');
          vbox.setAttribute('class', 'result');
          vbox.setAttribute('href', result.clickurl);
          var title = document.createElementNS("http://www.w3.org/1999/xhtml", "html:div");
          title.setAttribute('class', 'title');
          appendHTMLtoXUL(result.title, title);
          vbox.appendChild(title);
          var description = document.createElementNS("http://www.w3.org/1999/xhtml", "html:div");
          description.setAttribute('class', 'description');
          appendHTMLtoXUL(result['abstract'], description);
          vbox.appendChild(description);
          box.appendChild(vbox);

          if (!current) {
            vbox.setAttribute('current', true);
            current = vbox;
          }

          vbox.onclick = function(event) { visit(this, event); };
        });

    }
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
        text = text.replace(/&quote;/g, '"');
        text = text.replace(/&gt;/g, '>');
        text = text.replace(/&lt;/g, '<');
        text = text.replace(/&amp;/g, '&');

        span.appendChild(document.createTextNode(text));
        node.appendChild(span);
      });
  }
};
