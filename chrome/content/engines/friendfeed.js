name = 'friendfeed';
description = 'FriendFeed search';
function queryUrl(search) {
  var base = "http://friendfeed.com/api/feed/search?q=%QUERY%";
  return base.replace('%QUERY%', encodeURIComponent(search));
}

function buildResultNode(result) {
  var vbox = document.createElement('hbox');
  vbox.setAttribute('class', 'result friendfeed');
  vbox.setAttribute('href', result.link);
  var container = document.createElement('vbox');
  container.setAttribute('pack', 'top');
  var service = document.createElementNS("http://www.w3.org/1999/xhtml", "html:img");
  service.setAttribute('src', result.service.iconUrl);
  service.setAttribute('tooltiptext', result.service.name);
  container.appendChild(service);
  vbox.appendChild(container);
  var title = document.createElementNS("http://www.w3.org/1999/xhtml", "html:div");
  title.setAttribute('class', 'title');
  title.setAttribute('flex', 1);
  fakeHTMLinXUL(result.title, title);
  vbox.appendChild(title);
  return vbox;
}

function process(json) {
  if (!json.entries) {
    return [];
  }

  return json.entries;
}

var css = (<r><![CDATA[

#searchy .friendfeed.result .title
{
  overflow: inherit;
  max-height: inherit;
  padding-left: 8px;
}

]]></r>).toString();
