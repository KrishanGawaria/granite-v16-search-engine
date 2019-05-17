var skip = 3
// SO THAT INITIALLY IT CAN SKIP 5. 5 ARE ALREADY RENDERED BY SERVER



var callApi = true

function process() {

  callApi = false

  skip = skip + 2

  $.get('/api/user/profile/'+skip.toString())
  .then(function(Posts){


    if(Posts.length == 0){
      callApi = false
      return
    }

    Posts.forEach(function(Post){
      // MAIN SECTION ITEM
      var main_section_item = $('<div class="main-section-item"></div>')

      //  POST_AUTHOR POST.POST

      var post_author = $('<div class="main-section-item-author main-section-subitem"><a href="#">'+Post.author.username+'</a></div>')
      var post_post = $('<div class="main-section-item-post main-section-subitem">'+Post.post+'</div>')

      // IMAGES
      var image_item = $('<div class="main-section-item-post-image main-section-subitem"></div>')
      Post.images.forEach(function(Image, index){
        var image_subitem = $('<div class="main-section-item-post-image-subitem">')
        image_subitem.append('<a href="/'+100+'/post/'+Post._id+'/image/'+index+'"><img width=500px src="data:image/png;base64,'+Image["base64"]+'"></a>')
        image_item.append(image_subitem)
      })

      // QUANTITY PRICE COMMENT SHARE
      var qty_price_comment_share = $('<div class="main-section-item-qty-price-comments main-section-subitem"></div>')
      var qty = $('<div class="main-section-item-qty-price-comments-subitem">Quantity: <span id="quantity">'+Post.quantity+'</span></div>')
      var price = $('<div class="main-section-item-qty-price-comments-subitem">Price: <span id="price">'+Post.price+'</span></div>')
      var comment = $('<div class="main-section-item-qty-price-comments-subitem"><a href="/'+100+'/post/'+Post._id+'/comment">Comments</a></div>')
      var share = $('<div class="main-section-item-qty-price-comments-subitem"><a href="/'+100+'/post/'+Post._id+'/share">Share</a></div>')
      if(Post["type_of_post"] == "inventory"){
        qty_price_comment_share.append(qty)
        qty_price_comment_share.append(price)
      }
      qty_price_comment_share.append(comment)
      qty_price_comment_share.append(share)

      var block_div = $('<div class="main-section-item-block-form main-section-subitem"></div>')
      var block_form = $('<form action="/'+100+'/post/'+Post._id+'/block" method="POST"></form>')
      var form_flex = $('<div class="form-flex form-group"></div>')
      form_flex.append($('<input class="form-flex-item form-control" type="text" name="quantity" placeholder="Enter quantity to Block">'))
      form_flex.append($('<button class="form-flex-item btn btn-primary" style="background: black;">Block</button>'))
      block_form.append(form_flex)
      block_div.append(block_form)




      main_section_item.append(post_author)
      main_section_item.append(post_post)
      main_section_item.append(image_item)
      main_section_item.append(qty_price_comment_share)
      if(Post["type_of_post"] == "inventory"){
        main_section_item.append(block_div)
      }

      $('.main-section').append(main_section_item)

    })

    callApi = true

  })
  .catch(function(error){
    callApi = true
    console.log(error)
  })

}

// LOGIC TO DETECT WHEN USER HAS SCROLLED TO BOTTOM OF PAGE
$(window).scroll(function() {
  if($(window).scrollTop() + $(window).height() > $(document).height() - 100) {
    // USER IS AT BOTTOM OF PAGE
    if(callApi){
      process()
    }
   }
});



$('#broadcast_checkbox').change(function() {
    if($('#broadcast_checkbox').is(":checked")) {
        $('#select-category').removeClass('hide')
    } else {
        $('#select-category').addClass('hide')
    }
});


// window.onload = process
