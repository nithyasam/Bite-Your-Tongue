var express = require('express');
var PORT = process.env.PORT || 3000;
var path = require('path');
var app = express();	
var firebase = require('firebase');
var bodyParser = require('body-parser');
var stream = require('stream');
var nodemailer = require('nodemailer');
var blob = "";
var Yelp = require('yelp');
var token = process.env.YELP_TOKEN;
//==============================================
//Initialize firebase
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
//==============================================
//Initialize firebase(for nodemailer)
//==============================================
var config3 = {
	apiKey: "AIzaSyCE6loJGqUDEyxqGSzjhS2mqjV_uAgkxKA",
	authDomain: "eatbeforeyouspeak-c2968.firebaseapp.com",
	databaseURL: "https://eatbeforeyouspeak-c2968.firebaseio.com",
	projectId: "eatbeforeyouspeak-c2968",
	storageBucket: "",
	messagingSenderId: "93803214818"
};
var thirdApp = firebase.initializeApp(config3, 'thirdApp');
var dbReference = thirdApp.database().ref();

app.use(bodyParser());
//==============================================
//loding static files
//==============================================
app.use('/', express.static(path.join("", "./assets/images/")));
app.use('/', express.static(path.join("", "./assets/css/")));
app.use('/', express.static(path.join("", "./assets/javascript/")));
app.get('/', function(req, res){
	res.sendFile('index.html', {root: path.join("", "./")});
});

app.post('/getSpeechToText', function(req, res){
	req.on('readable', function(){
		console.log('Reached request');
		var fs = require('fs');
		let bufferStream;
		let calledWatson = false; 
		while (null !== (blob = req.read())) {
			bufferStream = new stream.PassThrough();
			bufferStream.end(Buffer(new Uint8Array(blob)));
		}
		if (!calledWatson && bufferStream !== undefined) {
			calledWatson = true;
//==============================================
//IBM Watson API
//==============================================	
var SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');
			
			var speech_to_text = new SpeechToTextV1 ({
				username: process.env.USER_NAME,
				password: process.env.USER_PASSWORD
			});
			var params = {
				model: 'en-US_BroadbandModel',
				content_type: 'audio/wav',
				'interim_results': true,
				'max_alternatives': 3,
				'word_confidence': true,
				timestamps: true
			};
		// Create the stream.
		var recognizeStream = speech_to_text.createRecognizeStream(params);
		// Pipe in the audio.
		bufferStream.pipe(recognizeStream);

		recognizeStream.setEncoding('utf8');
		recognizeStream.on('data', function(event) { onEvent('Data:', event); });
		recognizeStream.on('error', function(event) { onEvent('Error:', event); });
		recognizeStream.on('close-connection', function(event) { onEvent('Close:', event); });

		function onEvent(name, event) {
			console.log(name);
			if(name === 'Data:') {
				let message = JSON.stringify(event, null, 2);
				let usersRef = writeToFirebase(message);
				readFromFirebase(usersRef);
			} else {
				console.log(event);
			}
		};
	} else {
		console.log('bufferStream is ',bufferStream, 'and calledWatson is', calledWatson);
	}

});
//==============================================
//Reading from firebase
//==============================================	
function readFromFirebase(usersRef){
	usersRef.on("value", function(snapshot) {
		console.log(snapshot.val().speechToText);
		res.send(snapshot.val().speechToText);
	}, function (errorObject) {
		console.log("The read failed: " + errorObject.code);
	});
}

});
//==============================================
//Writing to firebase
//==============================================	
function writeToFirebase(message){
	let usersRef = dbRref.child(new Date().toUTCString());
	usersRef.set({
		"speechToText" : message,

	});
	return usersRef;
}

app.post('/search', function(req, res){
	var searchTerm = JSON.stringify(req.body.searchTerm);
	var locationzip = JSON.stringify(req.body.location);
//==============================================
//Yelp Fusion API
//==============================================
const yelp = require('yelp-fusion');
const client = yelp.client(token);

client.search({
	term: searchTerm,
	location: locationzip,
	limit: 5,

}).then(response => {
	var result = response.jsonBody.businesses;
	res.send(result);
}).catch(e => {
	console.log(e);
});
});
//==============================================
//Sending the email message to user
//==============================================
function sendMail(email, message) {

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
    	service: 'gmail',
    	auth: {
    		user: 'eatbeforeyouspeak@gmail.com',
    		pass: 'SMUstudent2017'
    	}
    });

    // setup email data with unicode symbols
    let mailOptions = {
        from: '"BYT" <eatbeforeyouspeak@gmail.com>', // sender address
        to: email, // list of receivers
        subject: 'Hello ✔', // Subject line
        text: message, // plain text body
        html: message // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
    	if (error) {
    		return console.log(error);
    	}
    	//console.log('Message %s sent: %s', info.messageId, info.response);
    });
}

dbReference.on('value', function(snapshot) {
	sendMail(snapshot.val().email, snapshot.val().message);
});

app.listen(PORT);