const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data.json');

// 初始化数据文件
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
}

function saveResponse(userInfo, colorData, duration) {
  const data = getAllResponses();
  // Find max ID to avoid duplicates after deletion
  const maxId = data.reduce((max, item) => Math.max(max, item.id || 0), 0);

  const newEntry = {
    id: maxId + 1,
    user_info: userInfo,
    color_data: colorData,
    duration: duration || 0, // 记录耗时 (秒)
    created_at: new Date().toISOString()
  };
  data.push(newEntry);
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  return { lastInsertRowid: newEntry.id };
}

function deleteResponse(id) {
  let data = getAllResponses();
  const initialLength = data.length;
  data = data.filter(item => item.id !== parseInt(id));

  if (data.length !== initialLength) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    return true;
  }
  return false;
}

function getAllResponses() {
  try {
    const fileData = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(fileData);
  } catch (error) {
    console.error('Error reading database file:', error);
    return [];
  }
}

module.exports = {
  saveResponse,
  deleteResponse,
  getAllResponses
};

