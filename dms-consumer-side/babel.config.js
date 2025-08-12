module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Removed react-native-worklets/plugin as the package was uninstalled
    ],
  };
}; 