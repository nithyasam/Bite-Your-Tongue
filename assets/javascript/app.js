$(document).ready(function(){
	$("#loginDiv").show();
	$("#recordDiv").hide();
	$("#textDiv").hide();
	$("#foodDiv").hide();
	$("#newUserDiv").hide();
	$("#signOutDiv").hide();
	$("#thankyou").hide();
	var blob;
//==============================================
//Setting random background image
//==============================================	
	var array = ["/grilled-food.jpg", "/pancakes.jpg", "/sweets-food.jpg", "/pizza.jpg", "/simpsons-food.jpg"];
	var spot = array[Math.floor(Math.random() * array.length)];
	$('body').css({ 'background-image': 'url(' + spot + ')' });
//==============================================
// Initialize Firebase
//==============================================
var config = {
	apiKey: "AIzaSyAC9s1umccaXLOBYqeY4ySUqnw5tOzlAIQ",
	authDomain: "bite-your-tongue.firebaseapp.com",
	databaseURL: "https://bite-your-tongue.firebaseio.com",
	projectId: "bite-your-tongue",
	storageBucket: "bite-your-tongue.appspot.com",
	messagingSenderId: "746124913031"
};
firebase.initializeApp(config);
var dbRref = firebase.database().ref(); 

var config2 = {
	apiKey: "AIzaSyCE6loJGqUDEyxqGSzjhS2mqjV_uAgkxKA",
	authDomain: "eatbeforeyouspeak-c2968.firebaseapp.com",
	databaseURL: "https://eatbeforeyouspeak-c2968.firebaseio.com",
	projectId: "eatbeforeyouspeak-c2968",
	storageBucket: "",
	messagingSenderId: "93803214818"
};
var secondApp = firebase.initializeApp(config2, 'secondApp');
var databaseRef = secondApp.database().ref();
//==============================================
// New User SignUp
//==============================================
function signUp(){
	var newemail = $("#newuseremail").val();
	var newpassword = $("#newpassword").val();
	firebase.auth().createUserWithEmailAndPassword(newemail, newpassword).catch(function(error) {
		if (!error) {
			alert("Please login with the username and password created");
		} else {
			alert(error);
		}
		clearFields();
	});
}
//==============================================
// Existing User Login
//==============================================
function loginUser(){
	var email = $("#useremail").val();
	var password = $("#password").val();
	firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
		if (!error) {

		} else {
			alert(error);
		}
		//clearFields();
	});
}
//==============================================
// Getting the currently signed-in user
//==============================================
firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
    // User is signed in.
    var email = user.email;
    $("#recordDiv").show();
    $("#signOutDiv").show();
    $("#loginDiv").hide();
    
    
} else {
	signOut();
}
});
//==============================================
// Handling user SignOut
//==============================================
function signOut(){
	firebase.auth().signOut().then(function() {
		$("#recordDiv").hide();
		$("#textDiv").hide();
		$("#foodDiv").hide();
		$("#newUserDiv").hide();
		$("#signOutDiv").hide();
		$("#thankyou").hide();
		$("#loginDiv").show();
		
	}, function(error) {
		console.error('Sign Out Error', error);
	});
	clearFields();
}
//==============================================
// Login with username and password
//==============================================
$("#login").on("click", function(event){
	event.preventDefault();
	loginUser();
});
//==============================================
// New User Login
//==============================================
$("#addUser").on("click", function(){
	event.preventDefault();
	$("#newUserDiv").hide();
	signUp();
});
//==============================================
// New user input
//==============================================
$("#newUser").on("click", function(){
	$("#newUserDiv").show();
	$("#loginDiv").hide();
});
//==============================================
// Logout Button
//==============================================
$("#logout").on("click", function(event){
	event.preventDefault();
	signOut();
	
});
//==============================================
// Clear fields
//==============================================
function clearFields(){
	$(".form-control").val("");
}
//==============================================
// To the emailing section
//==============================================
$("#toMessageSection").on("click", function(){
	clearFields();
	$("#searchResult").empty();
	$("#foodDiv").hide();
	$("#textDiv").show();

});
//==============================================
// Sending email to the user
//==============================================
$("#submitMessage").on('click', function(event) {
	event.preventDefault();
	firebase.auth().currentUser.email;
	$('#message').val();
	databaseRef.set({
		email: firebase.auth().currentUser.email,
		message: $('#message').val()
	});
	$("#textDiv").hide();
	$("#thankyou").show();

});
//==============================================
// Search user fav from yelp-fusion
//==============================================
$("#search").on("click", function(){
	event.preventDefault();
	var searchTerm = $('#searchTerm').val();
	var location = $('#zipcode').val();
	console.log(searchTerm +" "+ location);
	var data ={};
	data.searchTerm = searchTerm;
	data.location = location;
	$.ajax({
		url: '/search',
		type: 'POST',
		data: {
			"searchTerm": searchTerm,
			"location": location
		},
	}).done(function(res){
		console.log(res);
		for(var i=0; i<res.length; i++){
			$("#searchResult").append("<h3>"+res[i].name+"</h3>"+"<br>" + res[i].location.address1+"<br>"+res[i].location.city+
				"<br>"+ res[i].location.zip_code + "<br>"+ res[i].phone + "<br>" + "-----------------------------------"+"<br>");

		}
	});
});
//==============================================
// Recording user voice
//==============================================
navigator.mediaDevices.getUserMedia({audio:true})
.then(stream => {
	rec = new MediaRecorder(stream);
	rec.ondataavailable = e => {
		audioChunks.push(e.data);
		if (rec.state == "inactive"){
			blob = new Blob(audioChunks,{type:'audio/wav'});
		}
	}
})
.catch(e=>console.log(e));
//==============================================
// Star Recording
//==============================================
function startRec(){
	$('#message').val("");
	$("#startRecord").attr("disabled",true);
	$("#stopRecord").attr("disabled",false);
	audioChunks = [];
	rec.start();
}
//==============================================
// Stop Recording
//==============================================
function stopRec(){
	console.log("came here");
	$("#startRecord").attr("disabled",false);
	$("#stopRecord").attr("disabled",true);
	$("#submitRecord").attr("disabled",false);
	rec.stop();
}
//==============================================
// Submit the audio file
//==============================================
function submitRec(){
	console.log("came submitRecord");
	console.log(blob);
	$("#submitRecord").attr("disabled",true);
	var xhr = new XMLHttpRequest();
	xhr.open('POST', '/getSpeechToText', true);
	xhr.onreadystatechange = function () {
		if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
			console.log(xhr.responseText);
			$('#message').val(xhr.responseText);
		}
	};
	xhr.send(blob);
	$("#recordDiv").hide();
	$("#foodDiv").show();

}

$(document).on("click", "#startRecord", startRec);
$(document).on("click", "#stopRecord", stopRec);
$(document).on("click", "#submitRecord", submitRec);
});

