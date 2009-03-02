name = 'twitter';
description = 'Twitter search';
function queryUrl(search) {
  var base = "http://search.twitter.com/search.json?q=%QUERY%";
  return base.replace('%QUERY%', encodeURIComponent(search));
}

function buildResultNode(result) {
  var box = document.createElement('hbox');
  box.setAttribute('class', 'result twitter');
  box.setAttribute('href', 'http://twitter.com/' + result.from_user + '/status/' + result.id);
  var avatar = document.createElementNS("http://www.w3.org/1999/xhtml", "html:img");
  avatar.setAttribute('src', result.profile_image_url);
  box.appendChild(avatar);
  var title = document.createElementNS("http://www.w3.org/1999/xhtml", "html:div");
  title.setAttribute('class', 'title');
  title.setAttribute('flex', 1);
  fakeHTMLinXUL(result.text, title);
  box.appendChild(title);
  return box;
};

function process(json) {
  if (!json.results) {
    return [];
  }

  return json.results;
}

var css = (<r><![CDATA[

#searchy .twitter.result img
{
  width: 48px;
  height: 48px;
}

#searchy .twitter.result .title
{
  overflow: inherit;
  max-height: inherit;
  padding-left: 10px;
}

#searchy .twitter.result img
{
  width: 16px;
  height: 16px;
}

]]></r>).toString();

