const User = require("../model/user").User;
const Student = require("../model/user").Student;
const Moderator = require("../model/user").Moderator;
const expressValidator = require("express-validator");

exports.createStudent = (req, res) => {
    console.log(req.body);
    const {username, fullName, email, password} = req.body;
    let errors = [];

    if (username || fullName || email || password){
        errors.push({message: "All fields required"});
    }

    if (req.body.password.length < 5) {
        errors.push({message: "Password should be at least 5 characters"});
    }

    if (errors.length > 0){
        res.render('/signup.ejs', {
            errors,
            fullName,
            email,
            password,
            username
        });
    }
    const query = { username: req.body.username, email: req.body.email};
    console.log(query);
    User.find(query).then(data => {
        if (data.length !== 0){
            console.log(`${req.body.username} or ${req.body.email} already exist in user database.`);
            res.status(400).send({ message : "Error, username or email already exist in database"});
            res.redirect('/signup');
            return;
        }
        console.log("here")
        Student.create(req.body).
        then(data => {
            console.log(data);
            //req.flash("success_msg", "You are now registered.");
            res.redirect("/signup/choose_interests");
        }).
        catch(err =>{
            res.status(500).send({
                message : err.message || "Some error occurred while creating a create operation"
            });
        });

    });
}