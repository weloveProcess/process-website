/* PROCESS STUDIO 보강: 첫 화면 기본 외형 = 잔디 피치 · 원형 선수알 · 번호 표시 · 큰 선수알.
   '보기' 메뉴 동작을 자동 실행해 적용. 로드 순간 커버를 씌워 깜빡임 없이 "처음부터 잔디"로 보이게. */
(function(){
  var applied=false, tries=0, cover=null, revealed=false;
    /* #1 백업 배너 -> 헤더 칩 */
    try{var __bst=document.createElement('style');__bst.textContent='#bkBanner{display:none !important;}';document.head.appendChild(__bst);var __bar=document.querySelector('header.appbar');if(__bar&&!document.getElementById('ps-bkchip')){var __last=+(localStorage.getItem('cs_lastbk')||0);var __need=!__last||(Date.now()-__last)>6048e5;var __chip=document.createElement('button');__chip.id='ps-bkchip';__chip.type='button';__chip.title='백업';__chip.style.cssText='display:inline-flex;align-items:center;gap:6px;padding:4px 10px 4px 9px;margin-left:8px;border-radius:13px;border:1px solid #e2e4e8;background:#f4f6f8;color:#5a626b;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;';__chip.innerHTML='<span style="width:7px;height:7px;border-radius:50%;display:inline-block;background:'+(__need?'#e6a417':'#34b36a')+'"></span><span>'+(__need?'백업 권장':'로컬 저장됨')+'</span>';__chip.addEventListener('click',function(){var d=document.getElementById('bkDown')||document.getElementById('bkNow')||document.getElementById('gearBtn');if(d)d.click();});var __bk=document.getElementById('bkup');if(__bk&&__bk.parentNode){__bk.parentNode.insertBefore(__chip,__bk);}else{__bar.appendChild(__chip);}}}catch(e){}
  /* 커버 스플래시는 React 셸의 #cs-splash 가 담당하므로 생략(중복 방지). */
  function reveal(){
    if(revealed) return; revealed=true;
    if(cover){ try{ cover.style.opacity='0'; setTimeout(function(){ if(cover&&cover.parentNode) cover.parentNode.removeChild(cover); },380); }catch(e){} }
  }
  setTimeout(reveal, 1900);
  function boardDoc(){
    var ifr=document.getElementsByTagName('iframe');
    for(var i=0;i<ifr.length;i++){ try{ var d=ifr[i].contentDocument; if(d&&d.getElementById('board')) return d; }catch(e){} }
    return null;
  }
  function T(el){ return (el.textContent||'').trim(); }
  function find(doc, test){
    var els=doc.querySelectorAll('button,[role=button],a,div,span');
    for(var i=0;i<els.length;i++){ try{ if(test(els[i]) && els[i].getBoundingClientRect().width>0) return els[i]; }catch(e){} }
    return null;
  }
  function recolorGrass(doc){
    var board=doc.getElementById('board'); if(!board) return;
    var GREENS={'#1b8044':1,'#239150':1,'#1e8a4b':1};
    var DARK='#1e8a4b', LIGHT='#239150';
    var rects=[].slice.call(board.querySelectorAll('rect'));
    var grass=rects.filter(function(r){ return GREENS[(r.getAttribute('fill')||'').toLowerCase()]; });
    grass.filter(function(r){ return parseFloat(r.getAttribute('width')||0)>200; }).forEach(function(r){ if((r.getAttribute('fill')||'').toLowerCase()!==DARK) r.setAttribute('fill',DARK); });
    var stripes=grass.filter(function(r){ return parseFloat(r.getAttribute('width')||0)<=200; });
    stripes.sort(function(a,b){ return parseFloat(a.getAttribute('x')||0)-parseFloat(b.getAttribute('x')||0); });
    stripes.forEach(function(r,i){ var _v=Math.floor(i/2)%2===0?DARK:LIGHT; if((r.getAttribute('fill')||'').toLowerCase()!==_v) r.setAttribute('fill',_v); });
  }
  var psPitchN=1;
  function applyPitches(doc,n){
    try{
      var board=doc.getElementById('board'); if(!board) return;
      var world=board.querySelector('#world'); if(!world) return;
      var NS='http://www.w3.org/2000/svg', W=1110, H=740;
      var old=world.querySelector('#ps-multipitch'); if(old) old.remove();
      var grid=world.querySelector('#gridLayer');
      [].slice.call(world.querySelectorAll('[data-ps-hidden]')).forEach(function(c){ c.style.display=''; c.removeAttribute('data-ps-hidden'); });
      if(grid) grid.style.display='';
      if(n<=1) return;
      [].slice.call(world.children).forEach(function(c){ if(c.tagName.toLowerCase()==='g' && !c.id && c.querySelector('circle,path,line')){ c.setAttribute('data-ps-hidden','1'); c.style.display='none'; } });
      function E(t,a){ var e=doc.createElementNS(NS,t); for(var k in a) e.setAttribute(k,a[k]); return e; }
      var ST={stroke:'#ffffff','stroke-width':'2.4',fill:'none','stroke-opacity':'0.92'};
      function pitch(x0,y0,w,h){
        var g=E('g',{});
        function add(t,a){ for(var k in ST) if(!(k in a)) a[k]=ST[k]; g.appendChild(E(t,a)); }
        add('rect',{x:x0,y:y0,width:w,height:h,rx:6});
        add('line',{x1:x0,y1:y0+h/2,x2:x0+w,y2:y0+h/2});
        add('circle',{cx:x0+w/2,cy:y0+h/2,r:Math.min(w,h)*0.13});
        add('circle',{cx:x0+w/2,cy:y0+h/2,r:3,fill:'#ffffff','stroke-width':'0'});
        var pbW=w*0.58,pbH=h*0.155;
        add('rect',{x:x0+(w-pbW)/2,y:y0,width:pbW,height:pbH});
        add('rect',{x:x0+(w-pbW)/2,y:y0+h-pbH,width:pbW,height:pbH});
        var gbW=w*0.30,gbH=h*0.062;
        add('rect',{x:x0+(w-gbW)/2,y:y0,width:gbW,height:gbH});
        add('rect',{x:x0+(w-gbW)/2,y:y0+h-gbH,width:gbW,height:gbH});
        var ar=w*0.13;
        add('path',{d:'M '+(x0+(w-pbW*0.36)/2)+' '+(y0+pbH)+' A '+ar+' '+ar+' 0 0 0 '+(x0+(w+pbW*0.36)/2)+' '+(y0+pbH)});
        add('path',{d:'M '+(x0+(w-pbW*0.36)/2)+' '+(y0+h-pbH)+' A '+ar+' '+ar+' 0 0 1 '+(x0+(w+pbW*0.36)/2)+' '+(y0+h-pbH)});
        add('circle',{cx:x0+w/2,cy:y0+pbH*0.7,r:2.4,fill:'#ffffff','stroke-width':'0'});
        add('circle',{cx:x0+w/2,cy:y0+h-pbH*0.7,r:2.4,fill:'#ffffff','stroke-width':'0'});
        var cr=Math.min(w,h)*0.035;
        add('path',{d:'M '+x0+' '+(y0+cr)+' A '+cr+' '+cr+' 0 0 0 '+(x0+cr)+' '+y0});
        add('path',{d:'M '+(x0+w-cr)+' '+y0+' A '+cr+' '+cr+' 0 0 0 '+(x0+w)+' '+(y0+cr)});
        add('path',{d:'M '+(x0+w)+' '+(y0+h-cr)+' A '+cr+' '+cr+' 0 0 0 '+(x0+w-cr)+' '+(y0+h)});
        add('path',{d:'M '+(x0+cr)+' '+(y0+h)+' A '+cr+' '+cr+' 0 0 0 '+x0+' '+(y0+h-cr)});
        var goW=w*0.115, goD=Math.min(15,h*0.026), cx=x0+w/2;
        function goal(yLine,dir){ var gx=cx-goW/2, by=dir<0?yLine-goD:yLine+goD;
          g.appendChild(E('rect',{x:gx,y:dir<0?yLine-goD:yLine,width:goW,height:goD,fill:'rgba(255,255,255,0.16)',stroke:'#ffffff','stroke-width':'1.4','stroke-opacity':'0.85'}));
          g.appendChild(E('line',{x1:gx,y1:yLine,x2:gx,y2:by,stroke:'#ffffff','stroke-width':'3.4'}));
          g.appendChild(E('line',{x1:gx+goW,y1:yLine,x2:gx+goW,y2:by,stroke:'#ffffff','stroke-width':'3.4'}));
          g.appendChild(E('line',{x1:gx,y1:by,x2:gx+goW,y2:by,stroke:'#ffffff','stroke-width':'2.6'}));
          for(var k=1;k<3;k++){ var nx=gx+goW*k/3; g.appendChild(E('line',{x1:nx,y1:yLine,x2:nx,y2:by,stroke:'#ffffff','stroke-width':'0.7','stroke-opacity':'0.5'})); }
        }
        goal(y0,-1); goal(y0+h,1);
        return g;
      }
      var grp=E('g',{id:'ps-multipitch'});
      var m=16, gap=16, cw=(W-2*m-gap*(n-1))/n;
      for(var i=0;i<n;i++){ grp.appendChild(pitch(m+i*(cw+gap), m, cw, H-2*m)); }
      var tl=world.querySelector('#tokenLayer'); if(tl) world.insertBefore(grp,tl); else world.appendChild(grp);
    }catch(e){}
  }
  function setPitches(doc,n){ psPitchN=n; applyPitches(doc,n); }
  function attachGrassKeeper(doc){
    if(doc.__psGrassKeeper) return; var board=doc.getElementById('board'); if(!board) return; doc.__psGrassKeeper=1;
    var win=doc.defaultView; var busy=false, t=null;
    var obs=new win.MutationObserver(function(){
      if(busy) return; if(t) clearTimeout(t);
      t=setTimeout(function(){ busy=true; try{ obs.disconnect(); recolorGrass(doc); if(psPitchN>1) applyPitches(doc,psPitchN); }catch(e){} try{ obs.observe(board,{childList:true,subtree:true,attributes:true,attributeFilter:['fill']}); }catch(e){} busy=false; }, 60);
    });
    try{ obs.observe(board,{childList:true,subtree:true,attributes:true,attributeFilter:['fill']}); }catch(e){}
  }
  function attachOneOpen(doc){
    if(doc.__psOneOpen) return;
    var tb=doc.getElementById('boardToolbar'); if(!tb) return;
    doc.__psOneOpen=1;
    function open(e){ try{ return e && doc.defaultView.getComputedStyle(e).display!=='none'; }catch(_){ return false; } }
    function byLabel(l){ var bs=tb.querySelectorAll('button'); for(var i=0;i<bs.length;i++){ var t=T(bs[i]); if(t.indexOf(l)>=0&&t.length<10) return bs[i]; } return null; }
    function closeMenus(clicked){
      var label=clicked?T(clicked):'';
      var cw=(clicked&&clicked.closest)?clicked.closest('.menuwrap'):null;
      var bench=doc.getElementById('bench'); if(open(bench)&&label.indexOf('선수')<0){ var b=byLabel('선수'); if(b) b.click(); }
      var draw=doc.getElementById('drawPanel'); if(open(draw)&&label.indexOf('그리기')<0){ var d=byLabel('그리기'); if(d) d.click(); }
      var wraps=tb.querySelectorAll('.menuwrap');
      for(var i=0;i<wraps.length;i++){ var w=wraps[i], pm=w.querySelector('.popmenu'); if(open(pm)&&w!==cw){ var bt=w.querySelector('.btn'); if(bt) bt.click(); } }
    }
    tb.addEventListener('click', function(ev){ var b=ev.target.closest&&ev.target.closest('button'); if(!b) return; if(b.closest&&(b.closest('#drawPanel')||b.closest('#bench'))) return; setTimeout(function(){ try{ closeMenus(b); }catch(e){} },0); }, false);
  }
  function buildGroups(doc){
    try{
      var win=doc.defaultView; var tb=doc.getElementById('boardToolbar'); if(!tb) return;
      if(doc.getElementById('ps-group-team')) return;
      var acts=tb.querySelector('.tbar-actions'); if(!acts) return;
      var wraps=tb.querySelectorAll('.menuwrap'); var viewWrap=wraps[0], moreWrap=wraps[1];
      if(!viewWrap||!moreWrap) return;
      var viewRows=[].slice.call(viewWrap.querySelector('.popmenu').children);
      var moreRows=[].slice.call(moreWrap.querySelector('.popmenu').children);
      var benchTog=doc.getElementById('benchTog'),drawTog=doc.getElementById('drawTog'),animBtn=doc.getElementById('animToggle'),pngBtn=doc.getElementById('pngBtn'),viewTabs=doc.getElementById('viewTabsTop');
      function sec(t){var d=doc.createElement('div');d.className='menusec';var P={'보기':'<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>','저장':'<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h7"/>','팀':'<circle cx="9" cy="7" r="3"/><path d="M2.5 20a6 6 0 0 1 12 0"/><path d="M16 5.2a3 3 0 0 1 0 5.6"/>','운동장':'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M12 5v14M3 12h18"/>','지우기':'<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>','선수 · 보기':'<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>','배치 저장':'<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h7"/>','운동장 외형':'<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2a10 10 0 1 0 0 20 2.5 2.5 0 0 0 2-4 2.5 2.5 0 0 1 2-4h2a4 4 0 0 0 4-4 10 10 0 0 0-12-8z"/>','내보내기':'<path d="M12 15V3M8 7l4-4 4 4"/><path d="M4 13v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"/>','포메이션':'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/>'};var s=P[t];d.innerHTML=(s?'<svg class="ms-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+s+'</svg>':'')+t;return d;}
      function hrr(){var h=doc.createElement('hr');h.className='menudiv';return h;}
      function rw(n){var r=doc.createElement('div');r.className='menurow';r.style.cssText='display:flex;gap:6px;align-items:center;';r.appendChild(n);return r;}
      var groups=[];
      function closeAll(ex){groups.forEach(function(g){if(g!==ex){g.querySelector('.popmenu').style.display='none';}});}
      function clampAll(){groups.forEach(function(g){var pm=g.querySelector('.popmenu');if(pm.style.display==='none')return;var b=g.querySelector('.btn');var rect=b.getBoundingClientRect();var vw=win.innerWidth,vh=win.innerHeight;var pw=pm.offsetWidth||296;var ph=pm.offsetHeight||300;var left=Math.min(rect.left,vw-pw-10);if(left<8)left=8;var top=rect.top-ph-10;if(top+ph>vh-8)top=vh-8-ph;if(top<8)top=8;pm.style.setProperty('transform','none','important');pm.style.left=left+'px';pm.style.top=top+'px';pm.style.right='auto';});}
      function toggle(w){var pm=w.querySelector('.popmenu');var op=pm.style.display!=='none';closeAll(w);try{var bn=doc.getElementById('bench');if(bn&&win.getComputedStyle(bn).display!=='none'&&benchTog)benchTog.click();}catch(e){}try{var dp=doc.getElementById('drawPanel');if(dp&&win.getComputedStyle(dp).display!=='none'&&drawTog)drawTog.click();}catch(e){}if(op){pm.style.display='none';return;}pm.style.position='fixed';pm.style.display='flex';clampAll();}
      function mk(id,label){var w=doc.createElement('div');w.className='menuwrap';w.id=id;w.style.position='relative';var b=doc.createElement('button');b.className='btn ghost';b.type='button';b.innerHTML=label+' <span style="opacity:.6">▾</span>';var pm=doc.createElement('div');pm.className='popmenu';pm.style.display='none';pm.style.maxHeight='calc(100vh - 110px)';pm.style.overflowY='auto';pm.style.overflowX='hidden';w.appendChild(b);w.appendChild(pm);b.addEventListener('click',function(ev){ev.stopPropagation();toggle(w);setTimeout(clampAll,0);});return w;}
      if(benchTog) benchTog.style.display='none';
      if(drawTog) drawTog.style.display='none';
      var origEq=null; try{ var bc=doc.getElementById('benchCat'); if(bc){ var pp=bc.querySelectorAll('button'); for(var qi=0;qi<pp.length;qi++){ if(T(pp[qi])==='장비'){ origEq=pp[qi]; break; } } } }catch(e){}
      function getEq(){ try{ var bc=doc.getElementById('benchCat'); if(bc){ var pp=bc.querySelectorAll('button'); for(var gi=0;gi<pp.length;gi++){ if(T(pp[gi])==='장비') return pp[gi]; } } }catch(e){} return origEq; }
      function getColor(){ try{ var bc=doc.getElementById('benchCat'); if(bc){ var pp=bc.querySelectorAll('button'); for(var ci=0;ci<pp.length;ci++){ var t=T(pp[ci]); if(t==='파랑'||t==='빨강'||t==='노랑'||t==='초록') return pp[ci]; } } }catch(e){} return null; }
      function eqOn(){ var bc=doc.getElementById('benchCat'); return !!(bc && (''+bc.className).indexOf('equipcat')>=0); }
      function benchOpen(){ var b=doc.getElementById('bench'); return !!(b && win.getComputedStyle(b).display!=='none'); }
      function liftPanels(){ var tbE=doc.getElementById('boardToolbar'); var th=tbE?Math.round(tbE.getBoundingClientRect().height):47; ['drawPanel','bench'].forEach(function(id){ var p=doc.getElementById(id); if(p&&win.getComputedStyle(p).display!=='none'){ try{ p.style.setProperty('transform','translateY(calc(-100% - '+(th+8)+'px))','important'); }catch(e){} } }); }
      function liftSoon(){ setTimeout(liftPanels,90); setTimeout(liftPanels,240); }
      if(origEq) origEq.style.display='none';
      var benchCat=doc.getElementById('benchCat'); if(benchCat) benchCat.style.display='none';
      function itemsToDraw(){ try{ var bi=doc.getElementById('benchItems'); var dp2=doc.getElementById('drawPanel'); if(bi&&dp2&&bi.parentNode!==dp2) dp2.appendChild(bi); }catch(e){} }
      function itemsToBench(){ try{ var bi=doc.getElementById('benchItems'); var bn=doc.getElementById('bench'); if(bi&&bn&&bi.parentNode!==bn) bn.appendChild(bi); }catch(e){} }
      var modeToken=0;
      function enforce(wantEquip){ var my=++modeToken, n=0; var iv=win.setInterval(function(){ if(my!==modeToken){ win.clearInterval(iv); return; } try{ if(wantEquip){ if(!eqOn()){ var e=getEq(); if(e) e.click(); } itemsToDraw(); } else { if(eqOn()){ var c=getColor(); if(c) c.click(); } itemsToBench(); } var bc=doc.getElementById('benchCat'); if(bc) bc.style.display='none'; liftPanels(); }catch(e2){} if(++n>=10) win.clearInterval(iv); }, 80); }
      var team=doc.createElement('button'); team.className='btn ghost'; team.id='ps-group-team'; team.type='button'; team.innerHTML='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 5.2a3 3 0 0 1 0 5.6M17.5 20a5.5 5.5 0 0 0-3-4.9"/></svg>팀';
      var tool=doc.createElement('button'); tool.className='btn ghost'; tool.id='ps-group-tool'; tool.type='button'; tool.innerHTML='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>도구';
      var setg=mk('ps-group-set','<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.1 12c0-.5 0-.9-.1-1.3l1.7-1.3-1.8-3.1-2 .8a6.6 6.6 0 0 0-2.3-1.3L14 3.5h-4l-.3 2a6.6 6.6 0 0 0-2.3 1.3l-2-.8L3.6 9l1.7 1.3c0 .4-.1.8-.1 1.3s0 .9.1 1.3L3.6 15l1.8 3.1 2-.8a6.6 6.6 0 0 0 2.3 1.3l.3 2h4l.3-2a6.6 6.6 0 0 0 2.3-1.3l2 .8 1.8-3.1-1.7-1.3c.1-.4.1-.8.1-1.3z"/></svg>설정');
      var pitchg=mk('ps-group-pitch','<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M12 5v14"/><circle cx="12" cy="12" r="2.4"/></svg>운동장'); var ppm=pitchg.querySelector('.popmenu'); ppm.appendChild(sec('운동장 색')); try{ if(!doc.getElementById('ps-pitch-grp-css')){ var pcssEl=doc.createElement('style'); pcssEl.id='ps-pitch-grp-css'; pcssEl.textContent="#ps-group-pitch #pitchSeg{gap:6px;}#ps-group-pitch #pitchSeg button{display:inline-flex;align-items:center;gap:6px;}#ps-group-pitch #pitchSeg button::before{content:\"\";width:15px;height:11px;border-radius:3px;border:1px solid rgba(0,0,0,.22);}#ps-group-pitch #pitchSeg button[data-p=\"navy\"]::before{background:#15172b;}#ps-group-pitch #pitchSeg button[data-p=\"white\"]::before{background:#fff;}#ps-group-pitch #pitchSeg button[data-p=\"grass\"]::before{background:linear-gradient(135deg,#239150,#1b8044);}"; (doc.head||doc.documentElement).appendChild(pcssEl); } }catch(e){} groups=[setg,pitchg]; try{ if(!doc.getElementById('ps-set-compact-css')){ var scss=doc.createElement('style'); scss.id='ps-set-compact-css'; scss.textContent="#ps-group-set .popmenu{gap:5px 8px !important;padding:9px 10px !important;align-items:center !important;}@media(min-width:600px){#ps-group-set .popmenu{max-width:600px !important;}}#ps-group-set .popmenu .menusec{flex:0 0 auto !important;width:auto !important;margin:0 1px !important;padding:0 !important;font-size:10px !important;font-weight:700 !important;opacity:.5 !important;}#ps-group-set .popmenu .menudiv{flex:0 0 auto !important;width:1px !important;height:20px !important;margin:0 4px !important;background:var(--line,#e2e4e8) !important;border:0 !important;}#ps-group-set .popmenu .menurow{flex:0 0 auto !important;gap:4px !important;margin:0 !important;}#ps-group-set .popmenu .menurow.ps-wide{flex:0 0 auto !important;}#ps-group-set .popmenu .seg{gap:2px !important;}#ps-group-set .popmenu .seg button{padding:5px 8px !important;font-size:11.5px !important;}#ps-group-set .popmenu .btn{padding:5px 9px !important;font-size:11.5px !important;}#ps-group-set .popmenu select.btn{height:28px !important;font-size:11.5px !important;min-width:120px !important;}@media(max-width:599px){#ps-group-set .popmenu{flex-direction:row !important;flex-wrap:wrap !important;max-width:94vw !important;min-width:0 !important;align-items:center !important;justify-content:flex-start !important;}#ps-group-set .popmenu select.btn{min-width:96px !important;}}"; (doc.head||doc.documentElement).appendChild(scss); } }catch(e){} var eqg=doc.createElement('button'); eqg.className='btn ghost'; eqg.id='ps-group-eq'; eqg.type='button'; eqg.innerHTML='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 4h3l3.5 15h-10z"/><path d="M4 19h16"/></svg>장비'; eqg.addEventListener('click',function(ev){ ev.stopPropagation(); closeAll(null); try{ itemsToBench(); }catch(_){} var bn=doc.getElementById('bench'); if(!bn||win.getComputedStyle(bn).display==='none'){ if(benchTog) benchTog.click(); } setTimeout(function(){ try{ itemsToBench(); var ge=getEq(); if(ge && !eqOn()) ge.click(); }catch(_){} },70); });
      team.addEventListener('click',function(ev){ ev.stopPropagation(); closeAll(null); if(benchTog) benchTog.click(); enforce(false); });
      tool.addEventListener('click',function(ev){ ev.stopPropagation(); closeAll(null); if(drawTog) drawTog.click(); win.setTimeout(function(){ try{ var dp2=doc.getElementById('drawPanel'); var nowOpen=dp2&&win.getComputedStyle(dp2).display!=='none'; if(nowOpen){ var ge=getEq(); if(ge&&!eqOn()) ge.click(); itemsToDraw(); } else { itemsToBench(); } liftPanels(); }catch(_){} },70); liftSoon(); });
      var spm=setg.querySelector('.popmenu');
      /* ===== 운동장 (field) ===== */
      spm.appendChild(sec('운동장'));
      (function(){ var pr=doc.createElement('div'); pr.className='menurow'; pr.style.cssText='display:flex;gap:8px;align-items:center;'; var lb=doc.createElement('span'); lb.className='menulbl'; lb.textContent='개수'; pr.appendChild(lb); [1,2,3].forEach(function(k){ var b=doc.createElement('button'); b.type='button'; b.className='btn'; b.textContent=k+'개'; b.style.cssText='padding:4px 12px;'; b.addEventListener('click',function(ev){ ev.stopPropagation(); try{ setPitches(doc,k); }catch(e){} }); pr.appendChild(b); }); spm.appendChild(pr); })();
      if(viewRows[1]){viewRows[1].style.setProperty('display','none','important');spm.appendChild(viewRows[1]);}
      if(viewRows[2])spm.appendChild(viewRows[2]);
      if(viewRows[3]&&ppm)ppm.appendChild(viewRows[3]);
      if(pitchg){ pitchg.classList.add('ps-pitch-inset'); spm.appendChild(pitchg); }
      /* ===== 보기 (display) ===== */
      spm.appendChild(sec('보기'));
      if(viewRows[0])spm.appendChild(viewRows[0]);
      if(viewRows[5])spm.appendChild(viewRows[5]);
      if(viewRows[6])spm.appendChild(viewRows[6]);
      if(viewRows[7]){viewRows[7].className+=" ps-wide";spm.appendChild(viewRows[7]);}
      if(viewRows[8]){viewRows[8].style.setProperty('display','none','important');spm.appendChild(viewRows[8]);}
      /* 저장·내보내기·지우기는 도크 "저장" 메뉴로 분리됨 */
      
      try{ var benchEl=doc.getElementById('bench'); if(benchEl){ var tctl=doc.createElement('div'); tctl.id='ps-team-ctl'; tctl.style.cssText='display:flex;flex-wrap:wrap;align-items:center;gap:5px 9px;width:100%;padding:5px 2px 9px;'; function _psdiv(){var d=doc.createElement('span');d.className='ps-tc-div';return d;} function _pslbl(t){var sp=doc.createElement('span');sp.className='ps-tc-l';sp.textContent=t;return sp;} (function(){ try{ function _cp(nm){ var bc=doc.getElementById('benchCat'); if(bc){ var pp=bc.querySelectorAll('button'); for(var k=0;k<pp.length;k++){ if(T(pp[k])===nm) return pp[k]; } } return null; } var sw=doc.createElement('div'); sw.id='ps-side'; sw.appendChild(_pslbl('선수')); [['우리','파랑','#1a2f5c'],['상대','빨강','#9b1c2e']].forEach(function(a){ var b=doc.createElement('button'); b.type='button'; b.textContent=a[0]; b.className='ps-side-b'; b.style.background=a[2]; b.addEventListener('click',function(ev){ ev.stopPropagation(); var p=_cp(a[1]); if(p) p.click(); }); sw.appendChild(b); }); tctl.appendChild(sw); }catch(e){} })(); tctl.appendChild(_psdiv()); tctl.appendChild(_pslbl('포메이션')); if(moreRows[1]) tctl.appendChild(moreRows[1]); if(moreRows[2]) tctl.appendChild(moreRows[2]); tctl.appendChild(_psdiv()); if(viewRows[4]) tctl.appendChild(viewRows[4]); tctl.appendChild(_psdiv()); if(moreRows[6]) tctl.appendChild(moreRows[6]); benchEl.insertBefore(tctl, benchEl.firstChild); } }catch(e){}
      var __mB=viewTabs&&viewTabs.querySelector('[data-v="match"]'); var __eB=viewTabs&&viewTabs.querySelector('[data-v="meeting"]'); [[__mB,"match"],[__eB,"meeting"]].forEach(function(pair){ var btn=pair[0],v=pair[1]; if(!btn)return; btn.className="btn ghost"; btn.addEventListener("click",function(ev){ev.stopPropagation();try{closeAll(null);}catch(e){}try{win.setView(win.__csView===v?"board":v);}catch(e){}}); }); viewWrap.remove(); moreWrap.remove();
      var boardBtn=doc.createElement('button'); boardBtn.className='btn ghost'; boardBtn.id='ps-group-board'; boardBtn.type='button'; boardBtn.title='기본 작전판'; boardBtn.innerHTML='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;vertical-align:-2px;margin-right:3px"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M12 5v14M3 12h18"/><circle cx="12" cy="12" r="2.4"/></svg>작전판'; boardBtn.addEventListener('click',function(ev){ev.stopPropagation();try{closeAll(null);}catch(e){}try{if(win.boardShowDefault)win.boardShowDefault();else win.setView('board');}catch(e){}});
      acts.appendChild(team); acts.appendChild(tool); /* 장비는 도구 패널에 함께 표시 — 별도 버튼 없음 */ if(animBtn){ animBtn.className='btn ghost'; acts.appendChild(animBtn);} if(__mB)acts.appendChild(__mB); if(__eB)acts.appendChild(__eB); try{ var _spm=setg.querySelector('.popmenu'); }catch(e){} acts.appendChild(setg);
      try{ if(!doc.getElementById('ps-dock')){
        var __bench=doc.getElementById('bench'), __draw=doc.getElementById('drawPanel');
        var st=doc.createElement('style'); st.id='ps-dock-css'; st.textContent=
          "#ps-dock{position:fixed;left:0;right:0;bottom:0;z-index:195;background:var(--panel);border-top:1px solid var(--line);display:flex;flex-direction:column;box-shadow:0 -2px 12px rgba(0,0,0,.20);}"
         +"#ps-dock .ps-drow{display:flex;align-items:center;gap:8px;padding:6px 10px;overflow-x:auto;overflow-y:hidden;white-space:nowrap;scrollbar-width:thin;min-height:42px;}"
         +"#ps-dock .ps-drow+.ps-drow{border-top:1px solid var(--line);}"
         +"#ps-dock .ps-dlab{flex:0 0 auto;font-size:11px;font-weight:800;color:var(--txt-dim,#9aa4b3);margin-right:4px;letter-spacing:.02em;}"
         +"body.ps-dock #drawPanel,body.ps-dock .bench{display:flex!important;position:static!important;transform:none!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;box-shadow:none!important;border:0!important;border-radius:0!important;background:transparent!important;width:auto!important;max-width:none!important;flex-wrap:nowrap!important;padding:0!important;margin:0!important;z-index:auto!important;}"
         +"body.ps-dock #drawPanel::before,body.ps-dock .bench::before,body.ps-dock .bench::after{display:none!important;}"
         +"body.ps-dock #boardToolbar{display:none!important;}"
         +"body.ps-dock #boardStage{padding-bottom:104px!important;}"
         +"body.ps-dock #animBar.on,body.ps-dock .anim-bar.on{position:fixed!important;left:8px!important;right:8px!important;bottom:114px!important;top:auto!important;width:auto!important;max-width:none!important;transform:none!important;z-index:120!important;border-radius:14px!important;box-shadow:0 14px 44px rgba(0,0,0,.45)!important;}"
         +"body.ps-dock.ps-dock-min #animBar.on,body.ps-dock.ps-dock-min .anim-bar.on{bottom:30px!important;}"
         +"body.ps-dock #vaultSave{position:fixed!important;right:14px!important;bottom:116px!important;top:auto!important;left:auto!important;z-index:130!important;}"
         +"body.ps-dock #boardStage:has(#animBar.on) #vaultSave{bottom:190px!important;}"
         +"body.ps-dock.meet-mode:not(.focus-board) #ps-dock{left:154px;}"
         +"body.ps-dock.focus-board #ps-dock{display:none!important;}"
         +"body.ps-dock #ps-dock{display:none;}"
         +"body.ps-dock.board-view #ps-dock,body.ps-dock.match-mode #ps-dock,body.ps-dock.editing #ps-dock,body.ps-dock.meet-mode:not(.focus-board) #ps-dock{display:flex;}"
         +"body.ps-dock.editing #ps-drow-team{display:flex!important;}"
         +"body.ps-dock.editing #boardStage{padding-bottom:104px!important;}"
         +"body.ps-dock.editing #editorBoardWrap>.bench{display:none!important;}"
         +"#editorModal.on{background:var(--bg,#0f141b)!important;}"
         +"#ps-group-set .popmenu #ps-group-pitch{position:static!important;width:100%;background:transparent!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;box-shadow:none!important;border:0!important;}"
         +"#ps-group-set .popmenu #ps-group-pitch>.btn{display:none!important;}"
         +"#ps-group-set .popmenu #ps-group-pitch>.popmenu{display:flex!important;position:static!important;transform:none!important;box-shadow:none!important;border:0!important;padding:0!important;margin:0!important;background:transparent!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;inset:auto!important;min-width:0!important;max-height:none!important;flex-wrap:wrap;gap:6px;}"
         +"#ps-group-set .popmenu .menusec{flex:0 0 100%!important;width:100%!important;margin:9px 0 5px;font-size:11.5px;font-weight:800;color:var(--txt);opacity:.95;padding-top:9px;border-top:1px solid var(--line);display:flex!important;align-items:center;letter-spacing:.02em;}"
         +"#ps-group-set .popmenu>.menusec:first-child{border-top:0;margin-top:0;padding-top:0;}"
         +"#ps-group-set .popmenu .menusec .ms-ic{width:14px;height:14px;margin-right:6px;color:var(--blue,#3a6df0);flex:0 0 auto;}"
         +"#ps-group-set .popmenu .menudiv{display:none;}"
         +"#ps-set-x{position:absolute!important;top:7px;right:8px;width:26px;height:26px;display:flex!important;align-items:center;justify-content:center;border:0;border-radius:8px;background:transparent;color:var(--txt-dim);cursor:pointer;z-index:5;padding:0;margin:0;}"
         +"#ps-set-x:hover{background:color-mix(in srgb,var(--txt) 13%,transparent);color:var(--txt);}"
         +"#ps-set-x svg{width:15px;height:15px;}"
         +"#ps-group-set .popmenu>.menusec:first-child{padding-right:30px;}"
         +"#ps-group-set .popmenu .ps-actrow{display:flex!important;width:100%!important;gap:6px!important;margin:0 0 7px!important;}"
         +"#ps-group-set .popmenu .ps-actrow>.btn{flex:1 1 auto!important;justify-content:center!important;height:32px!important;min-height:32px!important;}"
         +"#ps-group-set .popmenu .menulbl{font-size:11.5px;color:var(--txt-dim);min-width:42px;}"
         +"#ps-group-set .popmenu{flex-direction:column!important;flex-wrap:nowrap!important;align-items:stretch!important;width:320px!important;max-width:92vw!important;}"
         +"#ps-group-set .popmenu>.menurow,#ps-group-set .popmenu #ps-group-pitch .menurow{display:flex!important;flex:0 0 auto!important;width:100%!important;align-items:center!important;gap:8px!important;margin:0 0 7px!important;}"
         +"#ps-group-set .popmenu>.menurow>.menulbl,#ps-group-set .popmenu #ps-group-pitch .menurow>.menulbl{flex:0 0 54px!important;min-width:54px!important;width:54px!important;max-width:54px!important;text-align:left!important;margin:0!important;}"
         +"#ps-group-set .popmenu #ps-group-pitch .menusec{display:none!important;}"
         +"#ps-group-set .ps-side-b{background:var(--panel2,#1b232e)!important;color:var(--txt)!important;border:1px solid var(--line)!important;font-weight:700;position:relative;padding-left:19px!important;}"
         +"#ps-group-set #ps-side .ps-side-b::before{content:\'\';position:absolute;left:7px;top:50%;transform:translateY(-50%);width:8px;height:8px;border-radius:50%;background:#9b1c2e;}"
         +"#ps-group-set #ps-side .ps-side-b:first-of-type::before{background:#1a2f5c;}"
         +"#ps-group-set #pitchSeg button::before{border-radius:50%!important;}"
         +"#ps-group-set #pitchSeg button[data-p=grass]::before{background:#1b8044!important;}"
         +"#ps-group-set #pitchSeg button[data-p=white]::before{box-shadow:inset 0 0 0 1px var(--line)!important;}"
         +"#ps-group-set .popmenu #ps-group-pitch .pe-btn{background:color-mix(in srgb,var(--panel2) 80%,transparent)!important;color:var(--txt)!important;border:1px solid var(--line)!important;}"
         +"#ps-group-set .popmenu #ps-group-pitch .pe-seg{background:color-mix(in srgb,var(--panel2) 75%,transparent)!important;border:1px solid var(--line)!important;}"
         +"#ps-group-set .popmenu #ps-group-pitch .pe-seg button{color:var(--txt-dim)!important;background:transparent!important;}"
         +"#ps-group-set .popmenu .seg button.on,#ps-group-set .popmenu .pe-seg button.on,#ps-group-set .popmenu #ps-group-pitch .seg button.on{background:color-mix(in srgb,var(--txt) 16%,transparent)!important;color:var(--txt)!important;box-shadow:none!important;border-color:transparent!important;}"
         +"#ps-group-set .popmenu #ps-group-pitch .pe-emblem-thumb{background:color-mix(in srgb,var(--panel2) 80%,transparent)!important;border:1px solid var(--line)!important;}"
         +"@media(min-width:761px){#ps-group-set .popmenu{width:392px!important;max-width:92vw!important;padding:14px!important;gap:0!important;border-radius:16px!important;background:rgba(22,27,35,.92)!important;background:color-mix(in srgb,var(--panel) 94%,transparent)!important;-webkit-backdrop-filter:blur(22px) saturate(1.7);backdrop-filter:blur(22px) saturate(1.7);border:0.5px solid color-mix(in srgb,var(--line) 75%,transparent)!important;box-shadow:0 18px 50px rgba(0,0,0,.45),0 2px 8px rgba(0,0,0,.25)!important;flex-direction:column!important;flex-wrap:nowrap!important;}#ps-group-set .popmenu .menusec{flex:0 0 auto!important;width:100%!important;display:flex!important;align-items:center;margin:10px 0 5px!important;padding:0!important;font-size:12px!important;font-weight:700!important;color:var(--txt-dim)!important;opacity:1!important;letter-spacing:.02em!important;}#ps-group-set .popmenu>.menusec:first-child{margin-top:2px!important;}#ps-group-set .popmenu .menusec::after{content:'';flex:1 1 auto;height:1px;background:color-mix(in srgb,var(--line) 65%,transparent);margin-left:10px;}#ps-group-set .popmenu .menusec .ms-ic{width:13px!important;height:13px!important;margin-right:6px!important;color:var(--txt-dim)!important;}#ps-group-set .popmenu>.menurow,#ps-group-set .popmenu #ps-group-pitch .menurow{display:flex!important;align-items:center;gap:8px!important;flex:0 0 auto!important;width:100%!important;margin:0 0 4px!important;}#ps-group-set .popmenu>.menurow>.menulbl,#ps-group-set .popmenu #ps-group-pitch .menurow>.menulbl{flex:0 0 58px!important;min-width:58px!important;text-align:right!important;font-size:12px!important;color:var(--txt-dim)!important;opacity:1!important;margin:0!important;}#ps-group-set .popmenu .btn,#ps-group-set .popmenu .seg>button{height:30px!important;min-height:30px!important;padding:0 11px!important;font-size:12px!important;border-radius:8px!important;}#ps-group-set .popmenu .seg{padding:2px!important;border-radius:9px!important;background:color-mix(in srgb,var(--panel2) 75%,transparent)!important;gap:2px!important;}#ps-group-set .popmenu .seg>button{border-radius:7px!important;}#ps-group-set .popmenu select.btn{height:30px!important;padding:0 8px!important;}#ps-group-set .popmenu input[type=color]{width:26px!important;height:26px!important;}#ps-group-set .popmenu #ps-team-ctl{display:flex!important;gap:7px 9px!important;padding:0 0 8px!important;flex-wrap:wrap!important;align-items:center!important;overflow:visible!important;}#ps-group-set .popmenu #ps-team-ctl .menurow{flex:0 1 auto!important;width:auto!important;margin:0!important;}#ps-group-set .popmenu #ps-team-ctl select.btn{min-width:0!important;width:auto!important;max-width:118px!important;}#ps-group-set .popmenu #ps-team-ctl .ps-tc-div{display:none!important;}#ps-group-set .popmenu #ps-team-ctl>*{flex:0 0 auto;}#ps-group-set .popmenu .ps-tc-l{font-size:12px!important;color:var(--txt-dim)!important;}#ps-group-set .popmenu #ps-group-pitch{width:100%!important;}}"
         +"#ps-dock .bench-items{flex:1 1 auto;min-width:60px;}"
         +"body.ps-dock #benchCat{display:flex!important;align-items:center;gap:6px;flex:0 0 auto;margin-right:6px;}"
         +"body.ps-dock #bench{gap:10px;}"
         +"#ps-dock .ps-drow{position:relative;}"
         +"#ps-dock .ps-dlab{font-size:12px;font-weight:900;color:var(--txt);opacity:.9;}"
         +"#ps-dock #ps-drow-team{background:rgba(0,0,0,.14);}"
         +"body.ps-dock #ps-team-ctl{display:none!important;}"
         +"body.ps-dock.ps-teamset #ps-team-ctl{display:flex!important;position:fixed;z-index:80;flex-direction:column!important;align-items:stretch!important;flex-wrap:nowrap!important;gap:9px;background:color-mix(in srgb,var(--panel,#1a2230) 96%,transparent);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:12px;box-shadow:0 14px 44px rgba(0,0,0,.5);min-width:240px;max-width:300px;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);}"
         +"#ps-teamset-tog{flex:0 0 auto;font-size:12px;font-weight:700;}"
         +"body.ps-teamset #ps-teamset-tog{color:var(--blue,#3a6df0);border-color:var(--blue,#3a6df0);}"
         +"#ps-dock .ps-sep{flex:0 0 auto;width:1px;height:24px;background:var(--line);margin:0 5px;}"
         +"#ps-dock .ps-side-mini-b{padding:5px 12px;font-weight:800;font-size:12px;}"
         +"#ps-dock .ps-side-mini-b.on{background:var(--blue,#3a6df0)!important;border-color:var(--blue,#3a6df0)!important;color:#fff!important;}"
         +"body.ps-dock #colorWrap{position:relative;}"
         +"body.ps-dock #colorBtn{position:relative;border-radius:50%;}"
         +"body.ps-dock #colorBtn::after{content:'';position:absolute;inset:-4px;border-radius:50%;z-index:-1;background:conic-gradient(#ff3b30,#ff9500,#ffcc00,#34c759,#5ac8fa,#007aff,#af52de,#ff2d55,#ff3b30);}"
         +"#ps-dock-grip{position:absolute;top:-15px;right:12px;z-index:61;width:50px;height:17px;border:1px solid var(--line);border-bottom:0;border-radius:8px 8px 0 0;background:var(--panel);color:var(--txt);font-size:11px;line-height:14px;cursor:pointer;}"
         +"body.ps-dock-min #ps-drow-tool,body.ps-dock-min #ps-drow-team{display:none!important;}"
         +"body.ps-dock-min #boardStage{padding-bottom:20px!important;}"
         +"body.ps-dock-min.meet-mode:not(.focus-board) #boardStage{padding-bottom:20px!important;}"
         +"#ps-save-pop,#ps-eq-pop{flex-direction:column;gap:0;width:250px;max-width:92vw;padding:12px;border-radius:16px;background:color-mix(in srgb,var(--panel) 94%,transparent);-webkit-backdrop-filter:blur(22px) saturate(1.7);backdrop-filter:blur(22px) saturate(1.7);border:0.5px solid color-mix(in srgb,var(--line) 75%,transparent);box-shadow:0 18px 50px rgba(0,0,0,.45),0 2px 8px rgba(0,0,0,.25);}"
         +"#ps-eq-pop{width:auto;}"
         +"#ps-save-pop svg:not(.ms-ic){width:15px!important;height:15px!important;flex:0 0 auto;}"
         +"#ps-eq-pop svg{width:16px!important;height:16px!important;flex:0 0 auto;}"
         +"#ps-save-pop .menusec{display:flex!important;align-items:center;width:100%;margin:14px 0 8px;padding:0;font-size:12px;font-weight:700;color:var(--txt-dim);letter-spacing:.02em;border:0;background:none;}"
         +"#ps-save-pop>.menusec:first-child{margin-top:2px;}"
         +"#ps-save-pop .menusec::after{content:'';flex:1 1 auto;height:1px;background:color-mix(in srgb,var(--line) 60%,transparent);margin-left:10px;}"
         +"#ps-save-pop .menusec .ms-ic{width:13px!important;height:13px!important;margin-right:6px;color:var(--txt-dim);flex:0 0 auto;}"
         +"#ps-save-pop .ps-wide{display:flex!important;width:100%;margin:0 0 7px;gap:6px;flex:0 0 auto;}"
         +"#ps-save-pop .btn{height:34px;min-height:34px;padding:0 12px;font-size:12.5px;border-radius:9px;display:inline-flex;align-items:center;gap:8px;justify-content:center;flex:1 1 auto;font-weight:600;}"
         +"#ps-save-pop .ps-wide.btn{justify-content:flex-start;}"
         +"#ps-save-pop .menurow .btn{flex:1 1 auto;}"
         +"#ps-save-pop #playSel,#ps-save-pop #delBtn,#ps-save-pop #playLibBtn{display:none!important;}"
         +"#ps-save-pop .menurow:has(#playLibBtn){display:none!important;}"
         +"#ps-eq-pop #ps-eq-row{gap:8px;max-width:min(540px,86vw);}"
         +"body.ps-dock.ps-teamset #ps-team-ctl{gap:8px;padding:13px;width:252px;}"
         +"body.ps-dock.ps-teamset #ps-team-ctl .ps-tc-div{display:block!important;width:100%;height:1px;background:color-mix(in srgb,var(--line) 55%,transparent);margin:4px 0;flex:0 0 auto;}"
         +"body.ps-dock.ps-teamset #ps-team-ctl>.ps-tc-l{width:100%;font-size:11px;font-weight:700;color:var(--txt-dim);opacity:.9;letter-spacing:.02em;margin:1px 0 -1px;}"
         +"body.ps-dock.ps-teamset #ps-team-ctl #ps-side{display:flex!important;align-items:center;gap:7px;width:100%!important;}"
         +"body.ps-dock.ps-teamset #ps-team-ctl #ps-side .ps-tc-l{flex:0 0 46px;font-size:12px;color:var(--txt-dim);font-weight:600;}"
         +"body.ps-dock.ps-teamset #ps-team-ctl .menurow{display:flex!important;align-items:center;gap:8px;width:100%!important;margin:0!important;flex:0 0 auto!important;}"
         +"body.ps-dock.ps-teamset #ps-team-ctl .menulbl{flex:0 0 46px;font-size:12px;color:var(--txt-dim);text-align:left;min-width:0;margin:0;}"
         +"body.ps-dock.ps-teamset #ps-team-ctl select.btn{flex:1 1 auto;height:31px;min-width:0;border-radius:8px;font-size:12.5px;}"
         +"body.ps-dock.ps-teamset #ps-team-ctl .btn{height:31px;border-radius:8px;}"
         +"body.ps-dock.ps-teamset #ps-team-ctl .ps-side-b{padding:6px 13px;border-radius:8px;font-weight:700;font-size:12.5px;}"
         +"body.ps-dock.ps-teamset #ps-team-ctl #rosterBtn{width:100%!important;flex:1 1 auto!important;justify-content:center!important;height:34px!important;font-weight:600;padding:0 12px!important;}"
         +"body.ps-dock.ps-teamset #ps-team-ctl .uni-wheels{display:flex;gap:9px;align-items:center;}"
         +"body.ps-dock.ps-teamset #ps-team-ctl .uni-w{font-size:12px;gap:4px;}"
         +"body.ps-dock.ps-teamset #ps-team-ctl .ps-ts-hd{display:flex!important;align-items:center;gap:7px;width:100%;font-size:12px;font-weight:700;color:var(--txt-dim);letter-spacing:.02em;padding:0 0 9px;margin:0 0 2px;border-bottom:1px solid color-mix(in srgb,var(--line) 60%,transparent);}"
         +"body.ps-dock.ps-teamset #ps-team-ctl .ps-ts-hd svg{width:14px;height:14px;flex:0 0 auto;color:var(--txt-dim);}"
         +"body.ps-dock.ps-teamset #ps-team-ctl #ps-side,body.ps-dock.ps-teamset #ps-team-ctl .menurow{gap:9px!important;padding:0!important;margin:0!important;}"
         +"body.ps-dock.ps-teamset #ps-team-ctl #ps-side .ps-tc-l,body.ps-dock.ps-teamset #ps-team-ctl .menulbl{flex:0 0 50px!important;width:50px!important;min-width:50px!important;margin:0!important;padding:0!important;text-align:left!important;}"
         +"body.ps-dock.ps-teamset #ps-team-ctl>.ps-tc-l{padding-left:0!important;margin:3px 0 -1px!important;}"
         +"body.ps-dock.ps-teamset #ps-team-ctl .menurow>.btn{flex:1 1 auto!important;width:100%!important;justify-content:center!important;}"
         +"body.ps-dock.ps-teamset #ps-team-ctl .uni-wheels{display:flex!important;align-items:center;gap:12px!important;justify-content:flex-start!important;width:auto!important;}"
         +"body.ps-dock.ps-teamset #ps-team-ctl .uni-wheels>*{margin:0!important;}"
         +"body.ps-dock.ps-teamset #ps-team-ctl{width:228px!important;gap:6px!important;padding:13px!important;}"
         +"body.ps-dock.ps-teamset #ps-team-ctl #ps-side,body.ps-dock.ps-teamset #ps-team-ctl .menurow{display:flex!important;align-items:center!important;gap:8px!important;width:100%!important;min-height:30px!important;margin:0!important;padding:0!important;box-sizing:border-box!important;}"
         +"body.ps-dock.ps-teamset #ps-team-ctl #ps-side>.ps-tc-l,body.ps-dock.ps-teamset #ps-team-ctl .menurow>.menulbl{flex:0 0 44px!important;width:44px!important;min-width:44px!important;max-width:44px!important;text-align:left!important;margin:0!important;padding:0!important;font-size:12px!important;color:var(--txt-dim)!important;}"
         +"body.ps-dock.ps-teamset #ps-team-ctl .menurow>select.btn{flex:1 1 auto!important;width:auto!important;min-width:0!important;max-width:none!important;margin:0!important;}"
         +"body.ps-dock.ps-teamset #ps-team-ctl #ps-side>.ps-side-b{flex:0 0 auto!important;margin:0!important;}"
         +"body.ps-dock.ps-teamset #ps-team-ctl .uni-wheels{flex:1 1 auto!important;gap:14px!important;margin:0!important;padding:0!important;}"
         +"body.ps-dock.ps-teamset #ps-team-ctl>.ps-tc-l{width:100%!important;margin:4px 0 0!important;padding:0!important;font-size:11px!important;font-weight:700!important;color:var(--txt-dim)!important;}"
         +"body.ps-dock.ps-teamset #ps-team-ctl .ps-tc-div{margin:5px 0!important;}"
         +"body.ps-dock.ps-teamset #ps-team-ctl #rosterBtn{width:100%!important;margin:2px 0 0!important;}";
        doc.head.appendChild(st);
        var dk=doc.createElement('div'); dk.id='ps-dock';
        var rTool=doc.createElement('div'); rTool.className='ps-drow'; rTool.id='ps-drow-tool';
        var rTeam=doc.createElement('div'); rTeam.className='ps-drow'; rTeam.id='ps-drow-team';
        var l1=doc.createElement('span'); l1.className='ps-dlab'; l1.textContent='도구'; rTool.appendChild(l1);
        try{ var _ub=doc.getElementById('undoBtn'),_rb=doc.getElementById('redoBtn'); if(_ub){_ub.className='btn ghost'; _ub.style.display=''; rTool.appendChild(_ub);} if(_rb){_rb.className='btn ghost'; _rb.style.display=''; rTool.appendChild(_rb);} var _sp=doc.createElement('span'); _sp.className='ps-sep'; rTool.appendChild(_sp); }catch(e){}
        if(__draw) rTool.appendChild(__draw);
        if(animBtn){ animBtn.className='btn ghost'; rTool.appendChild(animBtn); }
        if(setg) rTool.appendChild(setg);
        var __popBd; try{ __popBd=doc.getElementById('ps-pop-backdrop'); if(!__popBd){ __popBd=doc.createElement('div'); __popBd.id='ps-pop-backdrop'; __popBd.style.cssText='position:fixed;inset:0;z-index:190;display:none;background:transparent;'; doc.body.appendChild(__popBd); } }catch(e){}
        function __psHideBd(){ try{ if(__popBd)__popBd.style.display='none'; win.__psPopClose=null; }catch(e){} }
        function __psShowBd(closer){ try{ if(win.__psPopClose){ try{win.__psPopClose();}catch(e){} } if(__popBd)__popBd.style.display='block'; win.__psPopClose=closer; }catch(e){} }
        try{ if(__popBd && !__popBd.__wired){ __popBd.__wired=1; var __bdC=function(ev){ if(ev&&ev.stopPropagation)ev.stopPropagation(); if(win.__psPopClose){ try{win.__psPopClose();}catch(e){} } }; __popBd.addEventListener('click',__bdC); __popBd.addEventListener('touchstart',__bdC,{passive:true}); } }catch(e){}
        /* 배치 저장 메뉴 제거됨 — 이미지·지우기는 설정으로 이동 */
        var l2=doc.createElement('span'); l2.className='ps-dlab'; l2.textContent='팀'; rTeam.appendChild(l2);
        if(__bench) rTeam.appendChild(__bench);
        dk.appendChild(rTool); dk.appendChild(rTeam);
        doc.body.appendChild(dk);
        doc.body.classList.add('ps-dock');
        try{ function __edBench(){ try{ if(doc.body.classList.contains('editing')){ var dt=doc.getElementById('ps-drow-team'), bn=doc.getElementById('bench'); if(dt&&bn&&bn.parentNode!==dt){ dt.appendChild(bn); } } }catch(e){} } var __mo=new win.MutationObserver(__edBench); __mo.observe(doc.body,{attributes:true,attributeFilter:['class']}); win.setInterval(__edBench,800); }catch(e){}
        try{ itemsToBench(); }catch(e){}
        try{ doc.body.classList.remove('tools-open','bench-open'); }catch(e){}
        function __clrLift(){ try{ if(__draw)__draw.style.setProperty('transform','none','important'); if(__bench)__bench.style.setProperty('transform','none','important'); }catch(e){} }
        __clrLift(); win.setTimeout(__clrLift,120); win.setTimeout(__clrLift,400); win.setTimeout(__clrLift,900);
        try{ var __spm=setg&&setg.querySelector('.popmenu'); var __tctl=doc.getElementById('ps-team-ctl');
          if(__tctl){ __tctl.style.width='auto'; }
          try{ if(__spm){ if(!__spm.__extras){ __spm.__extras=1;
            if(pngBtn){ pngBtn.className='btn'; var _imw=doc.createElement('div'); _imw.className='menurow ps-wide ps-actrow'; _imw.appendChild(pngBtn); __spm.appendChild(sec('내보내기')); __spm.appendChild(_imw); }
            __spm.appendChild(sec('지우기'));
            [13,14].forEach(function(i){ if(moreRows[i]){ moreRows[i].className+=' ps-wide ps-actrow'; __spm.appendChild(moreRows[i]); } });
          } } }catch(e){}
          try{ if(__spm){ __spm.style.setProperty('display','none','important'); __spm.__open=false; } }catch(e){}
          try{ if(__spm && !doc.getElementById('ps-set-x')){ var _setx=doc.createElement('button'); _setx.id='ps-set-x'; _setx.type='button'; _setx.title='\ub2eb\uae30'; _setx.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>'; _setx.addEventListener('click',function(ev){ ev.stopPropagation(); try{__spm.style.setProperty('display','none','important');}catch(_){} __spm.__open=false; try{__psHideBd();}catch(_){} }); __spm.appendChild(_setx); } }catch(e){}
          if(setg&&__spm){ var __sb=setg.querySelector('.btn'); if(__sb){ var __sb2=__sb.cloneNode(true); __sb.parentNode.replaceChild(__sb2,__sb);
            __sb2.addEventListener('click',function(ev){ ev.stopPropagation();
              if(__spm.__open){ __spm.style.setProperty('display','none','important'); __spm.__open=false; __psHideBd(); return; }
              __spm.style.position='fixed'; __spm.style.setProperty('display','flex','important'); __spm.style.zIndex='200'; __spm.style.maxHeight='calc(100vh - 20px)'; __spm.style.overflowY='auto';
              var r=__sb2.getBoundingClientRect(); var pw=__spm.offsetWidth||340, ph=__spm.offsetHeight||340;
              var left=Math.min(r.left, win.innerWidth-pw-10); if(left<8)left=8;
              var top=r.top-ph-10; if(top<8)top=8;
              __spm.style.left=left+'px'; __spm.style.top=top+'px'; __spm.style.right='auto'; __spm.style.bottom='auto'; __spm.style.transform='none';
              __spm.__open=true;
              __psShowBd(function(){ __spm.style.setProperty('display','none','important'); __spm.__open=false; __psHideBd(); });
            });
            doc.addEventListener('click',function(e){ if(__spm.__open && !__spm.contains(e.target) && !__sb2.contains(e.target)){ __spm.style.setProperty('display','none','important'); __spm.__open=false; } });
          } }
        }catch(e){}
        try{ var __tp=__bench.querySelectorAll('#benchCat .tpill'); for(var ti=0;ti<__tp.length;ti++)__tp[ti].style.display='none'; }catch(e){}
        try{
          var rtool=doc.getElementById('ps-drow-tool');
          var __eqBtn=doc.createElement('button'); __eqBtn.className='btn ghost'; __eqBtn.type='button'; __eqBtn.id='ps-eq-btn';
          __eqBtn.innerHTML='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 3 7l9 5 9-5-9-5zM3 12l9 5 9-5M3 17l9 5 9-5"/></svg>장비';
          var __eqPop=doc.createElement('div'); __eqPop.id='ps-eq-pop'; __eqPop.className='popmenu'; __eqPop.style.display='none';
          var __eqRow=doc.createElement('div'); __eqRow.id='ps-eq-row'; __eqRow.style.cssText='display:flex;flex-wrap:wrap;align-items:center;gap:8px;max-width:min(540px,86vw);';
          __eqPop.appendChild(__eqRow); doc.body.appendChild(__eqPop);
          if(rtool){ var __at=doc.getElementById('animToggle'); if(__at&&__at.parentNode===rtool) rtool.insertBefore(__eqBtn,__at); else rtool.appendChild(__eqBtn); }
          var __prevColor=null;
          function __renderEqInto(){
            var real=doc.getElementById('benchItems'); var pc=doc.getElementById('ps-eq-items'); if(!real||!pc)return;
            try{ real.id='benchItems-bak'; pc.id='benchItems';
              var ep=getEq(); if(ep && !eqOn()){ ep.click(); } else if(win.renderBench){ win.renderBench(); }
            }catch(e){}
            try{ pc.id='ps-eq-items'; real.id='benchItems'; }catch(e){}
            try{ var c=__prevColor||getColor(); if(c) c.click(); }catch(e){}
          }
          function __eqOpen(){
            try{ __prevColor=getColor(); }catch(e){}
            try{ var ec=doc.getElementById('eqColCtl'); if(ec){ __eqRow.appendChild(ec); if(!ec.__psHook){ ec.__psHook=1; ec.addEventListener('click',function(){ if(__eqPop.__open) setTimeout(__renderEqInto,0); }); } } }catch(e){}
            try{ var pc=doc.getElementById('ps-eq-items'); if(!pc){ pc=doc.createElement('div'); pc.id='ps-eq-items'; pc.className='bench-items'; pc.style.cssText='display:flex;flex-wrap:wrap;align-items:center;gap:6px;'; __eqRow.appendChild(pc); } }catch(e){}
            try{ __renderEqInto(); }catch(e){}
            __eqPop.style.position='fixed'; __eqPop.style.display='flex'; __eqPop.style.zIndex='200'; __eqPop.style.maxHeight='calc(100vh - 150px)'; __eqPop.style.overflowY='auto';
            var r=__eqBtn.getBoundingClientRect(); var pw=__eqPop.offsetWidth||360, ph=__eqPop.offsetHeight||120;
            var left=Math.min(r.left, win.innerWidth-pw-10); if(left<8)left=8; var top=r.top-ph-10; if(top<8)top=8;
            __eqPop.style.left=left+'px'; __eqPop.style.top=top+'px'; __eqPop.style.right='auto'; __eqPop.style.bottom='auto'; __eqPop.style.transform='none';
            __eqPop.__open=true; __eqBtn.classList.add('on');
            __psShowBd(__eqClose);
          }
          function __eqClose(){
            if(!__eqPop.__open)return;
            try{ var bc=doc.getElementById('benchCat'); var ec=doc.getElementById('eqColCtl'); if(bc&&ec) bc.appendChild(ec); }catch(e){}
            try{ var pc=doc.getElementById('ps-eq-items'); if(pc) pc.innerHTML=''; }catch(e){}
            try{ var c=__prevColor||getColor(); if(c) c.click(); }catch(e){}
            __eqPop.style.display='none'; __eqPop.__open=false; __eqBtn.classList.remove('on');
            __psHideBd();
          }
          __eqBtn.addEventListener('click',function(ev){ ev.stopPropagation(); if(__eqPop.__open)__eqClose(); else __eqOpen(); });
          doc.addEventListener('click',function(e){ if(__eqPop.__open && !__eqPop.contains(e.target) && !__eqBtn.contains(e.target)) __eqClose(); });
          try{ var ep0=getEq(); if(ep0) ep0.style.display='none'; }catch(e){}
        }catch(e){}
        try{ var __tr=doc.getElementById('ps-drow-team'); var __tc=doc.getElementById('ps-team-ctl');
          if(__tr && __tc){
            var tog=doc.createElement('button'); tog.id='ps-teamset-tog'; tog.className='btn ghost'; tog.type='button';
            tog.innerHTML='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;vertical-align:-2px;margin-right:3px"><circle cx="12" cy="12" r="3"/><path d="M19 12c0-.4 0-.7-.1-1l1.5-1.1-1.5-2.6-1.8.7a6 6 0 0 0-1.8-1L15 5h-3l-.3 2a6 6 0 0 0-1.8 1l-1.8-.7L6.6 9.9 8.1 11c-.1.3-.1.6-.1 1s0 .7.1 1l-1.5 1.1 1.5 2.6 1.8-.7a6 6 0 0 0 1.8 1l.3 2h3l.3-2a6 6 0 0 0 1.8-1l1.8.7 1.5-2.6L18.9 13c.1-.3.1-.6.1-1z"/></svg>팀 설정 <span style="opacity:.5">\u25BE</span>';
            var __tc2=__tc;
            try{ if(!__tc.querySelector('.ps-ts-hd')){ var __hd=doc.createElement('div'); __hd.className='ps-ts-hd'; __hd.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="3"/><path d="M2.5 20a6 6 0 0 1 12 0"/><path d="M16 5.2a3 3 0 0 1 0 5.6"/></svg>팀 설정'; __tc.insertBefore(__hd, __tc.firstChild); } }catch(e){}
            function __closeTS(){ doc.body.classList.remove('ps-teamset'); doc.removeEventListener('mousedown',__tsOut,true); doc.removeEventListener('touchstart',__tsOut,true); }
            function __tsOut(ev){ if(__tc2.contains(ev.target)||tog.contains(ev.target))return; __closeTS(); }
            tog.addEventListener('click',function(e){ e.stopPropagation();
              var on=doc.body.classList.toggle('ps-teamset');
              if(on){ try{ var r=tog.getBoundingClientRect(), vw=doc.defaultView.innerWidth, vh=doc.defaultView.innerHeight;
                  __tc2.style.bottom=(vh-r.top+8)+'px'; var L=Math.min(r.left, vw-268); if(L<8)L=8; __tc2.style.left=L+'px'; __tc2.style.right='auto'; __tc2.style.top='auto'; }catch(_){}
                setTimeout(function(){ doc.addEventListener('mousedown',__tsOut,true); doc.addEventListener('touchstart',__tsOut,true); },0);
              } else { __closeTS(); }
            });
            var lbl=__tr.querySelector('.ps-dlab'); if(lbl&&lbl.nextSibling)__tr.insertBefore(tog,lbl.nextSibling); else __tr.insertBefore(tog,__tr.firstChild);
            try{ if(!doc.getElementById('ps-side2')){
              function __cpBC(nm){ var bc=doc.getElementById('benchCat'); if(bc){ var pp=bc.querySelectorAll('button'); for(var k=0;k<pp.length;k++){ if((pp[k].textContent||'').trim()===nm) return pp[k]; } } return null; }
              var __sw=doc.createElement('span'); __sw.id='ps-side2'; __sw.style.cssText='display:inline-flex;gap:4px;align-items:center;margin-left:3px';
              [['우리','파랑','#1a2f5c'],['상대','빨강','#9b1c2e']].forEach(function(a){
                var bb=doc.createElement('button'); bb.type='button'; bb.textContent=a[0]; bb.className='ps-side2-b'; bb.dataset.team=a[1];
                bb.style.cssText='padding:5px 12px;font-weight:800;font-size:12.5px;border:0;border-radius:9px;color:#fff;cursor:pointer;background:'+a[2];
                bb.addEventListener('click',function(ev){ ev.stopPropagation(); var p=__cpBC(a[1]); if(p)p.click(); try{[].forEach.call(__sw.children,function(x){x.style.opacity=(x===bb)?'1':'.45';});}catch(_){} });
                __sw.appendChild(bb);
              });
              if(tog.nextSibling)__tr.insertBefore(__sw,tog.nextSibling); else __tr.appendChild(__sw);
              try{ __sw.children[1].style.opacity='.45'; }catch(_){}
            } }catch(e){}
          } }catch(e){}
        try{ var __rt=doc.getElementById('ps-drow-tool'); var __eb=doc.getElementById('ps-eq-btn'); if(__rt&&__eb){ var __sep=doc.createElement('span'); __sep.className='ps-sep'; __rt.insertBefore(__sep,__eb); } }catch(e){}
        try{ var __dk2=doc.getElementById('ps-dock'); if(__dk2 && !doc.getElementById('ps-dock-grip')){ var __grip=doc.createElement('button'); __grip.id='ps-dock-grip'; __grip.type='button'; __grip.title='도구 막대 접기/펼치기'; __grip.textContent='▾'; __grip.addEventListener('click',function(ev){ ev.stopPropagation(); var on=doc.body.classList.toggle('ps-dock-min'); __grip.textContent=on?'▴':'▾'; }); __dk2.appendChild(__grip); } }catch(e){}
      } }catch(e){} try{ function syncTC(){ var bc=doc.getElementById('benchCat'); var tc=doc.getElementById('ps-team-ctl'); if(tc){ tc.style.display=(bc && (''+bc.className).indexOf('equipcat')>=0)?'none':''; } } var bcEl=doc.getElementById('benchCat'); if(bcEl){ new win.MutationObserver(syncTC).observe(bcEl,{attributes:true,attributeFilter:['class']}); } setTimeout(syncTC,500); setTimeout(syncTC,1200); }catch(e){}
      doc.addEventListener('click',function(ev){for(var i=0;i<groups.length;i++){if(groups[i].contains(ev.target))return;}closeAll(null);},false);
    }catch(e){}
  }
  function run(){
    if(applied) return true;
    var doc=boardDoc(); if(!doc) return false;
    try{ if(!doc.getElementById('ps-tb-bottom')){ var stb=doc.createElement('style'); stb.id='ps-tb-bottom'; stb.textContent='#boardView{justify-content:flex-start;}#boardToolbar{order:90;border-top:1px solid var(--line,#e2e4e8);border-bottom:none;margin-top:6px;}#boardToolbar .popmenu{transform:translateY(calc(-100% - 47px)) !important;}#boardToolbar .swatches{transform:translateY(calc(-100% - 50px)) !important;}#bench{flex-wrap:wrap !important;height:auto !important;max-height:none !important;row-gap:6px !important;align-items:center !important;}#ps-team-ctl{order:-1;gap:5px 8px !important;padding:0 0 4px !important;}#ps-team-ctl .menurow{width:auto !important;flex:0 0 auto !important;margin:0 !important;padding:0 !important;display:inline-flex !important;align-items:center !important;gap:4px !important;}#ps-team-ctl .menulbl{font-size:11px !important;opacity:.7 !important;min-width:0 !important;white-space:nowrap !important;}#ps-team-ctl .menusec{display:inline-flex !important;align-items:center !important;font-size:11px !important;font-weight:600 !important;opacity:.55 !important;margin:0 0 0 4px !important;padding:0 !important;border:0 !important;background:none !important;width:auto !important;}#ps-team-ctl select.btn,#ps-team-ctl #formHome,#ps-team-ctl #formAway{flex:0 0 auto !important;width:84px !important;min-width:0 !important;padding:3px 6px !important;height:28px !important;font-size:12px !important;}#ps-team-ctl .menudiv{display:none !important;}#ps-team-ctl #rosterBtn{flex:0 0 auto !important;width:auto !important;padding:4px 10px !important;height:28px !important;font-size:12px !important;}#ps-team-ctl .uni-wheels{gap:6px !important;}#ps-team-ctl .uni-w{font-size:11px !important;gap:3px !important;}#drawPanel,#bench{transform:translateY(calc(-100% - 47px)) !important;}'; (doc.head||doc.documentElement).appendChild(stb); } }catch(e){}
    try{ attachOneOpen(doc); }catch(e){}
    try{ attachGrassKeeper(doc); }catch(e){}
    var view=find(doc,function(e){ var t=T(e); if(t.indexOf('보기')<0||t.indexOf('사용법')>=0||t.indexOf('더보기')>=0||t.length>7) return false; var w=e.getBoundingClientRect().width; return w>20&&w<160; });
    if(!view) return false;
    applied=true;
    try{ view.click(); }catch(e){ reveal(); return true; }
    setTimeout(function(){
      var pPlus=function(e){return e.tagName==='BUTTON'&&T(e)==='＋'&&e.getBoundingClientRect().width<60;};
      var steps=[
        function(){var g=find(doc,function(e){return T(e)==='잔디'&&e.children.length===0;}); if(g)g.click();},
        function(){var c=find(doc,function(e){return T(e).indexOf('원형')>=0&&e.children.length===0;}); if(c)c.click();},
        function(){var n=find(doc,function(e){return T(e)==='번호'&&e.children.length===0;}); if(n)n.click();},
        function(){var p=find(doc,pPlus); if(p)p.click();},
        function(){var p=find(doc,pPlus); if(p)p.click();},
        function(){var p=find(doc,pPlus); if(p)p.click();},
        function(){var p=find(doc,pPlus); if(p)p.click();}
      ];
      var si=0;
      (function nextStep(){
        if(si>=steps.length){ setTimeout(function(){ try{ view.click(); }catch(e){} }, 150); setTimeout(function(){ try{ buildGroups(doc); }catch(e){} }, 210); setTimeout(function(){ try{ recolorGrass(doc); }catch(e){} reveal(); }, 470); setTimeout(function(){ try{ recolorGrass(doc); }catch(e){} }, 820); return; }
        try{ steps[si](); }catch(e){}
        si++;
        setTimeout(nextStep, 140);
      })();
    }, 220);
    return true;
  }
  var iv=setInterval(function(){ if(run()||++tries>50){ clearInterval(iv); if(tries>50) reveal(); } }, 250);
    
  (function(){var psPathOn=false,psFrames=[],wired=false;function bd(){var ifr=document.getElementsByTagName('iframe');for(var i=0;i<ifr.length;i++){try{var d=ifr[i].contentDocument;if(d&&d.getElementById('board'))return d;}catch(e){}}return null;}function cap(doc){var tl=doc.getElementById('tokenLayer');if(!tl)return null;var f={};[].slice.call(tl.querySelectorAll('.token')).forEach(function(t){var id=t.getAttribute('data-id');var m=/translate\(([-\d.]+)[, ]+([-\d.]+)\)/.exec(t.getAttribute('transform')||'');if(id&&m){var ci=t.querySelector('circle');f[id]={x:+m[1],y:+m[2],c:ci?ci.getAttribute('fill'):'#ffd23f'};}});return f;}function draw(doc){var b=doc.getElementById('board');if(!b)return;var world=b.querySelector('#world');var old=world.querySelector('#ps-pathlines');if(old)old.remove();if(!psPathOn||psFrames.length<2)return;var NS='http://www.w3.org/2000/svg';var g=doc.createElementNS(NS,'g');g.id='ps-pathlines';var ids={};psFrames.forEach(function(f){for(var k in f)ids[k]=1;});Object.keys(ids).forEach(function(id){var pts=[];psFrames.forEach(function(f){if(f[id])pts.push(f[id]);});if(pts.length<2)return;var col=pts[pts.length-1].c||'#ffd23f';var path=doc.createElementNS(NS,'path');path.setAttribute('d','M '+pts.map(function(p){return p.x+' '+p.y;}).join(' L '));path.setAttribute('stroke',col);path.setAttribute('stroke-width','2.4');path.setAttribute('fill','none');path.setAttribute('stroke-dasharray','7 5');path.setAttribute('stroke-linecap','round');path.setAttribute('opacity','0.9');g.appendChild(path);var last=pts[pts.length-1];var c=doc.createElementNS(NS,'circle');c.setAttribute('cx',last.x);c.setAttribute('cy',last.y);c.setAttribute('r','3.5');c.setAttribute('fill',col);g.appendChild(c);});var tl=world.querySelector('#tokenLayer');world.insertBefore(g,tl);}function findBtn(doc,txts){var bs=doc.querySelectorAll('#animBar button,#animBar [role=button]');for(var i=0;i<bs.length;i++){var t=(bs[i].textContent||'').replace(/\s+/g,'');for(var j=0;j<txts.length;j++){if(t.indexOf(txts[j])>=0)return bs[i];}}return null;}function setup(doc){var bar=doc.getElementById('animBar');if(!bar||doc.defaultView.getComputedStyle(bar).display==='none'){wired=false;psFrames=[];return;}if(wired)return;wired=true;psFrames=[cap(doc)];var addBtn=doc.getElementById('animAdd');var updBtn=doc.getElementById('animUpdate');if(addBtn)addBtn.addEventListener('click',function(){setTimeout(function(){psFrames.push(cap(doc));draw(doc);},60);});if(updBtn)updBtn.addEventListener('click',function(){setTimeout(function(){if(psFrames.length)psFrames[psFrames.length-1]=cap(doc);draw(doc);},60);});if(!doc.getElementById('ps-pathbtn')){var pb=doc.createElement('button');pb.id='ps-pathbtn';pb.type='button';pb.textContent='경로선';pb.style.cssText='font-size:12px;padding:3px 10px;margin-left:6px;border-radius:8px;border:1px solid #d9dce1;background:#fff;cursor:pointer;';pb.addEventListener('click',function(ev){ev.stopPropagation();psPathOn=!psPathOn;pb.style.background=psPathOn?'#ffd23f':'#fff';draw(doc);});bar.appendChild(pb);}}setInterval(function(){var doc=bd();if(doc)try{setup(doc);}catch(e){}},700);})();
})();
