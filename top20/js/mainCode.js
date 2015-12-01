var startIndex = 0;
var jsonText = "";

getResponseText();
showFiveImages();

function showPrevious() {
	if (startIndex >= 5) {
		startIndex -= 5;
	}

	showFiveImages();
}

function showNext() {
	if (startIndex <= 10) {
		startIndex += 5;
	}

	showFiveImages();
}

function showFiveImages() {
	// parse the JSON file to array of posts
	var posts = [];
	posts = JSON.parse(jsonText);

	// sort the post from most liked to least liked
	posts.sort(function (a, b) {
		return b.likes.count - a.likes.count;
	});

	// fill the top20Images <div> with 20 <img> tags
	var imageHTML = document.getElementById("top20Images");
	var imgs = "";
	var i = 0;
	imgs += "<table><tbody><tr>";
	for (i = startIndex; i < startIndex + 5; ++i) {
		var currentImage = posts[i].images.thumbnail;
		//imgs += "<img src=" + currentImage.url + " width: " + currentImage.width + " height:" + currentImage.height + ">";
		imgs += "<td><img src=" + currentImage.url + "></td>";
	}
	imgs += "</tr></tbody></table>";

	imageHTML.innerHTML = imgs;
}

function getResponseText() {
	var request = new XMLHttpRequest();
	request.open("GET", "data/parisattacks.json", false);

	request.onreadystatechange = function () {
		if (request.readyState === XMLHttpRequest.DONE && request.status === 200) {
			jsonText = request.responseText;
		}
	}

	request.send(null);
}