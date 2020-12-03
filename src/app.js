/* To configure the application/server */
const express = require('express');
const morgan = require('morgan');
const ejs = require('ejs');
// const exphbs = require('express-handlebars'); /* module for templates, like ejs */
const path = require('path'); /* module that allows as to work with the directories */
const bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
const csrf = require("csurf"); // to protect us Cross Site Forgery
const csrfMiddleware = csrf({ cookie: true });

const app = express();
const defaultLang = 'en';

//settings
app.set('port', process.env.PORT || 4000);
app.set('views', path.join(__dirname, 'views'));
app.engine('html', ejs.renderFile);
app.set('view engine', 'ejs');

//middlewares
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(csrfMiddleware);
/*app.use('/:local', (req, res, next) => {
    console.log(req.params.local);

    let activeLang;
    if(!req.cookies.current_culture) {
        let expiresIn = 60 * 60 * 24 * 1 * 1000;
        const options = { maxAge: expiresIn, httpOnly: true };
        res.cookie('current_culture', defaultLang, options);
        activeLang = defaultLang;
    } else {
        activeLang = req.params.local || defaultLang;
    }

    res.locals.langClass = activeLang + '-' + activeLang.toUpperCase();
    next();
});*/
app.use(function(req, res, next) {

    let activeLang;
    if(!req.cookies.current_culture) {
        let expiresIn = 60 * 60 * 24 * 1 * 1000;
        const options = { maxAge: expiresIn, httpOnly: true };
        res.cookie('current_culture', defaultLang, options);
        activeLang = defaultLang;
    } else {
        activeLang = req.cookies.current_culture;
    }

    res.locals.langClass = activeLang + '-' + activeLang.toUpperCase();
    next();
});

// routes
app.use(require('./routes/index'));

//static files
app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;