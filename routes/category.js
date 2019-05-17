var express = require('express')
var router = express.Router()

var models = require('../models')
var Category = models["Category"]

// DISPLAY MY INTERESTED CATEGORIES AND ALL CATEGORIES
router.get('/:id/category', function(req, res){

  Category.find({name : {$nin : req.user.interested_categories}})
  .then(function(foundCategories){
    console.log('--')
    res.render('category/category', {foundCategories : foundCategories})
  })
  .catch(function(error){
    res.send(error)
  })
})


// LOGIC TO ADD CATEGORY INTO MY INTERESTED CATEGORIES
router.get('/:id/category/add/:category_name', function(req, res){
  req.user.interested_categories.push(req.params.category_name)
  req.user.save()

  res.send('Added')
})


// LOGIC TO REMOVE CATEGORY FROM MY INTERESTED CATEGORIES
router.get('/:id/category/remove/:category_name', function(req, res){
  var index = req.user.interested_categories.indexOf(req.params.category_name)
  if(index != -1){
    req.user.interested_categories.splice(index, 1)
    req.user.save()
    res.send('Removed')
  } else{
    res.send('Not Found')
  }

})

module.exports = router
