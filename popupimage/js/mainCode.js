var jsonText = "";

var startTime;
var endTime;
var currentTime;
var timeHandler;

var dt = 100;
var posts = [];
var imageIndex = 0;

var currentTableRow;
var imageTable = document.getElementById("imageTable");

function start() {
	getResponseText();
	showImages();
}

function showImages() {
	// parse the JSON file to array of posts
	posts = JSON.parse(jsonText);

	// sort the post base on the create time from eariest to latest 
	// Turn your strings into datas, then subtract them
	//to get a value that is either negative, positive or zero 
	posts.sort(function (a, b) {
		return parseInt(a.created_time) - parseInt(b.created_time);
	});

	startTime = parseInt(posts[0].created_time);
	endTime = parseInt(posts[posts.length - 1].created_time);
	currentTime = startTime;

	timeHandler = window.setInterval(popupImages, dt);
}

function popupImages() {
	currentTime += 3600;
	
	while (parseInt(posts[imageIndex].created_time) < currentTime) {
		// add to image table
		if (imageIndex % 10 == 0) {
			currentTableRow = imageTable.insertRow(imageIndex / 10);
		}
		
		var cell = currentTableRow.insertCell(imageIndex % 10);
		cell.innerHTML = "<p>" + new Date(parseInt(posts[imageIndex].created_time) * 1000) + "</p>" + "<img src=" + posts[imageIndex].images.thumbnail.url + ">";
		
		imageIndex++;
	}
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