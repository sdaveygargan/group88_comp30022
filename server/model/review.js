import mongoose, {mongo} from "mongoose";


const subjectSchema = new mongoose.Schema({
    subjectCode: String,
    subjectName: String,
    fieldOfStudy: String,
    university: String
});

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    author: mongoose.Schema.Types.ObjectId, ref : 'User'
});

const reviewSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    author: mongoose.Schema.Types.ObjectId, ref : 'User',
    isPrivate: {
        type: Boolean,
        required: true,
        default: false
    },
    isVisible: {
        type: Boolean,
        required: true,
        default: true
    },
    subject: subjectSchema,
    rating: {
        type: Number,
        required: true
    },
    comments: [commentSchema],
    status: {
        type: String,
        enum : ['APPROVED', 'REQUIRES_SUBJECT_REVIEW', 'FLAGGED'],
        default: 'APPROVED'
    }
});

const Review = mongoose.model('Review', reviewSchema);
const Comment = mongoose.model('Comment', commentSchema);
const Subject = mongoose.model('Subject', subjectSchema);

module.exports = {Review, Comment, Subject}