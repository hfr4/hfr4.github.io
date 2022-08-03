function open_gallery_img(img_src) {
	document.getElementById("gallery_img_img").src = img_src;
	document.getElementById("gallery_img_modal").classList.add("visible")
	document.body.style.overflow = "hidden";
}

function close_gallery_img() {
	document.getElementById("gallery_img_modal").classList.remove("visible")
	document.body.style = "";
}

function open_gallery_vid(vid_src) {
    document.getElementById("gallery_vid_source").src = vid_src;
	document.getElementById("gallery_vid_video").poster = vid_src;
    document.getElementById("gallery_vid_video").load();
    document.getElementById("gallery_vid_video").play();
	document.getElementById("gallery_vid_modal").classList.add("visible")
	document.body.style.overflow = "hidden";
}

function close_gallery_vid() {
    document.getElementById("gallery_vid_video").pause();
    document.getElementById("gallery_vid_video").currentTime = 0;
	document.getElementById("gallery_vid_modal").classList.remove("visible")
	document.body.style = "";
}
