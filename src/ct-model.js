
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
// const env = 'ct-prod'
// let options = {};



let ct_options = {
          user: deployConfig.get('CT_USER'),
          password: deployConfig.get('CT_PASSWORD'),
          host: deployConfig.get('CT_ENDPOINT'),
          database: deployConfig.get('CT_DBNAME'),
          port: 3306,
          multipleStatements: true
  };



const connection = mysql.createConnection(ct_options);


connection.connect(function(err) {
      if (err) {
            console.error('error connecting to CT SQL: ' + err.stack);
            return;
      } else {
            console.log('connected to CT as id ' + connection.threadId+"to ");
      }
});




module.exports = {
  getUnitsByPropertyId,
  getWorkingUnitsByPropertyId,
  getWorkerByLink,
  getWorkerById,
  getPropertyById,
  getUnitById,
  getGLAccountById,
  getGLAccountByGLCode,
  getAllProperties,
  getAllWorkers,
  getAllTimeEntries,
  getAllGLAccounts,
  getTimeEntriesByWorkerId,
  getMobileTimeEntriesByWorkerId,
  getTimeEntriesByWorkerIdAndDates,
  getTimeEntriesByDates,
  getTimeEntryById,
  insertTimeEntry,
  insertWorker,
  insertProperty,
  insertUnit,
  insertGLAccount,
  updateTimeEntry,
  updateWorker,
  updateProperty,
  deleteUnit,
  deleteProperty,
  deleteWorker,
  deleteTimeentry,
  deleteGLAccount,
  setWorkStatus,
  findUser,
  updateUser,
  authUser, 
  getTodaysDate,
  convertDate,
  getPastDateWithOffset
};




//======  CREW TIME FUNCTIONS ==========================================
    
    
    function getTodaysDate() {
    
      var today = new Date();
      var dd = today.getDate();
      var mm = today.getMonth()+1; //January is 0!
      var yyyy = today.getFullYear();
      if (dd<10){  dd='0'+dd }
      if(mm<10){   mm='0'+mm }
      today = yyyy+'-'+mm+'-'+dd;
      return today
    }
    
    
    function convertDate(thisDate) {
      var dd = thisDate.getDate();
      var mm = thisDate.getMonth()+1; //January is 0!
      var yyyy = thisDate.getFullYear();
      if (dd<10){  dd='0'+dd }
      if(mm<10){   mm='0'+mm }
      let simpleDate = yyyy+'-'+mm+'-'+dd;
      return simpleDate
    }
    
    function getPastDateWithOffset(offset) {
    
      var pastDay = new Date();
      pastDay.setDate(pastDay.getDate() - offset);
      var dd = pastDay.getDate();
      var mm = pastDay.getMonth()+1; //January is 0!
      var yyyy = pastDay.getFullYear();
      if (dd<10){  dd='0'+dd }
      if(mm<10){   mm='0'+mm }
      let pastdayString = yyyy+'-'+mm+'-'+dd;
      return pastdayString
    }
    

function getMobileTimeEntriesByWorkerId(workerId, date1, date2) {


        var queryString = 'SELECT te.id as id, CONCAT(workers.first, " ", workers.last) as worker_name,'
            + ' u.name as unit_name, p.name as property_name,'
            + ' DATE_FORMAT(te.work_date, "%b %d %Y") as work_date, te.work_hours as work_hours'
            + ' FROM time_entry as te'
            +' JOIN units as u ON te.unit_id = u.id'
            +' JOIN workers as workers ON te.worker_id = workers.id'
            +' JOIN properties as p ON te.property_id = p.id'
            + " WHERE workers.id ='"+workerId+"'"
            +" AND te.work_date between '"+date1+"' and '"+date2+"'"
            +' ORDER BY te.work_date DESC';



            return new Promise(function(succeed, fail) {
                  connection.query(queryString,
                    function(err, results) {
                            if (err) {
                                  console.log("in model, no timeentries for worker: "+workerId+" got "+err)
                                  fail(err)
                            } else  {
                                  succeed(results)
                            }
                    }); //connection
            }); //promise

} // function



function getTimeEntriesByDates(date1, date2) {


          var queryString =  'SELECT te.id as id, workers.first as worker_first, workers.last as worker_last,'
            + 'u.name as unit_name, p.name as property_name, p.id as property_id,'
            + 'DATE_FORMAT(te.work_date, "%m/%d/%y") as excel_work_date,'
            + 'DATE_FORMAT(te.work_date, "%b %d %Y") as work_date, te.gl_code as gl_code, te.work_hours as work_hours'
            + ' FROM time_entry as te'
            +' JOIN units as u ON te.unit_id = u.id'
            +' JOIN workers as workers ON te.worker_id = workers.id'
            +' JOIN properties as p ON te.property_id = p.id'
            + " WHERE te.work_date between '"+date1+"' and '"+date2+"'"
            +' ORDER BY te.id DESC';


            console.log("In Model, TE by Dates, the query string is "+queryString)


            return new Promise(function(succeed, fail) {
                  connection.query(queryString,
                    function(err, results) {
                            if (err) {
                                  console.log("in model, no timeentries for TE by dates got "+err)
                                  fail(err)
                            } else  {
                                  succeed(results)
                            }
                    }); //connection
            }); //promise

} // function

function updateProperty(newProperty) {
      console.log("\n\nHere at model - update property"+ JSON.stringify(newProperty))
  
      let queryString = 'UPDATE properties SET'
      +' name = \''+newProperty.name+'\','
      +' prop_work_status = '+newProperty.prop_work_status
      +' WHERE id = '+newProperty.id+'';
  
    console.log("In Model, updating Property, the query string is "+queryString)
  
  
      return new Promise(function(succeed, fail) {
            connection.query(queryString,
              function(err, results) {
                      if (err) {
                            fail(err)
                      } else {
                            console.log ("In Model, Success - Updated entity with "+JSON.stringify(results)+"\n")
                            succeed(results.affectedRows)
                      }
              }); //connection
      }); //promise
  } // function
  



function updateWorker(newWorker) {
    console.log("\n\nHere at update: unit:"+ JSON.stringify(newWorker))

    let queryString = 'UPDATE workers SET'
    +' first = \''+newWorker.first+'\','
    +' last = \''+newWorker.last+'\','
    +' link = \''+newWorker.link+'\','
    +' phone= \''+newWorker.phone+'\','
    +' reg_rate = \''+newWorker.reg_rate+'\','
    +' ot_rate= \''+newWorker.ot_rate+'\''
    +' WHERE id ='+newWorker.id+'';

  console.log("In Model, updating Worker, the query string is "+queryString)


    return new Promise(function(succeed, fail) {
          connection.query(queryString,
            function(err, results) {
                    if (err) {
                          fail(err)
                    } else {
                          //console.log ("In Model, Success - Updated entity with "+JSON.stringify(results)+"\n")
                          succeed(results.affectedRows)
                    }
            }); //connection
    }); //promise
} // function






function getTimeEntriesByWorkerIdAndDates(workerId, date1, date2) {


      console.log("In Model start, worker Id  is "+workerId)


    if (workerId >0 )  {

          var queryString =  'SELECT te.id as id, workers.first as worker_first, workers.last as worker_last,'
            + ' CONCAT(workers.first, " ", workers.last) as worker_name, u.name as unit_name, p.name as property_name,'
            + 'DATE_FORMAT(te.work_date, "%b %d %Y") as work_date, te.work_hours as work_hours,'
            + 'DATE_FORMAT(te.work_date, "%m/%d/%y") as excel_work_date,'
            +'te.notes as notes, te.date_stamp as date_stamp, te.time_stamp as time_stamp, te.gl_code as gl_code, te.is_overtime as is_overtime,'
            + 'workers.reg_rate as reg_rate, workers.ot_rate as ot_rate'
            + ' FROM time_entry as te'
            +' JOIN units as u ON te.unit_id = u.id'
            +' JOIN workers as workers ON te.worker_id = workers.id'
            +' JOIN properties as p ON te.property_id = p.id'
            + " WHERE workers.id ='"+workerId+"'"
            + " AND te.work_date between '"+date1+"' and '"+date2+"'"
            +' ORDER BY te.id DESC';

      }  else {

          var queryString =  'SELECT te.id as id, workers.first as worker_first, workers.last as worker_last,'
            + ' CONCAT(workers.first, " ", workers.last) as worker_name, u.name as unit_name, p.name as property_name,'
            + 'DATE_FORMAT(te.work_date, "%b %d %Y") as work_date, te.work_hours as work_hours,'
            + 'DATE_FORMAT(te.work_date, "%m/%d/%y") as excel_work_date,'
            +'te.notes as notes, te.date_stamp as date_stamp, te.time_stamp as time_stamp, te.gl_code as gl_code, te.is_overtime as is_overtime,'
            + 'workers.reg_rate as reg_rate, workers.ot_rate as ot_rate'
            + ' FROM time_entry as te'
            +' JOIN units as u ON te.unit_id = u.id'
            +' JOIN workers as workers ON te.worker_id = workers.id'
            +' JOIN properties as p ON te.property_id = p.id'
            + " WHERE te.work_date between '"+date1+"' and '"+date2+"'"
            +' ORDER BY te.id DESC';

      }


            console.log("In Model, TE by ID and Date, the query string is "+queryString)


            return new Promise(function(succeed, fail) {
                  connection.query(queryString,
                    function(err, results) {
                            if (err) {
                                  console.log("in model, no timeentries for worker by date: "+workerId+" got "+err)
                                  fail(err)
                            } else  {
                                  succeed(results)
                            }
                    }); //connection
            }); //promise

} // function






function updateTimeEntry (newTE) {
    console.log("\n\nHere at update: unit:"+ JSON.stringify(newTE))

    let queryString = 'UPDATE time_entry SET'
    +' unit_id = \''+newTE.unit_id+'\','
    +' work_hours = \''+newTE.work_hours+'\','
    +' work_date = \''+newTE.work_date+'\','
    +' notes = \''+newTE.notes+'\','
    +' is_overtime = \''+newTE.is_overtime+'\','
    +' gl_code = \''+newTE.gl_code+'\','
    +' edit_log = \''+newTE.edit_log+'\''
    +' WHERE id ='+newTE.id+'';

  console.log("In Model, updating TE, the query string is "+queryString)


    return new Promise(function(succeed, fail) {
          connection.query(queryString,
            function(err, results) {
                    if (err) {
                          fail(err)
                    } else {
                          //console.log ("In Model, Success - Updated entity with "+JSON.stringify(results)+"\n")
                          succeed(results.affectedRows)
                    }
            }); //connection
    }); //promise
} // function





function setWorkStatus (unit_id,work_status) {
  let queryString = 'UPDATE units SET unit_work_status = '+work_status+' WHERE id='+unit_id

  console.log("In Model, updating work status, the query string is "+queryString)
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


function deleteTimeentry(te_id) {

  let queryString = 'DELETE FROM time_entry where id='+te_id+";"

  //console.log("In Model, deletng unit the query string is "+queryString)
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




function deleteWorker(worker_id) {

  let queryString = 'DELETE FROM workers where id='+worker_id+";"

  //console.log("In Model, deletng unit the query string is "+queryString)
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




function deleteUnit(unit_id) {

  let queryString = 'DELETE FROM units where id='+unit_id+";"

  //console.log("In Model, deletng unit the query string is "+queryString)
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



function deleteProperty(prop_id) {

  let queryString = 'DELETE FROM properties where id='+prop_id+";"

  //console.log("In Model, deletng property the query string is "+queryString)
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



function deleteGLAccount(gl_account_id) {
      let queryString = 'DELETE FROM gl_accounts where id='+gl_account_id+";"
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



function getWorkingUnitsByPropertyId (prop_id) {
  let queryString = 'SELECT * from units WHERE property_id ='+prop_id+' AND unit_work_status = 1';
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


function getUnitById (unit_id) {
      let queryString = 'SELECT * from units WHERE id ='+unit_id;
      return new Promise(function(succeed, fail) {
            connection.query(queryString,
              function(err, results) {
                      if (err) {
                            fail(err)
                      } else {
                            if (!results[0]) {
                                    fail("No such unit, sorry")
                            }

                            console.log ("Success found Unit by ID "+results[0].name +"\n")
                            succeed(results[0])
                      }
              }); //connection
      }); //promise
} // function

function getGLAccountById (gl_account_id) {
      let queryString = 'SELECT * from gl_accounts WHERE id ='+gl_account_id;
      return new Promise(function(succeed, fail) {
            connection.query(queryString,
              function(err, results) {
                      if (err) {
                            fail(err)
                      } else {
                            if (!results[0]) {
                                    fail("No such gl account, sorry")
                            }

                            console.log ("Success found GL Account by ID "+results[0].name +"\n")
                            succeed(results[0])
                      }
              }); //connection
      }); //promise
} // function

function getGLAccountByGLCode (gl_code) {
      let queryString = 'SELECT * from gl_accounts WHERE code ='+gl_code;
      return new Promise(function(succeed, fail) {
            connection.query(queryString,
              function(err, results) {
                      if (err) {
                            fail(err)
                      } else {
                            if (!results[0]) {
                                    fail("No such gl account, sorry")
                            }

                            console.log ("Success found GL Account by Code "+results[0].name +"\n")
                            succeed(results[0])
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
  //console.log ("In model - get worker by ID, query string is "+queryString+"\n")
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


function getAllGLAccounts()  {
      let queryString = 'SELECT * from gl_accounts';
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
      let queryString = 'SELECT * from workers ORDER BY last ASC';
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


function getTimeEntryById(teId) {

  let queryString = "SELECT * from time_entry WHERE id = '"+teId+"'";

            return new Promise(function(succeed, fail) {
                  connection.query(queryString,
                    function(err, results) {
                            if (err) {
                                  console.log("in model, no timeentries for id: "+teId+" got "+err)
                                  fail(err)
                            } else  {
                                  succeed(results[0])
                            }
                    }); //connection
            }); //promise

} // function




function getTimeEntriesByWorkerId(workerId) {


  if (workerId >0 )  {

        var queryString = 'SELECT te.id as id, workers.first as worker_first, workers.last as worker_last,'
            + ' CONCAT(workers.first, " ", workers.last) as worker_name, u.name as unit_name, p.name as property_name,'
            + 'DATE_FORMAT(te.work_date, "%b %d %Y") as work_date, te.work_hours as work_hours,'
            +'te.notes as notes, te.date_stamp as date_stamp, te.time_stamp as time_stamp, te.gl_code as gl_code, te.is_overtime as is_overtime'
            + ' FROM time_entry as te'
            +' JOIN units as u ON te.unit_id = u.id'
            +' JOIN workers as workers ON te.worker_id = workers.id'
            +' JOIN properties as p ON te.property_id = p.id'
            + " WHERE workers.id ='"+workerId+"'"
            +' ORDER BY te.id DESC';


   } else {

     var queryString =  'SELECT te.id as id, workers.first as worker_first, workers.last as worker_last,'
       + ' CONCAT(workers.first, " ", workers.last) as worker_name, u.name as unit_name, p.name as property_name,'
       + 'DATE_FORMAT(te.work_date, "%b %d %Y") as work_date, te.work_hours as work_hours,'
       +'te.notes as notes, te.date_stamp as date_stamp, te.time_stamp as time_stamp, te.gl_code as gl_code, te.is_overtime as is_overtime'
       + ' FROM time_entry as te'
       +' JOIN units as u ON te.unit_id = u.id'
       +' JOIN workers as workers ON te.worker_id = workers.id'
       +' JOIN properties as p ON te.property_id = p.id'
       +' ORDER BY te.id DESC';


   }

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
    +'te.notes as notes, te.date_stamp as date_stamp, te.time_stamp as time_stamp, te.gl_code as gl_code, te.is_overtime as is_overtime'
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
      console.log("In Model, adding new Property : "+JSON.stringify(newProperty));
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

function insertGLAccount(newGLAccount) {
      console.log("In Model, adding new Unit : "+JSON.stringify(newGLAccount))
      return new Promise(function(succeed, fail) {
            connection.query(
            'INSERT INTO gl_accounts SET ?', newGLAccount,
                function(err, results) {
                          if (err) {
                                console.log("Problem inserting Gl Account SQL"+err)
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
          console.log("\n AUTH USER - bad pw "+password+",  checkPlainPW is: "+checkPlainPW)
          //ctApp.logger.log('info', '/login failure U:'+email);
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
