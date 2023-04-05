const { Storage } = require('@google-cloud/storage')
const multer = require('multer')
require('dotenv').config()

//Server-side
var admin = require('firebase-admin')
var serviceAccount = require('../serviceAccountKey.json')

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
})

const db_admin = admin.firestore()

// Client-side
const { initializeApp } = require('firebase/app')
const { getFirestore } = require('firebase/firestore')
const { getAuth } = require('firebase/auth')
    //const firebase = require('firebase/app')
    //const { firestore } = require('firebase/firestore')

const firebaseConfig = {
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID,
    measurementId: process.env.MEASUREMENT_ID,
}

const app2 = initializeApp(firebaseConfig)

const auth = getAuth(app2)

const db_client = getFirestore(app2)

const storage = new Storage({
    projectId: process.env.STORAGE_PROJECT_ID,
    keyFilename: process.env.KEY_FILE_NAME,
})

const bucket = storage.bucket(process.env.STORAGE_BUCKET)

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (
            file.mimetype.startsWith('image/') ||
            file.mimetype.startsWith('video/')
        ) {
            cb(null, true)
        } else {
            cb(new Error('Only image and video files are allowed.'))
        }
    },
})

module.exports = {
    db_admin,
    db_client,
    app2,
    auth,
    multer,
    Storage,
    bucket,
    upload,
}