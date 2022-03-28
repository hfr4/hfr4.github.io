function open_gallery(img_src) {
	console.log(img_src)
	document.getElementById("gallery_img").src = img_src;
	document.getElementById("gallery_modal").classList.add("visible")
}

function close_gallery() {
	document.getElementById("gallery_modal").classList.remove("visible")
}
