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
        box.appendChild(vbox);

    if (!current) {
      vbox.setAttribute('current', true);
      current = vbox;
    }
  }

  function appendHTMLtoXUL(html, node) {
    node.appendChild(document.createTextNode(html));
  }

  setInterval(go, 100);

};
