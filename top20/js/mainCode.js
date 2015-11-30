showTop20Images();

function showTop20Images() {
	// create a Ajax request to download the JSON file
	var request = new XMLHttpRequest();
	request.open("GET", "data/parisattacks.json", false);

	request.onreadystatechange = function () {
		
		if (request.readyState === XMLHttpRequest.DONE && request.status === 200) {
			
			var fileContent = request.responseText;

			// parse the JSON file to array of posts
			var posts = [];
			posts = JSON.parse(fileContent);

			// sort the post from most liked to least liked
			posts.sort(function (a, b) {
				return b.likes.count - a.likes.count;
			});

			// fill the top20Images <div> with 20 <img> tags
			var imageHTML = document.getElementById("top20Images");
			var imgs = "";

			for (var i = 0; i < 20; ++i) {
				var postImg = posts[i].images.thumbnail;
				imgs += "<img src=" + postImg.url + " width: " + postImg.width + " height:" + postImg.height + ">";
			}

			imageHTML.innerHTML = imgs;
		}
	}

	request.send(null);
}
