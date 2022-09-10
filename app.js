/////// app.js

const express = require("express");
const bcrypt = require("bcryptjs");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const mongoDb =
  "mongodb+srv://m0001-student:Komputer8@cluster0.lczpxbg.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(mongoDb, { useUnifiedTopology: true, useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));

const User = mongoose.model(
  "User",
  new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
  })
);

const app = express();
app.set("views", __dirname);
app.set("view engine", "ejs");

app.use(session({ secret: "cats", resave: false, saveUninitialized: true }));
passport.use(
  new LocalStrategy((username, password, done) => {
    User.findOne({ username: username }, (err, user) => {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }
      bcrypt.compare(password, user.password, (err, res) => {
        if (!res) {
          // passwords do not match!
          return done(null, false, { message: "Incorrect password" });
        }
      });

      return done(null, user);
    });
  })
);
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

app.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  next();
});

app.get("/", (req, res) => {
  res.render("index", { user: req.user });
});
app.get("/sign-up", (req, res) => res.render("sign-up-form"));
app.get("/log-out", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

// app.post("/sign-up", (req, res, next) => {
//       const user = new User({
//         username: req.body.username,
//         password: req.body.password,
//       }).save((err) => {
//         if (err) {
//           return next(err);
//         }
//         res.redirect("/");
//       });

//     });
app.post("/sign-up", (req, res, next) => {
  const hash = bcrypt.hashSync(req.body.password, 10);
  const user = new User({
    username: req.body.username,
    password: hash,
  }).save((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});
// app.post("/sign-up", (req, res, next) => {
//   bcrypt.hash(req.body.password, 10, function (err, hash) {
//     if (err) {
//       return res.status(500).json({ error: err });
//     } else {
//       const user = new User({
//         username: req.body.username,
//         password: hash,
//       }).save((err) => {
//         if (err) {
//           return next(err);
//         }
//         res.redirect("/");
//       });
//     }
//   });
// });
// app.post("/sign-up", async (req, res, next) => {
//   try {
//     const { username, password } = req.body;

//     const hash = await bcrypt.hash(password, 10);
//     await db("users").insert({ username: username, hash: hash });

//     res.redirect("/");
//   } catch (e) {
//     // console.log(e); // Uncomment if needed for debug
//     // If a SQLITE_CONSTRAINT has been violated aka. row with that email already exists. You can read more: https://www.sqlite.org/c3ref/c_abort.html
//     if (e.errno === 19) {
//       res.status(400).json("A user with that email already exists!");
//     } else {
//       res.status(400).json("Something broke!");
//     }
//   }
// });
// app.post("/sign-up", async (req, res, next) => {
//   try {
//     const { username, password } = req.body;

//     if (!username || !password) {
//       res.status(400).json(`Missing ${!username ? "username" : "password"}!`);
//     }

//     const hash = await bcrypt.hash(password, 10);
//     await db("users").insert({ username: username, hash: hash });

//     res.status(200).json("All good!");
//   } catch (e) {
//     // console.log(e); // Uncomment if needed for debug
//     // If a SQLITE_CONSTRAINT has been violated aka. row with that email already exists. You can read more: https://www.sqlite.org/c3ref/c_abort.html
//     if (e.errno === 19) {
//       res.status(400).json("A user with that email already exists!");
//     } else {
//       res.status(400).json("Something broke!");
//     }
//   }
// });

app.post(
  "/log-in",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/",
  })
);

app.listen(3000, () => console.log("app listening on port 3000!"));
