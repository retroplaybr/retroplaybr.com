
(function(){
  'use strict';

  var state = {
    index: null,
    connected: false,
    id: '',
    lastButtons: [],
    lastAxes: [],
    deadzone: 0.28
  };

  function pads(){
    try {
      var fn = navigator.getGamepads || navigator.webkitGetGamepads;
      return fn ? fn.call(navigator) : [];
    } catch(e) { return []; }
  }

  function activePad(){
    var list = pads();
    if (state.index !== null && list[state.index]) return list[state.index];
    for (var i=0;i<list.length;i++){
      if (list[i]) {
        state.index=i;
        state.connected=true;
        state.id=list[i].id || 'USB Gamepad';
        return list[i];
      }
    }
    return null;
  }

  function emitKey(code, keyCode){
    try{
      var ev = document.createEvent('Event');
      ev.initEvent('keydown', true, true);
      ev.keyCode = keyCode;
      ev.which = keyCode;
      ev.code = code;
      ev.key = code;
      document.dispatchEvent(ev);
      if (document.activeElement) document.activeElement.dispatchEvent(ev);
    }catch(e){}
  }

  function clickFocused(){
    var el=document.activeElement;
    if(el && typeof el.click==='function') el.click();
  }

  function moveFocus(dir){
    var nodes=document.querySelectorAll(
      'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"]),input,select'
    );
    if(!nodes.length) return;
    var arr=[];
    for(var i=0;i<nodes.length;i++){
      var r=nodes[i].getBoundingClientRect();
      if(r.width>0 && r.height>0) arr.push(nodes[i]);
    }
    if(!arr.length) return;

    var cur=document.activeElement, idx=arr.indexOf(cur);
    if(idx<0){ arr[0].focus(); return; }

    // Reliable TV navigation fallback.
    var next=idx + (dir>0 ? 1 : -1);
    if(next<0) next=arr.length-1;
    if(next>=arr.length) next=0;
    arr[next].focus();
    try{ arr[next].scrollIntoView({block:'center',inline:'center'}); }catch(e){}
  }

  function buttonPressed(gp, i){
    return !!(gp.buttons && gp.buttons[i] && gp.buttons[i].pressed);
  }

  function edge(gp,i){
    var now=buttonPressed(gp,i);
    var old=!!state.lastButtons[i];
    state.lastButtons[i]=now;
    return now && !old;
  }

  function dispatchRetroHubButton(name, gp){
    try{
      var ev=document.createEvent('CustomEvent');
      ev.initCustomEvent('retrohubgamepad',true,true,{button:name,gamepad:gp});
      window.dispatchEvent(ev);
    }catch(e){}
  }

  function loop(){
    var gp=activePad();
    if(gp){
      // Standard mapping: 0 Cross/A, 1 Circle/B, 2 Square/X, 3 Triangle/Y,
      // 4 L1, 5 R1, 6 L2, 7 R2, 8 Share, 9 Options, 12-15 D-pad.
      if(edge(gp,0)){ clickFocused(); emitKey('Enter',13); dispatchRetroHubButton('A',gp); }
      if(edge(gp,1)){ emitKey('Escape',27); dispatchRetroHubButton('B',gp); }
      if(edge(gp,2)) dispatchRetroHubButton('X',gp);
      if(edge(gp,3)) dispatchRetroHubButton('Y',gp);
      if(edge(gp,4)) dispatchRetroHubButton('L1',gp);
      if(edge(gp,5)) dispatchRetroHubButton('R1',gp);
      if(edge(gp,6)) dispatchRetroHubButton('L2',gp);
      if(edge(gp,7)) dispatchRetroHubButton('R2',gp);
      if(edge(gp,8)) dispatchRetroHubButton('SHARE',gp);
      if(edge(gp,9)) dispatchRetroHubButton('OPTIONS',gp);

      if(edge(gp,12)){ moveFocus(-1); emitKey('ArrowUp',38); }
      if(edge(gp,13)){ moveFocus(1); emitKey('ArrowDown',40); }
      if(edge(gp,14)){ moveFocus(-1); emitKey('ArrowLeft',37); }
      if(edge(gp,15)){ moveFocus(1); emitKey('ArrowRight',39); }

      // Analog stick -> menu focus, edge-triggered.
      var ax0=(gp.axes && gp.axes.length>0)?gp.axes[0]:0;
      var ax1=(gp.axes && gp.axes.length>1)?gp.axes[1]:0;
      var old0=state.lastAxes[0]||0, old1=state.lastAxes[1]||0;
      if(ax1 < -state.deadzone && old1 >= -state.deadzone) moveFocus(-1);
      if(ax1 >  state.deadzone && old1 <=  state.deadzone) moveFocus(1);
      if(ax0 < -state.deadzone && old0 >= -state.deadzone) moveFocus(-1);
      if(ax0 >  state.deadzone && old0 <=  state.deadzone) moveFocus(1);
      state.lastAxes[0]=ax0; state.lastAxes[1]=ax1;

      // Expose raw pad to emulators/players.
      window.RetroHubGamepad = gp;
    }
    requestAnimationFrame(loop);
  }

  window.addEventListener('gamepadconnected',function(e){
    state.index=e.gamepad.index;
    state.connected=true;
    state.id=e.gamepad.id || 'USB Gamepad';
    window.RetroHubGamepad=e.gamepad;
    showStatus('🎮 Controle USB conectado: '+state.id);
  });

  window.addEventListener('gamepaddisconnected',function(e){
    if(state.index===e.gamepad.index){
      state.index=null; state.connected=false; state.id='';
      window.RetroHubGamepad=null;
      showStatus('🎮 Controle desconectado');
    }
  });

  function showStatus(text){
    var el=document.getElementById('retrohub-gamepad-status');
    if(!el){
      el=document.createElement('div');
      el.id='retrohub-gamepad-status';
      el.style.cssText='position:fixed;right:18px;bottom:18px;z-index:99999;background:#061522;color:#fff;border:1px solid #19bfff;border-radius:10px;padding:10px 14px;font:14px Arial,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.35)';
      document.body.appendChild(el);
    }
    el.innerHTML=text;
    clearTimeout(showStatus.t);
    showStatus.t=setTimeout(function(){ if(el) el.style.display='none'; },4500);
    el.style.display='block';
  }

  window.RetroHubGamepadSupport={
    getGamepad:activePad,
    getState:function(){ return state; },
    test:function(){
      var gp=activePad();
      if(!gp){ showStatus('🎮 Nenhum controle detectado. Conecte o DualShock 4 por USB e pressione ✕.'); return null; }
      showStatus('🎮 Detectado: '+(gp.id||'USB Gamepad'));
      return {id:gp.id,index:gp.index,buttons:gp.buttons.length,axes:gp.axes.length,mapping:gp.mapping};
    }
  };

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){ requestAnimationFrame(loop); });
  }else{
    requestAnimationFrame(loop);
  }
})();
