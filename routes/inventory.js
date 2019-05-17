var express = require('express')
var router = express.Router()

var multer = require("multer")
var path = require("path")
var fs = require("fs")

var models = require('../models')
var User = models['User']
var Post = models['Post']
var Group = models['Group']
var Category = models['Category']
var Pipe = models['Pipe']

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






// VIEW INVENTORY
router.get('/:id/inventory', function(req, res){

  // POPULATE INVENTORIES OF CURRENT USER
  User.findOne({_id : req.user._id}).populate('inventories').exec()
  .then(function(foundUser){

    // SORTING THE INVENTORIES
    var allInventories = foundUser.inventories
    allInventories.sort(function(a,b){
      var dateA = new Date(a.time)
      var dateB = new Date(b.time)
      return dateB - dateA;
    })

    res.render('inventory/inventories', {foundUser : foundUser, AllInventories:allInventories})
  })
  .catch(function(error){
    console.log(error)
    res.send(error)
  })
})


// DISPLAY CREATE INVENTORY PAGE
router.get('/:id/inventory/new', function(req, res){
    res.render('inventory/create.ejs')
})



// LOGIC TO CREATE INVENTORY
router.post('/:id/inventory', function(req, res){
  // CREATING NEW INVENTORY
  //ASSIGNING AUTHOR TO INVENTORY
  // PUSHING createdPost INTO CURRENT USER'S inventory ARRAY


  FILES = []
  MIME_TYPES = []
  upload(req,res,function(err) {
    // console.log(req.body);
    //console.log(req.files);
    if(err) {
      console.log(err)
      return res.end("Error uploading file.");
    }


    // CREATING NEW INVENTORY
    var newInventory = {
      post : req.body['inventory'],
      quantity : Number(req.body['quantity']),
      price : Number(req.body['price']),
      type_of_post : 'inventory',
      images : []
    }

    FILES.forEach(function(FILE_NAME, i){
      var image = {}
      image["data"] = fs.readFileSync(__dirname.replace('\\routes', '')+"\\public\\uploads\\"+FILE_NAME)
      image["contentType"] = MIME_TYPES[i]
      image["base64"] = new Buffer(image["data"], 'binary').toString('base64')
      newInventory["images"].push(image)
    })

    Post.create(newInventory)
    .then(function(createdPost){

      //ASSIGNING AUTHOR TO INVENTORY
      createdPost.author = req.user
      createdPost.save()

      // PUSHING createdPost INTO CURRENT USER'S inventory ARRAY
      req.user.inventories.push(createdPost)
      req.user.save()


      res.redirect('/' + req.user._id + '/inventory')
    })
    .catch(function(error){
      console.log(error)
      res.send(error)
    })


  })
})



// DISPLAY AN IMAGE ON CLICK
router.get('/:id/inventory/:inventory_id/image/:index', function(req, res){
  Post.findOne({_id : req.params.inventory_id})
  .then(function(foundPost){

    res.contentType(foundPost.images[Number(req.params.index)]["contentType"])
    res.send(foundPost.images[Number(req.params.index)]["data"]['buffer'])
  })
  .catch(function(error){
    console.log(error)
    res.send(error)
  })
})







// DELETE INVENTORY


// DISPLAY SHARE INVENTORY PAGE
router.get('/:id/inventory/:inventory_id/share', function(req, res){
  // POPULATING FRIENDS AND GROUPS OF CURRENT USER
  // FINDING THE INVENTORY TO SHARE

  // POPULATING FRIENDS AND GROUPS OF CURRENT USER
  User.findOne({_id : req.user._id}).populate('friends').populate('groups').exec()
  .then(function(foundUser){
    // FINDING THE INVENTORY TO SHARE
    Post.findOne({_id : req.params.inventory_id})
    .then(function(foundPost){
      Category.find()
      .then(function(foundCategories){
        res.render('inventory/share', {foundUser: foundUser, foundInventory: foundPost, foundCategories: foundCategories})
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
  .catch(function(error){
    console.log(error)
    res.send(error)
  })

})

// LOGIC TO SHARE INVENTORY
router.post('/:id/inventory/:inventory_id/share', function(req, res){
  // ONLY THE OWNER OF INVENTORY CAN HIT THIS ROUTE TO SHARE HIS INVENTORY.
  // OTHER USERS WILL SHARE THE SHARED_INVENTORIES AS A POST

  // CREATING NEW POST WITH NEW PRICE AND NEW QUANTITY
  // PUSHING newPost TO CURRENT USER'S shared_inventories_by_me ARRAY
  // PUSHING newPost TO foundPost'S children_posts ARRAY
  // PUSHING foundPost TO newPost'S parent_post
  // PUSHING newPost TO SELECTED FRIENDS'S shared_inventories
  // PUSHING newPost TO SELECTED GROUPS'S posts
  // PUSHING newPost TO CURRENT USER'S posts ARRAY IF HE SELECTED TO SHARE AS A POST ALSO
  // ASSIGNING show_access TO newPost IF CURRENT USER SELECTED TO SHARE AS A POST



  Post.findOne({_id : req.params.inventory_id})
  .then(function(foundInventory){



    // CREATING NEW POST WITH NEW PRICE AND NEW QUANTITY
    var newPost = {
      post : req.body['inventory'],
      quantity : req.body['quantity'],
      price : Number(req.body['price']),
      type_of_post : foundInventory['type_of_post'],
      images : foundInventory['images'],
      author : req.user
    }

    Post.create(newPost)
    .then(function(newPost){

      // PUSHING newPost TO CURRENT USER'S shared_inventories_by_me ARRAY
      req.user.shared_inventories_by_me.push(newPost)
      // req.user.save()

      // PUSHING newPost TO foundPost'S children_posts ARRAY
      foundInventory.children_posts.push(newPost)
      foundInventory.save()

      // PUSHING foundPost TO newPost'S parent_post
      newPost.parent_post = foundInventory
      // newPost.save()

      // req.body will be in format:
      // {"Friend-5c90c2db3c463e7e7075953c" : "rishabh", "Group-5c90c2db3c463e7e7075953c" : "our-group" }

      // PUSHING newPost TO SELECTED FRIENDS
      // PUSHING newPost TO SELECTED GROUPS
      // PUSHING newPost TO CURRENT USER'S posts ARRAY IF HE SELECTED TO SHARE AS A POST ALSO




      var putInCategory = false // It will be true when user selected 'broadcase as post'
      var category_name;

      var pipe_show_access_ids = []
      var pipe_show_access = []
      var pipe_group_ids = []
      //Object.entries iterates through an Javascript Object
      Object.entries(req.body).forEach(function(array){
        // array will be in format : [ 'Friend-5c90c2db3c463e7e7075953c', 'rishabh' ]
        // or  [ 'Group-5c90c2db3c463e7e7075953c', 'our-group' ]


        var category = array[0].split("-")[0]  // Friend/Group/Post
        var id = array[0].split("-")[1]

        if(category == "Friend"){
          User.findOne({_id : id})
          .then(function(foundFriend){
            foundFriend.shared_inventories.push(newPost)
            foundFriend.save()
          })
          .catch(function(error){
            console.log(error)
            res.send(error)
          })
        } else if(category == 'Group'){


            pipe_group_ids.push(id)

            Group.findOne({_id : id})
            .then(function(foundGroup){
              foundGroup.posts.push(newPost)
              foundGroup.save()
            })
            .catch(function(error){
              console.log(error)
              res.send(error)
            })
        }


        // ASSIGN SHOW ACCESS IF USER SELECTED TO POST ALSO
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
          req.user.posts.push(newPost)
          newPost.show_access.push('friend')
          pipe_show_access_ids.push(...req.user.friends)
          pipe_show_access.push('friend')
        }
        if(acquaintance == 1){
          req.user.posts.push(newPost)
          newPost.show_access.push('acquaintance')
          pipe_show_access_ids.push(...req.user.acquaintances)
          pipe_show_access.push('acquaintance')
        }
        if(unconnected == 1){
          req.user.posts.push(newPost)
          newPost.show_access.push('unconnected')
          pipe_show_access.push('unconnected')
        }

        // Putting the post in specified category if user selected "broadcast"
        if(array[0] == 'category'){
          if(putInCategory){

            category_name = array[1]

            Category.findOne({name:category_name})
            .then(function(foundCategory){
              foundCategory.posts.push(newPost)
              foundCategory.save()
            })
            .catch(function(error){
              console.log("Error Sharing Inventory")
            })
          }
        }


      })

      newPost.save()

      var newPipe = {}
      newPipe['activity_owner'] = req.user,
      newPipe['activity_caption'] = req.user.name + ' shared his inventory',
      newPipe['time'] = Date.now()
      newPipe['post'] = newPost
      newPipe['group_ids'] = pipe_group_ids // STRINGS
      newPipe['show_access_ids'] = pipe_show_access_ids
      newPipe['show_access'] = pipe_show_access

      if(putInCategory){
        newPipe['category_name'] = category_name
      }

      req.user.save()

      Pipe.create(newPipe)
      .then(function(createdPipe){
        res.redirect('/'+req.user._id+'/inventory')
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
  .catch(function(error){
    console.log(error)
    res.send(error)
  })

})

// DISPLAY SHARED INVENTORIES PAGE
router.get('/:id/shared-inventory', function(req, res){
  // POPULATE shared_inventories OF CURRENT USER
  User.findOne({_id : req.user._id}).populate({path : 'shared_inventories', populate:{path : 'author', model:'User'}}).exec()
  .then(function(foundUser){
    res.render('inventory/shared_inventories', {foundUser : foundUser})
  })
  .catch(function(error){
    console.log(error)
    res.send(error)
  })
})


// DISPLAY SHARED INVENTORIES BY ME PAGE
router.get('/:id/shared-inventory-by-me', function(req, res){
  // POPULATE shared_inventories OF CURRENT USER
  User.findOne({_id : req.user._id}).populate('shared_inventories_by_me').exec()
  .then(function(foundUser){
    res.render('inventory/shared_inventories_by_me', {foundUser : foundUser})
  })
  .catch(function(error){
    console.log(error)
    res.send(error)
  })
})


module.exports = router
