// 1.1：Review 開關、Notes 酒紅 ●、使用說明 — Chromium 實際操作與截圖
const {chromium}=require('playwright');
const OUT=process.env.OUT||'/tmp/claude-0/-home-claude-epi-app/d1fb5984-118a-5eb3-864f-3695fb43e27f/scratchpad/shots11/';
require('fs').mkdirSync(OUT,{recursive:true});
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const bad=[];
  for(const [label,w] of [['phone',390],['desk',1100]]){
    const pg=await b.newPage({viewport:{width:w,height:900},deviceScaleFactor:2});
    const errs=[];pg.on('pageerror',e=>errs.push(e.message));
    await pg.goto('file:///home/claude/index.html');await pg.waitForTimeout(700);
    await pg.evaluate(()=>{const n=Date.now(),D=864e5;
      S.notes.push({id:'x1',created:n-5e5,mtime:n-5e5,title:'HBV 世代資料來源',body:'健保資料庫…',kind:'study',links:[],tags:['HBV']},
        {id:'x2',created:n-4e5,mtime:n-4e5,title:'competing risk 要用哪個模型？',body:'',kind:'study',links:[],tags:[]},
        {id:'x3',created:n-3e5,mtime:n-3e5,title:'confounding 的三個條件',body:'',kind:EXAM,links:[],tags:[]});
      S.cards.push({id:'c1',created:n-9*D,q:'OR vs RR',a:'…',theme:1,links:[],level:0,due:n-D,last:null,n:0},
        {id:'c2',created:n-9*D,q:'immortal time bias',a:'…',theme:1,links:[],level:2,due:n+4*D,last:null,n:2});
      save();renderAll();document.querySelector('.tab[data-p="review"]').click()});
    await pg.waitForTimeout(200);
    const bOn=await pg.$eval('.tab[data-p="review"]',t=>t.textContent);
    await pg.screenshot({path:OUT+label+'_1_review_on.png'});
    await pg.click('#revSw');await pg.waitForTimeout(350);
    const bOff=await pg.$eval('.tab[data-p="review"]',t=>t.textContent);
    await pg.screenshot({path:OUT+label+'_2_review_off.png'});
    const swBg=await pg.$eval('#revSw',e=>getComputedStyle(e).backgroundColor);
    console.log(label,'badge on/off:',bOn,'/',bOff,'switch off bg',swBg);
    if(bOn==='Review'||bOff!=='Review')bad.push(label+' 紅點不對');
    await pg.click('#revSw');await pg.waitForTimeout(350);
    const swBg2=await pg.$eval('#revSw',e=>getComputedStyle(e).backgroundColor);console.log(label,'switch on bg',swBg2);
    // Notes
    await pg.click('.tab[data-p="courses"]');await pg.waitForTimeout(250);
    const dots=await pg.$$eval('#ntList [data-ntcard] .ck',a=>a.map(e=>e.parentElement.dataset.ntcard+':'+getComputedStyle(e).color));
    console.log(label,'dots',dots.join(' '));
    const nl=await pg.$('#ntList');await nl.screenshot({path:OUT+label+'_3_notes.png'});
    // Settings 說明
    await pg.click('.tab[data-p="settings"]');await pg.waitForTimeout(200);await pg.click('[data-setg="help"]');await pg.waitForTimeout(200);
    for(const [i,sec] of [[4,'🎛️ 全站共通約定'],[5,'🔁 Review'],[6,'📚 Library']]){
      const d=await pg.evaluateHandle(t=>[...document.querySelectorAll('#helpBox details')].find(x=>x.querySelector('summary').textContent===t),sec);
      await d.evaluate(x=>{let p=x;while(p){if(p.tagName==='DETAILS')p.open=true;p=p.parentElement}});await pg.waitForTimeout(150);
      await d.screenshot({path:OUT+label+'_'+i+'_help.png'});
      const ow=await d.evaluate(x=>[...x.querySelectorAll('table')].filter(t=>t.scrollWidth>t.parentElement.clientWidth+2).length);
      if(ow)bad.push(label+' '+sec+' 有表格超寬 '+ow);
    }
    const hscroll=await pg.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    if(hscroll)bad.push(label+' 頁面橫向捲動');
    if(errs.length)bad.push(label+' errors: '+errs.join('|'));
    await pg.close();
  }
  await b.close();
  console.log(bad.length?'✗ '+bad.join('；'):'✓ 全部合格');process.exit(bad.length?1:0);
})();
