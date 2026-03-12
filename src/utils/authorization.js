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
  try {
    return { payload: jwt.verify(token, secret), expired: false };
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return { payload: null, expired: true };
    }
    return { payload: null, expired: false };
  }
}

const createToken = (secret, expire, user) => {
  return createJWT(
    {
      sub: user.id,
      username: user.first_name + " " + user.last_name,
    },
    secret,
    {
      expiresIn: expire,
    },
  )
}



module.exports = {
  createHash,
  verifyHash,
  createToken,
  createJWT,
  verifyJWT,
}
