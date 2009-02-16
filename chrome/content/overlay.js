var searchy = new function() {

  var prefs = Cc['@mozilla.org/preferences-service;1']
    .getService(Ci.nsIPrefService)
    .getBranch('extensions.searchy.');

  prefs.QueryInterface(Ci.nsIPrefBranch2);

  var $ = function(x) { return document.getElementById(x); };

  var req = new Request();
  var current;
  var queried;
  var queryTimer;

  var searchyInputNode;

  function init() {
    /* add an attribute so we can make sure not to crash on linux */

    var runtime = Cc['@mozilla.org/xre/app-info;1'].getService(Ci.nsIXULRuntime);
    $('searchy').setAttribute('OS', runtime.OS);

    /* don't leak */

    window.removeEventListener('load', init, false);

    /* pop a tab if there is anything to tell the user about */

    function welcome() {
      var version = Cc["@mozilla.org/extensions/manager;1"]
        .getService(Ci.nsIExtensionManager)
        .getItemForID("searchy@overstimulate.com")
        .version;

      var pageURL;
      var lastVersion;

      if (prefs.getPrefType('lastversion')) {
        lastVersion = prefs.getCharPref('lastversion');
      }

      if (!lastVersion) {
        pageURL = "http://overstimulate.com/projects/searchy/welcome?" + version;
      } else if (lastVersion != version) {
        pageURL = "http://overstimulate.com/projects/searchy/upgrade?" + version;
      }

      if (pageURL) {
        setTimeout(function(){ window.openUILinkIn(pageURL, "tab"); }, 500);
      }

      prefs.setCharPref("lastversion", version);
    }

    welcome();

    /* update key bindings */

    var updateShortcut = {
      observe: function() {
        function update(key_id, attribute) {
          try {
            if (prefs.getPrefType(attribute)) {
              var val = prefs.getCharPref(attribute);
              if (val && val.length > 0) {
                var binding = document.getElementById(key_id);
                binding.setAttribute(attribute, val);
              }
            }
          } catch (e) {dump(e)}
        }

        update('key_searchy', 'key');
        update('key_searchy', 'modifiers');
      }
    };

    updateShortcut.observe();

    /* and update the key whenever the prefs change */

/*    prefs.addObserver('', updateShortcut, false);

    function uninit() {
      prefs.removeObserver('', updateShortcut, false);
      window.removeEventListener('unload', uninit, false);
    }

    window.addEventListener('unload', uninit, false); */

    searchyInputNode = $('searchy-input');
  }

  window.addEventListener('load', init, false);

  this.show = function() {
    var panel = $('searchy');
    var width = Math.min(document.width - 40, 800);
    panel.setAttribute('width', width);
    panel.openPopup(null, 'overlap', (document.width-width)/2, 20);
    panel.focus();
  };

  this.about = function() {
    $('searchy').hidePopup();
    openUILinkIn('http://overstimulate.com/projects/searchy', 'tab');
  };

  this.input = function(aEvent) {
    req.abort();
    if (queryTimer) clearTimeout(queryTimer);

    if (searchyInputNode.value == '') {
      return help();
    }

    busy();

    queryTimer = setTimeout(
                   function() {
                     req.search(searchyInputNode.value);
                   }, 250);
  };

  function visit(node, aEvent) {
    select(node);

    var url = node.getAttribute('href');
    $('searchy').hidePopup();
    if (aEvent) {
      var where = whereToOpenLink(aEvent);
    }
    else {
      var where = 'current';
    }
    openUILinkIn(url, where);
  }

  function select(node) {
    if (current && node) {
      current.removeAttribute('current');
    }
    if (node) {
      current = node;
      current.setAttribute('current', true);
    }
  }

  function inputlistener(aEvent) {
    switch (aEvent.keyCode) {
      case aEvent.DOM_VK_RETURN:
        if (queried == searchyInputNode.value) {
          visit(current, aEvent);
        }
        break;
      case aEvent.DOM_VK_UP:
        if (current) { select(current.previousSibling); }
        break;
      case aEvent.DOM_VK_DOWN:
        if (current) { select(current.nextSibling); }
        break;
      default:
        return;
    }

    aEvent.stopPropagation();
    aEvent.preventDefault();
  };

  this.focused = function() {
    searchyInputNode.focus();
    searchyInputNode.setSelectionRange(0, searchyInputNode.value.length);
    window.addEventListener('keypress', inputlistener, true);
  };

  this.hidden = function() {
    req.abort();
    window.removeEventListener('keypress', inputlistener, true);

    /* because the MAC doesn't redraw xul that has a panel over it you are left with crap */
    var win = window;
    setTimeout(function() {
                 var wu = win.QueryInterface(Ci.nsIInterfaceRequestor)
                   .getInterface(Ci.nsIDOMWindowUtils);
                 wu.redraw();
               }, 10);

  };

  function noresults() {
    done();
    $('searchy-no-results').hidden = false;
    $('searchy-help').hidden = true;
    $('searchy-about-results').hidden = true;
  }

  function help() {
    done();
    $('searchy-no-results').hidden = true;
    $('searchy-help').hidden = false;
    $('searchy-about-results').hidden = true;
  }

  function busy() {
    searchyInputNode.setAttribute('busy', true);
    $('searchy-no-results').hidden = true;
    $('searchy-help').hidden = true;
    $('searchy-about-results').hidden = true;
  }

  function done() {
    searchyInputNode.removeAttribute('busy');
    $('searchy-no-results').hidden = true;
    $('searchy-help').hidden = true;
    $('searchy-about-results').hidden = false;
    var box = $('searchy-results');
    while (box.childNodes.length>0) {
      box.removeChild(box.firstChild);
    }
  }

  function process() {
    if (req && (req.xhr.readyState == 4) && (req.xhr.status == 200)) {
      done();

      try {
        var nsJSON = Cc["@mozilla.org/dom/json;1"]
          .createInstance(Ci.nsIJSON);

        var json = nsJSON.decode(req.xhr.responseText);

        if (!json.entries) {
          return noresults();
        }
      }
      catch (e) {
        return noresults();
      }

      current = null;
      queried = req.input;

      if (json.entries.length == 0) {
        return noresults();
      }

      var box = $('searchy-results');
      // $('searchy-about-results').value = "Estimated Results: " + json.responseData.cursor.estimatedResultCount;

      json.entries.forEach(
        function(result) {
/*
        {
            "updated": "2009-02-16T01:47:25Z",
            "service": {
                "profileUrl": "http://friendfeed.com/dheydon",
                "iconUrl": "http://friendfeed.com/static/images/icons/internal.png?v=e471e9afdf04ae568dcbddb5584fc6c0",
                "id": "internal",
                "entryType": "message",
                "name": "FriendFeed"
            },
            "title": "What word would you use to describe people on friendfeed?",
            "media": [

            ],
            "comments": [
                {
                    "date": "2009-02-16T01:48:15Z",
                    "body": "other than friendly lol",
                    "id": "f68a8bca-fb6d-40f4-9e6c-0e3662edd66a",
                    "user": {
                        "profileUrl": "http://friendfeed.com/dheydon",
                        "nickname": "dheydon",
                        "id": "64981b38-5d14-11dd-9bce-003048343a40",
                        "name": "Darren Heydon"
                    }
                },
                {
                    "date": "2009-02-16T01:48:30Z",
                    "body": "People?",
                    "id": "7198b2a1-412b-41c8-b96d-6130bea6674d",
                    "user": {
                        "profileUrl": "http://friendfeed.com/schmeesy",
                        "nickname": "schmeesy",
                        "id": "7ab0207e-0db8-11dd-8c43-003048343a40",
                        "name": "Lisa L. Seifert"
                    }
                },
                {
                    "date": "2009-02-16T01:50:01Z",
                    "body": "Emotive",
                    "id": "98199462-5dc7-4c01-9cb5-07f1a52943f9",
                    "user": {
                        "profileUrl": "http://friendfeed.com/dheydon",
                        "nickname": "dheydon",
                        "id": "64981b38-5d14-11dd-9bce-003048343a40",
                        "name": "Darren Heydon"
                    }
                },
                {
                    "date": "2009-02-16T01:50:36Z",
                    "body": "interesting.",
                    "id": "f5bf844f-5b26-487a-9925-66478038f934",
                    "user": {
                        "profileUrl": "http://friendfeed.com/jvjannotti",
                        "nickname": "jvjannotti",
                        "id": "2f0cd52c-f396-11dc-8371-003048343a40",
                        "name": "some have called me, Jim?"
                    }
                },
                {
                    "date": "2009-02-16T01:51:12Z",
                    "body": "Lisa, i see what you did there :)",
                    "id": "bb7c9828-f890-4dcc-bb98-b621ee59db4e",
                    "user": {
                        "profileUrl": "http://friendfeed.com/dheydon",
                        "nickname": "dheydon",
                        "id": "64981b38-5d14-11dd-9bce-003048343a40",
                        "name": "Darren Heydon"
                    }
                },
                {
                    "date": "2009-02-16T01:51:43Z",
                    "body": "human",
                    "id": "a01cdca8-82ee-4973-947f-fb25e2187984",
                    "user": {
                        "profileUrl": "http://friendfeed.com/texasguitarbuster",
                        "nickname": "texasguitarbuster",
                        "id": "465df4f4-c938-11dd-8551-003048678d04",
                        "name": "Greg (GuitarBuster)"
                    }
                },
                {
                    "date": "2009-02-16T01:52:22Z",
                    "body": "Humorous!",
                    "id": "6421133d-924e-4566-9a6c-5a942e723100",
                    "user": {
                        "profileUrl": "http://friendfeed.com/dheydon",
                        "nickname": "dheydon",
                        "id": "64981b38-5d14-11dd-9bce-003048343a40",
                        "name": "Darren Heydon"
                    }
                },
                {
                    "date": "2009-02-16T01:53:13Z",
                    "body": "Typers.",
                    "id": "0027e6d0-59e7-4291-9815-be4f3689595a",
                    "user": {
                        "profileUrl": "http://friendfeed.com/faboomama",
                        "nickname": "faboomama",
                        "id": "a78335c4-3c7e-11dd-88bc-003048343a40",
                        "name": "Anika Malone"
                    }
                },
                {
                    "date": "2009-02-16T01:53:46Z",
                    "body": "Diverse",
                    "id": "804851d7-3890-426c-a4b9-10d9186a5cb9",
                    "user": {
                        "profileUrl": "http://friendfeed.com/mvandenberg",
                        "nickname": "mvandenberg",
                        "id": "ee463e96-4545-11dd-a546-003048343a40",
                        "name": "Mark VandenBerg"
                    }
                },
                {
                    "date": "2009-02-16T01:55:25Z",
                    "body": "+1 MVB, that's what I was going to say.",
                    "id": "4187356f-2e6b-4a47-912c-7cc022765881",
                    "user": {
                        "profileUrl": "http://friendfeed.com/jhuebel",
                        "nickname": "jhuebel",
                        "id": "3e15bcdc-454e-11dd-a546-003048343a40",
                        "name": "Jason Huebel"
                    }
                },
                {
                    "date": "2009-02-16T01:57:03Z",
                    "body": "*grin*",
                    "id": "dd9a726f-58ad-450b-a5cc-22f8323c10d5",
                    "user": {
                        "profileUrl": "http://friendfeed.com/schmeesy",
                        "nickname": "schmeesy",
                        "id": "7ab0207e-0db8-11dd-8c43-003048343a40",
                        "name": "Lisa L. Seifert"
                    }
                },
                {
                    "date": "2009-02-16T01:57:46Z",
                    "body": "Slackers! (jk)",
                    "id": "13971b8b-543f-458f-8261-1aa8692067df",
                    "user": {
                        "profileUrl": "http://friendfeed.com/rodfather",
                        "nickname": "rodfather",
                        "id": "5facb090-47b9-11dd-93ef-003048343a40",
                        "name": "Rodfather"
                    }
                },
                {
                    "date": "2009-02-16T01:58:56Z",
                    "body": "LOL",
                    "id": "f004de75-3ea9-4c1c-a710-82e845d7ccca",
                    "user": {
                        "profileUrl": "http://friendfeed.com/dheydon",
                        "nickname": "dheydon",
                        "id": "64981b38-5d14-11dd-9bce-003048343a40",
                        "name": "Darren Heydon"
                    }
                },
                {
                    "date": "2009-02-16T01:59:14Z",
                    "body": "Awesomesauce!",
                    "id": "8752eac6-66c0-4782-b5bd-659639262689",
                    "user": {
                        "profileUrl": "http://friendfeed.com/haggis",
                        "nickname": "haggis",
                        "id": "0d65b976-f520-11dc-87d3-003048343a40",
                        "name": "Haggis (Sean)"
                    }
                },
                {
                    "date": "2009-02-16T02:04:42Z",
                    "body": "Epic!",
                    "id": "14c37fda-ed86-49f1-a74f-37b86eb22126",
                    "user": {
                        "profileUrl": "http://friendfeed.com/simplyx",
                        "nickname": "simplyx",
                        "id": "f367eecc-c283-11dd-8616-003048678d04",
                        "name": "Christian (Simply X)"
                    }
                },
                {
                    "date": "2009-02-16T02:05:10Z",
                    "body": "Hawt!",
                    "id": "0ef353e0-60f0-4c7e-b970-c872d46708ff",
                    "user": {
                        "profileUrl": "http://friendfeed.com/dheydon",
                        "nickname": "dheydon",
                        "id": "64981b38-5d14-11dd-9bce-003048343a40",
                        "name": "Darren Heydon"
                    }
                },
                {
                    "date": "2009-02-16T02:06:29Z",
                    "body": "filterable!",
                    "id": "a8118a58-9d63-4593-9201-c5600b96a3e6",
                    "user": {
                        "profileUrl": "http://friendfeed.com/gamjee",
                        "nickname": "gamjee",
                        "id": "7b306422-1b29-11dd-b75f-003048343a40",
                        "name": "Geoff Schultz"
                    }
                },
                {
                    "date": "2009-02-16T02:07:52Z",
                    "body": "+1 for Darren!!",
                    "id": "a757dcc3-08f8-4cce-894c-72eb553020c0",
                    "user": {
                        "profileUrl": "http://friendfeed.com/micahbear78",
                        "nickname": "micahbear78",
                        "id": "b59e4454-ee00-4e3d-a777-8f5d5e626018",
                        "name": "Micah"
                    }
                },
                {
                    "date": "2009-02-16T02:14:53Z",
                    "body": "*blush*",
                    "id": "dd3870c0-1948-42e7-a5d9-2db594217f32",
                    "user": {
                        "profileUrl": "http://friendfeed.com/dheydon",
                        "nickname": "dheydon",
                        "id": "64981b38-5d14-11dd-9bce-003048343a40",
                        "name": "Darren Heydon"
                    }
                },
                {
                    "date": "2009-02-16T02:24:31Z",
                    "body": "pushers",
                    "id": "e6329c71-82e0-4670-86bd-8755a891d9c0",
                    "user": {
                        "profileUrl": "http://friendfeed.com/minimage",
                        "nickname": "minimage",
                        "id": "92101c20-f17e-11dc-963f-003048343a40",
                        "name": "MiniMageAdoptsBorgBabies"
                    }
                },
                {
                    "date": "2009-02-16T04:10:42Z",
                    "body": "Verbose.",
                    "id": "471aa979-e604-4224-9e0a-21639a1925b7",
                    "user": {
                        "profileUrl": "http://friendfeed.com/silas216",
                        "nickname": "silas216",
                        "id": "5afdbc6e-2a05-11dd-aed7-003048343a40",
                        "name": "Steven Perez"
                    }
                },
                {
                    "date": "2009-02-16T04:13:43Z",
                    "body": "Was gonna say Diverse, but Mark took it. I say Skilled.",
                    "id": "429782ab-66cb-4ba9-959b-730b8d683632",
                    "user": {
                        "profileUrl": "http://friendfeed.com/genieyclo",
                        "nickname": "genieyclo",
                        "id": "00268190-5ef8-11dd-85cc-003048343a40",
                        "name": "Mohomed.Genieyclo.Gatsby"
                    }
                },
                {
                    "date": "2009-02-16T04:15:06Z",
                    "body": "Bright.",
                    "id": "cea33a68-4eee-491c-ae23-2464fe390295",
                    "user": {
                        "profileUrl": "http://friendfeed.com/spragued",
                        "nickname": "spragued",
                        "id": "722a04ba-19d9-11dd-b253-003048343a40",
                        "name": "Sprague D"
                    }
                },
                {
                    "date": "2009-02-16T04:15:22Z",
                    "body": "Diverse",
                    "id": "37baa4ca-ca1e-4fce-a9b1-db4ee186b450",
                    "user": {
                        "profileUrl": "http://friendfeed.com/duckscratch",
                        "nickname": "duckscratch",
                        "id": "0ae42308-f57b-11dc-80a0-003048343a40",
                        "name": "Bryce"
                    }
                },
                {
                    "date": "2009-02-16T04:16:18Z",
                    "body": "Supercalifragilisticexpialidocious.",
                    "id": "e8b21b44-08b8-4caf-9935-0c3e52d507b5",
                    "user": {
                        "profileUrl": "http://friendfeed.com/boycaught",
                        "nickname": "boycaught",
                        "id": "fc06c882-9df7-4ed3-9da2-54ac2b64d795",
                        "name": ".LAG"
                    }
                },
                {
                    "date": "2009-02-16T04:18:36Z",
                    "body": "pleasant",
                    "id": "04a7e01e-abce-4797-8bfe-bfcf0d8bf8ba",
                    "user": {
                        "profileUrl": "http://friendfeed.com/eyebee",
                        "nickname": "eyebee",
                        "id": "fd410d92-4944-11dd-9c86-003048343a40",
                        "name": "Ian May"
                    }
                },
                {
                    "date": "2009-02-16T04:19:57Z",
                    "body": "Visual",
                    "id": "f40660df-05d6-4030-ba38-0b5781d60f7e",
                    "user": {
                        "profileUrl": "http://friendfeed.com/dheydon",
                        "nickname": "dheydon",
                        "id": "64981b38-5d14-11dd-9bce-003048343a40",
                        "name": "Darren Heydon"
                    }
                },
                {
                    "date": "2009-02-16T05:45:59Z",
                    "body": "apopemptoclinic",
                    "id": "960ae144-63f2-4bf4-80ae-ed4cc99ddbe6",
                    "user": {
                        "profileUrl": "http://friendfeed.com/mrwondrous",
                        "nickname": "mrwondrous",
                        "id": "fc23f716-f75b-11dc-b955-003048343a40",
                        "name": "david beckwith"
                    }
                },
                {
                    "date": "2009-02-16T08:06:05Z",
                    "body": "Insomniacs",
                    "id": "4d88c47c-47e7-4c85-958b-8c31339e42c7",
                    "user": {
                        "profileUrl": "http://friendfeed.com/charlieanzman",
                        "nickname": "charlieanzman",
                        "id": "a84135a3-0e7f-4197-aad4-14c3f82693de",
                        "name": "Charlie Anzman"
                    }
                },
                {
                    "date": "2009-02-16T08:09:35Z",
                    "body": "Stabbity",
                    "id": "4c0673bb-4c17-4ee5-b86a-16b0ca04dcce",
                    "user": {
                        "profileUrl": "http://friendfeed.com/itblogger",
                        "nickname": "itblogger",
                        "id": "fb86e966-5c60-11dd-8697-003048343a40",
                        "name": "Alex Scoble"
                    }
                },
                {
                    "date": "2009-02-16T08:09:49Z",
                    "body": "friends",
                    "id": "c68c0647-8415-4585-b20b-f979536b3546",
                    "user": {
                        "profileUrl": "http://friendfeed.com/dffrnt",
                        "nickname": "dffrnt",
                        "id": "f7e5b35c-0dbc-11dd-a773-003048343a40",
                        "name": "vijay"
                    }
                }
            ],
            "link": "http://friendfeed.com/e/1a5554ff-c117-4d63-ba0a-ae41adacde3b",
            "likes": [
            ],
            "anonymous": false,
            "published": "2009-02-16T01:47:25Z",
            "hidden": false,
            "id": "1a5554ff-c117-4d63-ba0a-ae41adacde3b",
            "user": {
                "profileUrl": "http://friendfeed.com/dheydon",
                "nickname": "dheydon",
                "id": "64981b38-5d14-11dd-9bce-003048343a40",
                "name": "Darren Heydon"
            }
        },

*/

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
          appendHTMLtoXUL(result.title, title);
          vbox.appendChild(title);
          box.appendChild(vbox);

          if (!current) {
            vbox.setAttribute('current', true);
            current = vbox;
          }

          vbox.onclick = function(event) { visit(this, event); };
        });

    }
  }

  function Request()  {
    var inst = this;

    function currentHost() {
      try {
        return gBrowser.selectedBrowser.webNavigation.currentURI.host;
      }
      catch (e) {}
    }

    function urlFor(search) {
      var base = "http://friendfeed.com/api/feed/search?q=%QUERY%";

/*      if ((search[0] == '@') && currentHost()) {
        search = search.slice(1) + " site:" + currentHost();
      }
*/

      return base.replace('%QUERY%', encodeURIComponent(search));
    }

    inst.search = function(query) {
      inst.input = query; // hmm - this is ugly
      inst.abort();
      inst.xhr = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]
        .createInstance(Ci.nsIXMLHttpRequest);
      inst.xhr.mozBackgroundRequest = true;
      inst.xhr.open("GET", urlFor(query));
      inst.xhr.setRequestHeader("Referer", "http://overstimulate.com/projects/searchy");
      inst.xhr.onreadystatechange = process;
      inst.xhr.send(null);
    };

    inst.abort = function() { if (inst.xhr) { inst.xhr.abort();} };
  }


  function appendHTMLtoXUL(html, node) {
    html.split(/<b>(.*?<\/b>)|([^<]*)/).forEach(
      function(text) {
        var span = document.createElementNS("http://www.w3.org/1999/xhtml", "html:span");
        if (text.match(/<\/b>$/)) {
          span.setAttribute('class', 'bold');
          text = text.slice(0, text.length - 4);
        }

        /* FIXME: instead of deleting <wbr>, instead create multiple spans
         *        so the layout engine can wrap the layout - JA
         */

        text = text.replace(/<wbr>/g, "");

        /* convert XML UTF-16 entities to string characters */
        text = text.replace(/&#(\d+);/g, function() { return String.fromCharCode(RegExp.$1); });

        /* convert some of the more popular XML entities in text */
        text = text.replace(/&quot;/g, '"');
        text = text.replace(/&gt;/g, '>');
        text = text.replace(/&lt;/g, '<');
        text = text.replace(/&amp;/g, '&');

        span.appendChild(document.createTextNode(text));
        node.appendChild(span);
      });
  }
};
