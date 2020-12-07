const { Router }= require('express');
const router = Router();
const admin = require("firebase-admin");
const serviceAccount = require("../../serviceAccountKey.json");
const firestore = require("firebase/firestore");

/* connection string */
admin.initializeApp({
 credential: admin.credential.cert(serviceAccount), /* admin.credential.applicationDefault() */
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

router.get('/createUser', checkCookieMiddleware, (req, res) => {
	console.log("router /createUser");
	res.render('signup');
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
				let totalUsers = 0, adminUsers = 0;
				snapshot.docs.forEach(user => {
					if(user.data().isAdmin) {
						adminUsers++;
					}
					totalUsers++;
				});
				res.render("profile", {
					'aud': req.decodedClaims.aud,
					'uid': uid,
					'email': req.decodedClaims.email,
					'emailVerified': req.decodedClaims.email_verified,
					'fullName': data.fullName,
					'city': data.city,
					'postalCode': data.postalCode,
					'totalUsers': totalUsers,
					'adminUsers': adminUsers,
					'isAdmin': data.isAdmin
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

router.get("/sessionLogout", (req, res) => {
	res.clearCookie("session");
	res.render("login");
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

router.post("/createUserData", (req, res) => {
  console.log("createUserData post");
  console.log(req.body);

  db.collection("userData").doc(req.body.uid).set({
      avatarRef: "default",
      city: req.body.city,
      enable: true,
      fullName: req.body.fullName,
      isAdmin: req.body.isAdmin,
      postalCode: req.body.postalCode,
      score: 0,
      uid: req.body.uid
    })
    .then(function() {
      console.log("UserData document correctly set");
      res.end(JSON.stringify({ status: "success" }));
    })
    .catch(function (error) {
      console.log("Error creating the userData document: " + error);
      res.status(500).send("Error Ocurred!");
    });
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

router.post("/updateCredentials", verifySession, (req, res) => {
	console.log("updateCredentials post");

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

/*app.post('/contact', (req, res) => {
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