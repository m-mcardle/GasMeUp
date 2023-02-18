// Needed to fix bundling issue when resolving @firebase module
// https://stackoverflow.com/questions/72179070/react-native-bundling-failure-error-message-while-trying-to-resolve-module-i
const { getDefaultConfig } = require("@expo/metro-config");

const exclusionList = require("metro-config/src/defaults/exclusionList");
const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.assetExts.push("cjs");
defaultConfig.resolver.blockList = exclusionList([/firebase-admin\/.*/, /functions\/.*/, /server\/.*/])

module.exports = defaultConfig;
