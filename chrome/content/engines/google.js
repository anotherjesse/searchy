var google = {
  name: 'google',
  description: 'Google web search',
  queryUrl: function(search) {
    var base = "http://ajax.googleapis.com/ajax/services/search/web?v=1.0&q=%QUERY%";
    return base.replace('%QUERY%', encodeURIComponent(search));
  },
  buildResultNode: function(result) {
    var box = document.createElement('vbox');
    box.setAttribute('class', 'result');
    box.setAttribute('href', result.unescapedUrl);
    var title = document.createElementNS("http://www.w3.org/1999/xhtml", "html:div");
    title.setAttribute('class', 'title');
    appendHTMLtoXUL(result.title, title);
    box.appendChild(title);
    var description = document.createElementNS("http://www.w3.org/1999/xhtml", "html:div");
    description.setAttribute('class', 'description');
    appendHTMLtoXUL(result['content'], description);
    box.appendChild(description);
    var url = document.createElementNS("http://www.w3.org/1999/xhtml", "html:div");
    url.setAttribute('class', 'url');
    appendHTMLtoXUL(result.unescapedUrl, url);
    box.appendChild(url);
    return box;
  },
  process: function(json) {
    if (!json.responseData.results) {
      return [];
    }
    return json.responseData.results;
  }
};
