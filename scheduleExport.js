const TABLE = "{{TABLE}}";
const SHEET_LABEL = "{{SHEET_LABEL}}"
const TIME_COLUMNS = "{{TIME_COLUMNS}}"
const TIME = "{{TIME}}"
const NAME = "{{NAME}}"
const FONT = "{{FONT}}"

exports.exportSchedule = (data) => {
  let generatedHTML = [];

  let baseTable = "<html><body>{{TABLE}}</body><style>body{margin: 0} table{border:1px solid black;border-spacing:0;border-collapse:collapse;width:100%} .label{font-size: 18px} th{border:1px solid black}td{border-bottom:1px solid black}.name{border:1px solid black; font-size: 18px; padding-right: 5px}.left{border-right:1px solid black}.hbuffer{border:1px solid black;min-width:2px}.shaded{background-color:grey}.vbuffer .name,.vbuffer .hbuffer{height: 5px; border:1px solid black}</style></html>"

  data.sheets.forEach((ps, i) => {
      generatedHTML.push(exportSheet(ps,data.sheetIds[i],data.timeIncrement));
  });

  baseTable = baseTable.replace(TABLE, generatedHTML.join("<div style='page-break-before: always;'></div>"));

  return baseTable;
};

const exportSheet = (sheet, id, timeIncrement) => {

  let baseTable = "<table>{{TABLE}}</table>"

  let headerRow = "<tr><th class='label'>{{SHEET_LABEL}}</th><th class='hbuffer'></th>{{TIME_COLUMNS}}</tr>";
  let baseTimeColumn = "<th colspan=2>{{TIME}}</th>";
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
  
  let shiftRows = sheet.shifts.map((shift) => {
      let s = "<tr><td class='name'>{{NAME}}</td><td class='hbuffer'>{{TIME}}</td>".replace(NAME, shift.empId).replace(TIME, `${timeToString(shift.startTime,false,false)} -${timeToString(shift.endTime,false,false)}`);
      tc.forEach((t) => {
          s += `<td class='left ${shouldShade(t,shift,true) ? "shaded" : ""}'></td><td class='${shouldShade(t,shift,false) ? "shaded" : ""}'></td>`
      })
      s += "</tr>";
      return s;
  });

  
  let shifts = shiftRows.join("<tr class='vbuffer'><td class='name'></td><td class='hbuffer'></td>" + tc.map(() => "<td class='left'></td><td class=''></td>").join("") + "</tr>");
  
  baseTable = baseTable.replace(TABLE, headerRow+shifts);
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
  return `${time.hours == 12 || time.hours == 0 ? "12" : formatHour(time.hours%12)}:${time.minutes < 10 ? "0" + time.minutes : time.minutes}${space ? " " : ""}${epoch ? time.hours>=12 ? "PM" : "AM" : ""}`;
}

const formatHour = (h) => {
  return h < 10 ? " "+h : h;
}