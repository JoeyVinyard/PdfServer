const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const htmlpdf = require('html-pdf');
const fs = require('fs');
const path = require('path');
const os = require('os');
const se = require("./scheduleExport");

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cors());

app.post('/pdf', function (req, res) {
    const schedule = req.body.data;
    const htmlData = se.exportSchedule(schedule);
    const tmpDirPath = fs.mkdtempSync(os.tmpdir()+path.sep);
    const tempPdfPath = path.join(tmpDirPath,"output.pdf"); 
    
    htmlpdf.create(htmlData, {
        "format": "Letter",
        "orientation": "landscape",
        "border": "0.25in",
        "zoomFactor": 0.5
    }).toFile(tempPdfPath, (err, resp) => {
        let f = fs.readFileSync(tempPdfPath);
        res.send(f);
    });
});

app.get('/', function (req, res) {
    res.status(200).send("PDF Server Up");
});

app.listen(process.env.PORT || 3000)