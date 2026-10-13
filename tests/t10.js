const {JSDOM}=require('jsdom');const fs=require('fs');const errs=[];
const dom=new JSDOM(fs.readFileSync('/home/claude/index.html','utf8'),
 {runScripts:'dangerously',pretendToBeVisual:true,url:'https://example.com/',
  beforeParse(w){const s={};w.localStorage.getItem=k=>s[k]??null;w.localStorage.setItem=(k,v)=>{s[k]=String(v)};
    w.fetch=()=>Promise.reject(new Error('x'));
    w.addEventListener('error',e=>errs.push('WIN: '+(e.error?e.error.stack.slice(0,300):e.message)));}});
const W=dom.window,D=W.document;
const MO=864e5*31;
setTimeout(()=>{
 const R=[];const t=(n,f)=>{try{const r=f();R.push([r===true?'PASS':'FAIL',n,r===true?'':String(r)])}catch(e){R.push(['FAIL',n,e.message])}};
 const S=W.eval('S');const src=fs.readFileSync('/home/claude/index.html','utf8');
 const now=Date.now();

 S.qs.push({id:'q1',created:now,kind:'mine',q:'什麼是 collider bias？',a:'選到共同結果',src:'Modern Epi ch12',done:false,links:[],tags:['因果推論','bias']});
 S.qs.push({id:'q2',created:now-1,kind:'study',q:'HBV 帶原者的定義',a:'',src:'',done:false,links:[],tags:['HBV']});
 S.qs.push({id:'q3',created:now-2,kind:'mine',q:'IPTW 要不要截尾',a:'一般截 1/99',src:'',done:true,doneAt:now-2,links:[],tags:['因果推論']});
 S.qs.push({id:'q4',created:now-3,kind:'mine',q:'舊問題',a:'',src:'',done:true,doneAt:now-3*MO,links:[],tags:[]});
 S.notes.push({id:'n1',created:now,mtime:now,title:'高流方法 W5',body:'講 collider',kind:'study',links:[],tags:['因果推論']});
 S.notes.push({id:'n2',created:now-1,mtime:now-1,title:'投稿流程備忘',body:'',kind:'mine',links:[],tags:[]});
 W.eval('renderAll()');

 // ① 狀態標籤在標題後
 t('卡片不再顯示狀態標籤',()=>{
   const it=[...D.querySelectorAll('#qList .item')].find(x=>x.textContent.includes('collider bias'));
   return !it.querySelector('.qst')&&it.firstElementChild.textContent.trim()==='什麼是 collider bias？'});
 t('Unresolved｜All 已移除',()=>!D.getElementById('qSeg')&&!src.includes('qSeg')&&!src.includes('qFilter'));

 // ② 搜尋
 t('搜尋框存在',()=>!!D.getElementById('nsearch')&&!!D.getElementById('nsearchX'));
 const srch=v=>{const i=D.getElementById('nsearch');i.value=v;
   i.dispatchEvent(new W.Event('input',{bubbles:true}))};
 t('搜尋題目命中',()=>{srch('collider');
   const q=D.querySelectorAll('#qList .item').length,n=D.querySelectorAll('#ntList .rsvrow').length;
   return q===1&&n===1});
 t('搜尋同時過濾筆記',()=>D.getElementById('ntList').textContent.includes('高流方法 W5'));
 t('搜尋答案內容',()=>{srch('共同結果');return D.querySelectorAll('#qList .item').length===1});
 t('Source 欄位已移除',()=>{srch('modern epi');
   return D.querySelectorAll('#qList .item').length===0&&!src.includes("q-src")});
 t('多關鍵字 AND',()=>{srch('collider 共同');return D.querySelectorAll('#qList .item').length===1});
 t('多關鍵字不符則 0',()=>{srch('collider HBV');return D.querySelectorAll('#qList .item').length===0});
 t('搜尋時自動展開分組',()=>{srch('bias');
   return D.querySelectorAll('#qList .kdgroup .kx').length===0});
 t('搜尋也找已解決',()=>{srch('IPTW');
   return D.getElementById('qList').textContent.includes('IPTW 要不要截尾')});
 t('搜尋資訊列',()=>{srch('因果');const i=D.getElementById('nsrchInfo');
   return i.style.display===''&&/找到 \d+ 個問題、\d+ 則筆記/.test(i.textContent)});
 t('✕ 清除搜尋',()=>{D.getElementById('nsearchX').click();
   return D.getElementById('nsearch').value===''&&D.getElementById('nsrchInfo').style.display==='none'});

 // ③ 標籤
 t('標籤列列出所有標籤',()=>{const ts=[...D.querySelectorAll('#ntagbar .tg')].map(x=>x.textContent);
   return ts.includes('因果推論')&&ts.includes('HBV')&&ts.includes('bias')});
 t('標籤依使用次數排序',()=>D.querySelector('#ntagbar .tg').textContent==='因果推論');
 t('卡片上有標籤',()=>{const it=[...D.querySelectorAll('#qList .item')].find(x=>x.textContent.includes('collider bias'));
   return it.querySelectorAll('.tg').length===2});
 t('筆記收合時也看得到標籤',()=>{
   const it=[...D.querySelectorAll('#ntList .rsvrow')].find(x=>x.textContent.includes('高流方法'));
   return it.querySelector('.tg').textContent==='因果推論'});
 t('點標籤即篩選',()=>{[...D.querySelectorAll('#ntagbar .tg')].find(x=>x.textContent==='HBV').click();
   const q=[...D.querySelectorAll('#qList .item')];
   return q.length===1&&q[0].textContent.includes('HBV 帶原者')});
 t('標籤篩選時按鈕按下',()=>D.querySelector('#ntagbar .tg[data-ntag="HBV"]').getAttribute('aria-pressed')==='true');
 t('點卡片標籤不會展開筆記',()=>{
   D.getElementById('nsearchX').click();
   const it=[...D.querySelectorAll('#ntList .rsvrow')].find(x=>x.textContent.includes('高流方法'));
   it.querySelector('.tg').click();
   const now=[...D.querySelectorAll('#ntList .rsvrow')].find(x=>x.textContent.includes('高流方法'));
   return !!now&&W.eval('nTags.size')===1});
 t('再點一次取消篩選',()=>{D.querySelector('#ntagbar .tg[data-ntag="因果推論"]').click();
   return W.eval('nTags.size')===0});
 t('標籤欄位可編輯',()=>src.includes('data-qtags=')&&src.includes('data-nttags=')
   &&!!D.getElementById('q-tags')&&!!D.getElementById('nt-tags'));
 t('parseTags 切分與去重',()=>{const r=W.eval("parseTags('a, b、 c;a')");
   return r.join('|')==='a|b|c'});
 t('新標籤進入標籤庫',()=>{W.eval("parseTags('新標籤XYZ')");return S.tagLib.includes('新標籤XYZ')});

 // ④ Resolved：一行式 + 月份標記
 t('Resolved 展開後有左側目錄',()=>{
   return !!D.querySelector('#qList .dirwrap .dirnav')
     &&!!D.querySelector('#qList .dirwrap .dirbody')});
 t('已解決預設只有一行、不顯示答案',()=>{
   const rows=[...D.querySelectorAll('#qList .rsvrow')];
   return rows.length===2&&rows.every(r=>r.querySelector('.ck').textContent==='✓'
     &&/^\d{1,2}\/\d{2}$/.test(r.querySelector('.rdt').textContent))
     &&!D.getElementById('qList').textContent.includes('一般截 1/99')});
 t('點標題展開答案',()=>{
   [...D.querySelectorAll('#qList .rsvrow')].find(r=>r.textContent.includes('IPTW')).click();
   return D.getElementById('qList').textContent.includes('一般截 1/99')
     &&D.querySelectorAll('#qList .rsvrow').length===1});
 t('再點標題收合',()=>{
   D.querySelector('#qList .dirbody .item [data-qopen]').click();
   return !D.getElementById('qList').textContent.includes('一般截 1/99')
     &&D.querySelectorAll('#qList .rsvrow').length===2});
 t('Resolved 標題是粗體',()=>!!D.querySelector('#qList .kdgroup b')
   &&D.querySelector('#qList .kdgroup b').textContent==='Resolved');
 t('Resolve 會記錄時間',()=>{
   D.querySelector('[data-qedit="q2"]').click();
   D.querySelector('[data-qd="q2"]').click();
   const q=S.qs.find(x=>x.id==='q2');return q.done===true&&typeof q.doneAt==='number'});
 t('已解決後收成一行',()=>!D.querySelector('[data-qd="q2"]')
   &&[...D.querySelectorAll('#qList .rsvrow')].some(r=>r.textContent.includes('HBV 帶原者')));
 t('Reopen 會清掉時間',()=>{
   [...D.querySelectorAll('#qList .rsvrow')].find(r=>r.textContent.includes('HBV 帶原者')).click();
   if(!D.querySelector('[data-qd="q2"]'))return 'no qd';
   D.querySelector('[data-qd="q2"]').click();
   const q=S.qs.find(x=>x.id==='q2');return q.done===false&&q.doneAt===undefined});
 t('Resolved 箭號可收合',()=>{
   D.querySelector('#qList [data-qgrp="__done"]').click();
   return D.querySelectorAll('#qList .dirnav').length===0});

 // ④ KEY DATES 已還原
 t('KEY DATES 為舊卡片樣式',()=>src.includes('.kd .cd{flex:0 0 74px')&&!src.includes('.kdlist{'));

 t('全分頁可切換',()=>{[...D.querySelectorAll('#tabs button')].forEach(b=>b.click());return errs.length===0||errs.join('|')});
 t('無執行期錯誤',()=>errs.length===0||errs.join('|'));

 R.forEach(([s,n,m])=>console.log(`[${s}] ${n}${m?'  → '+m:''}`));
 console.log(`\n通過 ${R.filter(r=>r[0]==='PASS').length}/${R.length}`);
 process.exit(R.some(r=>r[0]==='FAIL')?1:0);
},400);
