function open_gallery(img_src) {
	document.getElementById("gallery_img").src = img_src;
	document.getElementById("gallery_modal").classList.add("visible")
	document.body.style.overflow = "hidden";
}

function close_gallery() {
	document.getElementById("gallery_modal").classList.remove("visible")
	document.body.style = "";
}
