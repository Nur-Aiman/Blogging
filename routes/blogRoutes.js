var express = require('express') //import express module
var router = express.Router()
const {
  goToNextBlog,
  likePost,
  addComment,
  createPost,
  createPostPage,
  homePage,
} = require('../controllers/blogController')
const { authenticateToken } = require('../middleware/authenticateToken')
const { multer, Storage, bucket, upload } = require('../config/dbconfig')

router.use(authenticateToken)

router.get('/', homePage)
router.get('/nextBlog', goToNextBlog)
router
  .route('/createPost')
  .get(createPostPage)
  .post(upload.single('file'), createPost)
router.post('/likePost', likePost)
router.post('/addComment', addComment)

module.exports = router
