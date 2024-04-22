//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const bcrypt = require("bcrypt");
const saltrounds = 10;  
const router = express.Router();
const app = express();

// Set up middleware for parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set('view engine', 'ejs');

const PORT = process.env.PORT || 3002;

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1/cafeteria');
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});


// feedback schema
const signupSchema = new mongoose.Schema({
  fName: String,
  lName: String,
  phone: Number,
  email_address: String,
  insta_id: String,
  setupCredentials:{
    userName: String,
    password: String
  }
} ,{ versionKey: false });

const UserDetails = mongoose.model('signup-details', signupSchema);

app.post('/login', async (req, res) => {
  const userName= req.body.userName;
    const password = req.body.password;

    try {
      const existingRecord = await UserDetails.findOne({
        'setupCredentials.userName': userName
      });
      if (!existingRecord) {
        // No matching record found
        return res.status(401).send('Invalid username.');
      }

        // Compare the encrypted form of the entered password with the stored encrypted password
        bcrypt.compare(password, existingRecord.setupCredentials.password, async(err, result) => {
            if(result === true)
            {
              res.redirect('http://localhost:3001');
            }
            else {
               // Passwords do not match
               res.status(401).send("Wrong Password.");
           }
            })
            // Passwords match, user is authenticated
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Handle feedback form submissions
app.post('/signup', async (req, res) => {
  let personName, personLName;
    try {
        const { email_address } = req.body;
    
        // Check if a record with the given email address already exists
        const existingRecord = await UserDetails.findOne({ email_address });
    
        if (existingRecord) {
          // Account already exists
          return res.status(400).send('An account with this email address already exists!');
        }

        //Save new login details
        const newUser = new UserDetails(req.body);
        await newUser.save();

        personName = req.body.fName;
        personLName = req.body.lName;

        console.log('personName:', personName)
        
      
      res.redirect(`/signup-2?personName=${personName}&personLName=${personLName}`);
        // res.status(201).send('You have successfully signed up!');
      } 
      catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error!');
      }

});



app.get('/signup-2', (req, res) => {
  const personName = req.query.personName;
  const personLName = req.query.personLName;
  res.render('signup2', {personName, personLName});
});

// app.post('/submit-credentials', (req,res) =>{
//   const{ userName, password} = req.body;

//   res.send(`Credentials submitted successfully! Username: ${userName}, Password: ${password}`);
// })

app.post('/submit-credentials', async (req, res) => {
  bcrypt.hash(req.body.password, saltrounds, async(err,hash) => {
    try {
      const email_address= req.body.email_address;
      const userName=req.body.userName;
        // const userData = req.body;
        const existingRecord = await UserDetails.findOne({ email_address });
        if (!existingRecord) {
          return res.status(404).send('User not found');
        }
        const password=hash;
        existingRecord.setupCredentials={userName,password};
        await existingRecord.save();
        console.log(userName);
        res.status(200).redirect('http://localhost:3001');
      } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Internal Server Error'});
      }    
});
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
