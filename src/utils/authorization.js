const bcrypt = require('bcrypt');

const createHash = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

const verifyHash = async (password, hash) => {
  return await bcrypt.compare(password, hash);
}

module.exports = {
  createHash,
  verifyHash
}


