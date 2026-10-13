const {JSDOM}=require('jsdom');const fs=require('fs');
const errs=[];
const dom=new JSDOM(fs.readFileSync('/home/claude/index.html','utf8'),
 {runScripts:'dangerously',pretendToBeVisual:true,url:'https://example.com/',
  beforeParse(w){const s={};w.localStorage.getItem=k=>s[k]??null;w.localStorage.setItem=(k,v)=>{s[k]=String(v)};
    w.localStorage.removeItem=k=>{delete s[k]};w.fetch=()=>Promise.reject(new Error('offline'));
    w.console.error=(...a)=>errs.push('ERR: '+a.join(' '));
    w.addEventListener('error',e=>errs.push('WIN: '+(e.error?e.error.stack.slice(0,400):e.message)));}});
const W=dom.window,D=W.document;
setTimeout(()=>{
 const R=[];const t=(n,f)=>{try{const r=f();R.push([r===true?'PASS':'FAIL',n,r===true?'':String(r)])}catch(e){R.push(['FAIL',n,e.message])}};
 const S=W.eval('S');
 const click=id=>{const e=D.getElementById(id);if(!e)return'MISSING:'+id;e.click();return'ok'};
 const set=(id,v)=>{const e=D.getElementById(id);if(!e)return'MISSING:'+id;e.value=v;return'ok'};

 // ① What If
 t('What If 標題無計數',()=>{const h=D.getElementById('themeList').innerHTML;
   return h.includes('WHAT IF（補充）')&&!h.includes('補充 ·')});

 // ② 區塊標題
 t('Notes 用 blockhead 區隔',()=>{const p=D.getElementById('p-courses');
   const bh=p.querySelectorAll('.blockhead');
   return bh.length===2&&bh[0].textContent.includes('QUESTIONS')&&bh[1].textContent.includes('NOTES')});
 t('Meeting 三區塊也用 blockhead',()=>D.getElementById('p-ideas').querySelectorAll('.blockhead').length===3);
 t('blockhead 有樣式定義',()=>{const src=fs.readFileSync('/home/claude/index.html','utf8');
   return src.includes('.blockhead{')&&src.includes('color-mix')&&!src.includes('bd2')&&!src.includes('.blockhead::before')});

 // ③ Notes 展開=閱讀模式
 S.notes.push({id:'n1',created:Date.now(),mtime:Date.now(),title:'測試筆記',
   body:'## 標題\n**粗體**內容\n- 項目A',kind:'study',links:[{name:'講義',url:'https://x.com/a'}]});
 W.eval('renderNt()');
 t('Notes 收合只顯示摘要',()=>{const h=D.getElementById('ntList').innerHTML;
   return !h.includes('<textarea')&&h.includes('測試筆記')});
 t('Notes 展開顯示渲染後內容',()=>{W.eval("openNt.add('n1')");W.eval('renderNt()');
   const h=D.getElementById('ntList').innerHTML;
   return h.includes('<strong>粗體</strong>')&&!h.includes('<textarea')});
 t('Notes 展開有 ✎ 按鈕',()=>!!D.querySelector('[data-ntedit="n1"]'));
 t('Notes 點 ✎ 才出現輸入框',()=>{D.querySelector('[data-ntedit="n1"]').click();
   const h=D.getElementById('ntList').innerHTML;
   return h.includes('<textarea')&&h.includes('data-ntb="n1"')});
 t('Notes 再點 ✓ 回閱讀模式',()=>{D.querySelector('[data-ntedit="n1"]').click();
   return !D.getElementById('ntList').innerHTML.includes('<textarea')});
 t('Notes 附件標籤仍顯示',()=>D.getElementById('ntList').textContent.includes('講義'));
 t('Notes 收合卡片同時退出編輯',()=>{D.querySelector('[data-ntedit="n1"]').click();
   D.querySelector('[data-ntcard="n1"]').click();
   return !W.eval('editNt').has('n1')&&!W.eval('openNt').has('n1')});

 // ④ Meeting 展開=閱讀模式
 S.mt.push({id:'m1',created:Date.now(),mtime:Date.now(),date:'2026-09-17',title:'週會',
   topics:'## 重點\n- 先做 target trial',full:'逐字稿內容很長'.repeat(30),
   actions:[{text:'待辦A',done:false}],linksL:[{name:'簡報',url:'https://x.com/s'}]});
 W.eval('renderMT()');
 t('Meeting 收合只顯示摘要',()=>{const h=D.getElementById('mtList').innerHTML;
   return !h.includes('<textarea')&&h.includes('週會')});
 t('Meeting 展開顯示渲染後重點',()=>{W.eval("openM.add('m1')");W.eval('renderMT()');
   const h=D.getElementById('mtList').innerHTML;
   return h.includes('target trial')&&!h.includes('<textarea')});
 t('Meeting 展開有 ✎',()=>!!D.querySelector('[data-medit="m1"]'));
 t('Meeting 閱讀模式可勾 action',()=>!!D.querySelector('#mtList [data-mact]'));
 t('Meeting 已不再顯示逐字稿',()=>{const h=D.getElementById('mtList').innerHTML;
   return !h.includes('逐字稿')&&!h.includes('逐字稿內容很長')});
 t('Meeting 點 ✎ 出現輸入框',()=>{D.querySelector('[data-medit="m1"]').click();
   return D.getElementById('mtList').innerHTML.includes('data-mtb="m1"')});
 t('Meeting 附件只在展開後顯示',()=>{
   W.eval('openM.clear()');W.eval('editM.clear()');W.eval('renderMT()');
   const collapsed=!D.getElementById('mtList').textContent.includes('簡報');
   W.eval("openM.add('m1')");W.eval('renderMT()');
   return collapsed&&D.getElementById('mtList').textContent.includes('簡報')});

 // ⑤ KEY DATES
 const fut=n=>new Date(Date.now()+n*864e5).toISOString().slice(0,10);
 [['近1','exam',3],['近2','exam',10],['近3','exam',20],['遠1','exam',100],
  ['考1','school',5],['考2','school',8]].forEach(([ti,ty,d])=>
   S.kd.push({id:'k'+ti,date:fut(d),title:ti,type:ty}));
 W.eval('renderKD()');
 t('每類預設顯示 2 筆',()=>{const h=D.getElementById('kdList').textContent;
   return h.includes('近1')&&h.includes('近2')&&!h.includes('近3')});
 t('每類箭頭在標題同排',()=>{const b=D.querySelector('[data-kgrp="u:exam"]');
   return !!b&&!!b.querySelector('svg')&&b.parentElement.classList.contains('kdgroup')});
 t('箭頭 title 提示含兩個月後',()=>D.querySelector('[data-kgrp="u:exam"]').title.includes('兩個月後'));
 t('展開後含遠期事件',()=>{D.querySelector('[data-kgrp="u:exam"]').click();
   const h=D.getElementById('kdList').textContent;
   return h.includes('近3')&&h.includes('遠1')});
 t('school 類獨立計數',()=>{const h=D.getElementById('kdList').textContent;
   return h.includes('考1')&&h.includes('考2')});
 t('已無全域「兩個月後」按鈕',()=>!D.getElementById('toggleFar'));
 t('已過期按鈕獨立存在',()=>{S.kd.push({id:'kold',date:'2026-09-01',title:'過期事件',type:'other'});
   W.eval('renderKD()');return !!D.getElementById('togglePast')});
 t('過期兩個月自動刪除',()=>{S.kd.push({id:'kvold',date:'2026-01-01',title:'很久以前',type:'other'});
   W.eval('renderKD()');return !S.kd.some(k=>k.id==='kvold')});

 // 分頁切換
 t('全分頁可切換',()=>{let ok=true;
   D.querySelectorAll('.tab').forEach(tb=>{tb.click();
     const p=D.getElementById('p-'+tb.dataset.p);
     if(!p||!p.classList.contains('on'))ok=false});return ok});

 R.forEach(r=>console.log(`[${r[0]}] ${r[1]}${r[2]?'  → '+r[2]:''}`));
 console.log(`\n通過 ${R.filter(r=>r[0]==='PASS').length}/${R.length}`);
 if(errs.length)console.log('\n=== RUNTIME ERRORS ===\n'+errs.slice(0,5).join('\n---\n'));
 dom.window.close();
},1500);
