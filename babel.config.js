module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // ... otros plugins si tienes ...
      'react-native-reanimated/plugin', // <--- ESTE DEBE ESTAR AQUÍ Y AL FINAL
    ],
  };
};