const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const out=[];let bad=0;
  for(const w of [390,1280]){
    const pg=await b.newPage({viewport:{width:w,height:900}});
    await pg.goto('file:///home/claude/index.html');await pg.waitForTimeout(600);
    const r=await pg.evaluate(()=>{
      // 比較表
      S.papers.length=0;
      for(let i=0;i<3;i++)S.papers.push({id:'c'+i,created:Date.now()-i,title:'論文'+i,authors:'A',tags:[],cat:'teacher',
        sum:'一句話',design:'設計',result:'結果',note:'筆記'});
      paperView='table';renderPapers();
      const wrap=document.querySelector('#paperTable .tablewrap'),t=wrap.querySelector('table');
      const cmp={wrapW:Math.round(wrap.clientWidth),tableW:Math.round(t.getBoundingClientRect().width),
        scrolls:wrap.scrollWidth>wrap.clientWidth+1,
        td:(()=>{const d=getComputedStyle(t.querySelector('tbody td'));return [d.minWidth,d.maxWidth,d.padding]})()};
      // HELP 表格
      document.querySelectorAll('details').forEach(d=>d.open=true);
      const h=[...document.querySelectorAll('.help table')].pop();
      let help=null;
      if(h){const cs=getComputedStyle(h);
        help={w:Math.round(h.getBoundingClientRect().width),minW:cs.minWidth,
          parentW:Math.round(h.parentElement.clientWidth),
          bordered:getComputedStyle(h.querySelector('td')).borderTopWidth};}
      // 課表
      renderTT&&renderTT();
      const tt=document.querySelector('#ttTable');
      const ttv={minW:getComputedStyle(tt).minWidth,cells:tt.querySelectorAll('td').length};
      return {cmp,help,ttv,pageScrolls:document.scrollingElement.scrollWidth>document.scrollingElement.clientWidth+1};
    });
    out.push(`\n=== ${w}px ===`);
    out.push(`頁面橫向捲軸：${r.pageScrolls?'有 ✗':'無 ✓'}`);
    if(r.pageScrolls)bad++;
    const okCmp=r.cmp.tableW>=900&&r.cmp.td[0]==='130px'&&r.cmp.td[1]==='240px';
    if(!okCmp)bad++;
    out.push(`比較表：表寬 ${r.cmp.tableW}px（應 ≥900）　td min/max ${r.cmp.td[0]}/${r.cmp.td[1]}　padding ${r.cmp.td[2]}　容器捲動 ${r.cmp.scrolls} ${okCmp?'✓':'✗'}`);
    if(r.help){
      const okHelp=r.help.w<=r.help.parentW+1&&r.help.minW==='0px'&&r.help.bordered!=='0px';
      if(!okHelp)bad++;
      out.push(`HELP 表格：寬 ${r.help.w}px／容器 ${r.help.parentW}px　min-width ${r.help.minW}　有框線 ${r.help.bordered} ${okHelp?'✓':'✗'}`);
    } else out.push('HELP 表格：找不到（可能未展開）');
    out.push(`課表：min-width ${r.ttv.minW}　格數 ${r.ttv.cells}`);
    await pg.close();
  }
  await b.close();console.log(out.join('\n'));
  console.log(bad?`\n✗ ${bad} 項不合格`:'\n✓ 全部合格');process.exit(bad?1:0);
})();
