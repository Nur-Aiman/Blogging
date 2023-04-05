const jwt = require('jsonwebtoken')
const {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
} = require('firebase/auth')
    //const admin = require('firebase-admin')
    //const { auth } = require('../config/dbconfig')
const credentials = require('../serviceAccountKey.json')
const { db_admin } = require('../config/dbconfig')
const { db_client, auth } = require('../config/dbconfig')

module.exports = {
    //@desc Login user
    //@route POST /api/users/login
    //@access public
    login: async function login(req, res) {
        const { email, password } = req.body

        try {
            // Authenticate the user using Firebase Authentication
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            )
            const accessToken = jwt.sign(
                userCredential.user.toJSON(),
                process.env.ACCESS_TOKEN_SECRET
            )
            console.log(
                `Login successful. Current user: Email: ${email} Password: ${password}`
            )
            res.cookie('access_token', accessToken, { httpOnly: true })
            console.log('COOKIES')

            res.redirect('/api/blogs/')
        } catch (error) {
            var errorCode = error.code
            var errorMessage = error.message
            console.log(`Login failed. Error : ${errorMessage} Code : ${errorCode}`)

            if (errorCode === 'auth/user-not-found') {
                req.flash('error', 'User not found')
            } else if (errorCode === 'auth/wrong-password') {
                req.flash('error', 'Invalid password')
            } else {
                req.flash('error', 'An error occurred while logging in')
            }

            res.redirect('/api/users/login')
        }
    },

    //@desc Register a user
    //@route POST /api/users/signup
    //@access public
    signup: async function signup(req, res) {
        const user = {
            email: req.body.email,
            password: req.body.password,
        }

        try {
            // Create the user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                user.email,
                user.password
            )
            const uid = userCredential.user.uid
            console.log(`Registered user with email ${user.email} and UID ${uid}`)

            res.redirect('/api/users/login')
        } catch (error) {
            const errorCode = error.code
            const errorMessage = error.message
            console.error(`Error creating user: ${errorMessage} (${errorCode})`)

            if (errorCode === 'auth/email-already-in-use') {
                req.flash('error', 'Email already in use')
            } else if (errorCode === 'auth/invalid-email') {
                req.flash('error', 'Invalid email address')
            } else if (errorCode === 'auth/weak-password') {
                req.flash('error', 'Weak password. Password must contain at least 8 characters')
            } else {
                req.flash('error', 'An error occurred while signing up')
            }

            res.redirect('/api/users/signup')
        }
    },


    //@desc Go to login page
    //@route GET /api/users/login
    //@access public
    loginPage: function loginPage(req, res) {
        return res.render('login')
    },

    //@desc Go to sign up page
    //@route GET /api/users/signup
    //@access public
    signupPage: function signupPage(req, res) {
        return res.render('signup')
    },

    //@desc Logout user and go to home page
    //@route GET /api/users/logout
    //@access private
    logout: function logout(req, res) {
        res.clearCookie('access_token')
        res.redirect('/')
    },
}