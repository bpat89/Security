//Requiring the libraries
require('dotenv').config()

const express = require("express");
const bodyParser = require("body-Parser");
const ejs = require("ejs");
const app = express();
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require("mongoose");
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findorcreate');
//app usage
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: process.env.CLIENT_SECRET,
  resave: false,
  saveUninitialized: false,
}));
//initialize passport
app.use(passport.initialize());
app.use(passport.session());

//connecting to MongoDB by mongoose
mongoose.set('strictQuery', true);
mongoose.connect("mongodb+srv://cloudconnect:cBh1BDtyfR8dPIB5@cluster0.tbojdni.mongodb.net/userDB")
//mongoose data
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = new mongoose.model("User", userSchema);
// use static authenticate method of model in LocalStrategy
passport.use(User.createStrategy());
// use static serialize and deserialize of model for passport session support
passport.serializeUser(function(user,done){
  done(null,user.id);
});
passport.deserializeUser(function(id,done){
  User.findById(id, function(err,user){
    done(err,user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
//app routing
app.get("/", (req, res) => {
  res.render("home")
});
app.get("/auth/google", passport.authenticate("google", { scope: ["profile"] }));

app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });

app.get("/login", (req, res) => {
  res.render("login")
});
app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  })
  req.login(user, (err)=>{
  if (err) {
    console.log(err);
  } else {
    passport.authenticate("local")(req,res,function(){
      res.redirect("/secrets");
    });
  }
});
});
//To logout
app.get('/logout', function(req, res, next){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});
//To Register
app.route("/register")
  .get((req, res) => {
    res.render("register")
  })
  .post(("/register", (req, res) => {
  User.register({username: req.body.username}, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });
}));

  app.get("/secrets",(req,res)=>{
    User.find({"secret":{$ne:null}}, function(err, foundUser){
      if(err){
        console.log(err);
      } else {
        if (foundUser){
          res.render("secrets", {userWithSecrets: foundUser});
        }
      }
    })
  })







  app.get("/secrets",(req,res)=>{
    if (req.isAuthenticated()){
      res.render("secrets");
    } else {
      res.redirect("/login");
    }
  });
  app.get("/submit",function(req,res){
    if (req.isAuthenticated()){
      res.render("submit");
    };
  });
  app.post("/submit",function(req,res){
    const submittedSecret = req.body.secret;
    console.log(req.user.id);
    User.findById(req.user.id, function(err,foundUser){
      if(err){
        console.log(err);
      } else {
        if (foundUser){
          foundUser.secret = submittedSecret;
          foundUser.save();
          res.redirect("/secrets");
        }
      }
    });
  });
app.listen(3000, () => {
  console.log("server is running on port 3000")
});
