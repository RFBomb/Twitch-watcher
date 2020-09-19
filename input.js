const inquirer = require('inquirer');

exports.askLogin = () => {
  const questions = [{
    name: 'token',
    type: 'password',
    message: 'Enter your auth-token from twitch.tv 🔑:',
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return 'Please enter your valid token!';
      }
    }
  }, {
    name: 'exec',
    type: 'input',
    message: 'Enter the chromium executable path (usually /usr/bin/chromium-browser or /usr/bin/chromium or C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe):\n',
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return 'Please enter your valid path!';
      }
    }
  }, {
    name: 'ApiAuthToken',
    type: 'input',
    message: '\nObtain your API Authorization Key at this URL:    https://rfbomb.github.io/DockerWatcherAuthPage.io/      \nEnter your API Authorization Key:\n',
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return 'Please enter your valid Key!';
      }
    }
  }];
  return inquirer.prompt(questions);
};


exports.askApiAuthKey = () => {
  const questions = [{
    name: 'ApiAuthToken',
    type: 'input',
    message: '\nObtain your API Authorization Key at this URL:    https://rfbomb.github.io/DockerWatcherAuthPage.io/      \nEnter your API Authorization Key:\n',
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return 'Please enter your valid Key!';
      }
    }
  }];
  return inquirer.prompt(questions);
};


exports.AskCookie = () => {
  const questions = [{
    name: 'token',
    type: 'password',
    message: 'Enter your auth-token from twitch.tv 🔑:',
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return 'Please enter your valid token!';
      }
    }
  }];
  return inquirer.prompt(questions);
};


exports.AskExec = () => {
  const questions = [{
    name: 'exec',
    type: 'input',
    message: 'Enter the chromium executable path (usually /usr/bin/chromium-browser or /usr/bin/chromium or C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe):',
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return 'Please enter your valid path!';
      }
    }
  }];
  return inquirer.prompt(questions);
};
