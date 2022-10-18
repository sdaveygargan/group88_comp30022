const Review = require("../model/review").Review;
const pendingReview = require("../model/review").PendingReview;
const Comment = require("../model/comment");
const Subject = require("../model/subject");
const User = require("../model/user").User;
const Student = require("../model/user").Student;
const mongoose = require("mongoose");

exports.loadSubjectPage = async (req, res) => {
  const result = req.subject;
  //console.log('i am here')
  //console.log(result);
  if (result) {
    const reviews = await Review.find({
      subject: result._id,
      isVisible: true,
    }).populate("author");

    if (req.user) {
      let total_rating = 0;
      for(let i = 0; i < reviews.length; i++){
        total_rating = total_rating + reviews[i].rating
      }
      //console.log(Math.round(total_rating/reviews.length))
      console.log('in viiew subject page')
      res.render("student/view_subject", {
        subject: result,
        reviews: reviews,
        avg_rating: Math.round(total_rating/reviews.length)
      });
    } else {
      // Guest
      res.render("guest/view_subject_guest", {
        subject: result,
        reviews: reviews,
      });
    }
  } else {
    res.redirect("/error404");
  }
};

exports.loadSingleReview = async (req, res) => {
  const review = await Review.findById(req.params.id)
    .populate("comments")
    .populate("subject")
    .populate("author");

  if (!review) {
    res.redirect("/error404");
    return;
  }

  let comments = [];
  for (const comment of review.comments) {
    comments.push(await comment.populate("author"));
  }
  //review.comments = comments;
  console.log(review);

  if (req.user) {
    // Logged in mode
    res.render("./student/view_review", {
      review: review,
      subjectCode: req.params.subjectCode,
    });
  } else {
    // Guest mode
    res.render("guest/view_review_guest", {
      review: review,
      subjectCode: req.params.subjectCode,
    });
  }
};

exports.postReview = async (req, res) => {
  const subject = req.subject;

  let review = new Review({
    subject: subject._id,
    subjectCode: subject.subjectCode,
    subjectName: subject.subjectName,
    content: req.body.content,
    isPrivate: req.body.isPrivate,
    isVisible: req.body.isVisible,
    rating: req.body.rating,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  try {
    review = await review.save();
    //console.log(review)
    res.redirect(`/subject/${req.body.subjectCode}/review/${review._id}`);
  } catch (e) {
    console.log(e);
    res.render("student/write_review", { review: review });
  }
};
exports.findSubject = async (req, res, next) => {
  let subjectCode = "";
  
  if (!req.params.subjectCode) {
    subjectCode = req.body.subjectCode;
  } else {
    subjectCode = req.params.subjectCode;
  }
  const subject = await Subject.findOne({$or: [
    {subjectCode: new RegExp(`^${subjectCode}$`, 'i')},
    {subjectName: new RegExp(`^${subjectCode}$`, 'i')}
]});
 
  if (subject) {
    res.locals.subjectCode = subject.subjectCode;
    res.locals.subjectName = subject.subjectName;
  }
  req.subject = subject;
  next();
};

exports.flaggedReview = async (req, res) => {
  const review = await Review.findById(req.params.id);
  let reviewObject = {
    content: review.content,
    subject: review.subject,
    author: review.author,
    isPrivate: review.isPrivate,
    isVisible: review.isVisible,
    rating: review.rating,
    comments: review.comments,
    createdAt: review.createdAt,
    status: "FLAGGED",
  };
  await pendingReview.create(reviewObject);
  await Review.findByIdAndDelete(req.params.id);
  res.redirect(`/subject/${req.params.subjectCode}`);
};

exports.deleteReview = async (req, res) => {
  console.log("i am in delete");
  const review = await Review.findById(req.params.id);
  if (
    req.user.type === "moderator" ||
    review.author.toString() === req.user._id.toString()
  ) {
    await Review.findByIdAndDelete(req.params.id)
      .then((data) => {
        if (!data) {
          res.status(404).send({
            message: `Cannot delete with id ${req.params.id}. Is the id correct?`,
          });
        } else {
          res.redirect(`/subject/${req.params.subjectCode}`);
        }
      })
      .catch((err) => {
        res.status(500).send({
          message: `Could not delete review with id=${req.params.id}`,
        });
      });
  } else {
    res.redirect(`/subject/${req.params.subjectCode}`);
  }
};

exports.addComment = async (req, res) => {
  const content = req.body.content;
  const authorID = req.user._id;

  const reviewID = req.params.id;

  const newComment = await Comment.create({
    content: content,
    author: authorID,
  });
  console.log(newComment);
  console.log(reviewID);
  await Review.findByIdAndUpdate(reviewID, {
    $push: { comments: newComment },
  }).then((data) => {
    console.log(data);
    if (!data) {
      res.status(404).send({
        message: `Cannot update review with ${reviewID}. Is the id correct?`,
      });
    } else {
      console.log("We get here ");
      res.redirect(
        `/subject/${req.params.subjectCode}/review/${req.params.id}`
      );
    }
  });
};
exports.getSubjectList = async (req, res, next) => {
  res.locals.subjectList = (await Subject.find()).map(
    (subject) => subject.subjectCode
  );
  next();
};

exports.deleteComment = async (req, res) => {
  console.log("delete comment called");
  const reviewID = req.params.id;
  const commentID = req.params.commentID;

  const comment = await Comment.findById(commentID);
  if (
    req.user.type === "moderator" ||
    comment.author.toString() === req.user._id.toString()
  ) {
    await Comment.findByIdAndDelete(commentID);
    const review = await Review.findByIdAndUpdate(reviewID, {
      $pull: { comments: commentID },
    });
    console.log(commentID);
    console.log(review);
    res.redirect(`/subject/${req.params.subjectCode}/review/${req.params.id}`);
  } else {
    res.redirect(`/subject/${req.params.subjectCode}/review/${req.params.id}`);
  }
};

exports.likeReview = async (req, res) => {
  const reviewID = req.params.id;

  if (!req.user){
    res.redirect("/login");
  }
  if (req.user.type === "moderator") {
    console.log("moderator attempted liking review");
    return;
  }

  const student = await Student.findById(req.user._id);
  if (student.likedList.includes(reviewID)) {
    // Student cannot like comment more than once
    return;
  } else {
    console.log("correct up to herre");
    console.log(
      await Student.findByIdAndUpdate(req.user._id, {
        $push: { likedList: reviewID },
      })
    );
  }
  const reviewUpdated = await Review.findByIdAndUpdate(reviewID, {
    $inc: { nLikes: 1 },
  });

  if (!reviewUpdated) {
    console.log("review liking error");
  }
  // redirect back to the page POST request came from with new review
  res.redirect("back");
};

exports.likeComment = async (req, res) => {
  const commentID = req.params.commentID;
  if (req.user.type === "moderator") {
    res.redirect("back");
    console.log("moderator attempted liking");
  }
  const student = await Student.findById(req.user._id);
  if (student.likedComments.includes(commentID)) {
    // Student cannot like comment more than once
    return;
  } else {
    await Student.findByIdAndUpdate(req.user._id, {
      $push: { likedComments: commentID },
    });
  }
  const commentUpdated = await Comment.findByIdAndUpdate(commentID, {
    $inc: { nLikes: 1 },
  });

  if (!commentUpdated) {
    console.log("comment liking error");
  }

  res.redirect("back");
};