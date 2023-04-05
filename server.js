const express = require('express')
const app = express()
const path = require('path')
const jwt = require('jsonwebtoken')
const flash = require('express-flash')
const session = require('express-session')
const cookieParser = require('cookie-parser')
    //const db = require('./config/dbconfig')
const { v4: uuidv4 } = require('uuid')
const axios = require('axios')
require('dotenv').config()
    //const { auth } = require('./config/dbconfig')
const { authenticateToken } = require('./middleware/authenticateToken')
const { ref, get } = require('firebase/database')
const multer = require('multer')
const { Storage } = require('@google-cloud/storage')

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(flash())
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    })
)
app.use('/images', express.static('images'))

app.use('/api/users', require('./routes/userRoutes'))
app.use('/api/blogs', require('./routes/blogRoutes'))

app.get('/', (req, res) => {
    res.render('welcome')
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}.`)
})