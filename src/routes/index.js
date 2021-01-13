const { Router }= require('express');
const router = Router();
const nodemailer = require('nodemailer');
const admin = require("firebase-admin");
const {AlphaAnalyticsDataClient} = require('@google-analytics/data');
const serviceAccountKey = JSON.parse(Buffer.from(process.env.FIREBASE_APP_CREDENTIALS, 'base64')); //require("../../serviceAccountKey.json");

/* connection string */
admin.initializeApp({
 credential: admin.credential.cert(serviceAccountKey), /* admin.credential.applicationDefault() */
 databaseURL: "https://reciclame-app-b1f20.firebaseio.com"
});

const db = admin.firestore();
const propertyId = 252994745, projectId = 'reciclame-app-b1f20';
const client = new AlphaAnalyticsDataClient({keyFilename: "serviceAccountKey.json"});

router.get('/', (req, res) => {
	console.log("get /home");
	res.render('index', { title: 'Reciclame' });
});

router.get('/about-us', (req, res) => {
	console.log("get /about-us");
	res.render('about', { title: 'About us page' });
});

router.get('/contact', (req, res) => {
	console.log("get /contact");
	res.render('contact', { title: 'Contact page' });
});

router.get('/admin', checkCookieMiddleware, (req, res) => {
	console.log("get /admin");
	res.redirect("/profile");
});

router.post("/login", (req, res) => {
  	console.log("post /login");

	const idToken = req.body.idToken.toString(),
			expiresIn = 60 * 60 * 24 * 1 * 1000; // 1 day

	admin
		.auth()
		.createSessionCookie(idToken, { expiresIn })
		.then(
		(sessionCookie) => {
			console.log("Cookie created: " + sessionCookie);
			const options = { maxAge: expiresIn, httpOnly: true }; // secure: true
			res.cookie('session', sessionCookie, options);
			
			admin
				.auth()
				.verifyIdToken(idToken)
				.then((decodedClaims) => {
					console.log("/login: User logged: " + JSON.stringify(decodedClaims));
					res.status(200).end();
			});
		},
		(error) => {
			console.log("/login: Cookie creation error: " + error);
			res.status(401).send("UNAUTHORIZED REQUEST!");
		}
	);
});

router.get("/logout", (req, res) => {
	console.log("get /logout");
	res.clearCookie("session").render("login");
});

router.get("/profile", checkCookieMiddleware, (req, res) => {
	console.log("get /profile");
	let uid = req.decodedClaims.uid;

	db.collection('userData').doc(uid).get()
	.then(snapshot => {
		if(snapshot.empty) {
			console.log("/profile: No matching user documents");
			res.render("login");
		} else {
			let data = snapshot.data();
			db.collection('userData').get()
			.then(snapshot => {
				res.render("profile", {
					'uid': uid,
					'aud': req.decodedClaims.aud,
					'email': req.decodedClaims.email,
					'emailVerified': req.decodedClaims.email_verified,
					'fullName': data.fullName,
					/*'city': data.city,
					'postalCode': data.postalCode,
					'isAdmin': data.isAdmin*/
				});
			});
		}
	})
	.catch(err => {
		console.log("/profile: Error getting user documents: " + err);
		res.status(500).send("Error getting user documents!");
	});
});

router.get("/editProfile", checkCookieMiddleware, (req, res) => {
	console.log("get /editProfile");
	let uid = req.decodedClaims.uid;

	db.collection('userData').doc(uid).get()
	.then(snapshot => {
		if(snapshot.empty) {
			console.log("/editProfile: No matching user documents");
			res.render("login");
		} else {
			let data = snapshot.data();
			res.render("editProfile", {
				'fullName': data.fullName,
				'city': data.city,
				'postalCode': data.postalCode
			});
		}
	})
	.catch(err => {
		console.log("/editProfile: Error getting user document: " + err);
		res.status(500).send("Error getting user document!");
	});
});

router.post("/saveUserData", verifySession, (req, res) => {
	console.log("post /saveUserData");

	db.collection("userData").doc(req.decodedClaims.uid).set({
		fullName: req.body.fullName,
		city: req.body.city,
		postalCode: req.body.postalCode
	})
	.then(() => {
		console.log("/saveUserData: User data document correctly updated");
		res.end(JSON.stringify({ status: "success" }));
	})
	.catch((error) => {
		console.log("/saveUserData: Error updating user data document: " + error);
		res.status(500).send("Error updating user data document!");
	});
});

router.get('/createUser', checkCookieMiddleware, (req, res) => {
	console.log("get /createUser");
	res.render('signup');
});

router.post("/createUserData", (req, res) => {
  console.log("post /createUserData");

	admin
		.auth()
		.createUser({
			email: req.body.email,
			emailVerified: req.body.emailVerified,
			password: req.body.password,
			emailVerified: req.body.emailVerified,
			disabled: req.body.disabled
		})
		.then((userRecord) => {
			db.collection("userData").doc(userRecord.uid).set({
				avatarRef: "default",
				city: req.body.city,
				enable: true,
				fullName: req.body.fullName,
				isAdmin: req.body.isAdmin,
				postalCode: req.body.postalCode,
				score: 0,
				uid: userRecord.uid
			})
			.then(function() {
				console.log("/createUserData: User data document correctly set");
				res.status(200).end();
			})
			.catch(function (error) {
				console.log("/createUserData: Error creating the user data document: " + error);
				res.status(500).send("Error creating user data document!").end();
			});
		})
		.catch((error) => {
			console.log("/createUserData: Error creating user: " + error);
			res.status(500).send("Error creating user!").end();
		});

});

router.post("/updateCredentials", verifySession, (req, res) => {
	console.log("post /updateCredentials");
	// console.log("Password MD5: " + req.body.password.);

	admin
		.auth()
		.updateUser(req.decodedClaims.uid, {
			email: req.body.email,
			password: req.body.password
		})
		.then((userRecord) => {
			console.log("/updateCredentials: User credentials correctly updated: " + userRecord);
			res.status(200).end();
		})
		.catch((error) => {
			console.log('/updateCredentials: Error updating user credentials: ' + error);
			res.status(500).send("Error updating user credentials!");
		});
});

router.post("/getUsers", verifySession, (req, res) => {
	console.log("post /getUsers");
	listAllUsers(res, []);
});

function listAllUsers (res, result, nextPageToken) {
	admin
		.auth()
		.listUsers(1000, nextPageToken)
		.then((listUsersResult) => {
			result = result.concat(listUsersResult.users);
			if (listUsersResult.pageToken) {
				listAllUsers(res, result, listUsersResult.pageToken);
			} else {
				res.status(200).setHeader('Content-Type', 'application/json');
				res.json(result).end();
			}
		})
		.catch((error) => {
			console.log('/listAllUsers: Error listing users:', error);
			res.status(500).send("Error listing users!");
		});
};

router.post("/accountDetails", verifySession, function (req, res) {
	console.log("post /accountDetails");

	admin
	.auth()
	.getUser(req.body.uid)
	.then((userRecord) => {
		db.collection('userData').doc(userRecord.uid).get()
		.then(doc => {
			if(!doc.empty) {
				result = {
					'uid': userRecord.uid,
					'email': userRecord.email,
					'emailVerified': userRecord.emailVerified,
					'fullName': doc.data().fullName,
					'city': doc.data().city,
					'postalCode': doc.data().postalCode,
					'isAdmin': doc.data().isAdmin
				};
				res.status(200).setHeader('Content-Type', 'application/json');
				res.send(JSON.stringify(result));
			}
		})
		.catch(error => {
			console.log("/accountDetails: Error getting account details " + error);
			res.status(500).send("Error getting account details!");
		});
	})
	.catch((error) => {
		console.log('/accountDetails: Error getting user data:', error);
	});
});

router.post("/verifyEmail", verifySession, function (req, res) {
	console.log("post /verifyEmail");

	admin
		.auth()
		.updateUser(req.body.uid, {
			emailVerified: true
		})
		.then((userRecord) => {
			console.log('/verifyEmail: User updated successfully', userRecord.toJSON());
			res.status(200).end();
		})
		.catch((error) => {
			console.log('/verifyEmail: Error updating user:', error);
			res.status(500).end();
		});
});

router.post("/disabledUser", verifySession, function (req, res) {
	console.log("post /disabledUser");

	admin
		.auth()
		.updateUser(req.body.uid, {
			disabled: req.body.disabled,
		})
		.then((userRecord) => {
			console.log('/disabledUser: User updated successfully', userRecord.toJSON());
			res.status(200).end();
		})
		.catch((error) => {
			console.log('/disabledUser: Error updating user:', error);
			res.status(500).end();
		});
});

router.post("/deleteUser", verifySession, function (req, res) {
	console.log("post /deleteUser");

	admin
		.auth()
		.deleteUser(req.body.uid)
		.then(() => {
			db.collection("userData").doc(req.body.uid).delete();
			console.log('/deleteUser: User deleted successfully');
			res.status(200).end();
		})
		.catch((error) => {
			console.log('/deleteUser: Error deleting user: ', error);
			res.status(500).send("Error ocurred!");
		});
});

router.get("/analytics", (req, res) => {
	console.log("get /analytics");

	async function runReport() {
		const [response] = await client.runReport({
		  entity: {
			propertyId: propertyId, //project reciclame-app-b1f20 propertyId
		  },
		  dateRanges: [
			{
			  startDate: '2020-03-31',
			  endDate: 'today',
			},
		  ],
		  dimensions: [
			{
			  name: 'city',
			},
		  ],
		  metrics: [
			{
			  name: 'activeUsers',
			},
		  ],
		});
	  
		console.log('Report result:');
		response.rows.forEach(row => {
		  console.log(row.dimensionValues[0], row.metricValues[0]);
		});
	  }
	  
	  runReport().then(function() {
		res.status(200).end();
	  }).catch(err => {
		console.log("Error analytics data: " + err);
		res.status(500).end();
	  });	  
});

router.post('/contact', (req, res) => {
	console.log("post /contact");

	const smtpTrans = nodemailer.createTransport({
		host: process.env.MAIL_SERVER, //server
		port: 587,
		secure: false,
		auth: {
			user: process.env.MAIL_SERVER_USER, //email
			pass: process.env.MAIL_SERVER_PASSWORD //password
		}
	})

	// specify what the email will look like
	const mailOpts = {
		from: 'Your sender info here', // this is ignored by Gmail
		to: 'albertperezdatsira@gmail.com',
		subject: 'New message from contact form at ReciclameWeb',
		text: `${req.body.name} (${req.body.email}) subject: ${req.body.subject} says: ${req.body.message}`
	}

	// attempt to send the email
	smtpTrans.sendMail(mailOpts, (error, response) => {
		if (error) {
			console.log("Contact error: " + error);
			res.render('contactError', { title: 'Contact Error' }) // show a page indicating failure
		}
		else {
			res.render('contactSuccess', { title: 'Contact Success' }) // show a page indicating success
		}
	})
})

function verifySession(req, res, next) {
	const sessionCookie = req.cookies.session || "";

	admin
		.auth()
		.verifySessionCookie(sessionCookie, true)
		.then((decodedClaims) => {
			console.log("verifySession next()");
			req.decodedClaims = decodedClaims;
			next();
		})
		.catch((error) => {
			console.log("Error verifySession: " + error);
			res.status(500).send("Error verify session!");
		});
}

function checkCookieMiddleware(req, res, next) {
	const sessionCookie = req.cookies.session || '';

	admin
		.auth()
		.verifySessionCookie(sessionCookie, true)
		.then((decodedClaims) => {
			console.log("checkCookieMiddleware next()");
			req.decodedClaims = decodedClaims;
			next();
		})
		.catch(error => {
			console.log("Error checkCookieMiddleware, login redirect: " + error);
			res.render('login');
		})
}

module.exports = router;