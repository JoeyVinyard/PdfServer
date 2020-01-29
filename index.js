const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const se = require("./scheduleExport");
const phantom = require('phantom');
const fs = require('fs');
const os = require('os');
const path = require('path');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cors());

app.post('/pdf', function (req, res) {
    const schedule = req.body.data;
    const htmlData = se.exportSchedule(schedule);
    
    phantom.create().then((instance) => {
        return instance;
    }).then((instance) => {
        return instance.createPage();
    }).then((page) => {
        return page.setContent(htmlData, "").then(() => {
            return page.property("paperSize", {
                format: "Letter",
                orientation: "Landscape",
                margin: "0.4in"
            }).then(() => {
                return page.setting("dpi", "96").then(() => page);
            });
        });
    }).then((page) => {
        return page.render(tempPdfPath)
    }).then(() => {
        res.send(fs.readFileSync(tempPdfPath));
    }).catch((err) => {
        console.error(err);
        res.status(400).send("Error generating");
    });
});

app.get('/', function (req, res) {
    res.status(200).send("PDF Server Up");
});

app.listen(process.env.PORT || 3000)