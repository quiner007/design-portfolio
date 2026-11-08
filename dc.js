/* Tiny runtime for Quin's portfolio pages: renders {{holes}}, <sc-for>, <sc-if>, onClick, and patches the DOM on state changes. */
(function(){
  function look(path,scope){return path.trim().split('.').reduce(function(o,k){return o==null?undefined:o[k]},scope)}
  function fill(str,scope){return str.replace(/\{\{([^}]+)\}\}/g,function(m,p){var v=look(p,scope);return (v==null||typeof v==='function')?'':String(v)})}
  function hole(v){var m=v&&v.match(/\{\{([^}]+)\}\}/);return m?m[1]:null}
  function bind(el,fn){el.__h=fn;if(!el.__hl){el.__hl=1;el.addEventListener('click',function(e){if(el.__h){e.preventDefault();el.__h(e)}})}}
  function walk(node,scope){
    var kids=Array.prototype.slice.call(node.childNodes);
    for(var i=0;i<kids.length;i++){var ch=kids[i];
      if(ch.nodeType===3){if(ch.nodeValue.indexOf('{{')>-1)ch.nodeValue=fill(ch.nodeValue,scope);continue}
      if(ch.nodeType!==1)continue;
      var tag=ch.tagName.toLowerCase(), rep=ch.getAttribute('data-scfor');
      if(tag==='sc-for'||rep){
        var list=look(hole(rep||ch.getAttribute('list')),scope)||[], as=ch.getAttribute(rep?'data-as':'as'), frag=ch.ownerDocument.createDocumentFragment();
        for(var j=0;j<list.length;j++){var tmp=ch.ownerDocument.createElement(rep?'tbody':'div'); if(rep){var c=ch.cloneNode(true);c.removeAttribute('data-scfor');c.removeAttribute('data-as');tmp.appendChild(c)}else tmp.innerHTML=ch.innerHTML;
          var sc=Object.assign({},scope);sc[as]=list[j];walk(tmp,sc);while(tmp.firstChild)frag.appendChild(tmp.firstChild)}
        ch.parentNode.replaceChild(frag,ch);continue}
      if(tag==='sc-if'){var v=look(hole(ch.getAttribute('value')),scope);if(v){walk(ch,scope);var f2=ch.ownerDocument.createDocumentFragment();while(ch.firstChild)f2.appendChild(ch.firstChild);ch.parentNode.replaceChild(f2,ch)}else ch.parentNode.removeChild(ch);continue}
      var attrs=Array.prototype.slice.call(ch.attributes);
      for(var a=0;a<attrs.length;a++){var at=attrs[a];
        if(/^on/i.test(at.name)){var fn=look(hole(at.value)||'',scope);ch.removeAttribute(at.name);if(typeof fn==='function')bind(ch,fn);continue}
        if(at.value.indexOf('{{')>-1)ch.setAttribute(at.name,fill(at.value,scope))}
      walk(ch,scope)}
  }
  function patch(o,n){
    if(o.nodeType!==n.nodeType||o.nodeName!==n.nodeName){o.parentNode.replaceChild(n,o);return}
    if(o.nodeType===3){if(o.nodeValue!==n.nodeValue)o.nodeValue=n.nodeValue;return}
    if(o.nodeType!==1)return;
    var na=n.attributes,oa=o.attributes,i;
    for(i=oa.length-1;i>=0;i--){var nm=oa[i].name;if(!n.hasAttribute(nm)&&!(nm==='open'&&o.nodeName==='DETAILS'))o.removeAttribute(nm)}
    for(i=0;i<na.length;i++){if(o.getAttribute(na[i].name)!==na[i].value)o.setAttribute(na[i].name,na[i].value)}
    if(n.__h||o.__h){if(n.__h)bind(o,n.__h);else o.__h=null}
    var oc=o.childNodes,nc=Array.prototype.slice.call(n.childNodes);
    for(i=0;i<nc.length;i++){if(i<oc.length)patch(oc[i],nc[i]);else o.appendChild(nc[i])}
    while(oc.length>nc.length)o.removeChild(oc[oc.length-1]);
  }
  window.DCLogic=function(props){this.props=props||{};this.state=null};
  DCLogic.prototype.setState=function(s){this.state=Object.assign({},this.state||{},s);var me=this;if(!me.__q){me.__q=1;Promise.resolve().then(function(){me.__q=0;me.__render()})}};
  DCLogic.prototype.__render=function(){
    var t=document.getElementById('dc-template'),root=document.getElementById('root');
    if(!DCLogic.__doc)DCLogic.__doc=document.implementation.createHTMLDocument('');var D=DCLogic.__doc,fresh=D.createElement('div');fresh.appendChild(D.importNode(t.content,true));walk(fresh,this.renderVals());
    if(!root.__live){root.innerHTML='';while(fresh.firstChild)root.appendChild(document.adoptNode(fresh.firstChild));root.__live=1;return}
    var oc=root.childNodes,nc=Array.prototype.slice.call(fresh.childNodes),i;
    for(i=0;i<nc.length;i++){if(i<oc.length)patch(oc[i],nc[i]);else root.appendChild(document.adoptNode(nc[i]))}
    while(oc.length>nc.length)root.removeChild(oc[oc.length-1]);
  };
  window.dcBoot=function(Comp,props){var r=document.getElementById('root');if(r&&r.children.length)r.__live=1;var c=new Comp(props);c.__render();window.__dc=c};
})();
