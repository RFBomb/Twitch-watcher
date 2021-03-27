require('dotenv').config();
const puppeteer = require('puppeteer-core');
const dayjs = require('dayjs');
const cheerio = require('cheerio');
var fs = require('fs');
const inquirer = require('./input');
const HelixAPI = require('./HelixAPI');
const UserSettings = require('./UserSettings');
const treekill = require('tree-kill');

// ========================================== Misc Globals  =================================================================
var run = true;
var firstRun = true;
var cookie = null;
var streamers = null;
var PreviousChannelName = null;
var TotalWatchTime

/* ========================================== Loggging Level =================================================================
//  Level 0 = Defaults Only
//  Level 1 
//  Level 2
//  Level 3 = Very Verbose (Log most events)
*/
const  DebugMode = (process.env.LoggingLevel || 0 );  

// ========================================== DEBUG SECTION =================================================================
const testAuth = false
const testCookie =''
const testBrowserPath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'

// ========================================== CONFIG SECTION =================================================================
const screenshotFolder = './screenshots/';
const baseUrl = 'https://www.twitch.tv/';
const userAgent = (process.env.userAgent || 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');

const scrollDelay = (Number(process.env.scrollDelay) || 2000);
const scrollTimes = (Number(process.env.scrollTimes) || 5);

const streamerListRefresh = (Number(process.env.streamerListRefresh) || 1);
const streamerListRefreshUnit = (process.env.streamerListRefreshUnit || 'hour'); //https://day.js.org/docs/en/manipulate/add

const showBrowser = false; // false state equ headless mode;
const proxy = (process.env.proxy || ""); // "ip:port" By https://github.com/Jan710
const proxyAuth = (process.env.proxyAuth || "");

const browserScreenshot = (process.env.browserScreenshot || false);


const browserClean = 1;
const browserCleanUnit = 'hour';

var browserConfig = {
  headless: !showBrowser,
  args: [
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-setuid-sandbox'
  ]
}; //https://github.com/D3vl0per/Valorant-watcher/issues/24

const cookiePolicyQuery = 'button[data-a-target="consent-banner-accept"]';
const matureContentQuery = 'button[data-a-target="player-overlay-mature-accept"]';
const sidebarQuery = '*[data-test-selector="user-menu__toggle"]';
const userStatusQuery = 'span[data-a-target="presence-text"]';
const channelsQuery = 'a[data-test-selector*="ChannelLink"]';
const streamPauseQuery = 'button[data-a-target="player-play-pause-button"]';
const streamSettingsQuery = '[data-a-target="player-settings-button"]';
const streamQualitySettingQuery = '[data-a-target="player-settings-menu-item-quality"]';
const streamQualityQuery = 'input[data-a-target="tw-radio"]';

// ========================================== End Of CONFIG SECTION ===========================================================

// API Setup

var streamersUrl 
var ChannelName_1 
var ChannelName_2 
var ChannelName_3 
var IgnoreRandomChannels
var Game
var minWatching
var maxWatching
var UserTimeZone

async function SetupVariables() {
  //Set all the variables
  var ApiAuthToken, SetupSuccess
  try {
    if (  process.env.DockerContainer  ) {
      // API Values
      ApiAuthToken = process.env.ApiAuthToken
      streamersUrl = (process.env.streamersUrl || 'https://www.twitch.tv/directory/game/Warframe'); 
      ChannelName_1 = (process.env.ChannelName_1 || '');
      ChannelName_2 = (process.env.ChannelName_2 || '');
      ChannelName_3 = (process.env.ChannelName_3 || '');
      IgnoreRandomChannels = (process.env.IgnoreRandomChannels || true );
      UserTimeZone = (process.env.ChannelName_3 || 'America/New_York');
      Game = (process.env.Game || '')
      // Other Values to be put into config
      minWatching = (Number(process.env.minWatching) || 15); // Minutes
      maxWatching = (Number(process.env.maxWatching) || 30); //Minutes

      SetupSuccess = true 
      

    } else if ( await UserSettings.CheckConfigFileExists() ) {
      // API Values
      ApiAuthToken = await UserSettings.ReadConfigSetting('ApiAuthToken')
      streamersUrl = (await UserSettings.ReadConfigSetting('streamersUrl') || 'https://www.twitch.tv/directory/game/Warframe'); 
      ChannelName_1 = (await UserSettings.ReadConfigSetting('ChannelName_1') || '');
      ChannelName_2 = (await UserSettings.ReadConfigSetting('ChannelName_2') || '');
      ChannelName_3 = (await UserSettings.ReadConfigSetting('ChannelName_3') || '');
      IgnoreRandomChannels = (await UserSettings.ReadConfigSetting('IgnoreRandomChannels') || true );
      UserTimeZone = (await UserSettings.ReadConfigSetting('UserTimeZone') || 'America/New_York');
      Game = (await UserSettings.ReadConfigSetting('Game') || '')
      // Other Values to be put into config
      minWatching = (Number(await UserSettings.ReadConfigSetting('minWatching')) || 15); // Minutes
      maxWatching = (Number(await UserSettings.ReadConfigSetting('maxWatching')) || 30); //Minutes
      
      SetupSuccess = true 

    } else {
      console.log('Unable to setup the API Variables!')
      SetupSuccess = false

    } //End of 'else' statement
    if (SetupSuccess) {
      console.log('----------- Loaded Variables ------------')
      console.log('ChannelName_1 - ' + ChannelName_1) 
      console.log('ChannelName_2 - ' + ChannelName_2) 
      console.log('ChannelName_3 - ' + ChannelName_3) 
      console.log('streamersUrl - ' + streamersUrl) 
      console.log('TimeZone - ' + UserTimeZone) 
      //console.log('Game - ' + Game)  
      console.log('minWatching - ' + minWatching) 
      console.log('maxWatching - ' + maxWatching) 

      IgnoreRandomChannels = stringToBoolean(IgnoreRandomChannels)
      console.log('IgnoreRandomChannels - ' + IgnoreRandomChannels)
      
      console.log('----------- End of Loaded Variables ------------')
    } 
  } catch (err) {
    console.log('🤬 Error: ', err);
    console.log('Please visit my discord channel to solve this problem: https://discord.gg/s8AH4aZ');
  }

  HelixAPI.SetVariables(ApiAuthToken,DebugMode)

  // Test the API
  if (  await HelixAPI.TestAPIToken() ){
    //If True then API is OK
  } else {
    // API Key Missing / Failure
    let input = await inquirer.askApiAuthKey();
    await UserSettings.WriteConfigSetting('ApiAuthToken',input.ApiAuthToken)
    console.log('Please restart the script to try with the new API key.');
    process.exit();
  };
}

// ========================================== Viewing Streams Section  =============================================================

function stringToBoolean(string){
  var ret, str
  str = string.toString().toLowerCase().trim()
  if (DebugMode >=2) {console.log('stringToBoolean INPUT: ' + str)}
  switch(str){
    case 'false': case 'no': case '0': case null: { ret = false; break; }
    case 'true': case 'yes': case '1': { ret = true;  break; }
    default:  { ret = Boolean(str); if (DebugMode >=2) {console.log('Case -> DEFAULT')}; break; }
  }
  if (DebugMode >=2) {console.log('stringToBoolean OUPUT: ' + ret)}
  return ret
}

function TimeStamp( seconds = false ){
  try {
    let D = new Date().toLocaleString("en-US", {timeZone: UserTimeZone});
    if (seconds) {
      return dayjs(D).format('MM-DD HH:mm:ss')
    }else {
      return dayjs(D).format('MM-DD HH:mm')
    }
  }catch(e) {
    console.log('🤬 Error: ', e);
    process.exit()
  }
}

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

async function ViewPriority(browser,page) {
  var streamer_last_refresh = dayjs().add(streamerListRefresh, streamerListRefreshUnit);
  var browser_last_refresh = dayjs().add(browserClean, browserCleanUnit);
  var ForceRefresh = true;
  var SleepMessageDisplayed = false;

  while (run) {
    try {
      //Check to refresh the browser, don't bother refreshing if still in sleep mode.
      var RefreshRequired = dayjs(browser_last_refresh).isBefore(dayjs());
      if ( ForceRefresh || RefreshRequired && !SleepMessageDisplayed ) {
        if (DebugMode >= 1 ) {console.log("\nDEBUG -> Triggered Browser Refresh -> " + TimeStamp() )}; 
        var newSpawn = await cleanup(browser, page);
        browser = newSpawn.browser;
        page = newSpawn.page;
        firstRun = true;
        RefreshRequired = false;
        //ApiToken = await GetAuthToken(page);  //Whenever the browser is refreshed, request a new token to ensure we are never going to have an expired one
        PreviousChannelName = ''; //Reset the Previous Channel Name to ensure that it will navigate on the next selection
        ForceRefresh = false;       //Set the value to false to avoid refreshing it every loop
        browser_last_refresh = dayjs().add(browserClean, browserCleanUnit);
        if (DebugMode > 0 ) {console.log("DEBUG -> Browser Refresh Complete\n")}; 
      }

      // Check each stream in the priority list to determine which one to watch
      if ( await HelixAPI.CheckStreamerOnline(ChannelName_1) ) {         //View First Priority Channel
          SleepMessageDisplayed = false;
          if ( !RefreshRequired ) await ViewURL(page, ChannelName_1, minWatching);
      
      } else if ( await HelixAPI.CheckStreamerOnline(ChannelName_2) ) {  //View Second Priority Channel
          SleepMessageDisplayed = false;
          if ( !RefreshRequired ) await ViewURL(page, ChannelName_2, minWatching);

      } else if ( await HelixAPI.CheckStreamerOnline(ChannelName_3) ) {  //View Third Priority Channel
          SleepMessageDisplayed = false;
          if ( !RefreshRequired ) await ViewURL(page, ChannelName_3, minWatching);

      } else if ( IgnoreRandomChannels ) { // Don't bother viewing random pages, instead just sit idle until a desired channel comes online

        if (firstRun == false ){ 
          ForceRefresh = true; // Force a refresh if no channels available and have not done one yet (Save Resources)
        
        } else {  // Sitting Idle
          var SM= 2;  //Sleep Timer (minutes)
          if ( SleepMessageDisplayed == false  ) {
            console.log('\n🕒 ' + TimeStamp() );
            console.log('-- No High-Priority Streamers online -> Sleeping until priority streamer is online.');
            console.log('-- API Check will be performed every ' + SM + ' minutes.');
            SleepMessageDisplayed = true;
          }
          sleep(SM * 60000); //Sleep for X minutes
        }

      } else { // View Random Page & reset the browser if needed
        if (DebugMode >= 0 ) {console.log("No High-Priority Streamers online -> Viewing Random Streamer")};  
        streamer_last_refresh  = await viewRandomPage(page, streamer_last_refresh);
      }

    } catch (e) {
        console.log('🤬 Error: ', e);
        console.log('Please visit the discord channel to receive help: https://discord.gg/s8AH4aZ');
    }
  }
}


async function ViewURL(page, ChannelURL, SleepTimer){
  try {
    if (DebugMode >= 3 ) {
      console.log("DEBUG -> Previous Channel Name -> " + PreviousChannelName)
      console.log("DEBUG -> New Channel Name -> " + ChannelURL)
    };  
    if ( PreviousChannelName === ChannelURL ) {
      //Page should already be on this channel, so no need to move to it.

    }else {
      console.log('\n🔗 ' + TimeStamp(false) + ' -> Now watching streamer: ', baseUrl + ChannelURL);
      await page.goto(baseUrl + ChannelURL, {
        "waitUntil": "networkidle0"
      }); //https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#pagegobackoptions
      PreviousChannelName = ChannelURL;  // Store the ChannelURL to avoid refreshing the page if already on this page.
      TotalWatchTime = 0
    }

    await clickWhenExist(page, cookiePolicyQuery);  
    await clickWhenExist(page, matureContentQuery); //Click on accept button

    if (firstRun) {
      if (DebugMode >= 2 ) {console.log("DEBUG -> First Run actions triggered") };
      console.log('🔧 Setting lowest possible resolution..');
      await clickWhenExist(page, streamPauseQuery);

      await clickWhenExist(page, streamSettingsQuery);
      await page.waitFor(streamQualitySettingQuery);

      await clickWhenExist(page, streamQualitySettingQuery);
      await page.waitFor(streamQualityQuery);

      var resolution = await queryOnWebsite(page, streamQualityQuery);
      resolution = resolution[resolution.length - 1].attribs.id;
      await page.evaluate((resolution) => {
        document.getElementById(resolution).click();
      }, resolution);

      await clickWhenExist(page, streamPauseQuery);

      await page.keyboard.press('m'); //For unmute
      firstRun = false;
      if (DebugMode >= 2 ) {console.log("DEBUG -> First Run actions complete.") };
    }


    if (browserScreenshot) {
      await page.waitFor(1000);
      fs.access(screenshotFolder, error => {
        if (error) {
          fs.promises.mkdir(screenshotFolder);
        }
      });
      await page.screenshot({
        path: `${screenshotFolder}${ChannelURL}.png`
      });
      console.log('📸 Screenshot created: ' + `${ChannelURL}.png`);
    }

    await clickWhenExist(page, sidebarQuery); //Open sidebar
    await page.waitFor(userStatusQuery); //Waiting for sidebar
    let status = await queryOnWebsite(page, userStatusQuery); //status jQuery
    await clickWhenExist(page, sidebarQuery); //Close sidebar

    console.log('💡 Account status:', status[0] ? status[0].children[0].data : "Unknown"); //WHOSE ACCOUNT?
    
    //Sleep Timer
    console.log('💤 Watching stream for ' + SleepTimer + ' minutes');
    await SleepWatching(SleepTimer, ChannelURL, page) //Scan for higher priority channels while watching this stream
    
    console.log ('🕒' + TimeStamp() + ' -> You have watched this channel ( ' + ChannelURL + ' )  for ' + TotalWatchTime + 'minutes.')
    return;

  } catch (e) {
    console.log('🤬 Error: ', e);
    console.log('Please visit the discord channel to receive help: https://discord.gg/s8AH4aZ');
  }
}

async function viewRandomPage(page, firstRun, streamer_last_refresh) {  
    try {
      //Check to refresh the streamer list
      if (streamers == null || dayjs(streamer_last_refresh).isBefore(dayjs())) {
        await getAllStreamer(page); //Call getAllStreamer function and refresh the list
        streamer_last_refresh = dayjs().add(streamerListRefresh, streamerListRefreshUnit); //https://github.com/D3vl0per/Valorant-watcher/issues/25
      }

      // Pick a stream, get a random sleep timer, and attempt to view the stream
      let watch = streamers[getRandomInt(0, streamers.length - 1)]; //https://github.com/D3vl0per/Valorant-watcher/issues/27
      var SleepTimer = getRandomInt(minWatching, maxWatching); //Set watching timer
      await ViewURL(page, watch, SleepTimer, firstRun);
      return streamer_last_refresh

    } catch (e) {
      console.log('🤬 Error: ', e);
      console.log('Please visit the discord channel to receive help: https://discord.gg/s8AH4aZ');
      process.exit()
    }
  
}

function BoolToOnlineOffline(bool){
  if (bool){
    return 'ONLINE'
  }else {
    return 'OFFLINE'
  }
}

async function SleepWatching(MaxSleepTimer, ChannelURL, page) {
  var i = 0
  var SleepMinutes = 1
  do {
    await page.waitFor(SleepMinutes * 60000); //Sleep for X minutes between checks
    //await scroll(page,2) //Scroll to keep page active
    TotalWatchTime = TotalWatchTime + 1
    i = i + 1

    if (DebugMode >= 2) {console.log("DEBUG -> Starting Sleep-Watching Routine - " + MaxSleepTimer + 'Minutes')}
    var Ch1 = await HelixAPI.CheckStreamerOnline(ChannelName_1)
    var Ch2 = await HelixAPI.CheckStreamerOnline(ChannelName_2)
    var Ch3 = await HelixAPI.CheckStreamerOnline(ChannelName_3)
    var Cur = await HelixAPI.CheckStreamerOnline(ChannelURL)

    if (DebugMode >=3 ) {
      console.log('\nCurrently Viewing -> ' + ChannelURL + ' // Status : ' + BoolToOnlineOffline(Cur) )
      console.log('Channel 1 Name -> ' + ChannelName_1 + ' // Status : ' + BoolToOnlineOffline(ch1) )
      console.log('Channel 2 Name -> ' + ChannelName_2 + ' // Status : ' + BoolToOnlineOffline(ch2) )
      console.log('Channel 3 Name -> ' + ChannelName_3 + ' // Status : ' + BoolToOnlineOffline(ch3) )
    }
    var HigherPriority = false

    if (!(Cur)) { //The channel currently being viewed has gone offline
      if (DebugMode >= 0) {console.log("The channel currently being viewed has gone offline")}
      
    } else if ( ( ChannelURL ===  ChannelName_2 || ChannelURL === ChannelName_3 ) && Ch1 ) { //Channel 1 is LIVE while viewing Channel 2 / 3
      if (DebugMode >= 2) {console.log("DEBUG -> Channel 1 Live while watching channel 2 or 3")}
      HigherPriority = true

    } else if ( ChannelURL === ChannelName_3 && Ch2 ) { //Channel 2 is LIVE while viewing Channel 3
      if (DebugMode >= 2) {console.log("DEBUG -> Channel 2 Live while watching channel 3")}
      HigherPriority = true

    } else if ( ChannelURL == ChannelName_1 || ChannelURL == ChannelName_2 || ChannelURL == ChannelName_3 ) {    // Currently Watching a High Priority Channel
      i = 0 // Reset Sleep Timer to keep watching channel
      if (DebugMode >= 1) {console.log("DEBUG -> Current watching highest priorty channel available")}

    } else if ( Ch1 || Ch2 || Ch3 ) {  //Atleast 1 high priority stream is online while not watching any of them
      if (DebugMode >= 2) {console.log("DEBUG -> Channel 1, 2, or 3 are live while watching a random channel")}
      HigherPriority = true
      
    } else {  // No High Priority streamer is online
      
    }    
    if (DebugMode >= 1) {console.log("DEBUG -> You have been watching this channel for " + TotalWatchTime + " minutes.")}
  
  } while (i <= MaxSleepTimer && !HigherPriority );
  
  if (DebugMode >= 2) {console.log("DEBUG -> Sleep-Watching Routine Complete")}
  if (HighPriority){console.log("Higher Priority Streamer has been found. Switching Channels.")}
}

async function getAllStreamer(page) {
  console.log("=========================");
  await page.goto(streamersUrl, {
    "waitUntil": "networkidle0"
  });
  console.log('🔐 Checking login...');
  await checkLogin(page);
  console.log('📡 Checking active streamers...');
  await scroll(page, scrollTimes);
  const jquery = await queryOnWebsite(page, channelsQuery);
  streamers = null;
  streamers = new Array();

  console.log('🧹 Filtering out html codes...');
  for (var i = 0; i < jquery.length; i++) {
    streamers[i] = jquery[i].attribs.href.split("/")[1];
  }
  return;
}


// ========================================== Browser Setup  =============================================================

async function spawnBrowser() {
  console.log("=========================");
  console.log('📱 Launching browser...');
  var browser = await puppeteer.launch(browserConfig);
  var page = await browser.newPage();

  console.log('🔧 Setting User-Agent...');
  await page.setUserAgent(userAgent); //Set userAgent

  console.log('🔧 Setting auth token...');
  await page.setCookie(...cookie); //Set cookie

  console.log('⏰Setting timeouts...');
  await page.setDefaultNavigationTimeout(process.env.timeout || 0);
  await page.setDefaultTimeout(process.env.timeout || 0);

  if (proxyAuth) {
    await page.setExtraHTTPHeaders({
      'Proxy-Authorization': 'Basic ' + Buffer.from(proxyAuth).toString('base64')
    })
  }
  return {
    browser,
    page
  };
}

async function readLoginData(testAuth) {
  const cookie = [{
    "domain": ".twitch.tv",
    "hostOnly": false,
    "httpOnly": false,
    "name": "auth-token",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": true,
    "session": false,
    "storeId": "0",
    "id": 1
  }];
  try {
    console.log('🔎 Checking config file...');

    if (testAuth) {
      console.log('✅Debug Authorization Enabled');
      if (proxy) browserConfig.args.push('--proxy-server=' + proxy);
      browserConfig.executablePath = testBrowserPath;
      cookie[0].value = testCookie;
      return cookie;

    } else if (process.env.DockerContainer) {
      console.log('✅ Env config found');
      if (proxy) browserConfig.args.push('--proxy-server=' + proxy);
      cookie[0].value = process.env.LoginToken; //Set cookie from env
      browserConfig.executablePath = '/usr/bin/chromium-browser'; //For docker container
      return cookie;

    }else if (  await UserSettings.CheckConfigFileExists()  ) {
      console.log('✅ Json config found!');
      if (proxy) browserConfig.args.push('--proxy-server=' + proxy);
      browserConfig.executablePath = await UserSettings.ReadConfigSetting('exec');
      cookie[0].value = await UserSettings.ReadConfigSetting('LoginToken');
      return cookie;

    } else {
      console.log('❌ No config file found!');
      let input = await inquirer.askLogin();
      await UserSettings.WriteNewConfig(input)
      if (proxy) browserConfig.args[6] = '--proxy-server=' + proxy;
      browserConfig.executablePath = input.exec;
      cookie[0].value = input.token;
      return cookie;

    } //End of 'else' statement
  } catch (err) {
    console.log('🤬 Error: ', err);
    console.log('Please visit my discord channel to solve this problem: https://discord.gg/s8AH4aZ');
  }
}

async function checkLogin(page) {
  let cookieSetByServer = await page.cookies();
  setTimeout(function() {
    for (var i = 0; i < cookieSetByServer.length; i++) {
      if (cookieSetByServer[i].name == 'twilight-user') {
        console.log('✅ Login successful!');
        return true;
      }
    }
  ;
    //If you get here then login failed!
    console.log('🛑 Login failed!');
    console.log('🔑 Invalid token!');
    console.log('\nPleas ensure that you have a valid twitch auth-token.\nhttps://github.com/D3vl0per/Valorant-watcher#how-token-does-it-look-like');
    if (!process.env.token) {
      if ( testAuth = false ) { 
        //Request a new twitch auth token
        let input = inquirer.AskCookie();
        UserSettings.WriteConfigSetting('token',input.token)
        console.log('Please restart the script to try with the new auth token.');
      } ;
    }
    process.exit();
  }, 10000) //Delay processing the cookies by x milliseconds

  
}

async function cleanup(browser, page) {
  const pages = await browser.pages();
  await pages.map((page) => page.close());
  await treekill(browser.process().pid, 'SIGKILL');
  //await browser.close();
  return await spawnBrowser();
}


async function killBrowser(browser, page) {
  const pages = await browser.pages();
  await pages.map((page) => page.close());
  treekill(browser.process().pid, 'SIGKILL');
  return;
}


// ========================================== Browser Actions =============================================================

async function scroll(page, times, LogEvent = false ) {
  if ( LogEvent ) { console.log('🔨 Emulating scrolling...'); }
  for (var i = 0; i < times; i++) {
    await page.evaluate(async (page) => {
      var x = document.getElementsByClassName("scrollable-trigger__wrapper");
      x[0].scrollIntoView();
    });
    await page.waitFor(scrollDelay);
  }
  return;
}



function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}



async function clickWhenExist(page, query) {
  let result = await queryOnWebsite(page, query);

  try {
    if (result[0].type == 'tag' && result[0].name == 'button') {
      await page.click(query);
      await page.waitFor(500);
      return;
    }
  } catch (e) {}
}



async function queryOnWebsite(page, query) {
  let bodyHTML = await page.evaluate(() => document.body.innerHTML);
  let $ = cheerio.load(bodyHTML);
  const jquery = $(query);
  return jquery;
}



// ========================================== Startup / Exit  =============================================================

async function shutDown() {
  console.log("\n👋Bye Bye👋");
  run = false;
  process.exit();
}

async function main() {
  console.clear();
  console.log("=========================");
  cookie = await readLoginData();
  var {
    browser,
    page
  } = await spawnBrowser();
  
  await SetupVariables();
  
  //await getAllStreamer(page);
  console.log("=========================");
  console.log('🔭 Running watcher...');
  await ViewPriority(browser, page);
};

main();

process.on("SIGINT", shutDown);
process.on("SIGTERM", shutDown);
