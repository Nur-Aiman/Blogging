const {set, ref, get } = require('firebase/database')
const { v4: uuidv4 } = require('uuid')
const { auth } = require('../config/dbconfig')
var admin = require('firebase-admin')
const db = admin.firestore()
const { multer, Storage, bucket, upload } = require('../config/dbconfig')
var path = require('path')

module.exports = {
    //@desc Go to home page
    //@route GET /api/blogs
    //@access private
    homePage: async function homePage(req, res) {
        try {
            const postsRef = db.collection('BlogPosts')
            const snapshot = await postsRef.get()
            const posts = snapshot.docs.map((doc) => doc.data())
            const currentIndex = 0
            const currentPost = posts[currentIndex]
            const comments = currentPost.comments || []
            const userEmail = req.user.email

            // Find the next blog post
            let nextPostIndex = currentIndex + 1
            if (nextPostIndex >= posts.length) {
                nextPostIndex = 0 // wrap around to the first post
            }
            const nextPost = posts[nextPostIndex]

            const filesSnapshot = await db.collection('TestFiles').get()
            const files = filesSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }))

            res.render('home', {
                posts,
                currentIndex,
                currentPost,
                comments,
                userEmail,
                nextPost, // pass the next blog post data to the home template
            })
        } catch (error) {
            console.error('Error fetching post and file data:', error)
            res.status(500).send(`Error fetching post and file data: ${error}`)
        }
    },

    //@desc Navigate to next blog
    //@route GET /api/blogs/nextBlog
    //@access private
    goToNextBlog: async function goToNextBlog(req, res) {
        try {
            const postsRef = db.collection('BlogPosts')
            const snapshot = await postsRef.get()
            const posts = snapshot.docs.map((doc) => doc.data())
            let currentIndex = parseInt(req.query.currentIndex, 10)
            currentIndex = (currentIndex + 1) % posts.length
            const currentPost = posts[currentIndex]
            const nextIndex = (currentIndex + 1) % posts.length
            const nextPost = posts[nextIndex]
            const userEmail = req.user.email

            const filesSnapshot = await db.collection('TestFiles').get()
            const files = filesSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }))

            res.render('home', {
                posts,
                currentIndex,
                currentPost,
                comments: currentPost.comments || [],
                userEmail,
                nextPostTitle: nextPost.title,
                nextPostImageUrl: nextPost.imageUrl,
            })
        } catch (error) {
            console.error('Error fetching post and file data:', error)
            res.status(500).send(`Error fetching post and file data: ${error}`)
        }
    },

    //@desc Like post
    //@route POST /api/blogs/likePost
    //@access private
    likePost: async function likePost(req, res) {
        try {
            const postId = req.body.postId
            const postRef = db.collection('BlogPosts').doc(postId)
            const snapshot = await postRef.get()
            const post = snapshot.data()
            let newLikes
            if (!post.likedBy) {
                post.likedBy = [] // initialize the likedBy array if it doesn't exist
            }
            if (post.likedBy.includes(req.user.email)) {
                const index = post.likedBy.indexOf(req.user.email)
                post.likedBy.splice(index, 1)
                newLikes = post.likes - 1
            } else {
                post.likedBy.push(req.user.email)
                newLikes = post.likes + 1
            }
            await postRef.update({ likedBy: post.likedBy, likes: newLikes })
            res.json({ success: true, newLikes })
        } catch (error) {
            console.error('Error updating post data:', error)
            res.status(500).send(`Error updating post data: ${error}`)
        }
    },

    //@desc Comment post
    //@route POST /api/blogs/addComment
    //@access private
    addComment: async function addComment(req, res) {
        try {
            const { postId, comment } = req.body
            const postRef = db.collection('BlogPosts').doc(postId)
            const postDoc = await postRef.get()
            const post = postDoc.data()

            if (!post) {
                console.log(`Post with ID ${postId} not found`)
                res.status(404).send(`Post with ID ${postId} not found`)
                return
            }

            const newComment = { email: req.user.email, comment }

            if (!post.comments) {
                post.comments = [newComment]
            } else {
                post.comments.push(newComment)
            }

            await postRef.update(post)
            res.json({ success: true, newComment })
            console.log(`Post ID : ${postId}`)
        } catch (error) {
            console.error(`Error adding comment: ${error}`)
            res.status(500).send(`Error adding comment: ${error}`)
        }
    },

    //@desc Go to create post page
    //@route GET /api/blogs/createPost
    //@access private
    createPostPage: function createPostPage(req, res) {
        const userEmail = req.user.email
        res.render('createPost', { userEmail })
    },

    //@desc Create post
    //@route POST /api/blogs/createPost
    //@access private
    createPost: async function createPost(req, res) {
        const uuid = uuidv4()
        const { title, subheader, imageTitle, email, blogBody } = req.body

        if (!title) {
            res.status(400).send('Title is required')
            return
        }

        try {
            // Upload image/video file
            const uploadFile = req.file

            if (!uploadFile) {
                res.status(400).send('File is required')
                return
            }

            const ext = path.extname(uploadFile.originalname)
            const filename = `${uuid}${ext}`
            const blob = bucket.file(filename)

            const stream = blob.createWriteStream({
                metadata: {
                    contentType: uploadFile.mimetype,
                    metadata: {
                        firebaseStorageDownloadTokens: uuidv4(),
                    },
                },
            })

            stream.on('error', (error) => {
                console.error('Error uploading file:', error)
                res.status(500).send(`Error uploading file: ${error}`)
            })

            stream.on('finish', async() => {
                const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${
          bucket.name
        }/o/${encodeURIComponent(blob.name)}?alt=media&token=${
          blob.metadata.metadata.firebaseStorageDownloadTokens
        }`

                try {
                    // Save post data with downloadUrl of file
                    const postRef = db.collection('BlogPosts').doc(uuid)
                    await postRef.set({
                        ID: uuid,
                        title,
                        subheader,
                        imageTitle,
                        email,
                        blogBody,
                        comments: [],
                        likes: 0,
                        fileUrl: downloadUrl, // add download URL to Firestore document
                    })

                    res.redirect('/api/blogs/')
                        //res.send('OK')
                } catch (error) {
                    console.error('Error saving post data:', error)
                    res.status(500).send(`Error saving post data: ${error}`)
                }
            })

            stream.end(uploadFile.buffer)
        } catch (error) {
            console.error('Error uploading file:', error)
            res.status(500).send(`Error uploading file: ${error}`)
        }
    },
}