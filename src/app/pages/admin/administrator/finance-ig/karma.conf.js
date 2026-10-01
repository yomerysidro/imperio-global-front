module.exports = function (config) {
  require('../../../../../../karma.conf')(config);
  config.set({
    browsers: ['ChromeHeadlessFinanceIg'],
    customLaunchers: {
      ChromeHeadlessFinanceIg: {
        base: 'ChromeHeadless',
        flags: ['--disable-gpu', '--disable-software-rasterizer', '--no-sandbox']
      }
    }
  });
};
