// nodemon server2.js
const passport = require("passport");
const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const flash = require("express-flash");
const session = require("express-session");
const path = require("path");
const app = express();
const connectDB = require("./server/database/connection");


dotenv.config({ path: "config.env" });
const PORT = process.env.PORT || 8080;

require('./server/services/passport')(passport)
connectDB();


app.use(flash());

// Global vars
/*
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.local.error_msg = req.flash('error_msg');
    next();
})*/

// Session
app.use(
    session({
        // The secret used to sign session cookies (ADD ENV VAR)
        secret: process.env.SESSION_SECRET || "keyboard cat",
        name: "user", // The cookie name (CHANGE THIS)
        saveUninitialized: false,
        resave: false,
        cookie: {
            sameSite: "strict",
            httpOnly: true,
            secure: app.get("env") === "production",
        },
    })
);
app.use(passport.initialize());
app.use(passport.session());


// Express session and flash
app.use(express.json());

// View engine
app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "views"));
app.use(express.static(__dirname + "/"));

// Bodyparser
app.use(bodyParser.urlencoded({ extended: true }));

//Morgan for development
app.use(morgan("tiny"));

// Routes
app.use('/', require('./server/routes2/index.js'));

// Listen on port
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
