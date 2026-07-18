# Google Sheet 欄位範本（新版改版用）

> **重要規則**
> 1. 每個分頁的**第一列（標題列）請完全照抄下面的英文欄位名**，一字不差、不要有空格、不要改成中文，否則程式讀不到。
> 2. 下面每欄的中文只是說明給你看的，不用打進 Sheet。
> 3. 選填欄位留空沒關係，程式會自動處理。
> 4. 新增分頁後，要到「檔案 →（發佈到網路 / Publish to web）」確認整份試算表有發佈，然後**把每個新分頁的 gid 告訴我**（見文件最後「怎麼找 gid」）。

---

## 現況對照（2026-07-19 實際比對）

程式讀什麼 vs Sheet 現在有什麼。**這一節是待辦清單，做完可以刪。**

### 行程明細（Detail daily，gid `1143344383`）

| 程式讀的欄位 | Sheet 現況 | 要做什麼 |
|---|---|---|
| `day_id` `time` `activity` `desc` `location` `icon` | ✅ 都有 | — |
| `menu_url` | ❌ 沒有 | 想要「餐廳菜單連結」功能就新增此欄 |
| `food_rec` | ❌ 沒有 | 想要「熱推餐飲」功能就新增此欄 |
| （不讀）| Sheet 有 `link`、`早`、`中` | 程式不會讀，留著無妨 |

**缺資料**：D2、D3 一列都沒有，這兩天的亮點卡片會是空的。

### 每日概要（Days，gid `1603960862`）

| 程式讀的欄位 | Sheet 現況 | 要做什麼 |
|---|---|---|
| `day_id` `date` `title` `hotel` `alert` `meal_b` `meal_l` `meal_d` | ✅ 都有 | — |
| `highlights` | ⚠️ D2、D3、D7、D8 空白 | 想在每日摘要看到內容就補 |
| `map_place` | ❌ 沒有（選填） | 目前 7 個地點靠標題自動判斷都正確，**可以不加** |

**要刪的資料**：最後一列 `D11 / 8/1 / 測試` 是測試資料，會讓網站多出一個 Day 11。

### 分帳（budget，gid `0`）

| 程式讀的欄位 | Sheet 現況 | 要做什麼 |
|---|---|---|
| `name` `car` `total` | ✅ 都有 | — |
| `hotel` | ✅ 對到 `accomadation` 欄 | 程式已容錯，不用改 |
| `id` | ⚠️ 第一欄標題是空白的 | 程式已容錯不會壞，建議還是填上 `id` |
| （不讀）| `HC`、`car booking`、`accomadation booking`、`remark` | 程式不會讀，留著無妨 |

### 人員班機

**目前寫死在 `googleSheetService.ts` 裡，不讀 Sheet。** 且與分帳名單不一致：分帳有 `HOWARD`、`JAMES`，但班機區塊寫的是「Cathy 家」且完全沒有 James。使用者決定**先不處理**（2026-07-19）。日後要修有兩條路：新增「班機」分頁改成讀 Sheet，或直接改程式裡的常數。

### 輪值 / 住宿

兩個分頁都還沒建立，`googleSheetService.ts` 的 `DUTY_GID`／`LODGING_GID` 是空字串，網站目前顯示備援假資料。範本見下方第二、三節。

---

## 一、既有「行程明細」分頁 — 可新增 2 個欄位

這個分頁（目前欄位：`day_id, time, activity, desc, location, icon, link, 早, 中`）就是「景點 × 活動」亮點卡片的資料來源。若要啟用菜單與美食推薦功能，請在**最後面新增這 2 欄**：

| 英文欄位名 | 中文說明 | 必填？ |
|---|---|---|
| `menu_url` | 餐廳菜單連結（這個行程若含用餐才填） | 選填 |
| `food_rec` | 熱推餐飲（例如「Fergburger 漢堡、藍鱈魚」） | 選填 |

**填寫範例（一列）：**
`day_id=D1, time=13:25, activity=基督城機場, desc=領取 Hiace 車隊, location=Christchurch Airport, icon=Plane, menu_url=(留空), food_rec=(留空)`

> **關於景點照片**：程式一律自動抓 Google 地圖照片，不支援自訂圖片網址（`photo_url` 欄已於 2026-07-19 移除）。照片抓得準不準取決於 `location` 欄——填**景點名稱**（如 `Fairlie Playground`）會有照片，填**門牌地址**（如 `39 Meadow Street...`）通常抓不到，會顯示米色佔位圖。`location` 欄同時也是「開啟導航」按鈕的目標，填景點名稱對兩邊都好。

---

## 二、新分頁「輪值」— 餐廳及煮飯輪值

新增一個分頁，命名隨意（例如「輪值」）。標題列請照抄：

```
date	day_id	cook_family	breakfast	lunch	dinner	restaurant	menu_url	food_rec
```

| 英文欄位名 | 中文說明 | 必填？ |
|---|---|---|
| `date` | 日期（例如 `7/22`） | 必填 |
| `day_id` | 對應天數（`D1`、`D2`…，方便和行程關聯） | 必填 |
| `cook_family` | 當天煮飯輪值的家庭（例如 `Max 家`；外食日可留空） | 選填 |
| `breakfast` | 早餐安排 | 選填 |
| `lunch` | 午餐安排 | 選填 |
| `dinner` | 晚餐安排 | 選填 |
| `restaurant` | 推薦／預訂餐廳名 | 選填 |
| `menu_url` | 餐廳菜單連結 | 選填 |
| `food_rec` | 熱推餐飲 | 選填 |

**填寫範例（一列）：**
`date=7/26, day_id=D5, cook_family=Richard 家, breakfast=飯店, lunch=Fairlie 鮭魚派, dinner=自煮 BBQ, restaurant=Fairlie Bakehouse, menu_url=https://..., food_rec=三文魚派`

---

## 三、新分頁「住宿」— 住房資訊

新增一個分頁（例如「住宿」）。標題列請照抄：

```
date_range	name	address	checkin	room_note
```

| 英文欄位名 | 中文說明 | 必填？ |
|---|---|---|
| `date_range` | 入住日期區間（例如 `7/22-7/23`） | 必填 |
| `name` | 住宿名稱（例如 `25 Teesdale Street`） | 必填 |
| `address` | 完整地址（點了會開 Google 導航） | 必填 |
| `checkin` | 入住資訊（例如 `15:00 後入住、密碼 1234`） | 選填 |
| `room_note` | 房間分配備註（例如 `A 棟：Fenix/Jerry；B 棟：Max`） | 選填 |

**填寫範例（一列）：**
`date_range=7/22-7/23, name=25 Teesdale Street, address=25 Teesdale Street, Christchurch, checkin=自助入住 門鎖密碼另發, room_note=一樓 Fenix 家、二樓 Jerry 家`

---

## 四、（選填）互動地圖：每日概要分頁的 `map_place` 欄

互動地圖會自動從每天的**標題**判斷那天在地圖上的地點（例如標題含「庫克山」→ 對到 Mt Cook）。多數情況不用做任何事。

只有在「自動判斷錯誤」或「標題看不出地點」時，才在「每日概要」分頁（Days）新增一欄 `map_place`，填固定地點代號指定：

| 代號 | 地點 |
|---|---|
| `christchurch` | 基督城 |
| `tekapo` | 蒂卡波 |
| `mtcook` | 庫克山 |
| `queenstown` | 皇后鎮 |
| `teanau` | 蒂阿瑙 |
| `milford` | 米爾福德 |
| `oamaru` | 奧瑪魯 |

> 互動地圖的手繪底圖與 Isa 角色圖，之後分別放到 `public/map.png`、`public/isa.png` 就會自動蓋上程式繪製的暫代圖。

---

## 怎麼找每個分頁的 gid（分頁編號）

程式是用 gid 抓每個分頁的資料。找法：

1. 在瀏覽器打開你的 Google Sheet
2. 點到某個分頁（例如「輪值」）
3. 看網址列，會有一段 `#gid=1234567890`，最後那串數字就是這個分頁的 gid
4. 把「分頁名稱 → gid」列給我，例如：
   - 輪值 → `123456789`
   - 住宿 → `987654321`

我拿到 gid 後就把它接進程式。（你也要確認「發佈到網路」是發佈**整份文件**，這樣新分頁才會被公開讀取。）
