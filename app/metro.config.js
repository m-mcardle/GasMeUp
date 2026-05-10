// Needed to fix bundling issue when resolving @firebase module
// https://stackoverflow.com/questions/72179070/react-native-bundling-failure-error-message-while-trying-to-resolve-module-i
const path = require('path');
const { getDefaultConfig } = require('@expo/metro-config');

const exclusionList = require('metro-config/src/defaults/exclusionList');

const defaultConfig = getDefaultConfig(__dirname);
const fontfaceobserverPath = path.resolve(__dirname, 'src/shims/fontfaceobserver.js');

// defaultConfig.resolver.assetExts.push('cjs');
defaultConfig.resolver.blockList = exclusionList([/firebase-admin\/.*/, /functions\/.*/, /server\/.*/]);
defaultConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'fontfaceobserver') {
    return {
      filePath: fontfaceobserverPath,
      type: 'sourceFile',
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = defaultConfig;
