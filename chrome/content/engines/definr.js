name = 'definr';

description = 'Definr define your terms';


function queryUrl(search) {
  var base = "http://definr.com:4000/glob.json/%QUERY%";
  return base.replace('%QUERY%', encodeURIComponent(search));
}

function buildResultNode(result) {

  var word = 
    document.createElement('label'); 
    word.setAttribute('class', 'word');
      word.setAttribute('value', result);
      word.setAttribute('href', 'http://definr.com/'+result); 
  return word;
}

function process(json) {
  return json[1];
}  


var css = (<r><![CDATA[

#searchy label.word 
{
  color: #ffffff;
}

]]></r>).toString();

