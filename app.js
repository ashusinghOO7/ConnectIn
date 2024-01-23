const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const passportLocalMongoose = require("passport-local-mongoose");
require("dotenv").config();

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
mongoose.set("useCreateIndex", true);

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(
  "mongodb+srv://ashusingh_007:Connect-to-ashu@connectinn.8t8eawe.mongodb.net/your_database_name?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  }
);

const userSchema = new mongoose.Schema({
  username: String,
  name: String,
  branch: String,
  year: String,
  college: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

const questAndAnswerSchema = new mongoose.Schema({
  email: String,
  quest: String,
  postedBy: userSchema,
  answer: [
    {
      answer: String,
      name: String,
    },
  ],
  likes: Number,
  views: Number,
});

const Question = mongoose.model("Question", questAndAnswerSchema);

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
  const isauth = req.isAuthenticated();
  const currUser = req.user;
  res.render("home", { isauth, currUser });
});

app.get("/login", function (req, res) {
  const isauth = req.isAuthenticated();
  const currUser = req.user;
  res.render("login", { isauth, currUser });
});

app.get("/signup", function (req, res) {
  const isauth = req.isAuthenticated();
  const currUser = req.user;
  res.render("signup", { isauth, currUser });
});

app.post("/signup", function (req, res) {
  User.register(
    {
      username: req.body.username,
      name: req.body.name,
      branch: req.body.branch,
      year: req.body.year,
      college: req.body.college,
    },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        return res.redirect("/signup");
      }
      passport.authenticate("local")(req, res, function () {
        res.redirect("/discussion");
      });
    }
  );
});

app.post("/login", passport.authenticate("local", {
  successRedirect: "/discussion",
  failureRedirect: "/login",
}));

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

// Discussion Routes
app.get("/discussion", isAuthenticated, function (req, res) {
  Question.find({}, function (err, questions) {
    if (err) {
      console.log(err);
      return res.redirect("/login");
    }
    const isauth = true;
    const currUser = req.user;
    res.render("discussion", { questions, isauth, currUser });
  });
});

app.get("/discussion/:sorting", isAuthenticated, function (req, res) {
  const sortType = req.params.sorting;
  Question.find({}, function (err, questions) {
    if (err) {
      console.log(err);
      return res.redirect("/login");
    }
    questions.sort(function (a, b) {
      if (sortType === "Most Viewed") {
        return a.views - b.views;
      } else if (sortType === "Most Liked") {
        return a.likes - b.likes;
      } else if (sortType === "Most Answered") {
        return a.answer.length - b.answer.length;
      }
    });
    const isauth = true;
    const currUser = req.user;
    res.render("discussion", { questions, isauth, currUser });
  });
});

app.post("/discussion", isAuthenticated, function (req, res) {
  res.redirect("/discussion/" + req.body.sortType);
});

// Profile Route
app.get("/profile/:userID", isAuthenticated, function (req, res) {
  const userId = req.params.userID;
  const sameUser = req.user._id == userId;
  User.findById(userId, function (err, user) {
    if (err) {
      console.log(err);
      return res.redirect("/login");
    }
    const isauth = true;
    const currUser = req.user;
    res.render("profile", { user, isauth, currUser, sameUser });
  });
});

// Ask Route
app.get("/ask", isAuthenticated, function (req, res) {
  const isauth = true;
  const currUser = req.user;
  res.render("ask", { isauth, currUser });
});

app.post("/ask", isAuthenticated, function (req, res) {
  const currUser = req.user;
  const newQuest = new Question({
    postedBy: currUser,
    quest: req.body.quest,
    likes: 0,
    views: 0,
  });
  newQuest.save();
  res.redirect("/discussion");
});

// Answers Route
app.get("/answers/:questionId", isAuthenticated, function (req, res) {
  const questionId = req.params.questionId;
  Question.findById(questionId, function (err, question) {
    if (err) {
      console.log(err);
      return res.redirect("/login");
    }
    question.views += 1;
    question.save();
    const isauth = true;
    const currUser = req.user;
    res.render("answers", { question, isauth, currUser });
  });
});

app.post("/answers/:questionId", isAuthenticated, function (req, res) {
  const questionId = req.params.questionId;
  Question.findById(questionId, function (err, question) {
    if (err) {
      console.log(err);
      return res.redirect("/login");
    }
    question.answer.push({ answer: req.body.ans, name: req.user.name });
    question.save();
    res.redirect("/answers/" + question._id);
  });
});

// Likes Route
app.get("/likes/:questionId", isAuthenticated, function (req, res) {
  const questionId = req.params.questionId;
  Question.findById(questionId, function (err, question) {
    if (err) {
      console.log(err);
      return res.redirect("/login");
    }
    question.likes += 1;
    question.save();
    res.redirect("/discussion");
  });
});

app.listen(process.env.PORT || 3000, function (req, res) {
  console.log(`Server started`);
});


// Middleware to check authentication
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}