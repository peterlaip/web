// data_server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3001; // 這個端口號可以根據需要更改

app.get('/alcohol-history', (req, res) => {
    fs.readFile('/home/user/path/to/alcohol_history.json', 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading alcohol history file');
            return;
        }
        res.json(JSON.parse(data));
    });
});

app.listen(PORT, () => {
    console.log(`Data server is running on http://localhost:${PORT}`);
});

