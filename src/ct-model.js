
'use strict';
const extend = require('lodash').assign;
const mysql = require('mysql');
const nconf = require('nconf');
const deployConfig = require('./ct-config');
const passport  = require('passport');
const winston = require('winston')
const ctApp =  require('../ct');
//const bcrypt = require('bcrypt');

//CHANGE ENV HERE
const env = 'ct-dev'

let options = {};


if (env === 'ct-dev') {
        options = {
          user: deployConfig.get('CT_DEV_USER'),
          password: deployConfig.get('CT_DEV_PASSWORD'),
          host: deployConfig.get('CT_DEV_ENDPOINT'),
          database: deployConfig.get('CT_DEV_DBNAME'),
          port: 3306,
          multipleStatements: true
        };
}



if (env === 'ct-prod') {
        options = {
          user: deployConfig.get('PROD_USER'),
          password: deployConfig.get('PROD_PASSWORD'),
          host: deployConfig.get('PROD_ENDPOINT'),
          database: deployConfig.get('PROD_DBNAME'),
          port: 3306,
          multipleStatements: true
        };
}


const connection = mysql.createConnection(options);

connection.connect(function(err) {
      if (err) {
            console.error('error connecting to SQL: ' + err.stack);
            return;
      } else {
            console.log('connected as id ' + connection.threadId+"to ");
      }
});


module.exports = {
  getUnitsByPropertyId,
  getWorkerByLink,
  getWorkerById,
  getPropertyById,
  getAllProperties,
  getAllWorkers,
  getAllTimeEntries,
  getTimeEntriesById,
  insertTimeEntry,
  insertWorker,
  insertProperty,
  insertUnit,
  findUser,
  updateUser,
  authUser
};

//======  CREW TIME FUNCTIONS ==========================================

function getUnitsByPropertyId (prop_id) {
  let queryString = 'SELECT * from units WHERE property_id ='+prop_id;
      return new Promise(function(succeed, fail) {
            connection.query(queryString,
              function(err, results) {
                      if (err) {
                            fail(err)
                      } else {
                            if (!results[0]) {
                                    fail("No such unit, sorry")
                            }

                            //console.log ("In model, Success found Units for PropId "+JSON.stringify(results,null,4) +"\n")
                            succeed(results)
                      }
              }); //connection
      }); //promise
} // function


function getPropertyById (prop_id) {
      let queryString = 'SELECT * from properties WHERE id ='+prop_id;
      return new Promise(function(succeed, fail) {
            connection.query(queryString,
              function(err, results) {
                      if (err) {
                            fail(err)
                      } else {
                            if (!results[0]) {
                                    fail("No such unit, sorry")
                            }

                            console.log ("Success found Proprty by ID "+results[0].name +"\n")
                            succeed(results[0])
                      }
              }); //connection
      }); //promise
} // function



function getWorkerByLink (passedLink) {
  let queryString = "SELECT * from workers WHERE workers.link = '"+passedLink+"'";
  //console.log ("Inmodel - get worker by, query string is "+queryString+"\n")
  return new Promise(function(succeed, fail) {
        connection.query(queryString,
          function(err, results) {
                  if (err) {
                        console.log("in model, could not find worker: "+passedLink+" got "+err)
                        fail(err)
                  } else {
                        succeed(results[0])
                  }
          }); //connection
  }); //promise
} // function


function getWorkerById (passedId) {
  let queryString = "SELECT * from workers WHERE workers.id = '"+passedId+"'";
  //console.log ("Inmodel - get worker by, query string is "+queryString+"\n")
  return new Promise(function(succeed, fail) {
        connection.query(queryString,
          function(err, results) {
                  if (err) {
                        console.log("in model, could not find worker: "+passedId+" got "+err)
                        fail(err)
                  } else {
                        succeed(results[0])
                  }
          }); //connection
  }); //promise
} // function




function getAllProperties()  {
      let queryString = 'SELECT * from properties';
      return new Promise(function(succeed, fail) {
            connection.query(queryString,
              function(err, results) {
                      if (err) {
                            fail(err)
                      } else {

                            succeed(results)
                      }
              }); //connection
      }); //promise
} // function





function getAllWorkers()  {
      let queryString = 'SELECT * from workers';
      return new Promise(function(succeed, fail) {
            connection.query(queryString,
              function(err, results) {
                      if (err) {
                            fail(err)
                      } else {

                            succeed(results)
                      }
              }); //connection
      }); //promise
} // function

function getTimeEntriesById(passedId) {
          let queryString =  'SELECT te.id as id, workers.first as worker_first, workers.last as worker_last,'
            + ' CONCAT(workers.first, " ", workers.last) as worker_name, u.name as unit_name, p.name as property_name,'
            + 'DATE_FORMAT(te.work_date, "%b %d %Y") as work_date, te.work_hours as work_hours,'
            +'te.notes as notes, te.date_stamp as date_stamp, te.time_stamp as time_stamp'
            + ' FROM time_entry as te'
            +' JOIN units as u ON te.unit_id = u.id'
            +' JOIN workers as workers ON te.worker_id = workers.id'
            +' JOIN properties as p ON te.property_id = p.id'
            + " WHERE workers.id ='"+passedId+"'"
            +' ORDER BY te.id DESC';

            return new Promise(function(succeed, fail) {
                  connection.query(queryString,
                    function(err, results) {
                            if (err) {
                                  console.log("in model, no timeentries for worker: "+passedId+" got "+err)
                                  fail(err)
                            } else  {
                                  succeed(results)
                            }
                    }); //connection
            }); //promise

} // function




function getAllTimeEntries() {
  let queryString =  'SELECT te.id as id, workers.first as worker_first, workers.last as worker_last,'
    + ' CONCAT(workers.first, " ", workers.last) as worker_name, u.name as unit_name, p.name as property_name,'
    + 'DATE_FORMAT(te.work_date, "%b %d %Y") as work_date, te.work_hours as work_hours,'
    +'te.notes as notes, te.date_stamp as date_stamp, te.time_stamp as time_stamp'
    + ' FROM time_entry as te'
    +' JOIN units as u ON te.unit_id = u.id'
    +' JOIN workers as workers ON te.worker_id = workers.id'
    +' JOIN properties as p ON te.property_id = p.id'
    +' ORDER BY te.id DESC';

    return new Promise(function(succeed, fail) {
          connection.query(queryString,
            function(err, results) {
                    if (err) {
                          console.log("in model, no timeentries for worker: "+passedId+" got "+err)
                          fail(err)
                    } else  {
                          succeed(results)
                    }
            }); //connection
    }); //promise

} // function



function insertTimeEntry(newTimeEntry) {
      console.log("In Model, adding new Time Entry : "+JSON.stringify(newTimeEntry))
      return new Promise(function(succeed, fail) {
            connection.query(
            'INSERT INTO time_entry SET ?', newTimeEntry,
                function(err, results) {
                          if (err) {
                                console.log("Problem inserting TimeEntry SQL"+err)
                                fail(err)
                          } else {
                                //console.log("In model, results: "+JSON.stringify(results));
                                succeed(results)
                          }
              }); //connection
      }); //promise
} // function

function insertWorker(newWorker) {
      console.log("In Model, adding new Worker : "+JSON.stringify(newWorker))
      return new Promise(function(succeed, fail) {
            connection.query(
            'INSERT INTO workers SET ?', newWorker,
                function(err, results) {
                          if (err) {
                                console.log("Problem inserting Worker SQL"+err)
                                fail(err)
                          } else {
                                //console.log("In model, results: "+JSON.stringify(results));
                                succeed(results)
                          }
              }); //connection
      }); //promise
} // function


function insertProperty(newProperty) {
      console.log("In Model, adding new Worker : "+JSON.stringify(newProperty));
      return new Promise(function(succeed, fail) {
            connection.query(
            'INSERT INTO properties SET ?', newProperty,
                function(err, results) {
                          if (err) {
                                console.log("Problem inserting Property SQL"+err)
                                fail(err)
                          } else {
                                //console.log("In model, results: "+JSON.stringify(results));
                                succeed(results)
                          }
              }); //connection
      }); //promise
} // function

function insertUnit(newUnit) {
      console.log("In Model, adding new Unit : "+JSON.stringify(newUnit))
      return new Promise(function(succeed, fail) {
            connection.query(
            'INSERT INTO units SET ?', newUnit,
                function(err, results) {
                          if (err) {
                                console.log("Problem inserting Unit SQL"+err)
                                fail(err)
                          } else {
                                //console.log("In model, results: "+JSON.stringify(results));
                                succeed(results)
                          }
              }); //connection
      }); //promise
} // function









//=========== AUTH ==================


//without Bcrypt for now
function authUser (email, password, done) {
  connection.query(
    'SELECT * FROM users WHERE email = ?', email,  (err, results) => {
      if (!err && !results.length) {
              done("Not found "+ email+" got "+err, null);
              return;
      }

      if (err) {
        done("Search error" +err, null);
        return;
      }

     let checkPlainPW = (password === results[0].password)
     //res is result of comparing encrypted apsswords
      if (checkPlainPW) {
        console.log(results[0].firstname+" has authed in model - authuser");
        done(null, results[0]);

      } else {
          console.log("\nbad pw "+password+",  checkPlainPW is: "+checkPlainPW)
          ctApp.logger.log('info', '/login failure U:'+email);
          done("bad password", null)

      }



  } //cb function
 ) //connection querty
} //authuser




function updateUser (updateuser) {
    console.log("\n\nHere at update: email:"+ updateuser.email +" PW:"+updateuser.password+" ID:"+updateuser.id)

    return new Promise(   function(succeed, fail) {
          connection.query(
          'UPDATE users SET email = ?, photo =?, password=? WHERE id=?',
          [updateuser.email, updateuser.photo, updateuser.password, updateuser.id],
          function(err, results) {
                  if (err) {
                        fail(err)
                  } else {
                      //console.log ("in Moooodel, got uodated user "+JSON.stringify(results)+"")
                      succeed(results)
                  }
          }); //connection
      }); //promise
  } //updateuser





function findUser (email, cb) {
  connection.query(
    'SELECT * FROM users WHERE email = ?', email,  (err, results) => {
      if (!err && !results.length) {
              cb("Not found "+ email+" got "+err);
              return;
      }

      if (err) {
        cb("Search error" +err);
        return;
      }
      cb(null, results[0]);
    });
}
