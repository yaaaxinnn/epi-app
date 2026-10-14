// 1.2 筆記頁實機：app 裡「＋ 空白筆記頁」→ 頁面裡加卡片 → 關閉同步 → 另一台打開看得到 → 重新上傳新版不掉資料
const {chromium}=require('playwright');const fs=require('fs');
const OUT=process.env.OUT||'/tmp/claude-0/-home-claude/d1fb5984-118a-5eb3-864f-3695fb43e27f/scratchpad/shots12/';
fs.mkdirSync(OUT,{recursive:true});
const NM='/home/claude/node_modules/';
const LIB={'marked.min.js':NM+'marked/marked.min.js','purify.min.js':NM+'dompurify/dist/purify.min.js','katex.min.js':NM+'katex/dist/katex.min.js','katex.min.css':NM+'katex/dist/katex.min.css'};
const REPO={},SHA={};let n=0;const bad=[];const log=(...a)=>console.log(...a);
async function ctxFor(b,w){
  const ctx=await b.newContext({viewport:{width:w,height:860},deviceScaleFactor:2});
  await ctx.route('https://api.github.com/**',async r=>{
    const q=r.request(),u=decodeURIComponent(q.url().split('?')[0]),path=u.split('/contents/')[1]||'';
    if(q.method()==='PUT'){const j=JSON.parse(q.postData());if(REPO[path]!==undefined&&j.sha!==SHA[path])return r.fulfill({status:409,body:'{}'});
      REPO[path]=Buffer.from(j.content,'base64').toString('utf8');SHA[path]='s'+(++n);
      return r.fulfill({status:201,contentType:'application/json',body:JSON.stringify({content:{sha:SHA[path]}})})}
    if(path&&q.method()==='GET'){if(!(path in REPO))return r.fulfill({status:404,body:'{}'});
      if((q.headers()['accept']||'').includes('raw'))return r.fulfill({status:200,contentType:'text/plain; charset=utf-8',body:REPO[path]});
      return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({sha:SHA[path],size:Buffer.byteLength(REPO[path])})})}
    return r.fulfill({status:404,body:'{}'});
  });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  await ctx.route(/cdn\.jsdelivr\.net/,r=>{const k=Object.keys(LIB).find(k=>r.request().url().endsWith(k));return k?r.fulfill({path:LIB[k],contentType:k.endsWith('.css')?'text/css':'application/javascript'}):r.abort()});
  return ctx;
}
const GHJS=()=>{GH={owner:'yaaaxinnn',repo:'epi-data',branch:'main',path:'data/notes.json',token:'t',auto:false}};
async function frameAdd(fr,title,body){
  await fr.click('#addRoot');await fr.waitForTimeout(200);
  await fr.fill('.form [data-f=title]',title);if(body)await fr.fill('.form [data-f=body]',body);
  await fr.click('[data-save]');await fr.waitForTimeout(300);
}
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  for(const [label,w] of [['desk',1100],['phone',390]]){
    for(const k of Object.keys(REPO))delete REPO[k];
    const A=await ctxFor(b,w),pa=await A.newPage();const ea=[];pa.on('pageerror',e=>ea.push(e.message));
    await pa.goto('http://localhost:8766/index.html');await pa.waitForTimeout(600);
    await pa.evaluate(GHJS);
    await pa.click('.tab[data-p="library"]');
    await pa.click('#ucAddBtn');await pa.fill('#uc-name','HBV');await pa.fill('#uc-code','hbv');await pa.click('#saveUC');
    await pa.click('#addUnitBtn');await pa.fill('[data-ud="title"]','HBV Guideline 整理');
    await pa.click('[data-nbnew]');await pa.fill('[data-nbname]','HBV Guideline');
    await (await pa.$('#unitForm')).screenshot({path:OUT+label+'_1_name.png'});
    await pa.click('[data-nbok]');await pa.waitForTimeout(500);
    await (await pa.$('#unitForm')).screenshot({path:OUT+label+'_2_queued.png'});
    await pa.click('#saveUnit');await pa.waitForTimeout(900);
    const P='library/hbv/hbv-guideline.html',DP='library/hbv/hbv-guideline.data.json';
    if(!REPO[P]||!REPO[P].includes('"title":"HBV Guideline"'))bad.push(label+' 空白筆記頁沒上傳');
    const uid=await pa.evaluate(()=>S.units.find(u=>u.title==='HBV Guideline 整理').id);
    const fid=await pa.evaluate(id=>S.units.find(u=>u.id===id).files[0].fid,uid);
    await pa.screenshot({path:OUT+label+'_3_card.png'});
    await pa.click(`#u-${uid} [data-ufopen="${fid}"]`);await pa.waitForTimeout(1500);
    let fr=pa.frame({url:/^blob:/});
    const t0=await fr.evaluate(()=>document.querySelector('#sTitle').textContent);
    if(t0!=='HBV Guideline')bad.push(label+' 筆記頁標題不對 '+t0);
    if(w<600){await fr.click('#menuBtn');await fr.waitForTimeout(250)}
    await frameAdd(fr,'治療適應症','## 何時開始治療\n\n- [ ] 對照 AASLD\n- [ ] 對照 EASL');
    if(w<600){await fr.click('#menuBtn');await fr.waitForTimeout(250)}
    await frameAdd(fr,'抗病毒藥物','');
    await fr.evaluate(()=>location.hash='#/');await fr.waitForTimeout(300);
    await pa.screenshot({path:OUT+label+'_4_viewer.png'});
    const dbs=await pa.evaluate(id=>S.units.find(u=>u.id===id).files[0].dbs,uid);
    log(label,'資料庫',JSON.stringify(dbs));
    if(dbs.length!==1||!/^nb-/.test(dbs[0]))bad.push(label+' 沒偵測到筆記頁的資料庫');
    await pa.click('#uvClose');await pa.waitForTimeout(1500);
    if(!REPO[DP]||!REPO[DP].includes('治療適應症'))bad.push(label+' 關閉後頁面資料沒上傳');
    const stateA=await pa.evaluate(()=>localStorage.getItem('epi-yaxin'));
    // ===== 裝置 B =====
    const B=await ctxFor(b,w);await B.addInitScript(s=>{if(!localStorage.getItem('epi-yaxin'))localStorage.setItem('epi-yaxin',s)},stateA);
    const pb=await B.newPage();const eb=[];pb.on('pageerror',e=>eb.push(e.message));
    await pb.goto('http://localhost:8766/index.html');await pb.waitForTimeout(600);
    await pb.evaluate(GHJS);await pb.evaluate(()=>{document.querySelector('.tab[data-p="library"]').click()});
    await pb.evaluate(cid=>{libPick(cid);renderLib()},await pa.evaluate(id=>S.units.find(u=>u.id===id).cid,uid));
    await pb.click(`#u-${uid} [data-ufopen="${fid}"]`);await pb.waitForTimeout(1500);
    const fb=pb.frame({url:/^blob:/});
    const kb=await fb.evaluate(()=>[...document.querySelectorAll('.grid .kc .kt')].map(e=>e.textContent).join('|'));
    log(label,'裝置 B 看到',kb);
    if(!kb.includes('治療適應症')||!kb.includes('抗病毒藥物'))bad.push(label+' 裝置 B 沒還原卡片');
    // B 在卡片底下加一張、勾待辦
    const cid1=await fb.evaluate(()=>doc.kids.find(i=>doc.nodes[i].title==='治療適應症'));
    await fb.evaluate(id=>location.hash='#/c/'+id,cid1);await fb.waitForTimeout(300);
    await fb.click('.md li input[type=checkbox]');await fb.waitForTimeout(200);
    await fb.click('[data-add="'+cid1+'"]');await fb.waitForTimeout(200);await fb.fill('.form [data-f=title]','HBeAg 陽性');await fb.click('[data-save]');await fb.waitForTimeout(300);
    await pb.screenshot({path:OUT+label+'_5_deviceB.png'});
    await pb.click('#uvClose');await pb.waitForTimeout(1500);
    if(!REPO[DP].includes('HBeAg 陽性')||!REPO[DP].includes('- [x] 對照 AASLD'))bad.push(label+' 裝置 B 的修改沒上傳');
    // A：重新上傳「新版」模板（同檔名）→ 舊版另存、資料還在
    const newer=REPO[P].replace('</body>','<!-- v2 --></body>');
    await pa.click(`#u-${uid} [data-uedit="${uid}"]`);await pa.waitForTimeout(200);
    fs.writeFileSync('/tmp/claude-0/-home-claude/d1fb5984-118a-5eb3-864f-3695fb43e27f/scratchpad/hbv-guideline.html',newer);
    await pa.setInputFiles('#ua-file','/tmp/claude-0/-home-claude/d1fb5984-118a-5eb3-864f-3695fb43e27f/scratchpad/hbv-guideline.html');await pa.waitForTimeout(500);
    await pa.click('#saveUnit');await pa.waitForTimeout(1200);
    const olds=Object.keys(REPO).filter(k=>/hbv-guideline\.old-/.test(k)),baks=Object.keys(REPO).filter(k=>/hbv-guideline\.data\.backup-/.test(k));
    log(label,'舊版另存',olds.length,'資料備份',baks.length,'新版',REPO[P].includes('v2'));
    if(olds.length!==1||baks.length!==1||!REPO[P].includes('v2'))bad.push(label+' 覆蓋前沒另存');
    await pa.click(`#u-${uid} [data-ufopen="${fid}"]`);await pa.waitForTimeout(1500);
    fr=pa.frame({url:/^blob:/});
    const has=await fr.evaluate(()=>Object.values(doc.nodes).map(n=>n.title).join('|'));
    log(label,'換新版後 A 看到',has);
    if(!has.includes('HBeAg 陽性')||!has.includes('抗病毒藥物'))bad.push(label+' 換新版後資料不見');
    await pa.screenshot({path:OUT+label+'_6_afterUpdate.png'});
    await pa.click('#uvClose');await pa.waitForTimeout(800);
    const ov=await pa.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);if(ov>0)bad.push(`${label} 水平溢出 ${ov}px`);
    const fe=ea.concat(eb).filter(m=>!/Failed to fetch|fonts/.test(m));
    if(fe.length)bad.push(label+' JS 錯誤：'+fe.join(' / '));
    await A.close();await B.close();
  }
  await b.close();
  console.log(bad.length?'✗ '+bad.join('\n'):'✓ 全部合格');process.exit(bad.length?1:0);
})();
