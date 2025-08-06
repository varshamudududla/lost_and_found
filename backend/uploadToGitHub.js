const express = require('express');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' }); // temporary folder for uploads

// ======= GitHub config =======
const GITHUB_TOKEN = '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-------github repoistery';  // replace with your token
const GITHUB_USERNAME = 'varshamudududla';
const GITHUB_REPO = 'post-images';
const BRANCH = 'main';

// ======= MySQL config =======
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  port:3307,
  password: 'varshaM@1001',
  database: 'lostandfound'
});

db.connect(err => {
  if (err) {
    console.error('MySQL connection error:', err);
    process.exit(1);
  }
  console.log('✅ Connected to MySQL');
});

// ======= Upload Route =======
app.post('/upload', upload.single('post_image'), async (req, res) => {
  try {
    const { name, email, postTitle, postDescription } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).send('No image file uploaded.');
    }

    // Read file as base64
    const fileContent = fs.readFileSync(file.path, { encoding: 'base64' });

    // GitHub API URL to upload image into images/ folder
    const githubApiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/images/${file.originalname}`;

    // Upload image to GitHub
    const response = await axios.put(githubApiUrl, {
      message: `Upload image ${file.originalname}`,
      content: fileContent,
      branch: BRANCH
    }, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    // Remove local file after upload
    fs.unlinkSync(file.path);

    // Construct public raw URL of the uploaded image
    const imageUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/${BRANCH}/images/${file.originalname}`;

    // Insert post data into MySQL
    const sql = `INSERT INTO Posts (name, email, imageUrl, postTitle, postDescription) VALUES (?, ?, ?, ?, ?)`;
    db.query(sql, [name, email, imageUrl, postTitle, postDescription], (err, result) => {
      if (err) {
        console.error('MySQL insert error:', err);
        return res.status(500).send('Database insert failed');
      }
      res.json({
        message: 'Post uploaded successfully!',
        postId: result.insertId,
        imageUrl
      });
    });
  } catch (error) {
    console.error('Error uploading post:', error.response?.data || error.message);
    res.status(500).send('Upload failed');
  }
});

// Start server
const PORT = 5000;
app.listen(5000, () => {
  console.log(`🚀 Server running at http://localhost:5000`);
});
