/* 홈 첫 화면 작전판 예시 — 전술 설명 / 훈련 만들기 두 장면을 재생한다. */
(function(){
  var NS='http://www.w3.org/2000/svg';
  var H=function(id,n,x,y){return {id:id,team:'h',n:n,x:x,y:y}}, A=function(id,x,y){return {id:id,team:'a',n:'',x:x,y:y}};
  var SCENES={
    tactic:{
      title:'중원 전진 · 세 번째 선수',
      bg:'pitch', holder:'h4',
      players:[H('h1',1,6,34),H('h2',2,34,60),H('h4',4,22,43),H('h5',5,22,25),H('h3',3,34,8),
               H('h6',6,37,34),H('h8',8,50,45),H('h10',10,55,22),H('h7',7,72,60),H('h9',9,76,34),H('h11',11,72,8),
               A('a9',31,40),A('a10',45,33),A('a8',55,48),A('a6',60,26),A('a7',42,56),A('a11',42,12),
               A('a4',84,42),A('a5',84,26),A('a2',80,58),A('a3',80,10)],
      steps:[
        {cap:'센터백이 공을 잡습니다. 상대 공격수가 압박하고, 6번은 등 뒤에 수비가 있습니다.'},
        {cap:'4번이 내려온 8번에게 패스합니다. 상대 미드필더가 따라 나옵니다.',pass:['h4','h8'],runs:['h8'],moves:{h8:[43,47],a8:[47,49],a9:[26,42]}},
        {cap:'8번은 돌지 않고 6번에게 내줍니다. 그 사이 10번이 비어 있는 공간으로 들어갑니다.',pass:['h8','h6'],runs:['h10'],moves:{h6:[39,37],h10:[60,38],a10:[42,37]}},
        {cap:'6번이 앞을 보고 있는 10번에게 전진 패스. 세 번째 선수가 라인 사이에서 받습니다.',pass:['h6','h10'],moves:{a6:[61,31]}},
        {cap:'10번이 전진하면 양쪽 윙어가 수비 뒤로 뛰어듭니다.',runs:['h10','h7','h11'],moves:{h10:[69,36],h7:[86,52],h11:[86,16],h9:[80,35],a4:[82,40],a5:[82,29]}}
      ]},
    drill:{
      title:'4v2 론도 · 10×10m · 두 터치',
      bg:'grid', holder:'h1',
      players:[H('h1',1,28,34),H('h2',2,52,8),H('h3',3,76,34),H('h4',4,52,60),A('a1',46,30),A('a2',58,40)],
      steps:[
        {cap:'10×10m 사각형. 바깥 4명이 두 터치 안에 패스를 잇고, 가운데 2명이 뺏습니다.'},
        {cap:'코칭 포인트 1 · 받기 전에 어깨 너머로 확인합니다.',pass:['h1','h2'],moves:{a1:[48,20],a2:[56,32]}},
        {cap:'코칭 포인트 2 · 공에서 먼 발로 받아 몸을 엽니다.',pass:['h2','h3'],moves:{a1:[62,24],a2:[66,38],h4:[58,60],h1:[28,40]}},
        {cap:'코칭 포인트 3 · 공을 가진 사람 양옆에 패스 각도를 만듭니다.',runs:['h2','h4'],moves:{h2:[60,8],h4:[66,60],a1:[68,28],a2:[70,40]}},
        {cap:'코칭 포인트 4 · 틈이 보이면 수비 둘 사이로 가릅니다. 통하면 1점.',pass:['h3','h1']}
      ]}
  };

  var bg=document.getElementById('hb-l-bg'), arrows=document.getElementById('hb-l-arrows'), pl=document.getElementById('hb-l-players');
  var cap=document.getElementById('hb-cap'), stepsEl=document.getElementById('hb-steps'), playBtn=document.getElementById('hb-play'), titleEl=document.getElementById('hb-board-title');
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MOVE=1500, HOLD=1500, END=2600;
  var scene, pos, holders, nodes, ballNode, k=0, t0=0, paused=reduce, elapsed=0, shownCap=-1;

  function el(tag,attrs,parent){var e=document.createElementNS(NS,tag);for(var a in attrs)e.setAttribute(a,attrs[a]);if(parent)parent.appendChild(e);return e}

  function drawBg(kind){
    bg.innerHTML='';
    var L={fill:'none',stroke:'#cfe3d6','stroke-width':.35,opacity:.7};
    if(kind==='pitch'){
      for(var i=0;i<7;i++) if(i%2) el('rect',{x:i*15,y:0,width:15,height:68,fill:'#12462f'},bg);
      var a=function(tag,o){for(var key in L) if(!(key in o)) o[key]=L[key]; return el(tag,o,bg)};
      a('rect',{x:2,y:2,width:101,height:64});
      a('line',{x1:52.5,y1:2,x2:52.5,y2:66});
      a('circle',{cx:52.5,cy:34,r:9.15});
      a('rect',{x:2,y:13.85,width:16.5,height:40.3}); a('rect',{x:86.5,y:13.85,width:16.5,height:40.3});
      a('rect',{x:2,y:24.85,width:5.5,height:18.3});  a('rect',{x:97.5,y:24.85,width:5.5,height:18.3});
    }else{
      for(var gx=0;gx<=105;gx+=7.5) el('line',{x1:gx,y1:0,x2:gx,y2:68,stroke:'#cfe3d6','stroke-width':.12,opacity:.35},bg);
      for(var gy=4;gy<=68;gy+=7.5) el('line',{x1:0,y1:gy,x2:105,y2:gy,stroke:'#cfe3d6','stroke-width':.12,opacity:.35},bg);
      el('rect',{x:32,y:12,width:40,height:44,fill:'none',stroke:'#eef6ee','stroke-width':.5},bg);
      [[32,12],[72,12],[32,56],[72,56]].forEach(function(c){el('path',{d:'M'+c[0]+' '+(c[1]-1.6)+'l1.5 2.8h-3z',fill:'#ff9d4d'},bg)});
      var tx=el('text',{x:74,y:11,fill:'#eef6ee','font-size':3,'font-weight':700},bg); tx.textContent='10×10m';
    }
  }

  function build(name){
    scene=SCENES[name]; titleEl.textContent=scene.title;
    drawBg(scene.bg); pl.innerHTML=''; nodes={};
    pos=[{}]; holders=[scene.holder];
    scene.players.forEach(function(p){pos[0][p.id]=[p.x,p.y]});
    for(var i=1;i<scene.steps.length;i++){
      var s=scene.steps[i], cur={}; for(var id in pos[i-1]) cur[id]=pos[i-1][id];
      if(s.moves) for(var m in s.moves) cur[m]=s.moves[m];
      pos.push(cur); holders.push(s.pass?s.pass[1]:holders[i-1]);
    }
    scene.players.forEach(function(p){
      var g=el('g',{},pl);
      el('circle',{r:2.3,fill:p.team==='h'?'#dfff76':'#16241f',stroke:p.team==='h'?'#16241f':'#ffffff','stroke-width':.35},g);
      if(p.n!==''){var t=el('text',{y:1,'text-anchor':'middle','font-size':2.5,'font-weight':800,fill:'#16241f'},g);t.textContent=p.n}
      nodes[p.id]=g;
    });
    ballNode=el('circle',{r:1.05,fill:'#ffffff',stroke:'#16241f','stroke-width':.3},pl);
    stepsEl.innerHTML='';
    scene.steps.forEach(function(s,i){
      var b=document.createElement('button'); b.type='button'; b.setAttribute('aria-label',(i+1)+'번째 장면');
      b.addEventListener('click',function(){k=i;elapsed=MOVE;setPaused(true);render(1)});
      stepsEl.appendChild(b);
    });
    k=reduce?scene.steps.length-1:0; elapsed=reduce?MOVE:0; shownCap=-1; t0=performance.now(); render(reduce?1:0);
  }

  function ease(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2}
  function lerp(a,b,e){return [a[0]+(b[0]-a[0])*e,a[1]+(b[1]-a[1])*e]}
  function line(a,b,kind,op){
    var dx=b[0]-a[0],dy=b[1]-a[1],d=Math.sqrt(dx*dx+dy*dy); if(d<3.2) return '';
    var ux=dx/d,uy=dy/d, x1=a[0]+ux*2.6,y1=a[1]+uy*2.6,x2=b[0]-ux*2.9,y2=b[1]-uy*2.9;
    return '<line x1="'+x1.toFixed(2)+'" y1="'+y1.toFixed(2)+'" x2="'+x2.toFixed(2)+'" y2="'+y2.toFixed(2)+'" stroke="'+(kind==='pass'?'#ffffff':'#dfff76')+'" stroke-width=".55" opacity="'+op+'"'+(kind==='run'?' stroke-dasharray="1.6 1.2"':'')+' marker-end="url(#hb-ah-'+kind+')"/>';
  }

  function render(t){
    var e=ease(Math.min(1,Math.max(0,t))), prev=pos[Math.max(0,k-1)], cur=pos[k], s=scene.steps[k], now={}, html='';
    for(var id in cur){ now[id]=k===0?cur[id]:lerp(prev[id],cur[id],e); nodes[id].setAttribute('transform','translate('+now[id][0].toFixed(2)+' '+now[id][1].toFixed(2)+')'); }
    for(var j=1;j<k;j++){
      var sj=scene.steps[j];
      if(sj.pass) html+=line(pos[j-1][sj.pass[0]],pos[j][sj.pass[1]],'pass',.3);
      (sj.runs||[]).forEach(function(r){html+=line(pos[j-1][r],pos[j][r],'run',.3)});
    }
    var ball;
    if(k>0&&s.pass){ ball=lerp(prev[s.pass[0]],cur[s.pass[1]],e); html+=line(prev[s.pass[0]],ball,'pass',1); }
    else ball=now[holders[k]];
    if(k>0) (s.runs||[]).forEach(function(r){html+=line(prev[r],now[r],'run',1)});
    var atFeet=!(k>0&&s.pass)||e>=1||e<=0;
    ballNode.setAttribute('cx',(ball[0]+(atFeet?1.9:0)).toFixed(2)); ballNode.setAttribute('cy',(ball[1]+(atFeet?1.9:0)).toFixed(2));
    arrows.innerHTML=html;
    if(shownCap!==k){ cap.textContent=s.cap; shownCap=k; [].forEach.call(stepsEl.children,function(b,i){b.className=i<=k?'on':''}); }
  }

  function setPaused(p){
    paused=p; t0=performance.now();
    playBtn.setAttribute('aria-label',p?'재생':'일시정지');
    playBtn.innerHTML=p?'<svg viewBox="0 0 16 16"><path d="M4 2l10 6-10 6z"/></svg>':'<svg viewBox="0 0 16 16"><path d="M3 2h4v12H3zM9 2h4v12H9z"/></svg>';
  }
  function tick(ts){
    if(!paused){
      elapsed+=ts-t0; t0=ts;
      var last=k===scene.steps.length-1, total=(k===0?0:MOVE)+(last?END:HOLD);
      if(elapsed>=total){ k=last?0:k+1; elapsed=0; }
      render(k===0?1:elapsed/MOVE);
    }
    requestAnimationFrame(tick);
  }

  playBtn.addEventListener('click',function(){
    if(paused&&k===scene.steps.length-1){k=0;elapsed=0}
    setPaused(!paused);
  });
  [].forEach.call(document.querySelectorAll('.hb-tabs button'),function(b){
    b.addEventListener('click',function(){
      [].forEach.call(document.querySelectorAll('.hb-tabs button'),function(o){o.setAttribute('aria-selected',o===b?'true':'false')});
      build(b.dataset.scene); if(!reduce) setPaused(false);
    });
  });
  build('tactic'); setPaused(reduce); requestAnimationFrame(tick);
})();
