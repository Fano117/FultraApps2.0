const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Excluir carpetas de Visual Studio del file watcher
config.watchFolders = [];
config.resolver = {
  ...config.resolver,
  blockList: [
    /\.vs\/.*/,
    /\.vscode\/.*/,
  ],
};

module.exports = config;
