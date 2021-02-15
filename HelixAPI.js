/* solves: ReferenceError: Headers is not defined 
// https://github.com/apollographql/apollo-link-rest/issues/41
// https://www.npmjs.com/package/node-fetch 
// If faulting out use command:  npm install node-fetch --save 
*/
const fetch = require('node-fetch');  
global.Headers = fetch.Headers; 

// ========================================== Twitch API SECTION =============================================================
  
//https://dev.twitch.tv/docs/api/reference#get-streams

  const oAuthorizationURL = 'https://id.twitch.tv/oauth2/authorize?' ;
  const ImplicitAuthURL = 'https://api.twitch.tv/helix/users?' ;
  const TokenValidationURL = 'https://id.twitch.tv/oauth2/validate'
  const TokenURL = 'https://id.twitch.tv/oauth2/token?' ;
  const StreamsURL = 'https://api.twitch.tv/helix/streams'
  const GamesURL = 'https://api.twitch.tv/helix/games'
  const AppRedirectURL = 'http://localhost/'
  const AppClientID = ${{ secrets.TWITCHAPP_CLIENT_ID }}
  const DropsEnabledTag = 'c2542d6d-cd10-4532-919b-3d19f30a768b'
  const DropsEnabledURLPrefix = '?tl='

  var DebugMode = 0
  var ApiAuthToken
  var ApiTokenVerified = false

// ==========================================  API Call  =============================================================

function SetVariables(ApiToken, DebugLevel){
  ApiAuthToken = ApiToken
  DebugMode = DebugLevel
  
}
  async function StandardHeaders() { 
    //Returns the standard headers as a header object
    // https://developer.mozilla.org/en-US/docs/Web/API/Headers/Headers
    var myHeaders = new Headers(); // Currently empty
    myHeaders.append("Client-ID", AppClientID)
    myHeaders.append("Authorization", "Bearer " + ApiAuthToken)
    return myHeaders
  }

  async function APICall(URL, HeadersObject) {
    if ( ApiTokenVerified == false || ApiAuthToken == '' ) { return false }
    // Perform API Call and return a JSON object
    if (DebugMode >= 3 ) { console.log("DEBUG -> Performing API Call to URL: \n" + URL) }
    try {
    var resp = await fetch( URL ,   { headers: HeadersObject   } )
    if (DebugMode >= 4 ) {console.log("DEBUG -> API Response: \n" + JSON.stringify(resp))};  
    var D = resp.json()
      if(D.error == '401'){ // Bad Token - 'Unauthorized'
        /*
        if (DebugMode >= 1 ) {console.log("DEBUG -> API Token Invalid - Attempting Refresh")};
        //Attempt to refresh the api token
        ApiTokenRetrieved = false
        var {browser , page } = spawnBrowser()
        ApiAuthToken = await GetAuthToken(page)
        await killBrowser(browser,page)
        if ( ApiTokenRetrieved == false ) { return false }
        */
       return false
      }else if (D.error) {
        if (DebugMode >= 3 ) {console.log("DEBUG -> API Call Returned an error")};
          return false
        }else {
          if (DebugMode >= 3 ) {console.log("DEBUG -> API Call Completed successfully")};
          return D
        }
    } catch (e) {
      console.log('🤬 Error: ', e);;
    }	
  };  



// ==========================================  Return Basic Information  =============================================================

async function ReturnGameIdFromGameName(GameName){
    var URL = GamesURL + 'name=' + GameName
    var Resp = await APICall(URL,  await StandardHeaders());
    if ( Resp.data[0] ) {
        return Resp.data[0].id
    } else { return false }
}

async function GetStreamTags(ChannelName){
    var URL = GamesURL + 'broadcaster_id=' + ChannelName
    var Resp = await APICall(URL,  await StandardHeaders());
    if ( Resp.data[0] ) {
        return Resp
    } else { return false }
}

  async function TestAPIToken() {
    ApiTokenVerified = true // Force it to TRUE to allow the api test to work. 
    var resp = await APICall(StreamsURL, await StandardHeaders());
    if (resp.error || resp == false ) {
      // Error reported during API / Blank API Token
      ApiTokenVerified = false
      console.log(' ')
      console.log('API Test FAILED.')
      console.log('Your API Key:   ' + ApiAuthToken)
      console.log(' ')
      //console.log("Please Visit This page to authorize your twitch account to use this app's API functionality")
      //console.log("https://rfbomb.github.io/DockerWatcherAuthPage.io/")

    }else if (resp.data) {
      // API Call was a success
      ApiTokenVerified = true
    }
    return ApiTokenVerified
  }

  async function CheckStreamerOnline(ChannelURL) {
    var bolONLINE = false;
    if (DebugMode >= 3 ) {console.log("\n------------------------------------\n" + "DEBUG -> CheckStreamerOnline Routine Started: ChannelURL = " + ChannelURL)};
    if (ChannelURL ===  'NoValueSet' || ChannelURL ===  '' || ChannelURL ==  null  || ApiAuthToken == ''  || ApiTokenVerified == false ) {  
      // No Value -> Ignore
      bolOnline = false; 
      if (DebugMode >= 3  && ApiAuthToken != '') {console.log("DEBUG -> Channel Url has no value -> IGNORED")};
      if (DebugMode >= 3  && ApiTokenVerified == false) {console.log("DEBUG -> Invalid API Token -> ABORT")};

    } else { 
      // Send API Call
      var URL = StreamsURL + '?user_login=' + ChannelURL
      var Resp = await APICall(URL,  await StandardHeaders());
      if (DebugMode >= 4 ) {console.log("DEBUG -> JSON Data Pack:\n" + JSON.stringify(Resp) + "\n")};
      // Evaluate the input JSON package
      if (Resp == false || Resp.data[0]){
        bolONLINE =  true
      }else {
        bolONLINE = false         
      }
    };   // end of large if statement    
    if (DebugMode >= 3 ) {console.log("DEBUG -> CheckStreamerOnline Return Value: " + bolONLINE + "\n------------------------------------")};
    return bolONLINE
      
   };




   async function ReturnFirstStreamWithDropsEnabled(GameID, GameName) {
    // Gets the 20 most active streams and searches for the DropsEnabled tag
   if (DebugMode >= 3 ) {console.log("\n------------------------------------\n" + "ReturnFirstStreamWithDropsEnabled Routine Started: GameName = " + GameName)};
   var StreamerID = false;
   if (GameID == '' && GameName != '') {GameID = await ReturnGameIdFromGameName(GameName)}
   if (GameID ===  '' || GameID ==  false || GameID ==  null  || ApiAuthToken == ''  || ApiTokenVerified == false ) {  
     // No Value -> Ignore
     if (DebugMode >= 3 && ApiAuthToken != '') {console.log("DEBUG -> GameName has no value -> IGNORED")};
     if (DebugMode >= 3 && ApiTokenVerified == false) {console.log("DEBUG -> Invalid API Token -> ABORT")};

   } else { 
     // Send API Call
     var MaxNumberOfStreams = 20 //Number of streams to return Default 20, MAX 100
     var URL = StreamsURL + '?game_id=' + GameID + '&first=' + MaxNumberOfStreams
     var Resp = await APICall(URL,  await StandardHeaders());
     if (DebugMode >= 3 ) {console.log("DEBUG -> JSON Data Pack:\n" + JSON.stringify(Resp) + "\n")};
     // Loop through the JSON data package and return the first stream with drops enabled -> return false is no stream with drops is available
     // http://zetcode.com/javascript/jsonforeach/
     resp.foreach(stream => {
       // Get Streamer Username
       DropTagFound =false 
       StreamerID = stream.user_name
       if (DebugMode >= 3 ) {console.log("******** \n DEBUG -> Stream Found: Streamer Username :" + StreamerID)};
       //Get the stream tags
       if (DebugMode >= 4 ) {console.log("DEBUG -> Stream Tag JSON Data :\n" + JSON.stringify(stream.tag_ids) + "\n")};
       var i = 0
       stream.tag_ids.foreach(tag => {
         if (DebugMode >= 3 ) {console.log("DEBUG -> Stream Tag[" + i + "]: " + tag)};
         if (tag == DropsEnabledTag) {
            DropTagFound = true
            if (DebugMode >= 3 ) {console.log("DEBUG -> DROPS-ENABLED Tag Found!")};
         }
         i = i + 1
       })
       if (DropsEnabledTag = true) {
         if (DebugMode >= 3 ) {console.log("DEBUG -> ReturnFirstStreamWithDropsEnabled Return Value: " + StreamerID + "\n------------------------------------")};
         return StreamerID
       }
       });
     }
     // If you get here then no streamer has drops enabled
     if (DebugMode >= 3 ) {console.log("DEBUG -> ReturnFirstStreamWithDropsEnabled Return Value: false"  + "\n------------------------------------")};
     return false
  };


  /* This Routine Doesn't actually work currently. User must log in, which kinda defeats whole purpose of the cookie
  async function GetAuthToken(page) {
    //Authorize the user to generate their accesss token. "User" must click 'Authorize', then script must read back the access_token key
    console.log("Attempting to retrieve API Token.")
    try{  
      //First ensure user is logged in by going to a twitch page
      await page.goto('https://www.twitch.tv/directory/following', { "waitUntil": "networkidle0" });
      await checkLogin(page);
      //Navigate to Auth URL Page to make it seem like user clicked the button
      if (DebugMode >= 1 ) {console.log("\n------------------------------------\n" + "DEBUG -> Attempting to reach re-authorization URL")};
      await page.goto(oAuthorizationURL + 'client_id=' + AppClientID + '&redirect_uri=' + AppRedirectURL + '&response_type=token', {
        "waitUntil": "networkidle0" }); //https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#pagegobackoptions
         
        //Once on return page, evaluate the returned URL
        //Page returns this format url: https://localhost/#access_token=XXXXXXXXXXXXXXXXXXXXXXX&scope=&token_type=bearer 
      
     if (DebugMode >= 2 ) {console.log("DEBUG -> Current PAGE URL:  " + page.url())};
      var parsedHash = new URLSearchParams(page.url());
      if (parsedHash.get('access_token')) {
          var access_token = parsedHash.get('access_token');
          ApiTokenRetrieved = true 
          console.log("\n------------------------------------\n" + "API Token Retrieved."+ "\n------------------------------------\n")
          return access_token
      } else {
        console.log("Unable to retrieve API Token")
        console.log("Please Visit This page to authorize your twitch account to use this app's API functionality")
        console.log("https://rfbomb.github.io/DockerWatcherAuthPage.io/")
        ApiTokenRetrieved = false
        process.exit();
      }
    } catch(e) { console.log('🤬 Error: ', e);}
  };
 */

 
module.exports = {  
    //Variables
    ApiAuthToken,
    ApiTokenVerified,
    DebugMode, 
    // Functions
    SetVariables,
    ReturnGameIdFromGameName,
    GetStreamTags, 
    TestAPIToken,
    CheckStreamerOnline,
    ReturnFirstStreamWithDropsEnabled
}; 
