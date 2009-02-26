var video = {
  name: 'video',
  description: 'Google video search',
  queryUrl: function(search) {
    var base = "http://ajax.googleapis.com/ajax/services/search/video?v=1.0&q=%QUERY%";
    return base.replace('%QUERY%', encodeURIComponent(search));
  },
  buildResultNode: function(result) {
    var hbox = document.createElement('hbox');
    hbox.setAttribute('pack', 'start');
    hbox.setAttribute('class', 'result youtube');
    hbox.setAttribute('href', result.url);
    var thumb = document.createElementNS("http://www.w3.org/1999/xhtml", "html:img");
    thumb.setAttribute('src', result.tbUrl);
    hbox.appendChild(thumb);
    var vbox = document.createElement('vbox');
    vbox.setAttribute('flex', 1);
    var title = document.createElementNS("http://www.w3.org/1999/xhtml", "html:div");
    title.setAttribute("crop", 'end');
    title.setAttribute('class', 'title');
    appendHTMLtoXUL(result.title, title);
    vbox.appendChild(title);
    var content = document.createElementNS("http://www.w3.org/1999/xhtml", "html:div");
    content.setAttribute('class', 'description');
    appendHTMLtoXUL(result['content'], content);
    vbox.appendChild(content);
    var url = document.createElementNS("http://www.w3.org/1999/xhtml", "html:div");
    url.setAttribute('class', 'url');
    appendHTMLtoXUL(result.publisher, url);
    vbox.appendChild(url);
    hbox.appendChild(vbox);
    return hbox;
  },
  process: function(json) {
    if (!json.responseData.results) {
      return [];
    }
    // $('searchy-about-results').value = "Estimated Results: " + json.responseData.cursor.estimatedResultCount;
    return json.responseData.results;
  }
};
