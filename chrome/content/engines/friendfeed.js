var friendfeed = {
  name: 'friendfeed',
  description: 'FriendFeed search',
  queryUrl: function(search) {
    var base = "http://friendfeed.com/api/feed/search?q=%QUERY%";
    return base.replace('%QUERY%', encodeURIComponent(search));
  },
  buildResultNode: function(result) {
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
  },
  process: function(json) {
    if (!json.entries) {
      return [];
    }

    return json.entries;
  }
};
