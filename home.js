//clientID - 35931138837-9g501p5mbt3t5ls1g041s4uoqcoomkrc.apps.googleusercontent.com
//clientSECRET - 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

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
// app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

//session 
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1/cafeteria');
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});


// user schema
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String
} ,{ versionKey: false });

//passport-local-mongoose
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const userDetails = new mongoose.model('Google-SignUps', userSchema);

passport.use(userDetails.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/index",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile)
    userDetails.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/', function(req, res){
    res.render("home");
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] }));


app.get('/index', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });  

app.get('/login', function(req, res){
    res.render("login")
})


app.get('/register', function(req, res){
    res.render("signup")
})

app.get('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });

  app.get("/secrets", async function (req, res) {
    try {
      if (req.isAuthenticated()) {
        const foundUsers = await userDetails.find({ 'secret': { $ne: null } }).lean();
  
        if (foundUsers) {
          res.redirect('http://localhost:3001')
        }
      } else {
        res.redirect("/login");
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  });
  
app.get('/submit', function(req,res){
  if(req.isAuthenticated()){

    res.render("submit");
    }
  else{
    res.redirect("/login");
   }
})

app.post('/register', async (req, res) => {
    try {
        const newUser = new userDetails({ username: req.body.username });
        await userDetails.register(newUser, req.body.password);
        passport.authenticate("local")(req, res, function () {
            res.redirect("/secrets");
        });
    } catch (err) {
        console.error(err);
        // Display a specific error message on the registration page
        res.render("signup", { registrationError: "Registration failed. Please try again." });
    }
});

app.post('/login', async(req, res) => {
    const user = new userDetails({
        username: req.body.username,
        password: req.body.password
    }) 
    req.login(user, function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })
});

app.listen(3000,function(){
    console.log("Server is running on port 3000.")
})
