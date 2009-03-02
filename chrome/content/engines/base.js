function currentHost() {
  try {
    return gBrowser.selectedBrowser.webNavigation.currentURI.host;
  }
  catch (e) {}
}

function fakeHTMLinXUL(html, node) {
  html.split(/<b>(.*?<\/b>)|([^<]*)/).forEach(
    function(text) {
      var span = document.createElementNS("http://www.w3.org/1999/xhtml", "html:span");
      if (text.match(/<\/b>$/)) {
        span.setAttribute('class', 'bold');
        text = text.slice(0, text.length - 4);
      }

      /* FIXME: instead of deleting <wbr>, instead create multiple spans
       *        so the layout engine can wrap the layout
       */

      text = text.replace(/<wbr>/g, "");

      // convert XML UTF-16 entities to string characters
      text = text.replace(/&#(\d+);/g, function() { return String.fromCharCode(RegExp.$1); });

      // convert some of the more popular XML entities in text
      text = text.replace(/&quot;/g, '"');
      text = text.replace(/&gt;/g, '>');
      text = text.replace(/&lt;/g, '<');
      text = text.replace(/&amp;/g, '&');

      span.appendChild(document.createTextNode(text));
      node.appendChild(span);
    });
}
