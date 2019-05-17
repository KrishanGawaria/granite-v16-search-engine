$('#broadcast_checkbox').change(function() {
    if($('#broadcast_checkbox').is(":checked")) {
        $('#select-category').removeClass('hide')
    } else {
        $('#select-category').addClass('hide')
    }
});
