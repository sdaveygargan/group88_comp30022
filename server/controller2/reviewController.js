const Review = require("../model/review").Review;
const Comment = require("../model/comment");
const PendingReview = require("../model/review").PendingReview;
const Subject = require("../model/subject");
const User = require("../model/user").User;
const Student = require("../model/user").Student;
const mongoose = require("mongoose");

/**
 * @description Helper function that gets reviews based on fieldsOfInterest.
 *
 */
async function getReviewsByFieldOfInterest(req) {
  let reviews = [];
  let subjectIDs = [];
  let fieldsOfInterest = (await Student.findById(req.user._id)).fieldsOfInterest;
  /*
  if (fieldsOfInterest) {
    fieldsOfInterest.forEach((field) => {
      subjectIDs.push(Subject.find({fieldOfStudy: field}));
    });
  }

  for (const subjectID of subjectIDs) {
    const review = await Review.find({ subject: subjectID }).populate('subject').limit(5);
    reviews.push(review);
  }
  return reviews;*/
  return [];
}

exports.getHomepageReviews = async (req, res) => {
  let reviews = [];
  if (req.user) {
    console.log(req.user);
    if (req.user.type === "student") {
      const likedReviews = await Student.findById(req.user._id)["likedList"];
      if (likedReviews) {
        likedReviews.forEach((reviewID) => {
          reviews.push(Review.findById(reviewID).populate('subject'));
        });
      }
      // If no liked reviews, try field of interest
      if (reviews.length === 0) {
        reviews = await getReviewsByFieldOfInterest(req);
        // If no field of interest, default
        if (reviews.length === 0) {
          reviews = await Review.find().populate('subject').limit(20);
        }
        res.render("student/home", { title: "home", reviews: reviews });
      }
    } else {
      // Moderator
      reviews = await PendingReview.find();
      res.render("moderator/home", { reviews: reviews });
    }
  } else {
    // Guest
    reviews = await Review.find().populate('subject').limit(20);
    res.render("guest/home", { reviews: reviews });
  }
};
exports.getBrowsePageReviews = async (req, res) => {
  const reviews = await getReviewsByFieldOfInterest(req);
  console.log(reviews);
  res.render("student/browse", { title: "browse", reviews: reviews });
};

exports.getHistoryReviews = async (req, res) => {
  if (req.user.type === "moderator") {
    // Moderator has no history, should be redirected to home
    res.redirect("/home");
    return;
  }
  const query = { author: req.user._id };
  const reviews = await Review.find(query).populate('subject');
  const comments = await Comment.find(query);
  res.render("student/history", { title: "history", reviews: reviews, comments: comments});
};

exports.setStudentName = async (req, res, next) => {
  if (req.user) res.locals.fullName = req.user.fullName;
  next();
};

exports.postReview = async (req, res) => {
  let errors = [];
  const content = req.body.content;
  const author = req.user._id;
  //changed below for testing purposes
  //const subject = req.body.subject;
  const subject = req.body.subjectCode;
  //const rating = req.body.rating;
  const rating = 5;
  if (req.user.type === "moderator") {
    // Moderator has no post review capability, should be redirected to home
    res.redirect("/home");
    return;
  }

  if (!content || !subject || !rating) {
    console.log('no either one')
    errors.push({ message: "Not all fields correctly filled" });
  }

  if (!author) {
    console.log('no author!')
    errors.push({ message: "Author identification error" });
  }

  if (errors.length > 0) {
    console.log('i am in error')
    res.render("student/write_review.ejs", {
      errors,
      content,
      subject,
    });
    return;
  }

  const subjectResult = await Subject.findOne({
    subjectCode: req.body.subjectCode,
  });
  console.log(subjectResult._id);
  if (!subjectResult) {
    // Needs moderator attention
    console.log("Subject created with faulty code");
  } else {

    let reviewObject = {
      content: content,
      subject: subjectResult,
      author: req.user._id,
      isPrivate: req.body.private == 'on',
      isVisible: req.body.visible == 'on',
      rating: rating,
      comments: [],
    };
    
    try{
      let review = await Review.create(reviewObject)
      review = review.save();
      res.redirect('/home')
    }catch(err){
      console.log(err);
      res.render("student/write_review", { review: reviewObject });
    };
  }
};

exports.deleteReview = async (req, res) => {
  if (!req.user) {
    // Guest handling
  }
  const reviewID = req.params._id;
  if (req.user.type === "moderator" || req.user._id === reviewID) {
    // Authorised
  } else {
    // Not authorised
  }
};