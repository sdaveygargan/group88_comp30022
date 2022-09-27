const auth = require("../services/auth");
const reviewController = require("../controller2/reviewController");
const subjectController = require("../controller2/subjectController");
const express = require("express");
const router = express.Router();
const passport = require("passport");

router.get("/", (req, res) => {
  let code = req.query.code;

  if (code) {
    res.redirect("/subject/" + code);
  } else {
    res.redirect("/browse");
  }
});

router.get("/:subjectCode", subjectController.loadSubjectPage);
router.param("subjectCode", (req, res, next, subjectCode) => {
  next();
});
router.get("/:subjectCode/review/:id", subjectController.loadSingleReview);

// @desc Add comment to review
// @route /POST
router.post("/:subjectCode/review/:id", subjectController.addComment);

// @desc Add thumbs up to review
// @route PATCH
router.patch("/:subjectCode/review/:id", subjectController.likeReview);

router.get("/", (req, res) => {
  res.status(404);
});

router.post("/subject/:subjectCode", subjectController.postReview);

module.exports = router;
