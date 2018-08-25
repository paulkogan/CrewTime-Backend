
'use strict';

const express = require('express');
const appRouter = express.Router();

const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: false })

//const config = require('./propxxx3config');
//const extend = require('lodash').assign;
const mysql = require('mysql');
const calc =  require('./ira-calc');
const iraSQL =  require('./ira-model');
const menus = require('./ira-menus.js');



// const bcrypt = require('bcrypt');
// const crypto            = require('crypto');

const passport          = require('passport');
const LocalStrategy     = require('passport-local').Strategy;
const cookieParser = require('cookie-parser')
const session = require('express-session')
const RedisStore = require('connect-redis')(session)
const secret = "cat"

// appRouter.use(cookieParser(secret));
// appRouter.use(bodyParser.urlencoded({extended: true}))
// appRouter.use(bodyParser.json());
//
// appRouter.use(session({
//     cookieName: 'appRouter3sess',
//     secret: secret,
//     resave: true,
//     //store: RedisStore,
//     saveUninitialized: true,
//     cookie : { httpOnly: true, expires: 60*60*1000 }
// }));
// appRouter.use(passport.initialize());
// appRouter.use(passport.session());

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

module.exports = appRouter;

// module.exports = {
//   appRouter,
//   authuser,
//   updateuser,
//   finduser
// };

//functions ==============


//========== AUTH ===================



app.get('/updateuser/', checkAuthentication, (req, res,next) => {
          if (req.session && req.session.passport) {
             userObj = req.session.passport.user;
           }
          iraLogger.log('info', '/updateuser U:'+userObj.email);
          res.render('update-user', {
                  userObj: userObj,
                  sessionInfo: req.session,
                  updateendpoint: '/process_user_update'
          });
   });  //end UPDATE request


app.post('/process_user_update', urlencodedParser, (req, res) => {

    //call the async function
    updateUserInfo().catch(err => {
          console.log("Problem updating User info: "+err);
    })

    async function updateUserInfo()  {
             const data = req.body
             console.log("Just got form: "+JSON.stringify(data)+"<br>")
             //check if they entered the right old password
             //function authUser (email, password, done) {
             //pModel.authUser (username, password, (err, autheduser) => {

              console.log("Session-Info-passport"+JSON.stringify(req.session.passport,null,4))

             var updatedUser =
             {
               "id":userObj.id,
               "firstname":data.firstname,
               "lastname":data.lastname,
               "email":data.email,
               "photo":data.photo,
               "password": data.newpass
             }

             if (data.newpass === "") {
                 updatedUser.password = userObj.password;
            }

             console.log("\nHere is the New User v5 "+JSON.stringify(updatedUser,null,5))

              let results = await ctSQL.updateUser (updatedUser);
              req.flash('login', "Updated USER "+updatedUser.lastname+".  ")
              console.log("Updated  "+updatedUser.lastname+" with " +JSON.stringify(results));
              res.redirect('/home');



          } //async function
    }); // Route

          //    //hash the NEW password - changing password
          //     bcrypt.genSalt(10, function(err, salt) {
          //            if (err) return err;
          //            bcrypt.hash(data.newpass, salt, function(err, hash) {
          //                   console.log("hashing "+err)
          //                   if (err) return err;
          //                   if (data.newpass === "") {
          //                       updatedUser.password = userObj.password;
          //                   } else {
          //                        updatedUser.password = hash
          //                   }
          //                   console.log("\n\nHere is the New User v5 "+JSON.stringify(updatedUser))
          //                   pModel.updateUser (updatedUser, (err, status) => {
          //                          //err comes back but not results
          //                          if (err) {
          //                            console.log("\n\nModel Update problem "+JSON.stringify(err));
          //                          } else {
          //                          req.flash('login', "Updated USER "+updatedUser.lastname+".  ")
          //                          console.log("Updated  "+updatedUser.lastname+" with " +JSON.stringify(status));
          //                          res.redirect('/home');
          //                          }
          //                  });//updateuser
          //          }); //hash
          //  }); //getSalt






app.get('/login', (req, res, next) => {
        res.render('login', {
                postendpoint: '/checklogin',
                message: req.flash('login')
        });
});



//grab info, call strategy
app.post('/checklogin', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {

    if (err) { return next(err); }

    //if you did not get a user back from Strategy
    if (!user) {
      req.flash('login', 'Credentials could not be verified, please try again.')
      return res.redirect('/login');
    }
    //found user
    req.logIn(user, function(err) {
          if (err) {
            req.flash('login', 'Login problem '+err)
            return next(err);
          }


      console.log('START OF SESSION for user '+user.id+" sending to "+req.session.return_to)
      req.flash('login', 'Login success: '+req.session.passport.user.email); //does not work yet
      //req.session.user = user; //put user object in session - dont need this

      //on first login, use this to redirect
      if (req.session.return_to) {
            return res.redirect(req.session.return_to);  //WORKS?
      } else return res.redirect("/");

      //return res.redirect(url);

    });
  })(req, res, next);
});

app.get('/logout', function(req, res, next){
    req.logout();
    userObj =
    {
      "id":0,
      "firstname":"Log In",
      "lastname":"",
      "email":"",
      "password":"",
      "photo":"https://raw.githubusercontent.com/wilsonvargas/ButtonCirclePlugin/master/images/icon/icon.png",
      "access":0
    }
    res.redirect('/login');
  });




// Passport Strategy
passport.use(new LocalStrategy(
  {
    passReqToCallback: true
  },
  (req, username, password, done) => {
         ctSQL.authUser (username, password, (err, autheduser) => {
                 //err comes back but not results
                 if (err) {
                   console.log("call to model is err "+JSON.stringify(err));
                   //req.flash('login', 'strategy: bad user name or password')
                   return done(null, false);
                 }
                 if (!autheduser) {
                        console.log("strategy: user "+ username +" not found ");
                        iraLogger.log('info', '/login failure U:'+username);
                        return done(null, false);
                 }
                 console.log("OK autheduser is "+autheduser.firstname+"(in Local Strategy)");
                 iraLogger.log('info', '/login success U:'+autheduser.email);
                 return done(null, autheduser);

          }) //loginuser


})) //localstrategy



    passport.serializeUser(function(user, done){
        done(null, user);  //save user or just user.id in session
    });

    passport.deserializeUser(function(user, done){
        //connection.query("select * from tbl_users where id = "+ id, function (err, rows){
            done(null, user);

    });


      // User found - check passwpord
      // bcrypt.compare(checkpass, user.password, (err, isValid) => {
      // }) //bcrypt

//NOT FIRST TIME LOGIN
function checkAuthentication(req,res,next){
          if (userObj.id == 0) {
               req.session.return_to = "/";
          } else {
               req.session.return_to = req.url;
          }

          if(req.isAuthenticated()){
                 console.log("YES, authenticated"+req.url)
                 //req.flash('login', 'checkAuth success')
                 return next();
                 //res.redirect(req.url);

          } else {
              console.log("NO, not authenticated"+req.url)
              //req.flash('login', 'checkAuth failed, need to login')
              res.redirect("/login");
          }
}
