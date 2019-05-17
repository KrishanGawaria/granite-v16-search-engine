var express = require('express')
var router = express.Router()

var multer = require("multer")
var path = require("path")
var fs = require("fs")

var models = require("../models")
var User = models["User"]
var Post = models["Post"]
var Group = models["Group"]
var Category = models["Category"]
var Pipe = models["Pipe"]

var FILES = []
var MIME_TYPES = []

var storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './public/uploads');
  },
  filename: function (req, file, callback) {

    FILES.push(file.fieldname+"-"+Date.now()+path.extname(file.originalname))
    callback(null, file.fieldname+"-"+Date.now()+path.extname(file.originalname));
  }
});

var upload = multer({
    storage : storage ,
    fileFilter: function(req, file, cb){
        checkFileType(file, cb);
    }

}).array('userPhoto',20);

function checkFileType(file, cb){
    var filetypes= /jpeg|JPEG|jpg|JPG|png|PNG|gif|GIF/;
    var extname= filetypes.test(path.extname(file.originalname));
    var mimetype= filetypes.test(file.mimetype);

    // console.log("Mime Type: "+file.mimetype.toString())
    MIME_TYPES.push(file.mimetype.toString())

    if(mimetype && extname){
        return cb(null, true);
    } else{
        cb("Error: Images Only")
    }
}







// LOGIC TO CREATE POST
router.post('/:id/post', function(req, res){

  // CREATE A newPost. It's type_of_post is 'casual' so that it doesn't display form to block.
  // APPEND IMAGES INTO IT
  // PUSHING createdPost INTO CURRENT USER'S posts ARRAY
  // ASSIGNING show_access TO POST


  FILES = []
  MIME_TYPES = []
  upload(req,res,function(err) {

    if(err) {
      console.log(err)
      return res.end("Error uploading file.");
    }


    var newPost = {
      post : req.body["post"],
      // quantity : Number(req.body["quantity"]),
      // price : Number(req.body['price']),
      type_of_post : 'casual',
      images : [],
      author : req.user
    }

    FILES.forEach(function(FILE_NAME, i){
      var image = {}
      image["data"] = fs.readFileSync(__dirname.replace('\\routes', '')+"\\public\\uploads\\"+FILE_NAME)
      image["contentType"] = MIME_TYPES[i]
      image["base64"] = new Buffer(image["data"], 'binary').toString('base64')
      newPost["images"].push(image)
    })


    // CREATING POST
    Post.create(newPost)
    .then(function(createdPost){

      // PUSHING createdPost INTO CURRENT USER'S posts ARRAY
      req.user.posts.push(createdPost)
      req.user.save()


      var putInCategory = false // It will be true when user selected 'broadcase as post'
      var category_name; // It will contain the name of the category assigned to past

      // VARIABLES TO ASSIGN WHILE CREATING PIPE
      var pipe_show_access_ids = []
      var pipe_show_access = []
      var pipe_group_ids = []

      // ASSIGNING show_access TO POST
      Object.entries(req.body).forEach(function(array){

        var friend = -1
        var acquaintance = -1
        var unconnected = -1

        if(array[0] == 'friend'){
          friend = 1
        } else if(array[0] == 'acquaintance'){
          acquaintance = 1
        } else if(array[0] == 'unconnected'){
          unconnected = 1
          putInCategory = true
        }

        if(friend == 1){
          createdPost.show_access.push('friend')
          pipe_show_access_ids.push(...req.user.friends)
          pipe_show_access.push('friend')
        }
        if(acquaintance == 1){
          createdPost.show_access.push('acquaintance')
          pipe_show_access_ids.push(...req.user.acquaintances)
          pipe_show_access.push('acquaintance')
        }
        if(unconnected == 1){
          createdPost.show_access.push('unconnected')
          pipe_show_access.push('unconnected')
        }

        // PUSHING THE POST TO SPECIFIED GROUPS
        var category = array[0].split("-")[0]  // Friend/Group
        if(category == 'Group'){

          var id = array[0].split("-")[1]
          pipe_group_ids.push(id)

          Group.findOne({_id : id})
          .then(function(foundGroup){
            foundGroup.posts.push(createdPost)
            foundGroup.save()
          })
          .catch(function(error){
            console.log(error)
            res.send(error)
          })
        }


        // Putting the post in specified category if user selected "broadcast"

        if(array[0] == 'category'){
          if(putInCategory){
            category_name = array[1]
            // ASSIGNING category_name IN createdPost
            createdPost.category_name = category_name

            Category.findOne({name:category_name})
            .then(function(foundCategory){

              foundCategory.posts.push(createdPost)
              foundCategory.save()
            })
            .catch(function(error){
              console.log(error)
            })
          }
        }



      }) // END OF Object.entries()

      // CREATE A PIPE OF THIS POST


      createdPost.save()
      
      var newPipe = {}
      newPipe['activity_owner'] = req.user,
      newPipe['activity_caption'] = '',
      newPipe['time'] = Date.now()
      newPipe['post'] = createdPost
      newPipe['group_ids'] = pipe_group_ids // STRINGS
      newPipe['show_access_ids'] = pipe_show_access_ids
      newPipe['show_access'] = pipe_show_access

      if(putInCategory){
        newPipe['category_name'] = category_name
      }

      Pipe.create(newPipe)
      .then(function(createdPipe){
        res.send('Posted with Pipe creation')
      })
      .catch(function(error){
        console.log(error)
        res.send(error)
      })



    })
    .catch(function(error){
      console.log(error)
      res.send('Error creating post')
    })

  });
})



// DISPLAY AN IMAGE ON CLICK
router.get('/:id/post/:post_id/image/:index', function(req, res){
  // SINCE ONE POST HAS MULTIPLE IMAGES. SO WE RECEIVE INDEX IN THE ROUTE
  Post.findOne({_id : req.params.post_id})
  .then(function(foundPost){

    res.contentType(foundPost.images[Number(req.params.index)]["contentType"])
    res.send(foundPost.images[Number(req.params.index)]["data"]['buffer'])
  })
  .catch(function(error){
    console.log(error)
    res.send(error)
  })
})




// DISPLAY SHARE POST PAGE
router.get('/:id/post/:post_id/share', function(req, res){

  // POPULATING FRIENDS AND GROUPS OF CURRENT USER
  User.findOne({_id : req.user._id}).populate('friends').populate('groups').exec()
  .then(function(foundUser){
    // FINDING THE POST TO SHARE
    Post.findOne({_id : req.params.post_id}).populate('author').exec()
    .then(function(foundPost){
      res.render('post/share', {foundUser: foundUser, foundPost: foundPost})
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





// LOGIC TO SHARE POST
router.post('/:id/post/:post_id/share', function(req, res){

  // FIND THE POST TO SHARE
  // PUSHING foundPost TO SELECTED FRIENDS'S shared_inventories
  // PUSHING foundPost TO SELECTED GROUPS'S posts

  Post.findOne({_id : req.params.post_id}).populate('author').exec()
  .then(function(foundPost){

    // req.body will be in format:
    // {"Friend-5c90c2db3c463e7e7075953c" : "rishabh", "Group-5c90c2db3c463e7e7075953c" : "our-group" }

    //Object.entries iterates through an Javascript Object
    var pipe_group_ids = []
    var share_as_post = false
    Object.entries(req.body).forEach(function(array){
      // array will be in format : [ 'Friend-5c90c2db3c463e7e7075953c', 'rishabh' ]
      // or  [ 'Group-5c90c2db3c463e7e7075953c', 'our-group' ]

      var category = array[0].split("-")[0]  // Friend/Group
      var id = array[0].split("-")[1]



      if(category == "Group"){

        pipe_group_ids.push(id)

        // PUSHING THE POST INTO THE GROUP
        Group.findOne({_id : id})
        .then(function(foundGroup){
          foundGroup.posts.push(foundPost)
          foundGroup.save()



        })
        .catch(function(error){
          console.log(error)
          res.send(error)
        })
      }


      // PUTTING THE POST INTO USER'S activity_logs IF HE SELCTED TO SHARE AS POST
      if(array[0] == "Post-Post"){

        share_as_post = true

      }


    }) // END OF Object.entries()


    var newPipe= {
      show_access_ids : [],
      group_ids : pipe_group_ids,
      activity_owner : req.user,
      activity_caption : req.user.username + ' shared ' + foundPost.author.username + '\'s post',
      time : Date.now(),
      post : foundPost
    }

    if(share_as_post){
      newPipe['show_access_ids'] = [...req.user.friends, ...req.user.acquaintances]
    }


    Pipe.create(newPipe)
    .then(function(createdPipe){
      console.log('createdPipe')
    })
    .catch(function(error){
      console.log(error)
    })


    res.send("Post Successfully Shared")

  })
  .catch(function(error){
    console.log(error)
    res.send(error)
  })

})





module.exports = router
