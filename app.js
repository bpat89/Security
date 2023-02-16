//Requiring the libraries
const express = require("express");
const bodyParser = require("body-Parser");
const ejs = require("ejs");
const app = express();
const mongoose = require("mongoose");
const encrypt = require('mongoose-encryption');
//connecting to MongoDB by mongoose
mongoose.set('strictQuery', true);
mongoose.connect("mongodb+srv://cloudconnect:cBh1BDtyfR8dPIB5@cluster0.tbojdni.mongodb.net/userDB")
//mongoose data
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
});

const secret = "This is a secret message."
userSchema.plugin(encrypt, { secret: secret , encryptedFields: ['password']});
const User = new mongoose.model("User", userSchema);
//app usage
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended:true
}));
//app routing
app.get("/", (req,res)=>{
    res.render("home")
});
app.get("/login", (req,res)=>{
    res.render("login")
});
app.route("/register")
.get((req,res)=>{
    res.render("register")
})
.post((req,res)=>{
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });
    newUser.save((err)=>{
        if(err){
            console.log(err)
        } else {
            res.render("secrets")
        }
    });
});

app.post("/login", (req,res)=>{
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({email:username},(err,foundUser)=>{
        if(err){ 
          console.log(err);          
        } else {
            if(foundUser){
                if(foundUser.password === password){
                    res.render("secrets")
                }
            }
        }

    })
})



app.listen(3000, ()=>{
  console.log("server is running on port 3000")  
});

