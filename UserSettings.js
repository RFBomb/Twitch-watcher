
const inquirer = require('inquirer');
var fs = require('fs');

const configPath = './config.json'


async function CheckConfigFileExists(){
    try {
        if (fs.existsSync(configPath)) {
            try {
                let configFile = JSON.parse(fs.readFileSync(configPath, 'utf8'))
                JSON.stringify(configFile)
                //return true
            } catch (e) {
                //unable to read file -> Delete the file
                console.log('Invalid JSON File -> Deleting File');
                fs.unlinkSync(configPath); 
                return false
            }
            return true
        }else{
          //console.log('Config File NOT Found.')
            return false
        }
        
    } catch (err) {
        console.log('🤬 Error: ', err);
        console.log('Please visit my discord channel to solve this problem: https://discord.gg/s8AH4aZ');
      }
}

async function ReadConfigSetting(SettingName) {
    try {
        if ( CheckConfigFileExists() ) {
          let configFile = JSON.parse(fs.readFileSync(configPath, 'utf8'))
          var OUTPUT = configFile[SettingName]
          return OUTPUT
        }else{
            return ''
        } 
        
    } catch (err) {
        console.log('🤬 Error: ', err);
        console.log('Please visit my discord channel to solve this problem: https://discord.gg/s8AH4aZ');
      }
}

async function WriteConfigSetting(SettingName,NewValue) {
    try {
      var configFile
        if ( await CheckConfigFileExists() )  {
          // Read Existing File
          configFile = JSON.parse(fs.readFileSync(configPath, 'utf8'));  
        }else {
          // Create Empty Array
          configFile = JSON.parse('{}');
        }
        //Update the file with new value
        console.log('Updating Setting: "' + SettingName + '"   =   "' + NewValue  + '"');
        configFile[SettingName] = NewValue;
        //Save the updated json
        fs.writeFileSync(configPath, JSON.stringify(configFile), function(err) { 
            if (err) {                     console.log(err);                 }});
    } catch (err) {
        console.log('🤬 Error: ', err);
        console.log('Please visit my discord channel to solve this problem: https://discord.gg/s8AH4aZ');
      }
}

async function WriteNewConfig(JSON_Object ) {
  try {
      
    fs.writeFileSync(configPath, JSON.stringify(JSON_Object), function(err) { 
          if (err) {                     console.log(err);                 }});
    
    SetupConfigFile();

  } catch (err) {
      console.log('🤬 Error: ', err);
      console.log('Please visit my discord channel to solve this problem: https://discord.gg/s8AH4aZ');
    }
}

async function SetupConfigFile() {
  //console.log('Creating config.json Structure');
  
  //await WriteConfigSetting('token','1') // Taken care of during 'readLoginData' routine
  //await WriteConfigSetting('exec','2')
  
  await WriteConfigSetting('ApiAuthToken','')
  await WriteConfigSetting('streamersUrl','')
  await WriteConfigSetting('ChannelName_1','')
  await WriteConfigSetting('ChannelName_2','')
  await WriteConfigSetting('ChannelName_3','')
  await WriteConfigSetting('IgnoreRandomChannels','')
  await WriteConfigSetting('Game','')
  await WriteConfigSetting('minWatching','15')
  await WriteConfigSetting('maxWatching','30')
}

// Export all functions that are allowed to be public
module.exports = {  
    WriteNewConfig,
    CheckConfigFileExists,
    WriteConfigSetting,
    ReadConfigSetting,
    SetupConfigFile
 }; 