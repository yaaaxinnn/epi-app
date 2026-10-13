// 真實瀏覽器量測：卡片 Markdown 表格在手機與桌機寬度下的欄寬與橫向捲軸
const {chromium}=require('playwright');
const path='file:///home/claude/index.html';

const T2=['| 排除條件 | 理由 |','|---|---|',
 '| 招募前有癌症 | 可能同時影響 HRT 使用與卵巢癌 |',
 '| 自述做過雙側卵巢切除 | 幾乎消除卵巢癌風險 |',
 '| 最後聯繫時仍未停經 | 未說明 |'].join('\n');
const T4=['| 組別 | HBV DNA (copies/mL) | n | aHR (95% CI) |','|---|---:|---:|---|',
 '| 1 | <300 | 1,102 | 1.00（ref） |',
 '| 2 | 300–9,999 | 907 | 1.1（0.5–2.3） |',
 '| 3 | ≥10⁶ | 480 | 6.1（2.9–12.7） |'].join('\n');
const NEST=['- 主資料庫：NHIRD 2000–2018','  - 門診檔','  - 住院檔','    - 藥費明細','- 連結：死因檔'].join('\n');

(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const out=[];let bad=0;
  for(const [label,w] of [['手機 390px',390],['iPad 768px',768],['桌機 1280px',1280]]){
    const pg=await b.newPage({viewport:{width:w,height:900}});
    await pg.goto(path);
    await pg.waitForTimeout(600);
    await pg.evaluate(({T2,T4,NEST})=>{
      S.papers.length=0;
      S.papers.push({id:'pz',created:Date.now(),title:'版面測試',authors:'A',tags:[],cat:'teacher',
        pop:T2, result:T4, design:NEST});
      renderAll();
      document.querySelector('[data-pedit="pz"]').click();
    },{T2,T4,NEST});
    await pg.waitForTimeout(300);

    const r=await pg.evaluate(()=>{
      const secs=[...document.querySelectorAll('#paperList .pfsec')];
      const get=n=>secs.find(s=>s.querySelector('.pfhead').textContent.includes(n));
      const tbl=n=>{const s=get(n),wrap=s.querySelector('.mdtable'),t=wrap.querySelector('table');
        const cells=[...t.querySelectorAll('thead th')].map(c=>Math.round(c.getBoundingClientRect().width));
        return {wrapW:Math.round(wrap.clientWidth),scrollW:Math.round(wrap.scrollWidth),
                tableW:Math.round(t.getBoundingClientRect().width),cols:cells,
                scrolls:wrap.scrollWidth>wrap.clientWidth+1};};
      const nest=()=>{const s=get('研究設計');
        const L=[...s.querySelectorAll('li')];
        const base=L[0].getBoundingClientRect().left;
        const depth=el=>{let d=0,n=el.parentElement;while(n&&n!==s){if(/^(UL|OL)$/.test(n.tagName))d++;n=n.parentElement}return d};
        return L.map(li=>({txt:li.firstChild.textContent.trim().slice(0,10),
          depth:depth(li), indent:Math.round(li.getBoundingClientRect().left-base)}));};
      const page=document.scrollingElement;
      return {two:tbl('研究對象'),four:tbl('主要結果'),nest:nest(),
              pageScrolls:page.scrollWidth>page.clientWidth+1,
              bodyW:document.body.clientWidth};
    });

    out.push(`\n=== ${label} ===`);
    out.push(`頁面橫向捲軸：${r.pageScrolls?'有 ✗':'無 ✓'}`);
    const row=(n,t)=>{
      const okScroll=(n==='兩欄表')?!t.scrolls:true;
      if(!okScroll)bad++;
      out.push(`${n}：容器 ${t.wrapW}px／內容 ${t.scrollW}px　欄寬 [${t.cols.join(', ')}]　橫向捲軸：${t.scrolls?'有':'無'} ${okScroll?'✓':'✗'}`);
    };
    row('兩欄表',r.two); row('四欄表',r.four);
    // 兩欄表第一欄不該佔掉大半
    const [c1,c2]=r.two.cols, share=c1/(c1+c2);
    const shareOK=share<0.62;if(!shareOK)bad++;
    out.push(`兩欄表第一欄佔比 ${(share*100).toFixed(0)}% ${shareOK?'✓':'✗ 第一欄太寬'}`);
    // 巢狀縮排
    const d=r.nest;
    const okNest=d[1].depth===2&&d[1].indent>d[0].indent&&d[3].depth===3&&d[3].indent>d[1].indent;
    if(!okNest)bad++;
    out.push(`巢狀清單：${d.map(x=>`L${x.depth}+${x.indent}px(${x.txt})`).join('  ')} ${okNest?'✓':'✗'}`);
    await pg.close();
  }
  await b.close();
  console.log(out.join('\n'));
  console.log(bad?`\n✗ ${bad} 項不合格`:'\n✓ 全部合格');
  process.exit(bad?1:0);
})();
