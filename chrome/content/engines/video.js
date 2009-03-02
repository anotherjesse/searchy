name = 'video';
description = 'Google video search';

function queryUrl(search) {
  var base = "http://ajax.googleapis.com/ajax/services/search/video?v=1.0&q=%QUERY%";
  return base.replace('%QUERY%', encodeURIComponent(search));
}

function buildResultNode(result) {
  var hbox = document.createElement('hbox');
  hbox.setAttribute('pack', 'start');
  hbox.setAttribute('class', 'result video');
  hbox.setAttribute('href', result.url);

  var thumb = document.createElementNS("http://www.w3.org/1999/xhtml", "html:img");
  thumb.setAttribute('src', result.tbUrl);
  hbox.appendChild(thumb);
  var vbox = document.createElement('vbox');
  vbox.setAttribute('flex', 1);
  var title = document.createElementNS("http://www.w3.org/1999/xhtml", "html:div");
  title.setAttribute("crop", 'end');
  title.setAttribute('class', 'title');
  fakeHTMLinXUL(result.title, title);
  vbox.appendChild(title);
  var content = document.createElementNS("http://www.w3.org/1999/xhtml", "html:div");
  content.setAttribute('class', 'description');
  fakeHTMLinXUL(result['content'], content);
  vbox.appendChild(content);
  var url = document.createElementNS("http://www.w3.org/1999/xhtml", "html:div");
  url.setAttribute('class', 'url');
  fakeHTMLinXUL(result.publisher, url);
  vbox.appendChild(url);
  hbox.appendChild(vbox);
  return hbox;
}

function process(json) {
  if (!json.responseData.results) {
    return [];
  }
  return json.responseData.results;
}

function details(json) {
  return "Estimated Results: " + json.responseData.cursor.estimatedResultCount;
}

var css = (<r><![CDATA[

#searchy .result img
{
  max-width: 120px
}

#searchy .result vbox
{
  padding-left: 10px
}

]]></r>).toString();
