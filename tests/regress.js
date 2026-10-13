const {JSDOM}=require('jsdom');const fs=require('fs');const errs=[];
const dom=new JSDOM(fs.readFileSync('/home/claude/index.html','utf8'),
 {runScripts:'dangerously',pretendToBeVisual:true,url:'https://example.com/',
  beforeParse(w){const s={};w.localStorage.getItem=k=>s[k]??null;w.localStorage.setItem=(k,v)=>{s[k]=String(v)};
    w.fetch=()=>Promise.reject(new Error('x'));
    w.addEventListener('error',e=>errs.push('WIN: '+(e.error?e.error.stack.slice(0,300):e.message)));}});
const W=dom.window,D=W.document;
setTimeout(()=>{
 const R=[];const t=(n,f)=>{try{const r=f();R.push([r===true?'PASS':'FAIL',n,r===true?'':String(r)])}catch(e){R.push(['FAIL',n,e.message])}};
 const S=W.eval('S');
 const click=id=>{const e=D.getElementById(id);if(!e)return'MISSING:'+id;e.click();return'ok'};
 const set=(id,v)=>{const e=D.getElementById(id);if(!e)return'MISSING:'+id;e.value=v;return'ok'};

 // Meeting 新增流程
 t('新增 meeting 完整流程',()=>{click('addMTBtn');
   const ds=[...D.querySelectorAll('#mtForm details')];
   ds.forEach(d=>d.open=true);
   set('mt-date','2026-09-18');set('mt-title','新會議');set('mt-topics','**重點**測試');
   set('mt-act-text','待辦X');click('mtAddAct');
   set('mt-lk-name','附件Y');set('mt-lk-url','https://y.com/y');click('mtAddLk');
   click('addMT');
   return S.mt.some(m=>m.title==='新會議')});
 t('新 meeting 帶 action 與附件',()=>{const m=S.mt.find(x=>x.title==='新會議');
   return m.actions.length===1&&m.linksL.length===1});
 t('TO-DO 彙整未完成',()=>D.getElementById('mtTodo').textContent.includes('待辦X'));

 // Notes 新增
 t('新增筆記完整流程',()=>{click('addNtBtn');
   [...D.querySelectorAll('#ntForm details')].forEach(d=>d.open=true);
   set('nt-title','新筆記');set('nt-body','內容Z');
   set('nt-link-name','連結W');set('nt-link-url','https://w.com/w');click('ntAddLink');
   click('addNt');
   return S.notes.some(n=>n.title==='新筆記')});

 // Questions 三個出口
 S.qs.push({id:'q1',created:Date.now(),kind:'mine',q:'測試問題',a:'答案',done:false,links:[]});
 W.eval("openQ.add('q1')");W.eval('renderQ()');
 t('Question→Card',()=>{const n=S.cards.length;
   D.querySelector('[data-qc="q1"]').click();return S.cards.length===n+1});
 t('Question→Note',()=>{const n=S.notes.length;
   W.eval('renderQ()');const b=D.querySelector('[data-qn="q1"]');b.click();
   return S.notes.length===n+1});
 t('Question→方向',()=>{const n=S.dirs.length;
   S.qs.push({id:'q2',created:Date.now(),kind:'mine',q:'問題二',a:'',done:false,links:[]});
   W.eval("openQ.add('q2')");W.eval('renderQ()');
   const b=D.querySelector('[data-qr="q2"]');b.click();return S.dirs.length===n+1});

 // Reading
 t('匯入論文 JSON',()=>{click('importJsonBtn');
   set('jsonBox',JSON.stringify([{title:'Paper A',authors:'Smith, J., Lee, K., Wang, M., Chen, P., Liu, S.',
     year:'2023',journal:'NEJM',url:'https://x.com/a',sum:'一句話',tags:['RCT','T2DM','bias','conf']}]));
   click('doImportJson');return D.getElementById('paperList').textContent.includes('Paper A')});
 t('Reading APA7 作者',()=>D.getElementById('paperList').innerHTML.includes('(2023)'));
 t('Reading 分組標題',()=>D.getElementById('paperList').innerHTML.includes('kdgroup'));
 t('Reading tags 收合',()=>!!D.querySelector('[data-ptags]'));
 t('星號置頂',()=>{const b=D.querySelector('[data-pstar]');b.click();
   return S.papers.some(p=>p.star)});

 // 圖片
 t('圖片代號系統',()=>{S.imgs=S.imgs||{};S.imgs['t1']='data:image/jpeg;base64,AAAA';
   return W.eval('mdImg("![](img:t1)")').includes('<img src="data:image/jpeg;base64,AAAA"')});
 t('gcImages 清孤兒',()=>{S.imgs['orph']='data:image/jpeg;base64,BBBB';
   W.eval('gcImages()');return !S.imgs['orph']});
 t('markdown 渲染',()=>{const r=W.eval('md("**B** *I*\\n- x")');
   return r.includes('<strong>B</strong>')&&r.includes('<li>x</li>')});
 t('markdown 防 XSS',()=>W.eval('md("<script>alert(1)<\\/script>")').includes('&lt;script'));

 // 回收桶
 t('回收桶涵蓋所有型別',()=>{const B=W.eval('BIN');
   return ['paper','card','q','mt','dir','note','kd'].every(k=>B[k])});
 t('刪除進回收桶',()=>{const m=S.mt[0];W.eval(`doHold('mt|${m.id}')`);
   return S.trash.some(x=>x.type==='mt')});
 t('可還原',()=>{W.eval('renderTrash()');const b=D.querySelector('[data-undel]');
   if(!b)return 'no button';const n=S.mt.length;b.click();return S.mt.length===n+1});

 // 同步
 t('mergeState 全表',()=>{const src=fs.readFileSync('/home/claude/index.html','utf8');
   return ['papers','cards','qs','mt','dirs','notes','kd','courses'].every(k=>src.includes('S.'+k+'=applyTombs'))});
 t('export 含 imgs',()=>'imgs' in W.eval('exportable()'));
 t('export 不含金鑰',()=>!('gcKey' in W.eval('exportable()')));

 // KEY DATE 自動分類
 t('類型碼優先',()=>{const r=W.eval("kdAutoType('D 截止')");
   return r.type==='other'&&r.explicit===true});
 t('關鍵字備援',()=>W.eval("kdAutoType('期末口試')").type==='exam');
 t('Deadline 類型已移除',()=>!W.eval('kdcatIds()').includes('deadline')
   &&W.eval("kdAutoType('論文截止')").type==='other');

 // HELP
 t('HELP 有內容',()=>D.getElementById('helpBox').innerHTML.length>3000);
 t('HELP 無過時字眼',()=>{const h=D.getElementById('helpBox').textContent;
   return !['Research idea','Kill criteria','課程必讀','主題總結','畢業學分'].some(x=>h.includes(x))});

 R.forEach(r=>console.log(`[${r[0]}] ${r[1]}${r[2]?'  → '+r[2]:''}`));
 console.log(`\n通過 ${R.filter(r=>r[0]==='PASS').length}/${R.length}`);
 if(errs.length)console.log('\n=== ERRORS ===\n'+errs.slice(0,4).join('\n---\n'));
 dom.window.close();
},1500);
