const express = require('express');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config({path: '.env'});
const mongoose = require('mongoose');
const path = require('path');
const req = require('express/lib/request');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 5000;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.get('/',(req,res)=>{
  res.status(200).json({"running":"perfectly API"});

});
// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('MONGO_URI:', process.env.MONGO_URI);
// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Atlas connected'))
  .catch(err => console.error('Connection error:', err));
// Define MongoDB schema and model


const postSchema = new mongoose.Schema({
  name: String,
  email: String,
  postTitle: String,
  postDescription: String,
  imageUrl: String,
  phone: String,
  approved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);
app.get('/', (req, res) => {
  res.json({ message: 'API running' });
});

// Multer setup for local uploads
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // rename file
  }
});
const upload = multer({ storage });

// Upload route (save to DB here)
app.post('/upload', upload.single('post_image'), async (req, res) => {
  try {
    const file = req.file;
    console.log('BODY:', req.body);
console.log('FILE:', req.file);


    if (!file) return res.status(400).send('No image uploaded.');

    // Note: when using 'multipart/form-data', req.body is populated by multer automatically
    const { name, email, postTitle, postdescription, phone } = req.body;
const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;


    const newPost = new Post({
      name,
      email,
       phone,
      postTitle,
      postDescription: postdescription,
      imageUrl,
       
    });

    await newPost.save();
   res.status(200).json({ message: 'Post saved successfully!'});
//if (res.ok) window.location.href = './index.html';


  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).send('Server error');
  }
});


// GET all posts with optional filters and pagination
/*app.get('/all-posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const title = req.query.title || '';
    const email = req.query.email || '';
    const limit = 5;
    const skip = (page - 1) * limit;

    const query = {
      approved: false,
      postTitle: { $regex: title, $options: 'i' },
      email: { $regex: email, $options: 'i' }
    };

    const posts = await Post.find(query).skip(skip).limit(limit).exec();
    const total = await Post.countDocuments(query);

    res.json({
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load posts." });
  }
}); 

// PATCH: approve/reject a post
app.patch('/posts/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { approved } = req.body;
  try {
    await Post.findByIdAndUpdate(id, { approved });
    res.json({ message: `Post ${approved ? 'approved' : 'rejected'}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update post status.' });
  }
});
*/
// Get all posts
app.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error('Fetch posts error:', err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

app.listen(5000, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
