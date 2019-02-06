const jwt = require('jsonwebtoken');
const config = require('./config/config.json');
const secret = config.secret;


const isAuthorized = function(req, res, next) {
    //check for token
  const token = req.body.token || req.query.token || req.headers['x-access-token'] || req.cookies.token;
  if (!token) {
    res.status(401).send('No token found!');
  } else {
    jwt.verify(token, secret, function(err, decoded) {
      if (err) {
        res.status(401).send('Invalid token');
      } else {
        res.username = decoded.username;
        next();
      }
    });
  }
}
module.exports = isAuthorized;