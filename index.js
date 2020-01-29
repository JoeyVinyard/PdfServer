const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const se = require("./scheduleExport");
const puppeteer = require('puppeteer');
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
    
    puppeteer.launch({ args: ['--no-sandbox'] }).then((browser) => {
        browser.newPage().then((page) => {
            page.setContent(htmlData).then(() => {
                page.pdf({
                    format: "Letter",
                    landscape: true,
                    margin: {
                        top: "0.4in",
                        right: "0.4in",
                        bottom: "0.4in",
                        left: "0.4in"
                    },
                    printBackground: true
                }).then((b) => {
                    browser.close().then(() => {
                        res.send(b);
                    }).catch((err) => {
                        throw err;
                    })
                }).catch((err) => {
                    throw err;
                });
            });
        });
    }).catch((err) => {
        console.error(err);
    })
});

app.get('/', function (req, res) {
    res.status(200).send("PDF Server Up");
});

app.listen(process.env.PORT || 3000)