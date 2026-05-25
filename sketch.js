let myMap;
let canvas;
const mappa = new Mappa('Leaflet');
let rainData = [];

// API 與 Proxy 設定
const apiUrl = 'https://wic.gov.taipei/OpenData/API/Rain/Get?stationNo=&loginId=open_rain&dataKey=85452C1D';
const proxyUrl = 'https://api.allorigins.win/raw?url=';

// 地圖初始設定
const options = {
  lat: 25.0478, // 台北市中心緯度
  lng: 121.5319, // 台北市中心經度
  zoom: 12,
  style: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
};

function setup() {
  // 建立全螢幕畫布
  canvas = createCanvas(windowWidth, windowHeight);
  
  // 初始化地圖並將其疊加在 p5 畫布上
  myMap = mappa.tileMap(options);
  myMap.overlay(canvas);

  // 首次抓取資料
  fetchRainData();

  // 每 10 分鐘 (10 * 60 * 1000 ms) 更新一次資料
  setInterval(fetchRainData, 600000);
}

function fetchRainData() {
  console.log("正在更新雨量資料...");
  // 使用 Proxy 處理 CORS 問題
  const requestUrl = proxyUrl + encodeURIComponent(apiUrl);
  
  loadJSON(requestUrl, (data) => {
    // 假設 API 回傳的是陣列，若包含在特定欄位下請依實際結構調整 (例如 data.records)
    rainData = data;
    console.log("資料更新成功，總計測站數：" + rainData.length);
  }, (err) => {
    console.error("資料抓取失敗：", err);
  });
}

function draw() {
  // 清除背景（透明），以便看見下方的地圖
  clear();

  let hoveredStation = null;

  // 遍歷所有雨量資料
  for (let i = 0; i < rainData.length; i++) {
    let station = rainData[i];
    
    // 取得測站經緯度座標
    let lat = float(station.lat);
    let lon = float(station.lon);
    
    // 將經緯度轉換為畫布上的像素位置
    let pos = myMap.latLngToPixel(lat, lon);

    // 繪製測站圓點
    // 根據雨量大小改變顏色深淺 (以 station.now 為例)
    let rainVal = float(station.now || 0);
    fill(0, 100, 255, 180);
    if (rainVal > 0) fill(255, 50, 50, 200); // 有雨時顯示紅色
    
    stroke(255);
    strokeWeight(1);
    ellipse(pos.x, pos.y, 12, 12);

    // 判斷滑鼠是否在測站圓點上
    let d = dist(mouseX, mouseY, pos.x, pos.y);
    if (d < 10) {
      hoveredStation = station;
    }
  }

  // 如果有滑鼠懸停的測站，顯示詳細資訊
  if (hoveredStation) {
    drawTooltip(hoveredStation);
  }
}

function drawTooltip(s) {
  let x = mouseX + 15;
  let y = mouseY - 15;
  
  fill(255, 245); // 半透明白底
  stroke(0, 150);
  rect(x, y, 180, 80, 8);
  
  noStroke();
  fill(0);
  textSize(14);
  textStyle(BOLD);
  text("站名: " + s.stationName, x + 10, y + 25);
  textStyle(NORMAL);
  text("即時雨量: " + (s.now || 0) + " mm", x + 10, y + 45);
  text("更新時間: " + (s.time || "無"), x + 10, y + 65);
}

function windowResized() {
  // 當瀏覽器視窗大小改變時，重新調整畫布
  resizeCanvas(windowWidth, windowHeight);
}