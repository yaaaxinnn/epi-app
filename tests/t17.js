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
 const now=Date.now();
 const open2=id=>{const q=`#paperList [data-pedit="${id}"]`;
   if(!D.querySelector(`#paperList [data-ptitle="${id}"]`))return;
   D.querySelector(q).click()};

 S.papers.push({id:'p1',created:now-3000,title:'最舊',authors:'',tags:[],cat:'teacher',year:'2024',
   q:'問題一',design:'設計一',pop:'',def:'定義一',analysis:'',result:'結果一',
   interp:'解釋一',gap:'',note:'我的筆記'});
 S.papers.push({id:'p2',created:now-2000,title:'中間',authors:'',tags:[],cat:'teacher',year:'2010',q:'x'});
 S.papers.push({id:'p3',created:now-1000,title:'最新',authors:'',tags:[],cat:'teacher',year:'1999',q:'x'});
 S.papers.push({id:'p4',created:now-500,title:'課程最新',authors:'',tags:[],cat:'course',year:'2000',q:'x'});
 S.papers.push({id:'p5',created:now-4000,title:'課程最舊',authors:'',tags:[],cat:'course',year:'2026',q:'x'});
 W.eval('renderAll()');

 // ② 排序
 const titles=sel=>[...D.querySelectorAll(sel)].map(x=>x.textContent.trim());
 t('同分類內由新到舊（不再看出版年）',()=>
   titles('#paperList h3').slice(0,3).join('|')==='最新|中間|最舊');
 t('第二個分類也是新到舊',()=>{
   const all=titles('#paperList h3');
   return all.slice(3).join('|')==='課程最新|課程最舊'});
 t('星號仍然置頂',()=>{
   S.papers.find(p=>p.id==='p1').star=true;W.eval('renderPapers()');
   return titles('#paperList h3').slice(0,3).join('|')==='最舊|最新|中間'});
 t('排序條件只剩星號與建立時間',()=>
   src.includes("sort((x,y)=>((y.star?1:0)-(x.star?1:0))||(y.created-x.created))")
   &&!src.includes('(y.year||0)-(x.year||0)'));

 // ① 小標題
 S.papers.find(p=>p.id==='p1').star=false;W.eval('renderPapers()');
 D.querySelector('#paperList [data-pedit="p1"]').click();
 t('每個有內容的欄位各自成一個 section',()=>
   D.querySelectorAll('#paperList .pfsec').length===6);
 t('空欄位不顯示',()=>{
   const hs=[...D.querySelectorAll('#paperList .pfhead')].map(x=>x.textContent);
   return !hs.some(h=>h.includes('研究對象'))&&!hs.some(h=>h.includes('分析'))
     &&!hs.some(h=>h.includes('Gap'))});
 t('標題有整條底色與左側色條',()=>
   src.includes('border-left:3px solid var(--pf,var(--ac))')
   &&src.includes('background:color-mix(in srgb,var(--pf,var(--ac)) 10%,var(--surface))'));
 t('色條用分類色（老師＝紅）',()=>{
   const eb=D.querySelector('#paperList .editbox');
   return eb.getAttribute('style').includes('--pf:#B0472E')});
 t('編號固定不跳號',()=>{
   const ns=[...D.querySelectorAll('#paperList .pfhead .n')].map(x=>x.textContent);
   return ns.join('|')==='01|02|04|06|07|09'});
 t('編號對應 PF 的鍵',()=>{
   const no=W.eval('PFNO'),pf=W.eval('PF').map(f=>f[0]).filter(k=>k!=='sum');
   return pf.every(k=>/^\d{2}$/.test(no[k]))&&no.q==='01'&&no.note==='09'
     &&Object.keys(no).length===9});
 t('標題文字正確',()=>{
   const hs=[...D.querySelectorAll('#paperList .pfhead')].map(x=>x.textContent.replace(/^\d\d/,''));
   return hs.join('|')==='研究問題/目標|研究設計與資料來源|暴露與結果的定義|主要結果|解釋|Note'});
 t('內容仍走 markdown 且有縮排',()=>{
   const b=D.querySelector('#paperList .pfsec .mdview');
   return b.classList.contains('pfbody')&&src.includes('.pfbody{padding-left:12px}')
     &&b.innerHTML.includes('<p>')});
 t('窄螢幕縮排變小',()=>src.includes('@media(max-width:560px){.pfbody{padding-left:4px}}'));
 t('沒有內容時仍顯示提示',()=>{
   D.querySelector('#paperList [data-pedit="p2"]').click();
   S.papers.find(p=>p.id==='p2').q='';W.eval('renderPapers()');
   const card=D.querySelector('[data-ptitle="p2"]').closest('.item');
   return card.textContent.includes('還沒有內容')&&!card.querySelector('.pfsec')});

 // 不得退化
 t('比較檢視仍有 Interpretation',()=>W.eval('CMPCOLS').some(c=>c[0]==='interp'));
 t('iframe 高度仍是 100%',()=>D.getElementById('fvFrame').style.height==='100%');
 t('Markdown 渲染器沒動',()=>W.eval('md')('|a|\n|---|\n|1|').includes('<table>'));

 t('全分頁可切換',()=>{[...D.querySelectorAll('#tabs button')].forEach(b=>b.click());return errs.length===0||errs.join('|')});
 t('無執行期錯誤',()=>errs.length===0||errs.join('|'));

 R.forEach(([s,n,m])=>console.log(`[${s}] ${n}${m?'  → '+m:''}`));
 console.log(`\n通過 ${R.filter(r=>r[0]==='PASS').length}/${R.length}`);
 process.exit(R.some(r=>r[0]==='FAIL')?1:0);
},400);
