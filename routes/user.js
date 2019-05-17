var express = require('express')
var router = express.Router()

var models = require('../models')
var User = models['User']
var Post = models['Post']
var Category = models['Category']
var Pipe = models['Pipe']
var Group = models['Group']


// API OF USER PROFILE PAGE
router.get('/api/user/profile/:skip', function(req, res){

  // FIND POSTS WHOSE AUTHOR IS CURRENT USER
  Post.find({author:req.user}).populate('author').sort({time:-1}).skip(Number(req.params.skip)).limit(2).exec()
  .then(function(foundPosts){
    res.json(foundPosts)
  })
  .catch(function(error){
    console.log(error)
    res.send(error)
  })
})


// DISPLAY PROFILE PAGE
router.get('/:id/profile', function(req, res){

  // FIND POSTS WHOSE AUTHOR IS CURRENT USER
  Post.find({author:req.user}).populate('author').sort({time:-1}).skip(Number(req.params.skip)).sort({time: -1}).limit(5)
  .then(function(foundPosts){

    // TO SHOW WHILE CREATING POST
    Category.find()
    .then(function(foundCategories){

      // TO SHOW WHILE CREATING POST
      Group.find({members:req.user._id})
      .then(function(foundGroups){
        res.render('user/profile', {AllPosts:foundPosts, foundCategories:foundCategories, foundGroups: foundGroups})
      })
      .catch(function(error){
        console.log(error)
      })

    })
    .catch(function(error){
      console.log(error)
    })
  })
  .catch(function(error){
    console.log(error)
  })
})



// API OF NEWS FEED -> USER HOME PAGE
router.get('/api/user/home/:skip', function(req, res){
  var skip = Number(req.params.skip)
  // FIND PIPES THAT MATCH EITHER OF THE CONDITIONS:
  //   1. SHOW ACCESS IDS INCLUDE CURRENT USER
  //   2. PIPE'S CATEGORY NAME IS USER'S INTEREST AND AUTHOR SHOULD BE NEITHER FRIEND NOR ACQUAINTANCE NOR HIMSELF
  //       AND SHOW ACCESS MUST BE UNCONNECTED/BROADCAST
  Pipe.find({$or:[{show_access_ids : req.user._id}, {category_name:{$in:req.user.interested_categories}, activity_owner :{$nin: [...req.user.friends, ...req.user.acquaintances, req.user]}, show_access:"unconnected"}]}).populate('activity_owner').populate({path:'post',populate:{path:'author'}}).sort({time:-1}).skip(skip).limit(2).exec()
  .then(function(foundPipes){
    res.json(foundPipes)
  })
  .catch(function(error){
    console.log(error)
  })
})


// Display HOME PAGE
router.get('/:id/home', function(req, res){

  // FIND PIPES THAT MATCH EITHER OF THE CONDITIONS:
  //   1. SHOW ACCESS IDS INCLUDE CURRENT USER
  //   2. PIPE'S CATEGORY NAME IS USER'S INTEREST AND AUTHOR SHOULD BE NEITHER FRIEND NOR ACQUAINTANCE NOR HIMSELF
  //       AND SHOW ACCESS MUST BE UNCONNECTED/BROADCAST
  Pipe.find({$or:[{show_access_ids : req.user._id}, {category_name:{$in:req.user.interested_categories}, activity_owner :{$nin: [...req.user.friends, ...req.user.acquaintances, req.user]}, show_access:"unconnected"}]}).populate('activity_owner').populate({path:'post',populate:{path:'author'}}).sort({time:-1}).limit(5).exec()
  .then(function(foundPipes){

    // TO SHOW WHILE CREATING POST
    Group.find({members:req.user._id})
    .then(function(foundGroups){

      // TO SHOW WHILE CREATING POST
      Category.find()
      .then(function(foundCategories){

        res.render("user/home", {foundPipes:foundPipes, foundGroups:foundGroups, foundCategories:foundCategories})
      })
      .catch(function(error){
        console.log(error)
      })

    })
    .catch(function(error){
      console.log(error)
    })


  })
  .catch(function(error){
    res.send(error)
  })

})




// DISPLAY FRIENDS-ACQUAINTANCES PAGE
router.get('/:id/friends-acquaintances', function(req, res){

  // FETCH CURRENT USER WITH POPULATED friends ARRAY
  User.findOne({_id : req.user._id}).populate('friends').populate('acquaintances').exec()
  .then(function(foundUser){
    res.render('user/friends_acquaintances', {foundUser : foundUser})
  })
  .catch(function(error){
    console.log(error)
    res.send(error)
  })

})




// DISPLAY FRIEND-ACQUAINTANCE REQUESTS PAGE
router.get('/:id/friend-requests', function(req, res){

  // FETCH CURRENT USER WITH POPULATED friend_requests ARRAY
  User.findOne({_id : req.user._id}).populate('friend_requests').populate('acquaintance_requests').exec()
  .then(function(foundUser){
    res.render('user/friend_acquaintance_requests', {foundUser : foundUser})
  })
  .catch(function(error){
    console.log(error)
    res.send(error)
  })

})

// DISPLAY SENT REQUESTS PAGE THAT DISPLAYS SENT FRIEND REQUESTS AND SENT ACQUAINTANCE REQUESTS
router.get('/:id/sent-requests', function(req, res){

  // FETCH CURRENT USER WITH POPULATED sent_friend_requests AND sent_acquaintance_requests ARRAY
  User.findOne({_id : req.user._id}).populate('sent_friend_requests').populate('sent_acquaintance_requests').exec()
  .then(function(foundUser){
    res.render('user/sent_requests', {foundUser : foundUser})
  })
  .catch(function(error){
    console.log(error)
    res.send(error)
  })

})



module.exports = router
