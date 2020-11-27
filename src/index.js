const app = require('./app');

app.all("*", (req, res, next) => {
  res.cookie("XSRF-TOKEN", req.csrfToken());
  next();
});

// listening the server
app.listen(app.get('port'), () => {
	console.log("Server on port", app.get('port'));
});
