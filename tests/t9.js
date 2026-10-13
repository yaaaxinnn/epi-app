const {JSDOM}=require('jsdom');const fs=require('fs');const errs=[];
const dom=new JSDOM(fs.readFileSync('/home/claude/index.html','utf8'),
 {runScripts:'dangerously',pretendToBeVisual:true,url:'https://example.com/',
  beforeParse(w){const s={};w.localStorage.getItem=k=>s[k]??null;w.localStorage.setItem=(k,v)=>{s[k]=String(v)};
    w.fetch=()=>Promise.reject(new Error('x'));
    w.addEventListener('error',e=>errs.push('WIN: '+(e.error?e.error.stack.slice(0,300):e.message)));}});
const W=dom.window,D=W.document;
setTimeout(()=>{
 const R=[];const t=(n,f)=>{try{const r=f();R.push([r===true?'PASS':'FAIL',n,r===true?'':String(r)])}catch(e){R.push(['FAIL',n,e.message])}};
 const S=W.eval('S');const src=fs.readFileSync('/home/claude/index.html','utf8');

 // ① Calendar 標題無 emoji
 t('KEY DATES 有 emoji',()=>src.includes('<span class="bt">📅 KEY DATES</span>'));
 t('TIMETABLE 有 emoji',()=>src.includes('<span class="bt">🗓️ TIMETABLE</span>'));
 t('KD 分組圖示常數已移除',()=>!src.includes('KDTICON'));
 t('blockhead 底色變淡',()=>src.includes('color-mix(in srgb,var(--ac) 14%,var(--surface))')
   &&!src.includes('var(--ac-soft) 62%'));

 // ② 字級再縮
 t('seg.sm 9.5px',()=>src.includes('.seg.sm button{padding:0 6px;font-size:9.5px;height:17px'));
 t('blockhead 內 seg 17px',()=>src.includes('.blockhead .seg{height:17px'));

 // ④ Settings 小標題
 t('Settings 用一條線式標題',()=>{
   const hs=[...D.querySelectorAll('#p-settings .setg')];
   return hs.length===5&&hs.every(h=>h.classList.contains('kdgroup'))});
 t('Settings 標題無 emoji',()=>{
   const txt=[...D.querySelectorAll('#p-settings .setg')].map(x=>x.firstChild.textContent).join('|');
   return txt==='同步|備份|Google 日曆|分類與清理|使用說明'});
 t('plain 無底色',()=>src.includes('.blockhead.plain{background:none'));

 // ③ KEY DATES 新樣式
 const fut=n=>new Date(Date.now()+n*864e5).toISOString().slice(0,10);
 [2,5,12,40].forEach((n,i)=>S.kd.push({id:'k'+i,date:fut(n),title:'事項'+i,type:'exam'}));
 S.kd.push({id:'ke',date:fut(9),title:'期中考',type:'exam'});
 S.kd.push({id:'kp',date:fut(-5),title:'過去的事',type:'other'});
 W.eval('renderKD()');
 const rows=[...D.querySelectorAll('#kdList .kd')];
 t('KEY DATES 有列出',()=>rows.length>=2);
 t('沿用舊卡片樣式：有 .cd 倒數方塊',()=>rows.every(r=>r.querySelector('.cd .n')&&r.querySelector('.cd .u')));
 t('卡片有外框圓角',()=>src.includes('.kd{display:flex;align-items:stretch;border:1px solid var(--line);border-radius:var(--r)'));
 t('左側色條',()=>rows.every(r=>/border-left:4px solid/.test(r.getAttribute('style')||'')));
 t('標題與完整日期',()=>rows.every(r=>r.querySelector('.bd .ti')&&/\d{4}-\d{2}-\d{2}（[日一二三四五六]）/.test(r.querySelector('.bd .dt').textContent)));
 t('無議程樣式殘留',()=>!src.includes('.kdlist{')&&!src.includes('<span class="dot"'));
 t('✎✕ 仍在且包 cxg',()=>rows.every(r=>r.querySelector('.rt .cxg [data-ed-kd]')&&r.querySelector('.rt .cxg [data-hold]')));
 t('編輯仍可用',()=>{D.querySelector('#kdList [data-ed-kd]').click();
   return D.getElementById('kdForm').style.display!=='none'
     &&D.getElementById('kd-title').value.startsWith('事項')});
 t('分組展開仍可用',()=>{const b=D.querySelector('#kdList [data-kgrp]');if(!b)return 'no btn';
   const n0=D.querySelectorAll('#kdList .kd').length;b.click();
   return D.querySelectorAll('#kdList .kd').length>n0});
 t('已過期按鈕仍在',()=>!!D.getElementById('togglePast'));
 t('過期列可展開且變淡',()=>{D.getElementById('togglePast').click();
   const p=D.querySelectorAll('#kdPastList .kd.past');return p.length===1});

 // 整體不崩
 t('全分頁可切換',()=>{[...D.querySelectorAll('#tabs button')].forEach(b=>b.click());return errs.length===0||errs.join('|')});
 t('無執行期錯誤',()=>errs.length===0||errs.join('|'));

 R.forEach(([s,n,m])=>console.log(`[${s}] ${n}${m?'  → '+m:''}`));
 console.log(`\n通過 ${R.filter(r=>r[0]==='PASS').length}/${R.length}`);
 process.exit(R.some(r=>r[0]==='FAIL')?1:0);
},400);
