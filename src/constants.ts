export const familyBudgets = [
  { id: 'fenix', name: 'Fenix 家', car: 635.3, hotel: 817.1, total: 1452.4 },
  { id: 'jerry', name: 'JERRY 家', car: 635.3, hotel: 935.5, total: 1570.8 },
  { id: 'ziv', name: 'ziv 家', car: 635.3, hotel: 935.5, total: 1570.8 },
  { id: 'cathy', name: 'CATHY 家', car: 635.3, hotel: 1494.6, total: 2129.9 },
  { id: 'richard', name: 'Richard 家', car: 564.7, hotel: 994.7, total: 1559.4 },
  { id: 'max', name: 'MAX 家', car: 494.1, hotel: 818.0, total: 1312.1 }
];

// 備用資料：只有在抓 Google Sheet 失敗時才會用到，內容對齊 Sheet 上完整的 Day 1~10，
// 避免退回時缺天數。若 Sheet 行程大改，這份也順手更新一下。
export const days = [
  {
    day: 1,
    date: '7/22',
    title: '基督城集結 Day 1',
    hotel: '基督城 AIR BNB',
    hotelAddress: '29 Everest Street- Christchurch',
    meals: { b: '自理', l: '自理', d: '自理' },
    items: [
      { time: '14:00', label: '首波取車', detail: 'Cross Country Rentals Christchurch，領取 Toyota Hiace 10人座兩台', map: 'Cross Country Rentals Christchurch' },
      { time: '18:00', label: '超市採買', detail: 'Woolworths Avonhead 購買初期物資', map: 'Woolworths Avonhead' }
    ]
  },
  {
    day: 2,
    date: '7/23',
    title: '基督城集結 Day 2',
    hotel: '基督城 AIR BNB',
    hotelAddress: '29 Everest Street- Christchurch',
    meals: { b: '自理', l: '自理', d: '自理' },
    items: [
      { time: '09:00', label: 'Castle Hill', detail: '參觀巨石陣', map: 'Castle Hill Conservation Area' },
      { time: '14:00', label: '國際南極中心', detail: 'International Antarctic Centre', map: 'International Antarctic Centre' },
      { time: '17:00', label: '晚餐 BurgerFuel', detail: 'BurgerFuel Spitfire Square 漢堡餐廳', map: 'BurgerFuel Spitfire Square' }
    ]
  },
  {
    day: 3,
    date: '7/24',
    title: '基督城集結 Day 3',
    hotel: '基督城露營地 / 基督城 AIR BNB',
    hotelAddress: 'Tasman Holiday Parks - Christchurch',
    meals: { b: '自理', l: '自理', d: '超市備料' },
    items: [
      { time: '10:00', label: 'Orana Wildlife Park', detail: '早上 10:00 開始營業', map: 'Orana Wildlife Park' },
      { time: '10:00', label: '高爾夫', detail: 'McLeans Island Golf Club', map: 'McLeans Island Golf Club' },
      { time: '14:20', label: '市區觀光', detail: 'Christchurch City tour', map: 'Christchurch Botanic Gardens' },
      { time: '17:00', label: 'James & Max 抵達', detail: 'Tasman Holiday Parks 住露營車', map: 'Tasman Holiday Parks - Christchurch' },
      { time: '18:00', label: '晚餐 Riverside Market', detail: 'Riverside Market, Christchurch', map: 'Riverside Market Christchurch' }
    ]
  },
  {
    day: 4,
    date: '7/25',
    title: '探險起點：Tekapo (Day 4)',
    hotel: 'Tekapo 露營小屋',
    hotelAddress: 'Lakes Edge Holiday Park',
    meals: { b: '自煮早餐', l: 'Fairlie 豬五花派', d: '煮飯' },
    deadline: '08:30 超市集合出發',
    items: [
      { time: '08:30', label: '超市會合', detail: 'PAK\'nSAVE Hornby 集合出發', map: 'PAK\'nSAVE Hornby' },
      { time: '12:30', label: 'Fairlie 派', detail: '名店：Fairlie Bakehouse 豬五花派', map: 'Fairlie Bakehouse' },
      { time: '13:45', label: '兒童放電', detail: 'Fairlie Playground（派店正對面）', map: 'Fairlie Playground' },
      { time: '15:00', label: 'Tekapo Springs', detail: '熱池、雪胎與溜冰體驗', map: 'Tekapo Springs' },
      { time: '18:00', label: '辦理入住', detail: 'Lakes Edge Holiday Park', map: 'Lakes Edge Holiday Park' },
      { time: '21:30', label: '觀星', detail: 'Mt. John 暗空保護區導覽（自由參加）', map: 'Mt. John' }
    ]
  },
  {
    day: 5,
    date: '7/26',
    title: '庫克山與冰川 (Day 5)',
    hotel: '皇后鎮住宿',
    hotelAddress: '21 Saint Samantha Lane',
    meals: { b: '自煮早餐', l: '隱士飯店', d: 'Cromwell 燒烤餐廳' },
    deadline: '09:00 Tekapo 自駕出發',
    items: [
      { time: '08:30', label: '啟程南下', detail: '沿 SH80 賞 Lake Pukaki 牛奶藍湖', map: 'Lake Pukaki' },
      { time: '10:15', label: '拍照點', detail: 'Peter\'s Lookout 庫克山全景', map: 'Peter\'s Lookout' },
      { time: '11:00', label: '步道健行', detail: 'Tasman Glacier View Track', map: 'Tasman Glacier Viewpoint' },
      { time: '12:30', label: '隱士飯店午餐', detail: 'Sir Edmund Hillary Café & Bar', map: 'Sir Edmund Hillary Café & Bar' },
      { time: '14:00', label: '高山鮭魚', detail: 'High Country Salmon', map: 'High Country Salmon' },
      { time: '18:00', label: '燒烤晚餐', detail: 'The Stoaker Room, Cromwell', map: 'The Stoaker Room Cromwell' }
    ]
  },
  {
    day: 6,
    date: '7/27',
    title: '蒂阿瑙螢火蟲',
    hotel: '皇后鎮住宿',
    hotelAddress: '21 Saint Samantha Lane',
    meals: { b: '自煮早餐', l: '餐廳', d: '漢堡+肋排外帶+自煮火鍋' },
    deadline: '07:00 自駕出發',
    items: [
      { time: '06:30', label: '蒂阿瑙螢火蟲', detail: 'RealNZ 自行開車前往', map: 'Te Anau Visitor Centre' },
      { time: '13:30', label: '蒂阿瑙午餐', detail: 'The Ranch Bar & Grill', map: 'The Ranch Bar & Grill Te Anau' },
      { time: '16:00', label: 'Skyline Luge', detail: 'Skyline Queenstown Luge', map: 'Skyline Queenstown' },
      { time: '20:30', label: '晚餐 火鍋＋羊排', detail: 'Pedro\'s House of Lamb 外帶加自煮火鍋', map: 'Pedro\'s House of Lamb Queenstown' }
    ]
  },
  {
    day: 7,
    date: '7/28',
    title: '米爾福德峽灣',
    hotel: '皇后鎮住宿',
    hotelAddress: '21 Saint Samantha Lane',
    meals: { b: '自煮早餐', l: '餐盒', d: '煮飯' },
    deadline: '06:30 巴士 AIR BNB 接上車',
    items: [
      { time: '06:30', label: 'Milford 巴士接送', detail: 'Airbnb 門口接送', map: 'Queenstown' },
      { time: '13:00', label: '峽灣巡航', detail: '欣賞瀑布與尋找海豹', map: 'Milford Sound' },
      { time: '19:30', label: '回程休息', detail: '返回皇后鎮回家煮', map: 'Queenstown' }
    ]
  },
  {
    day: 8,
    date: '7/29',
    title: 'Queenstown 自由活動',
    hotel: '皇后鎮住宿',
    hotelAddress: '21 Saint Samantha Lane',
    meals: { b: '自理', l: '自理', d: '煮飯' },
    items: [
      { time: '09:00', label: 'Glenorchy 騎馬', detail: '騎馬 Tour 與格萊諾基碼頭、天堂 Paradise', map: 'Glenorchy' },
      { time: '10:00', label: '皇后鎮自由活動', detail: '皇后鎮整天自由活動', map: 'Queenstown Mall' }
    ]
  },
  {
    day: 9,
    date: '7/30',
    title: '前往 Omaru',
    hotel: 'Omaru AIR BNB',
    hotelAddress: '24 Tay Street, Oamaru, OTA 9400, New Zealand',
    meals: { b: '自煮早餐', l: '自理', d: '自理' },
    items: [
      { time: '09:00', label: '鹿園高地', detail: '私人農場餵食鹿與羊駝', map: 'Deer Park Heights' },
      { time: '11:15', label: 'Omarama 午餐', detail: 'Four Square Omarama / The Stoaker Room', map: 'Omarama' },
      { time: '16:50', label: '藍企鵝歸巢', detail: 'Oamaru Blue Penguin Colony（不可攝影）', map: 'Oamaru Blue Penguin Colony' },
      { time: '18:45', label: '奧馬魯超市', detail: 'New World Oamaru 買晚餐食材', map: 'New World Oamaru' },
      { time: '19:45', label: 'Airbnb 入住', detail: '奧馬魯度假屋', map: '24 Tay Street, Oamaru' }
    ]
  },
  {
    day: 10,
    date: '7/31',
    title: '前往基督城',
    hotel: 'Christchurch Airport 附近住宿',
    hotelAddress: 'LyLo Christchurch Airport',
    meals: { b: '餐廳（早午餐）', l: '東東餐廳', d: '自理' },
    items: [
      { time: '09:40', label: '早午餐', detail: 'Star and Garter Restaurant, Oamaru', map: 'Star and Garter Restaurant Oamaru' },
      { time: '12:30', label: '慶功午宴', detail: 'Formosa Modern Asian Cuisine 台灣美食', map: '173 West Street, Ashburton' },
      { time: '17:00', label: '歸還租車', detail: 'Cross Country Rentals 機場還車', map: 'Cross County Rental Christchurch' },
      { time: '18:30', label: 'Lylo 入住', detail: '旅程最後一晚', map: 'Lylo Christchurch' }
    ]
  }
];
