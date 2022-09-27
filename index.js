const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const mongoose = require("mongoose");
const mySecret = process.env["MONGO_URI"];
mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true });

const schema = mongoose.Schema;

const userSchema = new schema({
  username: { type: String, unique: true, required: true },
});
const USER = mongoose.model("USER", userSchema);

const exerciseSchema = new schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, min: 1, required: true },
  date: { type: Date, default: Date.now },
});
const EXERCISE = mongoose.model("EXERCISE", exerciseSchema);

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", (req, res) => {
  let userName = req.body.username;
  let userId = "";

  USER.findOne({ username: userName }, (err, data) => {
    if (!err && data === null) {
      let newUser = new USER({ username: userName });

      newUser.save((err, data) => {
        if (!err) {
          userId = data["_id"];
          return res.json({ username: userName, _id: userId });
        }
      });
    } else return res.json({ error: "username already exists" });
  });
});

app.post("/api/users/:_id/exercises", (req, res) => {
  if (req.params._id === "") {
    return res.json({ error: "userId is required" });
  }
  if (req.body.description === "") {
    return res.json({ error: "description is required" });
  }
  if (req.body.duration === "") {
    return res.json({ error: "duration is required" });
  }

  let userId = req.params._id;
  let description = req.body.description;
  let duration = req.body.duration;
  let date = req.body.date !== "" ? new Date(req.body.date) : new Date();

  USER.findById(userId, (err, data) => {
    if (!err && data !== null) {
      let newExercise = new EXERCISE({
        userId: userId,
        description: description,
        duration: duration,
        date: date,
      });

      newExercise.save((err2, data2) => {
        if (!err2) {
          return res.json({
            _id: data["_id"],
            username: data.username,
            date: data2.date.toDateString(),
            duration: data2.duration,
            description: data2.description,
          });
        }
      });
    } else {
      return res.json({ error: "user not found" });
    }
  });
});

app.get("/api/users/", (req, res) => {
  USER.find({}, (err, data) => {
    if (!err) {
      res.json(data);
    }
  });
});

app.get("/api/users/:_id/logs", (req, res) => {
  if (req.params._id === "") {
    return res.json({ error: "user not found" });
  }
  let userId = req.params._id;
  let findParam = { userId: userId };

  USER.findById(userId, (err, data) => {
    if (!err && data !== null) {
      EXERCISE.find(findParam, (err2, data2) => {
        if (!err2) {
          return res.json({
            _id: data._id,
            username: data.username,
            count: data2.length,
            log: data2.map((elem) => {
              return {
                description: elem.description,
                duration: elem.duration,
                date: elem.date.toDateString(),
              };
            }),
          });
        }
      });
    } else return res.json({ error: "user not found" });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});


