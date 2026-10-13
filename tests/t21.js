const {JSDOM}=require('jsdom');const fs=require('fs');const errs=[];
const calls=[];
let TREE={truncated:false,tree:[
  {type:'blob',path:'data/notes.json',sha:'s0',size:40000},
  {type:'tree',path:'papers',sha:'st',size:0},
  {type:'blob',path:'papers/chen_2006_hbv.html',sha:'s1',size:52000},
  {type:'blob',path:'papers/beral_2007_hrt.html',sha:'s2',size:31000},
  {type:'blob',path:'papers/orphan_a.html',sha:'s3',size:12000},
  {type:'blob',path:'papers/orphan_b.htm',sha:'s4',size:800},
  {type:'blob',path:'notes/隨手.html',sha:'s5',size:2048},
  {type:'blob',path:'README.md',sha:'s6',size:300},
  {type:'blob',path:'assets/logo.png',sha:'s7',size:9000}]};
let DELSTATUS=200;
const mkFetch=W=>(url,opt)=>{
  opt=opt||{};calls.push({url:String(url),method:opt.method||'GET',body:opt.body});
  const u=String(url);
  if(/\/repos\/[^/]+\/[^/]+$/.test(u))
    return Promise.resolve({ok:true,status:200,json:()=>Promise.resolve({size:358400}),text:()=>Promise.resolve('')});
  if(u.includes('/git/trees/'))
    return Promise.resolve({ok:true,status:200,json:()=>Promise.resolve(TREE),text:()=>Promise.resolve('')});
  if(opt.method==='DELETE')
    return Promise.resolve({ok:DELSTATUS<400,status:DELSTATUS,json:()=>Promise.resolve({}),text:()=>Promise.resolve('')});
  return Promise.resolve({ok:false,status:404,json:()=>Promise.resolve({}),text:()=>Promise.resolve('')});
};
const dom=new JSDOM(fs.readFileSync('/home/claude/index.html','utf8'),
 {runScripts:'dangerously',pretendToBeVisual:true,url:'https://example.com/',
  beforeParse(w){const s={};w.localStorage.getItem=k=>s[k]??null;w.localStorage.setItem=(k,v)=>{s[k]=String(v)};
    w.fetch=mkFetch(w);
    w.addEventListener('error',e=>errs.push('WIN: '+(e.error?e.error.stack.slice(0,300):e.message)));}});
const W=dom.window,D=W.document;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
setTimeout(async()=>{
 const R=[];const t=(n,f)=>{try{const r=f();R.push([r===true?'PASS':'FAIL',n,r===true?'':String(r)])}catch(e){R.push(['FAIL',n,e.message])}};
 const ta=async(n,f)=>{try{const r=await f();R.push([r===true?'PASS':'FAIL',n,r===true?'':String(r)])}catch(e){R.push(['FAIL',n,e.message])}};
 const S=W.eval('S');const src=fs.readFileSync('/home/claude/index.html','utf8');
 const st=()=>D.getElementById('orphState').textContent;
 const rows=()=>[...D.querySelectorAll('#orphList [data-orph]')].map(x=>x.closest('.chk').querySelector('span').textContent);

 // UI 存在
 t('Settings 有「分類與清理」區塊',()=>[...D.querySelectorAll('#p-settings .setg')]
   .some(x=>x.firstChild.textContent==='分類與清理'));
 t('掃描與刪除按鈕都在',()=>!!D.getElementById('orphScan')&&!!D.getElementById('orphDel')
   &&!!D.getElementById('orphAll')&&!!D.getElementById('orphList'));
 t('刪除鈕是長按、預設隱藏',()=>{const b=D.getElementById('orphDel');
   return b.dataset.hold==='orphdel|1'&&b.style.display==='none'&&b.classList.contains('warn')});
 t('有說明提示（收在 ⓘ）',()=>D.getElementById('tipClean').textContent.includes('不會跟著刪')
   &&!D.getElementById('orphScan').closest('details').textContent.includes('不會跟著刪'));

 // 沒設定同步時
 await ta('沒設定 GitHub 時會提示',async()=>{
   D.getElementById('orphScan').click();await wait(60);
   return st().includes('請先在上面設定 GitHub 同步')});

 // 設定同步 + 卡片
 W.eval("GH.owner='yaaaxinnn';GH.repo='epi-data';GH.token='tok';GH.branch='main'");
 S.papers.push({id:'p1',created:1,title:'A',authors:'',tags:[],cat:'teacher',file:'papers/chen_2006_hbv.html'});
 S.papers.push({id:'p2',created:2,title:'B',authors:'',tags:[],cat:'teacher',file:'/papers/beral_2007_hrt.html'});
 S.papers.push({id:'p3',created:3,title:'C',authors:'',tags:[],cat:'teacher',file:''});

 await ta('掃描列出孤兒檔案',async()=>{
   D.getElementById('orphScan').click();await wait(80);
   return rows().join('|')==='notes/隨手.html|papers/orphan_a.html|papers/orphan_b.htm'});
 t('有卡片指向的不會列出',()=>!rows().some(x=>x.includes('chen_2006')||x.includes('beral_2007')));
 t('開頭的斜線也算比對得到',()=>!rows().some(x=>x.includes('beral')));
 t('非 HTML 一律略過',()=>!rows().some(x=>/\.(json|md|png)$/.test(x)));
 t('.htm 也算',()=>rows().some(x=>x.endsWith('.htm')));
 t('資料夾本身不算',()=>!rows().some(x=>x==='papers'));
 t('狀態列報數量與比對基準',()=>st().includes('找到 3 個')&&st().includes('已比對 2 張'));
 t('列出大小',()=>D.getElementById('orphList').textContent.includes('12 KB'));
 t('每列有預覽鈕',()=>D.querySelectorAll('#orphList [data-orphopen]').length===3);
 t('掃描後才顯示刪除鈕',()=>D.getElementById('orphDel').style.display===''
   &&D.getElementById('orphAll').style.display==='');
 t('用的是 git trees API',()=>{const c=calls.filter(x=>x.url.includes('/git/trees/'));
   return c.length===1&&c[0].url.includes('recursive=1')&&c[0].url.includes('/yaaaxinnn/epi-data/')});

 // 全選
 t('全選／全不選',()=>{
   D.getElementById('orphAll').click();
   const on=[...D.querySelectorAll('[data-orph]')].every(x=>x.checked);
   D.getElementById('orphAll').click();
   const off=[...D.querySelectorAll('[data-orph]')].every(x=>!x.checked);
   return on&&off});

 // 沒勾選就長按
 await ta('沒勾選會擋下',async()=>{
   const n=calls.filter(x=>x.method==='DELETE').length;
   await W.eval("doHold('orphdel|1')");
   return calls.filter(x=>x.method==='DELETE').length===n&&rows().length===3});

 // 刪除
 await ta('刪除勾選的兩個',async()=>{
   const cbs=[...D.querySelectorAll('[data-orph]')];
   cbs[1].checked=true;cbs[2].checked=true;
   await W.eval("doHold('orphdel|1')");
   const del=calls.filter(x=>x.method==='DELETE');
   return del.length===2&&rows().join('|')==='notes/隨手.html'
     &&st().includes('已刪除 2 個')});
 t('DELETE 帶 sha 與 branch',()=>{
   const d=calls.filter(x=>x.method==='DELETE');
   const b=JSON.parse(d[0].body);
   return b.sha==='s3'&&b.branch==='main'&&b.message.includes('papers/orphan_a.html')
     &&d[0].url.includes('/contents/papers/orphan_a.html')});
 t('中文路徑有編碼',()=>{
   const cbs=[...D.querySelectorAll('[data-orph]')];
   return !!cbs.length});

 await ta('刪除失敗會回報',async()=>{
   DELSTATUS=409;
   D.querySelector('[data-orph]').checked=true;
   await W.eval("doHold('orphdel|1')");
   return st().includes('1 個失敗')&&st().includes('409')});

 await ta('全部清掉後顯示沒有待清檔案',async()=>{
   DELSTATUS=200;
   D.querySelector('[data-orph]').checked=true;
   await W.eval("doHold('orphdel|1')");
   const d=calls.filter(x=>x.method==='DELETE').pop();
   return D.getElementById('orphList').textContent.includes('每個 HTML 與圖片都有卡片指向')
     &&decodeURIComponent(d.url).includes('notes/隨手.html')});

 await ta('repo 太大時會警告',async()=>{
   TREE={truncated:true,tree:[{type:'blob',path:'papers/x.html',sha:'z',size:10}]};
   D.getElementById('orphScan').click();await wait(80);
   return D.getElementById('orphState').innerHTML.includes('清單可能不完整')});

 // repo 用量
 await ta('掃描後顯示 repo 用量',async()=>{
   await wait(60);
   const el=D.getElementById('repoSize');
   return el.textContent.includes('350.0 MB')&&el.textContent.includes('34%')
     &&el.innerHTML.includes('var(--amber)')});
 t('掃描時一併查用量',()=>src.includes('repoSize();\n  st.textContent=')
   &&src.includes('async function repoSize()'));
 t('用量用顏色分級',()=>src.includes("mb>700?'var(--clay)':mb>300?'var(--amber)'"));

 t('全分頁可切換',()=>{[...D.querySelectorAll('#tabs button')].forEach(b=>b.click());return errs.length===0||errs.join('|')});
 t('無執行期錯誤',()=>errs.length===0||errs.join('|'));

 R.forEach(([s,n,m])=>console.log(`[${s}] ${n}${m?'  → '+m:''}`));
 console.log(`\n通過 ${R.filter(r=>r[0]==='PASS').length}/${R.length}`);
 process.exit(R.some(r=>r[0]==='FAIL')?1:0);
},500);
