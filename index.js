// if the tool is old enough to ignore "main" in package.json,
// then it should probably use cjs
// eslint-disable-next-line @typescript-eslint/no-var-requires
module.exports = require('./lib/cjs/persist');
