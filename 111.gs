/**
 * 蜜桃快逃 RPG
 * 存檔後端（對齊前端 Data SDK 結構）
 */

const SHEET_NAME = "SAVE_DATA";

/**
 * 初始化 Sheet（第一次部署後手動執行一次也可）
 */
function initSheet() {
  const ss = SpreadsheetApp.getActive();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      "slot_id",
      "current_scene",
      "current_page",
      "visited_scenes",
      "unlocked_endings",
      "is_dead",
      "saved_at"
    ]);
  }
}

/**
 * 新增或更新存檔
 */
function upsertSave(data) {
  initSheet();
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.slot_id) {
      sheet.getRange(i + 1, 2, 1, 6).setValues([[
        data.current_scene,
        data.current_page,
        data.visited_scenes,
        data.unlocked_endings,
        data.is_dead,
        new Date(data.saved_at)
      ]]);
      return { isOk: true, action: "updated" };
    }
  }

  sheet.appendRow([
    data.slot_id,
    data.current_scene,
    data.current_page,
    data.visited_scenes,
    data.unlocked_endings,
    data.is_dead,
    new Date(data.saved_at)
  ]);

  return { isOk: true, action: "created" };
}

/**
 * 取得所有存檔（給 dataSdk.init 用）
 */
function getAllSaves() {
  initSheet();
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  const rows = sheet.getDataRange().getValues();

  return rows.slice(1).map(r => ({
    slot_id: r[0],
    current_scene: r[1],
    current_page: r[2],
    visited_scenes: r[3],
    unlocked_endings: r[4],
    is_dead: r[5],
    saved_at: r[6]?.getTime?.() || r[6]
  }));
}

/**
 * Web API - POST
 * dataSdk.create / update
 */
function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const result = upsertSave(body);

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Web API - GET
 * dataSdk.init 時會呼叫
 */
function doGet() {
  const data = getAllSaves();

  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
