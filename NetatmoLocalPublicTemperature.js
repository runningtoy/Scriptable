// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-gray; icon-glyph: magic;


const DECIMAL_PLACES = 1;
// parameters -- modify this & keep it private
const CLIENT_ID = 'XXXXXXXXXXXXXXXXXXXXXXX'
const CLIENT_SECRET = 'XXXXXXXXXXXXXXXXXXXXXXX'
if (CLIENT_ID == "" || CLIENT_SECRET == "")
    throw new Error("Missing configuration parameters")
const key_id = CLIENT_ID + "-refresh_token"
const CODE = ""
let refresh_token = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
let access_token = ""

let MAX_DISTANCE = await args.widgetParameter;
if (MAX_DISTANCE != null) {
    MAX_DISTANCE = parseInt(MAX_DISTANCE.toLowerCase(), 10);
} else {
    MAX_DISTANCE = 3;
}

async function param(name) {
    try {
        return new RegExp(`${name}:([^\n\r\t ]+)`, "g").exec(params)[1]
    } catch (ex) {
        throw new Error(`Param "${name}" not found`)
    }
}

function deg2rad(degrees) {
    return degrees * (Math.PI / 180)
}

function rad2deg(radians) {
    return radians * (180 / Math.PI)
}

function getDueCoords(latitude, longitude, bearing, distance) {
    let radius = 6378.1;
    let new_latitude = rad2deg(Math.asin(Math.sin(deg2rad(latitude)) * Math.cos(distance / radius) + Math.cos(deg2rad(latitude)) * Math.sin(distance / radius) * Math.cos(deg2rad(bearing))))
    let new_longitude = rad2deg(deg2rad(longitude) + Math.atan2(Math.sin(deg2rad(bearing)) * Math.sin(distance / radius) * Math.cos(deg2rad(latitude)), Math.cos(distance / radius) - Math.sin(deg2rad(latitude)) * Math.sin(deg2rad(new_latitude))))
    return [new_latitude, new_longitude]
}

function circle_distance(lat1, lon1, lat2, lon2) {
    rad = Math.PI / 180;
    return Math.acos(Math.sin(lat2 * rad) * Math.sin(lat1 * rad) + Math.cos(lat2 * rad) * Math.cos(lat1 * rad) * Math.cos(lon2 * rad - lon1 * rad)) * 6371 // Kilometers
}

ex = null

let curLocation = {}

try {
     Location.setAccuracyToKilometer()
    // Location.setAccuracyToHundredMeters()
    curLocation = await Location.current();
    if (!curLocation || Object.keys(curLocation).length == 0) {
        throw "couldn't retrieve location or location is an empty object";
    }
} catch (error) {}

const posLAT = curLocation.latitude || 48.85243888
const posLON = curLocation.longitude || 2.35084677

values = getDueCoords(posLAT, posLON, 45, MAX_DISTANCE) //
// QuickLook.present(values)  //
lat_ne = values[0]
lon_ne = values[1]
values = getDueCoords(posLAT, posLON, 225, MAX_DISTANCE)
lat_sw = values[0]
lon_sw = values[1] //
// QuickLook.present(values)


//  try {


if (refresh_token == "") {
    // get initial tokens
  
    /*
	let req1 = new Request("https://api.netatmo.net/oauth2/token")
    req1.method = "POST"
    req1.addParameterToMultipart("grant_type", "authorization_code")
    req1.addParameterToMultipart("redirect_uri", "https://noop")
    req1.addParameterToMultipart("scope", "read_homecoach")
    req1.addParameterToMultipart("client_id", CLIENT_ID)
    req1.addParameterToMultipart("client_secret", CLIENT_SECRET)
    req1.addParameterToMultipart("code", CODE)
    let res1 = await req1.loadJSON()

    if (!res1.access_token || !res1.refresh_token)
    throw new Error("Authentication error (1)")

    // save refresh_token for next run
    Keychain.set(key_id, res1.refresh_token)

    access_token = res1.access_token
	*/
   
} else {
    // use refresh_token to get new access_token
    let req1 = new Request("https://api.netatmo.net/oauth2/token")
    req1.method = "POST"
    req1.addParameterToMultipart("grant_type", "refresh_token")
    //        req1.addParameterToMultipart("redirect_uri", "https://noop")
    req1.addParameterToMultipart("client_id", String(CLIENT_ID))
    req1.addParameterToMultipart("client_secret", String(CLIENT_SECRET))
    req1.addParameterToMultipart("refresh_token", String(refresh_token))
    let res1 = await req1.loadJSON()
    //logWarning(res1)
    if (!res1.access_token || !res1.refresh_token)
        throw new Error("Authentication error (2)")

    // save refresh_token for next run (this usually doesn't change)
    Keychain.set(key_id, res1.refresh_token)

    access_token = res1.access_token
}

let localNetatmoTemp
let name_location

try {

    let url = "https://api.netatmo.net/api/getpublicdata?access_token=" + encodeURI(access_token) + "&lat_ne=" + lat_ne + "&lon_ne=" + lon_ne + "&lat_sw=" + lat_sw + "&lon_sw=" + lon_sw

    let req2 = new Request(url)
    let res2 = await req2.loadJSON()

    //QuickLook.present(res2)

    total_temp = 0
    temp_count = 0

    for (var obj of res2.body) {
        lon = obj.place.location[0]
        lat = obj.place.location[1]
        station_distance = circle_distance(posLAT, posLON, lat, lon)
        //console.log()
        if (station_distance < MAX_DISTANCE) { //max distance
            for (var date in obj.measures) {
                for (var k in obj.measures[date].type) {
                    if (obj.measures[date].type[k] == "temperature") {
                        Object.keys(obj.measures[date].res).forEach(function(prop) {
                            loc_temp = obj.measures[date].res[prop][0];
                            temp_count = temp_count + 1
                            total_temp = total_temp + loc_temp
                        });
                    }

                }
            }
        }
    }

    localNetatmoTemp = (total_temp / temp_count).toFixed(DECIMAL_PLACES)

    name_location = await Location.reverseGeocode(posLAT, posLON)

} catch (error) {
    name_location[0]["locality"] = "N/A"
    localNetatmoTemp = -50
}

const timeFormatter = new DateFormatter()
timeFormatter.dateFormat = 'dd.MM.yyyy HH:mm:ss';
const updateFont = new Font('SanFranciscoRounded-Regular', 6)
const cityFont = new Font('SanFranciscoRounded-Regular', 10)
const tempFont = new Font('SanFranciscoRounded-Bold', 34)

let widget = new ListWidget();
let widgetTemp = widget.addText(localNetatmoTemp.toString() + "°C");
widgetTemp.font = tempFont
let widgetCity = widget.addText(String(name_location[0]["locality"]));
widgetCity.font = cityFont
update=widget.addText(timeFormatter.string(new Date()))
update.font = updateFont
Script.setWidget(widget);
widget.presentSmall();