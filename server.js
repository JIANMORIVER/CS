const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const ADMIN_PASSWORD = 'admin123'; // 简单的硬编码密码

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// 提交问卷 API
app.post('/api/submit', (req, res) => {
    try {
        const { userInfo, colorData, duration } = req.body;
        if (!userInfo || !colorData) {
            return res.status(400).json({ error: 'Missing data' });
        }
        db.saveResponse(userInfo, colorData, duration);
        res.json({ success: true });
    } catch (error) {
        console.error('Submit error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 中间件：简单密码验证
const checkAuth = (req, res, next) => {
    const password = req.headers['authorization'] || req.query.password;
    if (password === ADMIN_PASSWORD) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// 获取所有数据 API
app.get('/api/responses', checkAuth, (req, res) => {
    try {
        const data = db.getAllResponses();
        res.json(data);
    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 删除数据 API
app.delete('/api/responses/:id', checkAuth, (req, res) => {
    try {
        const success = db.deleteResponse(req.params.id);
        if (success) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Not found' });
        }
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 导出 CSV API
app.get('/api/export', checkAuth, (req, res) => {
    try {
        const data = db.getAllResponses();

        // 生成 CSV 内容
        const header = ['ID', 'Time', 'Duration(s)', 'Name', 'Age', 'Gender', 'Contact'];
        // 假设 color_data 是个数组或对象，我们需要动态生成表头
        // 为简化，我们假设顺序固定或者我们提取所有键

        // 预处理以获取所有可能的情绪词作为表头
        let emotionKeys = new Set();
        data.forEach(row => {
            if (row.color_data && typeof row.color_data === 'object') {
                Object.keys(row.color_data).forEach(k => emotionKeys.add(k));
            }
        });
        const sortedEmotions = Array.from(emotionKeys); // 保持一定顺序

        // 扩展表头：每个情绪词对应 H, S, L, Hex
        sortedEmotions.forEach(emotion => {
            header.push(`${emotion}_H`, `${emotion}_S`, `${emotion}_L`, `${emotion}_Hex`);
        });

        const csvRows = [header.join(',')];

        data.forEach(row => {
            const userInfo = row.user_info || {};
            const colorData = row.color_data || {};

            const csvRow = [
                row.id,
                new Date(row.created_at).toLocaleString(),
                row.duration || 0,
                userInfo.name || '',
                userInfo.age || '',
                userInfo.gender || '',
                userInfo.contact || ''
            ];

            sortedEmotions.forEach(emotion => {
                const c = colorData[emotion] || { h: 0, s: 0, l: 0, hex: '' };
                csvRow.push(c.h, c.s, c.l, c.hex || '');
            });

            csvRows.push(csvRow.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));
        });

        const csvContent = '\uFEFF' + csvRows.join('\n'); // 添加 BOM 以支持 Excel 打开 UTF-8

        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', 'attachment; filename="survey_data.csv"');
        res.send(csvContent);

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).send('Internal server error');
    }
});

// 如果没有匹配到 API，且请求的不是静态文件，可以返回 index.html (SPA 支持，虽然这里用不到)
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
