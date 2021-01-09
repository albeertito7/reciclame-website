const { Router }= require('express');
const router = Router();
const admin = require("firebase-admin");
//const serviceAccount = require("../../serviceAccountKey.json");
const firestore = require("firebase/firestore");

/* connection string */
admin.initializeApp({
 credential: admin.credential.cert(JSON.parse(new Buffer(process.env.FIREBASE_APP_CREDENTIALS, 'base64'))), /* admin.credential.applicationDefault() 
 databaseURL: "https://reciclame-app-b1f20.firebaseio.com"
});

const db = admin.firestore();

router.get('/', (req, res) => {
	res.render('index', { title: 'Reciclame' });
});

router.get('/about-us', (req, res) => {
	res.render('about', { title: 'About Us Page' });
});

router.get('/contact', (req, res) => {
	res.render('contact', { title: 'Contact Page' });
});

router.get('/admin', checkCookieMiddleware, (req, res) => {
	console.log("router /admin");
	res.redirect("/profile");
});

router.post("/sessionLogin", (req, res) => {
  console.log("sessionLogin post");

  const idToken = req.body.idToken.toString(),
        expiresIn = 60 * 60 * 24 * 1 * 1000;

  admin
    .auth()
    .createSessionCookie(idToken, { expiresIn })
    .then(
      (sessionCookie) => {
        console.log("cookie created: " + sessionCookie);
        const options = { maxAge: expiresIn, httpOnly: true }; // secure: true
		res.cookie('session', sessionCookie, options);
		
		admin.auth().verifyIdToken(idToken).then(function(decodedClaims) {
			res.redirect('/profile');
			res.end(JSON.stringify({ status: "success" }));
		});
      },
      (error) => {
        console.log("cookie creation error unauthorized request");
        res.status(401).send("UNAUTHORIZED REQUEST!");
      }
    );
});

router.get("/sessionLogout", (req, res) => {
	res.clearCookie("session");
	res.render("login");
});

router.get("/profile", checkCookieMiddleware, (req, res) => {
	console.log("router /profile");
	let uid = req.decodedClaims.uid;
	console.log("decodeClaims: " + JSON.stringify(req.decodedClaims));
	console.log("UID: " + uid);

	db.collection('userData').doc(uid).get()
	.then(snapshot => {
		if(snapshot.empty) {
			console.log("No matching documents")
			res.render("login");
		} else {
			let data = snapshot.data();
			console.log(data);
			db.collection('userData').get()
			.then(snapshot => {
				/*let totalUsers = 0, adminUsers = 0;
				snapshot.docs.forEach(user => {
					if(user.data().isAdmin) {
						adminUsers++;
					}
					totalUsers++;
				});*/
				res.render("profile", {
					'aud': req.decodedClaims.aud,
					'uid': uid,
					'email': req.decodedClaims.email,
					'emailVerified': req.decodedClaims.email_verified,
					'fullName': data.fullName,
					//'city': data.city,
					//'postalCode': data.postalCode,
					/*'totalUsers': totalUsers,
					'adminUsers': adminUsers,
					'isAdmin': data.isAdmin*/
				});
			});
		}
	})
	.catch(err => {
		console.log("Error getting docuemnts: " + err);
		res.status(500).send("Error getting user data!");
	});
});

router.get("/editProfile", checkCookieMiddleware, (req, res) => {
	console.log("router /editProfile");

	let uid = req.decodedClaims.uid;
	console.log("UID: " + uid);

	db.collection('userData').doc(uid).get()
	.then(snapshot => {
		if(snapshot.empty) {
			console.log("No matching documents")
			res.render("login");
		} else {
			let data = snapshot.data();
			console.log(data);
			res.render("editProfile", {
				'fullName': data.fullName,
				//'email': req.decodedClaims.email,
				'city': data.city,
				'postalCode': data.postalCode
			});
		}
	})
	.catch(err => {
		console.log("Error getting documents: " + err);
		res.status(500).send("Error getting user data!");
	});
});

router.get('/createUser', checkCookieMiddleware, (req, res) => {
	console.log("router /createUser");
	res.render('signup');
});

router.post("/saveUserData", verifySession, (req, res) => {
	console.log("createUserData post");

  /*admin.auth().updateUser(req.decodedClaims.uid, {
	  email: req.body.email
  })
  .then(function(userRecord) {})
  .catch(function (error) {
	  console.log('Error updating user: ' + error);
	  res.status(500).send("Error Ocurred!");
  });*/

  db.collection("userData").doc(req.decodedClaims.uid).set({
	  fullName: req.body.fullName,
	  city: req.body.city,
	  postalCode: req.body.postalCode
  })
  .then(function() {
	  console.log("UserData document correctly updated");
	  res.end(JSON.stringify({ status: "success" }));
  })
  .catch(function (error) {
	  console.log("Error updating the userData document: " + error);
	  res.status(500).send("Error Ocurred!");
  });
});

router.post("/createUserData", (req, res) => {
  console.log("createUserData post");
  console.log(req.body);

	admin
	.auth()
	.createUser({
		email: req.body.email,
		emailVerified: false,
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
			console.log("UserData document correctly set");
			res.end(JSON.stringify({ status: "success" }));
		  })
		  .catch(function (error) {
			console.log("Error creating the userData document: " + error);
			res.status(500).send("Error Ocurred!");
		  });
	})
	.catch((error) => {
		console.log("Error creating the userData document: " + error);
		res.status(500).send("Error Ocurred!");
	});

});

router.post("/updateCredentials", verifySession, (req, res) => {
	console.log("updateCredentials post");

	//console.log("Password MD5: " + req.body.password.);

	admin.auth().updateUser(req.decodedClaims.uid, {
		email: req.body.email,
		password: req.body.password
	})
	.then(function(userRecord) {
		console.log("User credentials correctly updated: " + userRecord);
		res.end(JSON.stringify({ status: "success" }));
	})
	.catch(function (error) {
		console.log('Error updating user credentials: ' + error);
		res.status(500).send("Error Ocurred!");
	});
});

router.get("/getUsers", verifySession, function (req, res) {
	console.log("/getUsers");
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
				console.log("Result: " + JSON.stringify(result));
				res.status(200).setHeader('Content-Type', 'application/json');
				res.json(result).end();
			}
		})
		.catch((error) => {
			console.log('Error listing users:', error);
			res.status(500).send("Error ocurred!");
		});
};

router.post("/deleteUser", verifySession, function (req, res) {
	console.log("/deleteUser");

	admin
	.auth()
	.deleteUser(req.body.uid)
	.then(() => {
		db.collection("userData").doc(req.body.uid).delete();
		res.status(200).end();
	})
	.catch((err) => {
		console.log('Error deleting user: ', error);
		res.status(500).send("Error ocurred!");
	});
});

router.post("/accountDetails", verifySession, function (req, res) {
	console.log("/accountDetails");

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
				console.log("Result: " + JSON.stringify(result));
				res.status(200).setHeader('Content-Type', 'application/json');
				res.send(JSON.stringify(result));
			}
		})
		.catch(err => {
			console.log("Error accountDetails " + err);
			res.status(500).send("Error ocurred!");
		});
	})
	.catch((error) => {
		console.log('Error fetching user data:', error);
	});
});

router.post("/disabledUser", verifySession, function (req, res) {
	console.log("/disabledUser");

	admin
		.auth()
		.updateUser(req.body.uid, {
			disabled: req.body.disabled,
		})
	.then((userRecord) => {
		console.log('Successfully updated user', userRecord.toJSON());
		res.status(200).end();
	})
	.catch((error) => {
		console.log('Error updating user:', error);
		res.status(500).end();
	});
});

router.post("/verifyEmail", verifySession, function (req, res) {
	console.log("/verifyEmail");

	admin
		.auth()
		.updateUser(req.body.uid, {
			emailVerified: true
		})
	.then((userRecord) => {
		console.log('Successfully updated user', userRecord.toJSON());
		res.status(200).end();
	})
	.catch((error) => {
		console.log('Error updating user:', error);
		res.status(500).end();
	});
});

function verifySession(req, res, next) {
	const sessionCookie = req.cookies.session || "";
	admin
		.auth()
		.verifySessionCookie(sessionCookie, true)
		.then((decodedClaims) => {
			req.decodedClaims = decodedClaims;
			next();
		})
		.catch((error) => {
			console.log("error authentication: " + error);
			res.status(500).send("Error Ocurred!");
		});
}

function checkCookieMiddleware(req, res, next) {
	console.log("checkCookieMiddleware");
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
			console.log("checkCookieMiddleware login()");
			res.render('login');
		})
}

/*router.post('/contact', (req, res) => {
	console.log("Contact");

  const smtpTrans = nodemailer.createTransport({
    host: 'mx4.compsaonline.com', //server
    port: 587,
    secure: false,
    auth: {
      user: "web@compsa.es", //email
      pass: "121512xjsm" //password
    }
  })
  // Specify what the email will look like
  const mailOpts = {
    from: 'Your sender info here', // This is ignored by Gmail
    to: 'albertperezdatsira@gmail.com',
    subject: 'New message from contact form at healthsites',
    text: `${req.body.name} (${req.body.email}) subject: ${req.body.subject} says: ${req.body.message}`
  }

  // Attempt to send the email
  smtpTrans.sendMail(mailOpts, (error, response) => {
    if (error) {
      res.render('contactError', { title: 'Contact Error' }) // Show a page indicating failure
    }
    else {
      res.render('contactSuccess', { title: 'Contact Success' }) // Show a page indicating success
    }
  })
})*/

module.exports = router;