// const ROLES = require('../utils/roles');
const { expressjwt } = require('express-jwt');

const getTokenFromHeaders = (req) => {
  const { headers: { authorization } } = req;
  if(authorization && authorization.split(' ')[0] === 'Token') {
    return authorization.split(' ')[1];
  }else if(req.body.token){
    return req.body.token;
  }
  return null;
};

const checkIsInRole = (...roles) => (req, res, next) => {
  const { body: { user } } = req;
    if (!user) {
      return res.status(400).json({
        errors: {
          password: 'User is missing',
        },
      });
    }
  
    const hasRole = roles.find(role => user.role === role)
    if (!hasRole) {
      return res.status(400).json({
        errors: {
          password: 'Admin section!',
        },
      });
    }
  
    return next()
  }

const auth = {
  required: expressjwt({
    secret: 'secret',
    userProperty: 'payload',
    getToken: getTokenFromHeaders,
    algorithms: ["HS256"],
  }),
  optional: expressjwt({
    secret: 'secret',
    userProperty: 'payload',
    getToken: getTokenFromHeaders,
    credentialsRequired: false,
    algorithms: ["HS256"],

  }),
  checkIsInRole : checkIsInRole
};

module.exports = auth;