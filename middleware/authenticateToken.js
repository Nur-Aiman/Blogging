const jwt = require('jsonwebtoken')
require('dotenv').config()

module.exports = {
  authenticateToken: function authenticateToken(req, res, next) {
    const token = req.cookies.access_token

    if (!token) {
      // If there is no token, set a message and redirect the user to the login page with a delay of 1 seconds
      res.locals.message = 'Please log in'
      setTimeout(() => {
        res.redirect('/api/users/login')
      }, 1000)
    } else {
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
          // If the token is invalid, set a message and redirect the user to the login page with a delay of 1 seconds
          res.locals.message = 'Please log in'
          setTimeout(() => {
            console.log('Unauthorized')
            res.redirect('/api/users/login')
          }, 1000)
        } else {
          // If the token is valid, set the user object and call the next middleware
          req.user = user
          next()
        }
      })
    }
  },
}
