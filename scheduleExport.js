const TABLE = "{{TABLE}}";
const SHEET_LABEL = "{{SHEET_LABEL}}"
const TIME_COLUMNS = "{{TIME_COLUMNS}}"
const TIME = "{{TIME}}"
const NAME = "{{NAME}}"
const FONT = "{{FONT}}"

exports.exportSchedule = (data) => {
    let generatedHTML = [];

    let baseTable = "<html><body>{{TABLE}}</body><style>body{margin: 0} table{table-layout: auto; border-spacing: 0; display: block; border: 1px solid black;} table * {font-size: 13px;border-inline-width: 0;} thead * {border-bottom: 1px solid black;} td {display: table-cell; background-color: transparent} tr {display: table-row} td .name{font-size: 14px} .name p {margin-right: 10px} .hbuffer {border-right: 1px solid black;} .time{text-align: center; background-color: white} .label {background-color: white} .label p {font-weight: bold; font-size: 16px; border: none} .label {border-right: 1px solid black;} .left {border-right: 1px solid black;} .hbuffer{min-width:70px}.shaded{background-color: #999} .vbuffer td {height: 3px;} .offRow {background-color: #eee} .onRow {background-color: white}</style></html>"

    data.sheets.forEach((ps, i) => {
      generatedHTML.push(exportSheet(ps,data.sheetIds[i],data.timeIncrement));
    });

    baseTable = baseTable.replace(TABLE, generatedHTML.join("<div style='page-break-before: always;'></div>"));

    return baseTable;
};

const exportSheet = (sheet, id, timeIncrement) => {

    let baseTable = "<table>{{TABLE}}</table>"

    let headerRow = "<thead><tr><td colspan=2 class='label'><p>{{SHEET_LABEL}}</p></td>{{TIME_COLUMNS}}</tr><thead>";
    let baseTimeColumn = "<td class='time' colspan=2>{{TIME}}</td>";
    let timeHeaders = "";

    let tc = generateTimeColumns(sheet, timeIncrement);
    tc.forEach((column) => {
        timeHeaders += baseTimeColumn.replace(TIME, timeToString(column));
    });
    headerRow = headerRow.replace(SHEET_LABEL, id.display);
    headerRow = headerRow.replace(TIME_COLUMNS, timeHeaders);

    sheet.shifts = sheet.shifts.sort((a, b) => {
        let r = convertTimeToNum(a.startTime) - convertTimeToNum(b.startTime);
        if(r == 0) {
          return convertTimeToNum(a.endTime) - convertTimeToNum(b.endTime);
        }
        return r;
      });
    
    let shiftRows = sheet.shifts.map((shift,ind) => {
        let s = `<tr class='row ${ind%2==1 ? "offRow" : "onRow"}'><td class='name'><p>{{NAME}}</p></td><td class='hbuffer'>{{TIME}}</td>`.replace(NAME, shift.empId).replace(TIME, `${timeToString(shift.startTime,false,false)}-${timeToString(shift.endTime,false,false)}`);
        tc.forEach((t,i) => {
            s += `<td class='${i!=0 ? "left" : ""} ${shouldShade(t,shift,true) ? "shaded" : ind%2==1 ? "offRow" : "onRow"}'></td><td class='${shouldShade(t,shift,false) ? "shaded" : ind%2==1 ? "offRow" : "onRow"}'></td>`
        })
        s += "</tr>";
        return s;
    });

    
    let shifts = [];
    shiftRows.forEach((r,i) => {
      shifts.push(`<tr class='vbuffer ${i%2==1 ? "offRow" : "onRow"}'><td class='name'></td><td class='hbuffer'></td>` + tc.map((v,ind) => `<td class='${ind==0 ? "" : "left"} ${i%2==1 ? "offRow" : "onRow"}'></td><td class='${i%2==1 ? "offRow" : "onRow"}'></td>`).join("") + "</tr>");
      shifts.push(r);
      shifts.push(`<tr class='vbuffer ${i%2==1 ? "offRow" : "onRow"}'><td class='name'></td><td class='hbuffer'></td>` + tc.map((v,ind) => `<td class='${ind==0 ? "" : "left"} ${i%2==1 ? "offRow" : "onRow"}'></td><td class='${i%2==1 ? "offRow" : "onRow"}'></td>`).join("") + "</tr>");
    });
    
    baseTable = baseTable.replace(TABLE, headerRow+`<tbody>${shifts.join("")}</tbody>`);
    return baseTable;
}

const convertTimeToNum = (t) => {
    return t.hours*100 + t.minutes;
}

const shouldShade = (time, shift, left) => {
    let convertedTime = convertTimeToNum(time);
    let convertedStart = convertTimeToNum(shift.startTime);
    let convertedEnd = convertTimeToNum(shift.endTime);
    return isInShift(convertedTime, convertedStart, convertedEnd)
    && (!left || (left && convertedTime != convertedStart))
    && (left || (!left && convertedTime != convertedEnd));
}

const isInShift = (time, start, end) => {
    return time >= start && time <= end;
}
  
const generateTimeColumns = (sheet, timeIncrement) => {
    let s = sheet.openTime.hours + sheet.openTime.minutes/60;
    let e = sheet.closeTime.hours + sheet.closeTime.minutes/60;
    let numColumns = Math.floor(e-s+1)*(60/timeIncrement);
    let times = [];
    let h = sheet.openTime.hours;
    let m = sheet.openTime.minutes;
    times.push(sheet.openTime);
    for(let i = 0; i < numColumns-1; i++) {
      m+= timeIncrement;
      if(m % 60 == 0) {
        m = 0;
        h++;
      }
      let t = {
        hours: h,
        minutes: m
      }
      times.push(t);
    }
    return times;
  }

const timeToString = (time, space = true, epoch=true) => {
    return `${time.hours == 12 || time.hours == 0 ? "12" : time.hours%12}:${time.minutes < 10 ? "0" + time.minutes : time.minutes}${space ? " " : ""}${epoch ? time.hours>=12 ? "PM" : "AM" : ""}`;
}