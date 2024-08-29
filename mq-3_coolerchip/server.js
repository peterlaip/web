const express = require('express');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process'); // 用於執行控制命令
const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));

// 讀取文件內容的輔助函數
const readFile = (filePath) => {
    try {
        return fs.readFileSync(filePath, 'utf8').trim();
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return 'N/A';
    }
};

// 讀取 JSON 文件內容的輔助函數
const readJsonFile = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(data);
        const labels = jsonData.records.map(record => record.date);
        const dataPoints = jsonData.records.map(record => record.concentration);
        return {
            labels: labels,
            data: dataPoints
        };
    } catch (error) {
        console.error(`Error reading JSON file ${filePath}:`, error);
        return { labels: [], data: [] };
    }
};

// 控制風扇和致冷晶片的函數
const autoControl = () => {
    const currentTemperature = parseFloat(readFile('/home/user/path/to/current_temperature.txt'));
    const userTemperature = parseFloat(readFile('/home/user/path/to/user_temperature.txt'));
    const fanStatusFile = '/home/user/path/to/fan_status.txt';
    const coolerChipStatusFile = '/home/user/path/to/coolerchip_status.txt';

    const fanStatus = JSON.parse(readFile(fanStatusFile));
    const coolerChipStatus = JSON.parse(readFile(coolerChipStatusFile));

    let newFanStatus = fanStatus.status;
    let newCoolerChipStatus = coolerChipStatus.status;

    if (currentTemperature > userTemperature) {
        newFanStatus = 'on';
        newCoolerChipStatus = 'on';
    } else {
        newCoolerChipStatus = 'off';
    }

    if (fanStatus.status !== newFanStatus) {
        fs.writeFileSync(fanStatusFile, JSON.stringify({ status: newFanStatus }), 'utf8');
        try {
            execSync(`/home/user/0818-1/fan_control 1 ${newFanStatus === 'on' ? 1 : 0}`);
            execSync(`/home/user/0818-1/fan_control 2 ${newFanStatus === 'on' ? 1 : 0}`);
        } catch (error) {
            console.error(`Error executing fan control command:`, error);
        }
    }

    if (coolerChipStatus.status !== newCoolerChipStatus) {
        fs.writeFileSync(coolerChipStatusFile, JSON.stringify({ status: newCoolerChipStatus }), 'utf8');
        try {
            execSync(`/home/user/0818-1/coolerchip_control ${newCoolerChipStatus === 'on' ? 1 : 0}`);
        } catch (error) {
            console.error(`Error executing cooler chip control command:`, error);
        }
    }
};

// 顯示主頁面
app.get('/', (req, res) => {
    autoControl(); // 自動控制

    const currentAlcoholConcentration = readFile('/home/user/path/to/alcohol_concentration.txt');
    const alcoholHistory = readJsonFile('/home/user/path/to/alcohol_history.json');
    const currentTemperature = readFile('/home/user/path/to/current_temperature.txt');
    const userTemperature = readFile('/home/user/path/to/user_temperature.txt');
    const fanStatus = readFile('/home/user/path/to/fan_status.txt');
    const coolerChipStatus = readFile('/home/user/path/to/coolerchip_status.txt');

    res.render('index', {
        currentAlcoholConcentration: parseFloat(currentAlcoholConcentration) || 0,
        alcoholHistory: alcoholHistory,
        currentTemperature: parseFloat(currentTemperature) || 0,
        userTemperature: parseFloat(userTemperature) || 0,
        fanStatus: JSON.parse(fanStatus),
        coolerChipStatus: JSON.parse(coolerChipStatus)
    });
});

// 處理風扇開關請求
app.post('/toggle_fans', (req, res) => {
    const action = req.body.action;
    fs.writeFileSync('/home/user/path/to/fan_status.txt', JSON.stringify({ status: action }), 'utf8');
    try {
        execSync(`/home/user/0818-1/fan_control 1 ${action === 'on' ? 1 : 0}`);
        execSync(`/home/user/0818-1/fan_control 2 ${action === 'on' ? 1 : 0}`);
    } catch (error) {
        console.error(`Error executing fan control command:`, error);
    }
    res.redirect('/');
});

// 處理致冷晶片開關請求
app.post('/toggle_cooler_chip', (req, res) => {
    const action = req.body.action;
    fs.writeFileSync('/home/user/path/to/coolerchip_status.txt', JSON.stringify({ status: action }), 'utf8');
    try {
        execSync(`/home/user/0818-1/coolerchip_control ${action === 'on' ? 1 : 0}`);
    } catch (error) {
        console.error(`Error executing cooler chip control command:`, error);
    }
    res.redirect('/');
});

// 處理更新溫度請求
app.post('/update_temperature', (req, res) => {
    const userTemperature = req.body.newTemperature;

    // 更新 user_temperature.txt 文件
    fs.writeFileSync('/home/user/path/to/user_temperature.txt', userTemperature, 'utf8');

    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
