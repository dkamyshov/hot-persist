// eslint-disable-next-line @typescript-eslint/no-var-requires
const crypto = require('crypto');

const randomString = crypto.randomBytes(8).toString('hex');

console.log(randomString);
