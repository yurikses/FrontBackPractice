const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const createHash = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

const verifyHash = async (password, hash) => {
  return await bcrypt.compare(password, hash);
}


const createJWT = (payload, secret, options) => {
  console.log(payload, secret, options)
  const token = jwt.sign(payload, secret, options);
  return token;
}

const verifyJWT = (token, secret) => {
  console.log(token, secret)
  try {
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (err) {
    console.log(err);
    return null;
  }
}

module.exports = {
  createHash,
  verifyHash,
  createJWT,
  verifyJWT,
}
