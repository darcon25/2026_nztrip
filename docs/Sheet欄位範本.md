# Google Sheet 欄位範本（新版改版用）

> **重要規則**
> 1. 每個分頁的**第一列（標題列）請完全照抄下面的英文欄位名**，一字不差、不要有空格、不要改成中文，否則程式讀不到。
> 2. 下面每欄的中文只是說明給你看的，不用打進 Sheet。
> 3. 選填欄位留空沒關係，程式會自動處理。
> 4. 新增分頁後，要到「檔案 →（發佈到網路 / Publish to web）」確認整份試算表有發佈，然後**把每個新分頁的 gid 告訴我**（見文件最後「怎麼找 gid」）。

---

## 一、既有「行程明細」分頁 — 新增 3 個欄位

這個分頁（目前欄位：`day_id, time, activity, desc, location, icon`）就是「景點 × 活動」亮點卡片的資料來源。請在**最後面新增這 3 欄**：

| 英文欄位名 | 中文說明 | 必填？ |
|---|---|---|
| `photo_url` | 景點照片網址（備援用；平常程式會自動抓 Google 地圖照片，這欄有填就優先用） | 選填 |
| `menu_url` | 餐廳菜單連結（這個行程若含用餐才填） | 選填 |
| `food_rec` | 熱推餐飲（例如「Fergburger 漢堡、藍鱈魚」） | 選填 |

**填寫範例（一列）：**
`day_id=D1, time=13:25, activity=基督城機場, desc=領取 Hiace 車隊, location=Christchurch Airport, icon=Plane, photo_url=(留空), menu_url=(留空), food_rec=(留空)`

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
