var twitter = {
  name: 'twitter',
  description: 'Twitter search',
  queryUrl: function(search) {
    var base = "http://search.twitter.com/search.json?q=%QUERY%";
    return base.replace('%QUERY%', encodeURIComponent(search));
  },
  buildResultNode: function(result) {
    var vbox = document.createElement('hbox');
    vbox.setAttribute('class', 'result twitter');
    vbox.setAttribute('href', 'http://twitter.com/' + result.from_user + '/status/' + result.id);
    var avatar = document.createElementNS("http://www.w3.org/1999/xhtml", "html:img");
    avatar.setAttribute('src', result.profile_image_url);
    vbox.appendChild(avatar);
    var title = document.createElementNS("http://www.w3.org/1999/xhtml", "html:div");
    title.setAttribute('class', 'title');
    title.setAttribute('flex', 1);
    fakeHTMLinXUL(result.text, title);
    vbox.appendChild(title);
    return box;
  },
  process: function(json) {
    if (!json.results) {
      return [];
    }

    return json.results;
  }
};
