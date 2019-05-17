var express = require('express')
var router = express.Router()

var models = require('../models')
var Comment = models['Comment']
var Message = models['Message']
var Post = models['Post']

// DISPLAY ALL REPLIES OF A COMMENT
router.get('/:id/post/:post_id/comment/:comment_id/reply', function(req, res){

  Comment.findOne({_id : req.params.comment_id}).populate('author').populate({path:'replies', populate:{path:'author', model:'User'}})
  .then(function(foundComment){
    Post.findOne({_id: req.params.post_id}).populate('author').exec()
    .then(function(foundPost){
      res.render('reply/replies', {foundComment : foundComment, foundPost : foundPost})
    })
    .catch(function(error){
      res.send(error)
    })

  })
  .catch(function(error){
    console.log(error)
    res.send(error)
  })
})


// LOGIC TO CREATE A REPLY AND APPEND TO COMMENT'S replies
router.post('/:id/post/:post_id/comment/:comment_id/reply', function(req, res){
  // CREATING NEW REPLY (MESSAGE)
  // ASSIGNING author TO CREATED REPLY
  // ASSIGNING CREATED REPLY TO THE COMMENT



  // CREATING NEW REPLY (MESSAGE)

  var newReply = {
    message : req.body['message']
  }

  Message.create(newReply)
  .then(function(createdReply){
    // ASSIGNING author TO CREATED REPLY
    createdReply.author = req.user
    createdReply.save()

    Comment.findOne({_id : req.params.comment_id})
    .then(function(foundComment){
      // ASSIGNING CREATED REPLY TO THE COMMENT
      foundComment.replies.push(createdReply)
      foundComment.save()

      res.redirect('/'+req.user._id+'/post/'+req.params.post_id+'/comment/'+req.params.comment_id+'/reply')
    })
    .catch(function(error){
      console.log(error)
      res.send(error)
    })
  })
  .catch(function(error){
    console.log(error)
    res.send(error)
  })

})

module.exports = router
