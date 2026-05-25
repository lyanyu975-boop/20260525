let myMap;
let canvas;
let mappa;
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

  // 初始化 Mappa
  mappa = new Mappa('Leaflet');
  
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
    let rainVal = float(station.now || 0);

    // 根據雨量計算圓點直徑：0mm 為 10px，50mm 以上為 60px
    let dotSize = map(rainVal, 0, 50, 10, 60, true);

    // 根據雨量計算顏色：沒雨用藍色，雨越大越紅
    if (rainVal > 0) {
      let r = map(rainVal, 0, 50, 150, 255, true);
      fill(r, 50, 50, 180);
    } else {
      fill(0, 100, 255, 150);
    }
    
    stroke(255);
    strokeWeight(1);
    ellipse(pos.x, pos.y, dotSize, dotSize);

    // 判斷滑鼠是否在該圓點範圍內 (半徑 + 緩衝)
    let d = dist(mouseX, mouseY, pos.x, pos.y);
    if (d < dotSize / 2 + 2) {
      hoveredStation = station;
    }
  }

  // 繪製地圖圖例
  drawLegend();

  // 如果有滑鼠懸停的測站，顯示詳細資訊
  if (hoveredStation) {
    drawTooltip(hoveredStation);
  }
}

function drawLegend() {
  let x = width - 180;
  let y = 20;
  
  push();
  // 圖例背景容器
  fill(255, 220);
  stroke(0, 50);
  rect(x, y, 160, 160, 10);
  
  // 圖例標題
  noStroke();
  fill(0);
  textSize(14);
  textStyle(BOLD);
  textAlign(LEFT, TOP);
  text("即時雨量級距", x + 15, y + 15);
  
  textStyle(NORMAL);
  textSize(12);
  
  // 定義要顯示的參考級距
  let levels = [0, 20, 50];
  let labels = ["0 mm", "20 mm", "50+ mm"];
  
  for (let i = 0; i < levels.length; i++) {
    let val = levels[i];
    let dSize = map(val, 0, 50, 10, 60, true);
    let itemY = y + 55 + i * 40;
    
    // 顏色邏輯與 draw() 內一致
    if (val > 0) {
      let r = map(val, 0, 50, 150, 255, true);
      fill(r, 50, 50, 180);
    } else {
      fill(0, 100, 255, 150);
    }
    
    ellipse(x + 40, itemY, dSize, dSize);
    fill(0);
    textAlign(LEFT, CENTER);
    text(labels[i], x + 85, itemY);
  }
  pop();
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