const express = require('express')
const mongoose = require('mongoose')
const Review = require('./../model/review');
const Subject = require('./../model/subject');
const router = express.Router();

router.get('/', async (req,res) => {
    const reviews = await Review.find().populate('subject');
    res.render('student/home', { reviews : reviews })
})

router.get('/browse', (req,res) => {
    res.render('student/browse')
})

router.get('/history', async (req,res) => {
    const reviews = await Review.find().populate('subject');
    res.render('student/history', { reviews : reviews })
})

router.get('/write_review', (req,res) => {
    res.render('student/write_review', {review : new Review()})
})

router.get('/view_review', async (req,res) => {
    const result = await Subject.find({subjectCode : req.body.subjectCode})
    console.log(result)
    
    //res.render('student/view_review' , { reviews : reviews })
})

router.get('/:id', async (req,res) =>{
    const review = await Review.findById(req.params.id)
    const same_subjectcode = await Review.find({subjectCode : review.subjectCode})
    if(review == null){
        res.redirect('/')
    }
    //res.send(req.params.id)
    res.render('student/view_review', { review : review , same_subjectcode : same_subjectcode})
})

router.post('/', async (req,res) =>{
    
    const result = await Subject.find({subjectCode : req.body.subjectCode})
    //console.log(result)
    let review = new Review({   
        subject : result[0]._id,
        subjectCode : result[0].subjectCode,
        subjectName: result[0].subjectName,
        content: req.body.content,
        isPrivate: false,
        isVisible: true,
        rating: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
    })
    try{
        review = await review.save()
        //console.log(review)
        res.redirect(`/student/${review.id}`)
    }catch(e){
        console.log(e)
        res.render('student/write_review', { review : review})
    }
    
})

module.exports = router