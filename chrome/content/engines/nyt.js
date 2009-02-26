var nyt = {
  name: 'nyt',
  description: 'New York Times article search',
  queryUrl: function(search) {
    var key = "a3156fe94c1ec3ebfdbb390335abf448:2:57951843";
    var base = "http://api.nytimes.com/svc/search/v1/article?query=%QUERY%&api-key=" + key;
    return base.replace('%QUERY%', encodeURIComponent(search));
  },
  buildResultNode: function(result) {
    var vbox = document.createElement('vbox');
    vbox.setAttribute('class', 'result');
    vbox.setAttribute('href', result.url);
    var title = document.createElementNS("http://www.w3.org/1999/xhtml", "html:div");
    title.setAttribute('class', 'title');
    appendHTMLtoXUL(result.title, title);
    vbox.appendChild(title);
    var description = document.createElementNS("http://www.w3.org/1999/xhtml", "html:div");
    description.setAttribute('class', 'description');
    appendHTMLtoXUL(result.body, description);
    vbox.appendChild(description);
    return vbox;
  },
  process: function(json) {
    if (!json.results) {
      return [];
    }

    return json.results;
  }
};
