var searchy = new function() {

  function $(x) {
    return document.getElementById(x);
  }

  var current;
  var hidden = true;

  function go() {
    if (hidden) {
      return;
    }
    if (Math.random() < 0.1) {
      clear();
    }
    else {
      add();
    }
  }

  this.show = function() {
    var panel = $('searchy');
    var width = Math.min(document.width - 40, 800);
    panel.setAttribute('width', width);
    panel.openPopup(null, 'overlap', (document.width-width)/2, 20);
    panel.focus();
    hidden = false;
  };

  this.hiding = function() {
    hidden = true;
  };

  function clear() {
    var box = $('searchy-results');
    while (box.childNodes.length>0) {
      box.removeChild(box.firstChild);
    }
    current = null;
  }

  function add() {
    var box = $('searchy-results');
    var vbox = document.createElement('vbox');
    vbox.setAttribute('class', 'result');
    vbox.setAttribute('href', 'the url is here');
    var title = document.createElementNS("http://www.w3.org/1999/xhtml", "html:div");
    title.setAttribute('class', 'title');
    appendHTMLtoXUL('I am a <b>title</b>', title);
    vbox.appendChild(title);
    var description = document.createElementNS("http://www.w3.org/1999/xhtml", "html:div");
    description.setAttribute('class', 'description');
    appendHTMLtoXUL("w00t <b>content</b>", description);
    vbox.appendChild(description);
    var url = document.createElementNS("http://www.w3.org/1999/xhtml", "html:div");
    url.setAttribute('class', 'url');
    appendHTMLtoXUL('url://', url);
    vbox.appendChild(url);
    box.appendChild(vbox);

    if (!current) {
      vbox.setAttribute('current', true);
      current = vbox;
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
        text = text.replace(/&quot;/g, '"');
        text = text.replace(/&gt;/g, '>');
        text = text.replace(/&lt;/g, '<');
        text = text.replace(/&amp;/g, '&');

        span.appendChild(document.createTextNode(text));
        node.appendChild(span);
      });
  }

  setInterval(go, 100);

};
