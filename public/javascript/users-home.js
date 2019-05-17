var skip = 3
// SO THAT INITIALLY IT CAN SKIP 5. 5 ARE ALREADY RENDERED BY SERVER

var callApi = true



function process() {

  callApi = false

  skip = skip + 2

  $.get('/api/user/home/'+skip.toString())
  .then(function(Pipes){


    if(Pipes.length == 0){
      callApi = false
      return
    }

    Pipes.forEach(function(Pipe){
      // MAIN SECTION ITEM
      var main_section_item = $('<div class="main-section-item"></div>')

      // ACTIVITY_CAPTION POST_AUTHOR POST.POST
      var activity_caption = $('<div class="main-section-item-author main-section-subitem">'+Pipe.activity_caption+'</div>')
      var post_author = $('<div class="main-section-item-author main-section-subitem"><a href="#">'+Pipe.post.author.username+'</a></div>')
      var post_post = $('<div class="main-section-item-post main-section-subitem">'+Pipe.post.post+'</div>')

      // IMAGES
      var image_item = $('<div class="main-section-item-post-image main-section-subitem"></div>')
      Pipe.post.images.forEach(function(Image, index){
        var image_subitem = $('<div class="main-section-item-post-image-subitem">')
        image_subitem.append('<a href="/'+100+'/post/'+Pipe.post._id+'/image/'+index+'"><img width=500px src="data:image/png;base64,'+Image["base64"]+'"></a>')
        image_item.append(image_subitem)
      })

      // QUANTITY PRICE COMMENT SHARE
      var qty_price_comment_share = $('<div class="main-section-item-qty-price-comments main-section-subitem"></div>')
      var qty = $('<div class="main-section-item-qty-price-comments-subitem">Quantity: <span id="quantity">'+Pipe.post.quantity+'</span></div>')
      var price = $('<div class="main-section-item-qty-price-comments-subitem">Price: <span id="price">'+Pipe.post.price+'</span></div>')
      var comment = $('<div class="main-section-item-qty-price-comments-subitem"><a href="/'+100+'/post/'+Pipe.post._id+'/comment">Comments</a></div>')
      var share = $('<div class="main-section-item-qty-price-comments-subitem"><a href="/'+100+'/post/'+Pipe.post._id+'/share">Share</a></div>')
      if(Pipe.post["type_of_post"] == "inventory"){
        qty_price_comment_share.append(qty)
        qty_price_comment_share.append(price)
      }
      qty_price_comment_share.append(comment)
      qty_price_comment_share.append(share)

      var block_div = $('<div class="main-section-item-block-form main-section-subitem"></div>')
      var block_form = $('<form action="/'+100+'/post/'+Pipe.post._id+'/block" method="POST"></form>')
      var form_flex = $('<div class="form-flex form-group"></div>')
      form_flex.append($('<input class="form-flex-item form-control" type="text" name="quantity" placeholder="Enter quantity to Block">'))
      form_flex.append($('<button class="form-flex-item btn btn-primary" style="background: black;">Block</button>'))
      block_form.append(form_flex)
      block_div.append(block_form)



      if(Pipe.activity_caption){
        $(main_section_item).append(activity_caption)
      }
      main_section_item.append(post_author)
      main_section_item.append(post_post)
      main_section_item.append(image_item)
      main_section_item.append(qty_price_comment_share)
      if(Pipe.post["type_of_post"] == "inventory"){
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
