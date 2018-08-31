'use strict';


const ctSQL =  require('./src/ct-model');
const menus = require('./src/ct-menus');
const actions = require('./src/ct-actions');
const api = require('./src/ct-api');
const deployConfig = require('./src/ct-config');

const path = require('path');
const fs = require('fs');
const vm = require('vm')
const express = require('express');
const app = express();
const nconf = require('nconf');
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: false })
const flash             = require('connect-flash-plus');

//const crypto            = require('crypto');
//const bcrypt = require('bcrypt');

const passport          = require('passport');
const LocalStrategy     = require('passport-local').Strategy;
const cookieParser = require('cookie-parser')
const session = require('express-session')
const RedisStore = require('connect-redis')(session)
const secret = "cat"
const winston = require('winston')
const nodePort = 8081;

const ctVersion = "5.5 +time stamp +bldg admin"


let ctLogger = winston.createLogger({
    level: 'info',  //or get from config.json
    format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.printf(info => {
            return `<*${info.timestamp} ${info.level}: ${info.message}*>`;
        })
    ),
    transports: [
             new winston.transports.Console(),
             //new winston_mysql(winstonSQL_options),
 		         new winston.transports.File({ filename: './src/iralog3.log' })
       ]

    //    ,
    // exceptionHandlers: [
    // 		    new winston.transports.File({ filename: 'iralog.log' })
    //   ]
}); // ctLogger

ctLogger.exceptions.handle(
  //new winston.transports.File({ filename: 'iralog2.log' }),
  new winston.transports.Console()
);







app.use(cookieParser(secret));
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json());
app.use(session({
    cookieName: 'irasess',
    secret: secret,
    resave: true,
    //store: RedisStore,
    saveUninitialized: true,
    cookie : { httpOnly: true, expires: 60*60*1000 }
}));


app.use(passport.initialize());
app.use(passport.session());
app.use(passport.authenticate('session'));


// consider adding alogger
//app.use(express.logger('dev'));

//to allow API access from React
app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
});
app.set('trust proxy', true);


app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, '/views/'));
app.use('/static', express.static(__dirname + '/static'));

let sessioninfo = "no session"
let userObj =
{
  "id":0,
  "firstname":"Log In",
  "lastname":"",
  "email":"",
  "password":"",
  "photo":"https://raw.githubusercontent.com/wilsonvargas/ButtonCirclePlugin/master/images/icon/icon.png",
  "access":0
}

  app.use(flash());
//routes last
  app.use(menus)
  app.use(actions)
  app.use(api)

// ========START THE SERVER ==============================

const server = app.listen(nodePort, function() {
  console.log('CrewTime listening on port  ' + nodePort);
  console.log('winston logging IRA on level = ' + ctLogger.level)
});


module.exports = app;
exports.ctLogger = ctLogger;
exports.version = ctVersion;




//============ ROUTES  ======================
