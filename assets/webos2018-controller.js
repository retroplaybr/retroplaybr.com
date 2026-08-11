
(function(){
  'use strict';

  var lastKey = null;
  var log = [];
  var MAX_LOG = 40;

  function visibleFocusable(){
    var nodes=document.querySelectorAll('a[href],button:not([disabled]),input,select,[tabindex]:not([tabindex="-1"])');
    var arr=[];
    for(var i=0;i<nodes.length;i++){
      var r=nodes[i].getBoundingClientRect();
      if(r.width>0 && r.height>0) arr.push(nodes[i]);
    }
    return arr;
  }

  function focusMove(delta){
    var arr=visibleFocusable();
    if(!arr.length) return;
    var cur=document.activeElement;
    var idx=arr.indexOf(cur);
    if(idx<0){ arr[0].focus(); return; }
    idx=(idx+delta+arr.length)%arr.length;
    arr[idx].focus();
    try{arr[idx].scrollIntoView({block:'center',inline:'center'});}catch(e){}
  }

  function activate(){
    var el=document.activeElement;
    if(el && typeof el.click==='function') el.click();
  }

  function goBack(){
    try{
      if(history.length>1) history.back();
      else location.href='/';
    }catch(e){
      location.href='/';
    }
  }

  function pushLog(e){
    lastKey={
      key:e.key||'',
      code:e.code||'',
      keyCode:e.keyCode||e.which||0,
      which:e.which||0,
      time:Date.now()
    };
    log.unshift(lastKey);
    if(log.length>MAX_LOG) log.length=MAX_LOG;

    try{
      var ev=document.createEvent('CustomEvent');
      ev.initCustomEvent('retrohubkey',true,true,lastKey);
      window.dispatchEvent(ev);
    }catch(err){}
  }

  // LG documented remote key codes:
  // Left 37, Up 38, Right 39, Down 40, OK 13, Back 461.
  // Some gamepads on old webOS are translated into these keyboard events.
  function onKeyDown(e){
    pushLog(e);
    var k=e.keyCode||e.which||0;

    if(k===37 || k===38){
      e.preventDefault();
      focusMove(-1);
      return;
    }
    if(k===39 || k===40){
      e.preventDefault();
      focusMove(1);
      return;
    }
    if(k===13 || k===32){
      e.preventDefault();
      activate();
      return;
    }
    if(k===461 || k===27 || k===8){
      e.preventDefault();
      goBack();
      return;
    }

    // Common TV/gamepad media/color codes are exposed to app via event.
    // Do not force action; diagnostic page will reveal exact mapping on this TV.
  }

  document.addEventListener('keydown',onKeyDown,true);

  // Focus first UI item so D-pad works immediately.
  function initFocus(){
    var arr=visibleFocusable();
    if(arr.length && document.activeElement===document.body){
      try{arr[0].focus();}catch(e){}
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',initFocus);
  }else{
    initFocus();
  }

  window.RetroHubWebOS2018={
    getLastKey:function(){return lastKey;},
    getLog:function(){return log.slice();},
    clear:function(){log=[];lastKey=null;}
  };
})();
