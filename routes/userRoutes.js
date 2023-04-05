var express = require('express') //import express module
var router = express.Router()
const {
  login,
  signup,
  logout,
  loginPage,
  signupPage,
} = require('../controllers/userController')
const { authenticateToken } = require('../middleware/authenticateToken')

router.route('/login').get(loginPage).post(login)
router.route('/signup').get(signupPage).post(signup)
router.get('/logout', authenticateToken, logout)

module.exports = router
