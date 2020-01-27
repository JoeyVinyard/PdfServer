const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const se = require("./scheduleExport");
// const convertHTMLToPDF = require("pdf-puppeteer");
const htmlpdf = require('html-pdf');
const fs = require('fs');
const os = require('os');
const path = require('path');

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
        "border": "0.25in"
    }).toFile(tempPdfPath, (err, resp) => {
        let f = fs.readFileSync(tempPdfPath);
        res.send(f);
    });

    // convertHTMLToPDF(htmlData, (pdf) => {
    //     res.send(pdf);
    // }, {
    //     width: "10.5in",
    //     height: "8in",
    //     margin: {
    //         top: "0.2in",
    //         right: "0.2in",
    //         bottom: "0.2in",
    //         left: "0.2in"
    //     }
    // }).catch((err) => {
    //     console.error(err);
    // });
});

app.get('/', function (req, res) {
    res.status(200).send("PDF Server Up");
});

app.listen(process.env.PORT || 3000)