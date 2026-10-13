// v47 資格考：Chromium 實際操作與截圖
const {chromium}=require('playwright');
const OUT=process.env.OUT||'/tmp/claude-0/-home-claude/d1fb5984-118a-5eb3-864f-3695fb43e27f/scratchpad/shots47/';
require('fs').mkdirSync(OUT,{recursive:true});
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const bad=[];
  for(const [label,w] of [['phone',390],['desk',1100]]){
    const pg=await b.newPage({viewport:{width:w,height:900},deviceScaleFactor:2});
    const errs=[];pg.on('pageerror',e=>errs.push(e.message));
    await pg.goto('file:///home/claude/index.html');await pg.waitForTimeout(700);
    await pg.evaluate(()=>{const n=Date.now();
      S.notes.push({id:'x1',created:n-5e5,mtime:n-5e5,title:'一般筆記：HBV 世代資料來源',body:'健保資料庫…',kind:'study',links:[],tags:['HBV']});
      S.cards.push({id:'c1',created:n,q:'一般卡：OR vs RR',a:'…',theme:1,links:[],level:0,due:n,last:null,n:0});
      save();renderAll();document.querySelector('.tab[data-p="courses"]').click()});
    // 用 UI 新增一則資格考
    await pg.click('#addNtBtn');await pg.selectOption('#nt-kind','exam');
    await pg.fill('#nt-title','老師說考過：confounding 的三個條件，並舉例');
    await pg.fill('#nt-psrc','高流方法 W6 陳老師 10/6');await pg.selectOption('#nt-tb','Confounding');
    await pg.fill('#nt-body','1. 與暴露有關\n2. 與結果有關（獨立於暴露）\n3. 不在因果路徑上');
    await pg.click('#ntExamBox [data-tip="tipExam"]');await pg.waitForTimeout(150);
    await (await pg.$('#ntForm')).screenshot({path:OUT+label+'_1_form.png'});
    await pg.click('#addNt');await pg.waitForTimeout(300);
    const toast=await pg.textContent('#toast');console.log(label,'toast:',toast);
    if(!toast.includes('考古卡'))bad.push(label+' 沒有送卡提示');
    // 展開剛建的筆記
    const nid=await pg.evaluate(()=>S.notes[S.notes.length-1].id);
    await pg.click(`#ntList [data-ntcard="${nid}"]`);await pg.waitForTimeout(200);
    await pg.screenshot({path:OUT+label+'_2_notes.png',fullPage:true});
    await pg.click(`#ntList [data-ntedit="${nid}"]`);await pg.waitForTimeout(200);
    await (await pg.$(`#ntList .item[data-ntcard="${nid}"]`)).screenshot({path:OUT+label+'_3_edit.png'});
    await pg.click(`#ntList [data-ntsave="${nid}"]`);
    // Review
    await pg.click('.tab[data-p="review"]');
    await pg.evaluate(()=>{document.querySelector('#p-review details.fold').open=true});await pg.waitForTimeout(200);
    await pg.screenshot({path:OUT+label+'_4_review.png',fullPage:true});
    const due=await pg.textContent('#dueCount');if(due!=='1')bad.push(label+' DUE 應為 1，實際 '+due);
    // 只跑考古題
    await pg.check('#examPast');await pg.click('#startExam');await pg.waitForTimeout(200);
    await pg.screenshot({path:OUT+label+'_5_exam.png'});
    const prog=await pg.textContent('#ovProg');if(prog!=='1 / 1')bad.push(label+' 考古題 queue '+prog);
    await pg.click('#ovClose');
    for(const p of ['courses','review']){
      await pg.click(`.tab[data-p="${p}"]`);await pg.waitForTimeout(150);
      const ov=await pg.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
      if(ov>0)bad.push(`${label} ${p} 水平溢出 ${ov}px`);
    }
    if(errs.length)bad.push(label+' JS 錯誤：'+errs.join(' / '));
    await pg.close();
  }
  await b.close();
  console.log(bad.length?'✗ '+bad.join('\n'):'✓ 全部合格');process.exit(bad.length?1:0);
})();
