# Epi_Yaxin 筆記頁模板與 Library 網頁資料規約

`notebook.html` 是 Epi_Yaxin Library 的通用筆記頁模板。HTML 只是外殼；標題、卡片、卡片的上下層與順序全部是**資料**，使用者在頁面裡就能新增、編輯、搬移、刪除。

- Library 卡片表單的「＋ 空白筆記頁」會讀這個檔案，填好名稱與一個新的資料庫名稱後上傳。
- 要做一頁「有預設內容」的筆記頁（例如課程預習包），就拿這個檔案，只改下面兩個 `<script type="application/json">` 區塊，**不要改其他程式**。

## 1. 設定：`nb-config`

```html
<script id="nb-config" type="application/json">{"db":"causalPrep","title":"因果推論預習"}</script>
```

| 欄位 | 說明 |
|---|---|
| `db` | 這一頁的 indexedDB 名稱。**每一頁都要不一樣**，一旦用了就不要再改（改了就讀不到舊資料）。英數與 `-`。 |
| `title` | 第一次打開時的標題（之後使用者可以在頁面裡改）。 |

`<title>` 也改成同一個名稱。

## 2. 預設內容：`nb-seed`

空白頁是 `null`。要放預設內容時改成：

```json
{
  "title": "因果推論預習",
  "sub": "林老師課程｜ME Ch3、Ch12、What If Ch6",
  "about": "首頁最上面的說明（Markdown）",
  "fold": true,
  "view": "grid",
  "kids": ["orientation", "po"],
  "nodes": {
    "orientation": {
      "title": "預習導讀",
      "body": "**閱讀範圍**：……\n\n## 待辦\n- [ ] NotebookLM 1　章節導讀",
      "fold": true,
      "view": "grid",
      "kids": ["chapter-map"]
    },
    "chapter-map": {
      "title": "章節導讀",
      "body": "### NotebookLM 步驟1\n\n````text\n要複製的指令放在四個反引號的區塊裡\n````",
      "fold": true,
      "view": "list",
      "kids": []
    }
  }
}
```

| 欄位 | 用在 | 說明 |
|---|---|---|
| `title`／`sub`／`about` | 首頁 | 標題、副標、說明（Markdown） |
| `fold` | 首頁、卡片 | `true`＝內容預設收成一行，要用時再點開（適合放指令、待辦） |
| `view` | 首頁、卡片 | 底下卡片的排法：`grid` 格狀（放主題）、`list` 清單（放問答，點一下就地展開） |
| `kids` | 首頁、卡片 | 底下卡片的代號，**陣列順序就是顯示順序** |
| `nodes` | — | 所有卡片，key 是代號 |
| `body` | 卡片 | Markdown：表格、`$公式$`、`$$公式$$`、程式碼區塊（右上自動有「複製」鈕）、`- [ ]`／`- [x]` 可以勾的待辦 |
| `imgs` | 卡片（選填） | `[{"src":"data:image/jpeg;base64,…","cap":"小說明"}]` |

規則：

- **代號**：英數、`-`、`_`，整頁不重複；用了就不要改、不要拿去給別的卡片用。
- 層數不限；不要再分「單元／主題」這類固定層級，全部都是卡片。
- 指令裡如果本身有 ```` ``` ````，外層用四個反引號 ```` ```` ```` 包。
- 不要放「未歸位」頁或頁碼對照這類固定頁面；需要的話就是一張普通卡片。

## 3. 改版時資料怎麼保住

- 使用者自己加的、改的、刪的都存在 indexedDB（`db`）的 store `kv`、key `doc`，Epi_Yaxin 會同步到 GitHub 的 `檔名.data.json`。**換新版 HTML 不會動到這份資料**。
- 第一次打開：照 `nb-seed` 建出卡片，記下哪些代號是預設內容。
- 之後換新版 HTML：只會**補上沒見過的代號**（放在 seed 指定的上層；上層被刪了就放首頁最後）；使用者改過、刪過的卡片不會被覆蓋，也不會復活。
- 所以改版時：要加內容就加新代號；要改既有卡片的文字，請使用者在頁面裡自己改（或換一個新代號）。
- 讀到看不懂的存檔格式時，頁面會唯讀、不存檔，不會用空白蓋掉。
- 同一個 `db` 底下其他 key（例如舊版留下的 `state`）不會被讀寫，原樣保留。

## 4. 資料格式（`doc`，給 Claude 參考，不用手寫）

```json
{"schema":"epi-notebook","v":1,"title":"","sub":"","about":"","fold":false,"view":"grid",
 "kids":["…"],"nodes":{"代號":{"id":"代號","title":"","body":"","imgs":[],"kids":[],"view":"grid","fold":false,"created":0,"updated":0}},
 "seeded":["…"],"trash":[{"at":0,"root":"代號","parent":null,"index":0,"nodes":{}}],"created":0,"updated":0}
```

`trash` 是刪除後可按「復原」的紀錄，保留 30 天。
