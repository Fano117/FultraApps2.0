module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@design-system': './src/design-system',
            '@components': './src/design-system/components',
            '@hooks': './src/shared/hooks',
            '@services': './src/shared/services',
            '@utils': './src/shared/utils',
            '@store': './src/shared/store',
            '@apps': './src/apps'
          }
        }
      ]
    ]
  };
};
