const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const app = express();
require("dotenv").config();

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
  "mongodb+srv://ashusingh_007:ashu2309@mycluster0.bp0om.mongodb.net/?retryWrites=true&w=majority",
  { useNewUrlParser: true }
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

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

app.get("/", function (req, res) {
  var isauth = 0;
  var currUser;
  if (req.isAuthenticated()) {
    isauth = 1;
    currUser = req.user;
  }
  res.render("home", { isauth: isauth, currUser: currUser });
});

app.get("/login", function (req, res) {
  var isauth = 0;
  var currUser;
  if (req.isAuthenticated()) {
    isauth = 1;
    currUser = req.user;
  }
  res.render("login", { isauth: isauth, currUser: currUser });
});
app.get("/signup", function (req, res) {
  var isauth = 0;
  var currUser;
  if (req.isAuthenticated()) {
    isauth = 1;
    currUser = req.user;
  }
  res.render("signup", { isauth: isauth, currUser: currUser });
});

app.get("/discussion", function (req, res) {
  var isauth = 0;
  var currUser;
  if (req.isAuthenticated()) {
    isauth = 1;
    currUser = req.user;
    Question.find({}, function (err, questions) {
      if (err) {
        console.log(err);
      } else {
        res.render("discussion", {
          questions: questions,
          isauth: isauth,
          currUser: currUser,
        });
      }
    });
  } else {
    res.redirect("/login");
  }
});
app.get("/discussion/:sorting", function (req, res) {
  var sortType = req.params.sorting;
  var isauth = 0;
  var currUser;
  if (req.isAuthenticated()) {
    isauth = 1;
    currUser = req.user;
    Question.find({}, function (err, questions) {
      if (err) {
        console.log(err);
      } else {
        questions.sort(function (a, b) {
          if (sortType == "Most Viewed") {
            return a.views < b.views ? -1 : a.views > b.views ? 1 : 0;
          } else if (sortType == "Most Liked") {
            return a.likes < b.likes ? -1 : a.likes > b.likes ? 1 : 0;
          } else if (sortType == "Most Answered") {
            return a.answer.length < b.answer.length
              ? -1
              : a.answer.length > b.answer.length
              ? 1
              : 0;
          }
        });
        res.render("discussion", {
          questions: questions,
          isauth: isauth,
          currUser: currUser,
        });
      }
    });
  } else {
    res.redirect("/login");
  }
});
app.post("/discussion", function (req, res) {
  res.redirect("/discussion/" + req.body.sortType);
});
app.get("/ask", function (req, res) {
  var isauth = 0;
  var currUser;
  if (req.isAuthenticated()) {
    isauth = 1;
    currUser = req.user;
    res.render("ask", { isauth: isauth, currUser: currUser });
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

app.get("/answers/:questionId", function (req, res) {
  var isauth = 0;
  var currUser;
  if (req.isAuthenticated()) {
    isauth = 1;
    currUser = req.user;
    const questionId = req.params.questionId;
    Question.findById(questionId, function (err, question) {
      question.views = question.views + 1;
      question.save();
      res.render("answers", {
        isauth: isauth,
        currUser: currUser,
        question: question,
      });
    });
  } else {
    res.redirect("/login");
  }
});
app.get("/likes/:questionId", function (req, res) {
  const questionId = req.params.questionId;
  Question.findById(questionId, function (err, question) {
    question.likes = question.likes + 1;
    question.save();
    res.redirect("/discussion");
  });
});
app.get("/profile/:userID", function (req, res) {
  var isauth = 0;
  var currUser;
  if (req.isAuthenticated()) {
    isauth = 1;
    currUser = req.user;
    const userId = req.params.userID;
    var sameUser = 0;

    User.findById(userId, function (err, user) {
      if (currUser._id == userId) {
        sameUser = 1;
        console.log("GOOD");
        res.render("profile", {
          isauth: isauth,
          currUser: currUser,
          user: user,
          sameUser: sameUser,
        });
      } else {
        res.render("profile", {
          isauth: isauth,
          currUser: currUser,
          user: user,
          sameUser: sameUser,
        });
      }
    });
  } else {
    res.redirect("/login");
  }
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
        res.redirect("/signup");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/discussion");
        });
      }
    }
  );
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, function (err) {
    if (err) {
      console.log(err);
      res.redirect("login");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/discussion");
      });
    }
  });
});

app.post("/ask", function (req, res) {
  var isauth = 1;
  var currUser = req.user;
  const newQuest = new Question({
    postedBy: currUser,
    quest: req.body.quest,
    likes: 0,
    views: 0,
  });
  newQuest.save();
  res.redirect("/discussion");
});

app.post("/answers/:questionId", function (req, res) {
  var isauth = 1;
  var currUser = req.user;
  const questionId = req.params.questionId;
  Question.findById(questionId, function (err, question) {
    question.answer.push({ answer: req.body.ans, name: currUser.name });
    question.save();
    res.redirect("/answers/" + question._id);
  });
});

app.listen(process.env.PORT || 3000, function (req, res) {
  console.log(`Server started`);
});
