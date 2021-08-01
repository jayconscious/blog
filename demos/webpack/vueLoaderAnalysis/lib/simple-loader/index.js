module.exports = function loader (source) {
  console.log('simple-loader is working');
  return source;
}

module.exports.pitch = function () {
  console.log('pitching graph');
}