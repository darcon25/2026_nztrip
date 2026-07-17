export const familyBudgets = [
  { id: 'fenix', name: 'Fenix 家', car: 635.3, hotel: 817.1, total: 1452.4 },
  { id: 'jerry', name: 'JERRY 家', car: 635.3, hotel: 935.5, total: 1570.8 },
  { id: 'ziv', name: 'ziv 家', car: 635.3, hotel: 935.5, total: 1570.8 },
  { id: 'cathy', name: 'CATHY 家', car: 635.3, hotel: 1494.6, total: 2129.9 },
  { id: 'richard', name: 'Richard 家', car: 564.7, hotel: 994.7, total: 1559.4 },
  { id: 'max', name: 'MAX 家', car: 494.1, hotel: 818.0, total: 1312.1 }
];

export const days = [
  {
    day: 1,
    date: '7/22',
    title: '基督城抵達集結',
    hotel: 'Christchurch Central Hotel',
    meals: { b: '飛機餐', l: '市區自理', d: '住宿點自己煮' },
    items: [
      { time: '14:00', label: '首波取車', detail: '領取 Toyota Hiace 主要車隊', map: 'Christchurch Airport' },
      { time: '18:00', label: '首波採買', detail: '超市：Pak\'nSave Moorhouse<br>297 Moorhouse Ave', map: 'Pak\'nSave Moorhouse' }
    ]
  },
  {
    day: 4,
    date: '7/25',
    title: '探險起點：Tekapo',
    hotel: 'Lake Tekapo Village Accommodation',
    meals: { b: '飯店自理', l: 'Fairlie 豬五花派', d: '住宿點自己煮' },
    deadline: '08:00 R&M 提領露營車任務',
    items: [
      { time: '08:00', label: 'R&M 取車', detail: 'Richard 與 MAX 機場提領露營車', map: 'Christchurch Airport Rental Car' },
      { time: '10:00', label: '超市會合', detail: '超市：Pak\'nSave Riccarton<br>Riccarton Rd, Christchurch', map: 'Pak\'nSave Riccarton' },
      { time: '13:15', label: 'Fairlie 派', detail: '名店：Fairlie Bakehouse 豬五花派', map: 'Fairlie Bakehouse' },
      { time: '13:45', label: '🪁 兒童放電', detail: '公園：Fairlie Playground (正對面)', map: 'Fairlie Playground' },
      { time: '15:30', label: '♨️ Tekapo Springs', detail: '項目：享受熱池、冬季雪胎體驗', map: 'Tekapo Springs' }
    ]
  },
  {
    day: 5,
    date: '7/26',
    title: '庫克山與冰川',
    hotel: 'Alpine Resort Wanaka',
    meals: { b: '自煮早餐', l: '景觀午餐', d: '住宿點自己煮' },
    deadline: '09:30 Tekapo 準時發車',
    items: [
      { time: '10:15', label: '📸 拍照點', detail: 'Peter\'s Lookout 捕捉庫克山全景', map: 'Peter\'s Lookout' },
      { time: '11:00', label: '步道輕健行', detail: 'Tasman Glacier View Track (看冰湖)', map: 'Tasman Glacier Viewpoint' },
      { time: '12:30', label: '庫克山午餐', detail: '名店：The Old Mountaineers\' Cafe', map: 'The Old Mountaineers\' Cafe' },
      { time: '14:00', label: '高山鮭魚', detail: 'High Country Salmon (採買鮮鮭魚)', map: 'High Country Salmon' }
    ]
  },
  {
    day: 6,
    date: '7/27',
    title: '漢堡與 Skyline',
    hotel: 'Oaks Shores Resort',
    meals: { b: 'DIY 早餐', l: '漢堡午餐', d: '19人 BBQ (自己煮)' },
    items: [
      { time: '11:30', label: '🍷 酒莊休憩', detail: '中途停靠 Gibbston Valley 酒莊區域', map: 'Gibbston Valley Winery' },
      { time: '13:30', label: '🍔 必吃漢堡', detail: '名店：Fergburger Queenstown', map: 'Fergburger' },
      { time: '15:30', label: 'Skyline 皇后鎮', detail: '滑板車 Luge 體驗與鳥瞰湖景', map: 'Skyline Queenstown' },
      { time: '17:00', label: '超市補給', detail: 'Countdown Queenstown 採購食材', map: 'Countdown Queenstown Grant Road' }
    ]
  },
  {
    day: 9,
    date: '7/30',
    title: '老街、伴手禮與企鵝',
    hotel: 'Oamaru Airbnb',
    meals: { b: '自煮早餐', l: '公路咖啡廳', d: '自己煮 (超市熟食)' },
    deadline: '17:00 必須抵達企鵝保護區',
    items: [
      { time: '15:15', label: '維多利亞區', detail: '老街伴手禮最後掃貨', map: 'Oamaru Victorian Precinct' },
      { time: '16:50', label: '藍企鵝歸巢', detail: '地點：Oamaru Blue Penguin Colony', map: 'Oamaru Blue Penguin Colony' },
      { time: '18:45', label: '奧馬魯超市', detail: 'New World Oamaru 買晚餐食材', map: 'New World Oamaru' }
    ]
  },
  {
    day: 10,
    date: '7/31',
    title: '慶功還車',
    hotel: 'Lylo Christchurch',
    meals: { b: 'Airbnb 自煮', l: '慶功午宴', d: '基督城市區自理' },
    items: [
      { time: '12:30', label: '慶功午宴', detail: '名店：東東家 (Tongs Restaurant)', map: 'Tongs Chinese Restaurant Christchurch' },
      { time: '17:00', label: '還車任務', detail: '所有車輛統一歸還租賃中心', map: 'Cross County Rental Christchurch' }
    ]
  }
];
