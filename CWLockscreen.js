// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: magic;
const widget = new ListWidget()

currDate = new Date();

let cw =getWeek(currDate)
let isValid = !Number.isNaN(cw)


if (!isValid)
    cw = 0

const tempFont = new Font('SanFranciscoRounded-Bold', 30)


let progressStack = await progressCircle(widget, cw/52)
mainIcon = progressStack.addText("" + cw);
mainIcon.font = tempFont
mainIcon.centerAlignText()

  
widget.presentAccessoryCircular() // Does not present correctly

//widget.presentSmall()

Script.setWidget(widget)
Script.complete()

async function progressCircle(
  on,
  value = 50,
  colour = "hsl(0, 0%, 100%)",
  background = "hsl(0, 0%, 10%)",
  size = 60,
  barWidth = 5.5
) {
  if (value > 1) {
    value /= 100
  }
  if (value < 0) {
    value = 0
  }
  if (value > 1) {
    value = 1
  }

  async function isUsingDarkAppearance() {
    return !Color.dynamic(Color.white(), Color.black()).red
  }
  let isDark = await isUsingDarkAppearance()

  if (colour.split("-").length > 1) {
    if (isDark) {
      colour = colour.split("-")[1]
    } else {
      colour = colour.split("-")[0]
    }
  }

  if (background.split("-").length > 1) {
    if (isDark) {
      background = background.split("-")[1]
    } else {
      background = background.split("-")[0]
    }
  }

  let w = new WebView()
  await w.loadHTML('<canvas id="c"></canvas>')

  let base64 = await w.evaluateJavaScript(
    `
  let colour = "${colour}",
    background = "${background}",
    size = ${size}*3,
    lineWidth = ${barWidth}*3,
    percent = ${value * 100}
      
  let canvas = document.getElementById('c'),
    c = canvas.getContext('2d')
  canvas.width = size
  canvas.height = size
  let posX = canvas.width / 2,
    posY = canvas.height / 2,
    onePercent = 360 / 100,
    result = onePercent * percent
  c.lineCap = 'round'
  c.beginPath()
  c.arc( posX, posY, (size-lineWidth-1)/2, (Math.PI/180) * 270, (Math.PI/180) * (270 + 360) )
  c.strokeStyle = background
  c.lineWidth = lineWidth 
  c.stroke()
  c.beginPath()
  c.strokeStyle = colour
  c.lineWidth = lineWidth
  c.arc( posX, posY, (size-lineWidth-1)/2, (Math.PI/180) * 270, (Math.PI/180) * (270 + result) )
  c.stroke()
  completion(canvas.toDataURL().replace("data:image/png;base64,",""))`,
    true
  )
  const image = Image.fromData(Data.fromBase64String(base64))
  
  let stack = on.addStack()
  stack.size = new Size(size, size)
  stack.backgroundImage = image
  stack.centerAlignContent()
  let padding = barWidth * 2
  stack.setPadding(padding, padding, padding, padding)

  return stack
}



async function loadValues() {
  
  let url = "https://api.kvstore.io/collections/TODO-COLLECTION/items/TODO-ITEMKEY"
  
  let req = new Request(url)
  req.headers = { "kvstoreio_api_key": "TODO-APIKEY" }
  
  let jsonString = await req.loadString()
  
  // kvstore json
  let json = JSON.parse(jsonString)
  
  jsonString = json.value
  
  // abgelegtes json als value
  let innerJson = JSON.parse(jsonString);
  
  console.log(innerJson)
  
  return innerJson
}



/**
 * Checks if the current year is a leap year
 * or not and returns it as a boolean.
 * @param {number} year the year to check
 * @returns true if it's a leap year, false if not
 */
function isLeapYear(year) {
    if(year % 400 == 0) {
        return true;
    }

    if(year % 100 == 0) {
        return false;
    }

    if(year % 4 == 0) {
        return true;
    }

    return false;
}


/**
 * Calculates the current day of the year.
 * Code from Renat Galyamov, https://renatello.com/javascript-day-of-year/
 * @param {Date} date the current date
 * @returns day of year
 */
function getDayOfYear(date) {
    return Math.floor(date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24;
}


/**
 * Calculates the current week of the year using the algorithm 
 * from Wikipedia. (https://en.wikipedia.org/wiki/ISO_week_date#Calculating_the_week_number_from_an_ordinal_date)
 * @param {Date} date the current date
 * @returns the current calendar week, starting Monday
 */
function getWeek(date) {
    let leapYear = isLeapYear(date.getFullYear());
    let dayOfYear = getDayOfYear(date);

    let day = date.getDay() - 1; // getDay() starts with Sunday at 0, we want Sunday to be 7 and Monday to be 1

    if (day == -1) {
        day = 7;
    }

    let week = Math.floor(((dayOfYear - day) + 10) / 7);

    if(week == 0) {
        if(leapYear){
            week = 53;
        } else {
            week = 52;
        }
        return week;
    }

    if(week == 53) {
        if(!leapYear) {
           week = 1;
        }
        return week;
    }

    return week;
}