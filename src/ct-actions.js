'use strict';

const express = require('express');
const actions = express.Router();
const path = require('path');
const fs = require('fs');
const lodash = require('lodash');

const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: false })
const mysql = require('mysql');
//const calc =  require('./ira-calc');
const ctSQL =  require('./ct-model');
const menus =  require('./ct-menus');
const ct =  require('../ct');
const passport  = require('passport');
const winston = require('winston');


actions.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
});


//default session info
let sessionInfo = "no session"
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

module.exports = actions;

//module.exports = checkAuthentication






//============ CREW-TIME ROUTES ======================



// insert the new transaction - from MOBILE
actions.post('/process-web-newtime', urlencodedParser, (req, res,next) => {

  processMobNewtime().catch(err => {
        console.log("Process 2 Newtime problem: "+err);
  })

  async function processMobNewtime() {


    let newtime_form = req.body
    console.log("\nNewtime - MOB - Raw from the Form: "+JSON.stringify(newtime_form)+"\n");

    let newTimeEntry = {
            worker_id : newtime_form.worker_id,
            property_id : newtime_form.property_id,
            unit_id : newtime_form.unit_id,
            work_date : newtime_form.work_date,
            work_hours : newtime_form.work_hours,
            notes:  newtime_form.notes,
            gl_code: ct.gl_default,
            date_stamp: newtime_form.date_stamp,
            time_stamp: newtime_form.time_stamp,
            is_overtime: (newtime_form.is_overtime) ? 1 : 0
    }


    console.log("\nAbout to insert new Time Entry from MOBILE with "+JSON.stringify(newTimeEntry, null, 4)+"\n");
    try {
              let insertTEResults = await ctSQL.insertTimeEntry(newTimeEntry);
              ct.ctLogger.log('info', '/add-new-time-entry : '+insertTEResults.insertId+" U:"+userObj.email);
              res.status(200).send(insertTEResults);

    }  catch (err){
              res.status(404).send("Database Error"+err);
    }


  } //async function


}); //route








// the old web-based version of addtime
actions.get('/updateworker/:id', checkAuthentication, (req, res) => {
        if (req.session && req.session.passport) {
           userObj = req.session.passport.user;
        }


  updateWorker().catch(err => {
               console.log("Problems updating worker : "+err);
               req.flash('login', "Problems updating worker ")
               res.redirect('/workers')
         })


  async function updateWorker() {
      let worker = await ctSQL.getWorkerById(req.params.id);
      console.log("\nin update got Worker"+JSON.stringify(worker,null,4));
      if (worker) {
                res.render('ct-update-worker', {
                            userObj: userObj,
                            postendpoint: '/process-update-worker',
                            worker
                    });//render
        } else {
                console.log("No such Worker "+req.params.id);
                req.flash('login', "Problems editing a Worker "+req.params.id)
                res.redirect('/workers')

        }


  } //async function
}); //route add mytime




// insert the new transaction - from MOBILE
actions.post('/process-update-worker', urlencodedParser, (req, res,next) => {


  processUpdateWorker().catch(err => {
        console.log("Process Worker Update problem: "+err);
  })

  async function processUpdateWorker() {

    let update_worker_form = req.body
    console.log("\nUpdate Worker Raw from the Form: "+JSON.stringify(update_worker_form,null,4)+"\n");
    //IF form fields correspond exactly to object fields
    const workerUpdate  = {...update_worker_form}

    console.log("\nAbout to send updated Time Entry to Model "+JSON.stringify(workerUpdate , null, 4)+"\n");

        let updateResults = await ctSQL.updateWorker(workerUpdate);
        //ct.ctLogger.log('info', '/add-new-time-entry : '+insertTEResults.insertId+" U:"+userObj.email);
        console.log("\nUpdated Worker  "+updateResults);
        //res.send(200,"Time Entry Added");
        req.flash('login', "Updated Worker "+workerUpdate.id+" ")
        res.redirect('/workers');

      } //async function


    }); //route









// the old web-based version of addtime
actions.get('/delete_timeentry/:id', checkAuthentication, (req, res) => {
        if (req.session && req.session.passport) {
           userObj = req.session.passport.user;
        }


  deleteTimeentry().catch(err => {
               console.log("Delete timeentry problem: "+err);
               req.flash('login', "Problems delete timeentry")
               res.redirect('/workers')
         })


  async function deleteTimeentry() {
      let timeentry = await ctSQL.getTimeEntryById(req.params.id)
      timeentry.work_date = timeentry.work_date.toString().slice(0,16)
      console.log("\ngot time entry"+JSON.stringify(timeentry, null, 4));
      res.render('ct-confirm-delete-timeentry', {
                userObj: userObj,
                postendpoint: '/process_delete_timeentry',
                timeentry
        });//render
  } //async function
}); //route add mytime



// insert the new deal and corresponding entity
actions.post('/process_delete_timeentry', checkAuthentication, urlencodedParser, (req, res) => {

  //call the async function
  doDeleteTimeentry().catch(err => {
        console.log("Process Del Timeentry problem: "+err);
  })

  async function doDeleteTimeentry() {
            let formData = req.body
            console.log("\nDelete timeentry - Raw from the Form: "+JSON.stringify(formData)+"\n");
            let timeentry =  await ctSQL.getTimeEntryById(formData.timeentryId);

            var delResults = await ctSQL.deleteTimeentry(timeentry.id);
            console.log( "Delted Time Entry #: "+timeentry.id);
            req.flash('login', "Deleted Time Entry #: "+timeentry.id);
            res.redirect('/timeentries/0');

   } //async function
}); //process route





// the old web-based version of addtime
actions.get('/updateworktime/:wtid', checkAuthentication, (req, res) => {
        if (req.session && req.session.passport) {
           userObj = req.session.passport.user;
        }


  updateWorkTime().catch(err => {
               console.log("Update WorkTime problem: "+err);
               req.flash('login', "Problems editing a WorkTime ")
               res.redirect('/home')
         })


  async function updateWorkTime() {
      let workTime = await ctSQL.getTimeEntryById(req.params.wtid)
      console.log("\ngot WT"+JSON.stringify(workTime,null,4));
      if (workTime) {
                let worker = await ctSQL.getWorkerById(workTime.worker_id);
                console.log("\ngot worker"+JSON.stringify(worker,null,4));
                let property = await ctSQL.getPropertyById(workTime.property_id);
                let units =  await ctSQL.getUnitsByPropertyId(workTime.property_id);
                //console.log("\ngot units"+JSON.stringify(units,null,4));
                let unit =  await ctSQL.getUnitById(workTime.unit_id);
                let hoursBy30 = lodash.range(.5, 9, .5);
                //console.log("\ngot Hours"+JSON.stringify(hoursBy30,null,4));
                let allGLAccounts = await ctSQL.getAllGLAccounts() 
                let gl_account = workTime.gl_code ? await ctSQL.getGLAccountByGLCode (workTime.gl_code) : null
                workTime.work_date = ctSQL.convertDate(workTime.work_date)


                console.log("\nrendering  worktime"+JSON.stringify(workTime,null,4));
                res.render('ct-update-worktime', {
                            userObj: userObj,
                            postendpoint: '/process-update-worktime',
                            worktime: workTime,
                            hoursBy30,
                            units,                     
                            unit,
                            gl_accounts: allGLAccounts,
                            gl_account,
                            property,
                            worker,
                            today: ctSQL.getTodaysDate()
                    });//render
        } else {
                console.log("No such Worktime "+req.params.wtid);
                req.flash('login', "Problems editing a WorkTime "+req.params.wtid)
                res.redirect('/home')

        }


  } //async function
}); //route add mytime




// insert the new transaction - from MOBILE
actions.post('/process-update-worktime', urlencodedParser, (req, res,next) => {

  processUpdateWorktime().catch(err => {
        console.log("Process WT Update problem: "+err);
  })

  async function processUpdateWorktime() {

      let update_te_form = req.body
      console.log("\nUpdate WT Raw from the Form: "+JSON.stringify(update_te_form,null,4)+"\n");

      let teUpdates = {
              id: update_te_form.worktime_id,
              unit_id : update_te_form.selcted_unit,
              work_hours : update_te_form.hours_worked,
              notes:  update_te_form.notes,
              is_overtime: update_te_form.is_overtime,
              edit_log: update_te_form.edit_log,
              work_date: update_te_form.work_date,
              gl_code: update_te_form.gl_code
      }


      console.log("\nAbout to send updated Time Entry to Model "+JSON.stringify(teUpdates, null, 4)+"\n");

      let updateTEResults = await ctSQL.updateTimeEntry(teUpdates);
      //ct.ctLogger.log('info', '/add-new-time-entry : '+insertTEResults.insertId+" U:"+userObj.email);
      console.log("\nUpdated Time Entry  "+updateTEResults);
      //res.send(200,"Time Entry Added");
      req.flash('login', "Updated Time Entry "+teUpdates.id+" ")
      res.redirect('/timeentries/0');

    } //async function

  }); //route







// the old web-based version of addtime
actions.get('/delete_worker/:id', checkAuthentication, (req, res) => {
        if (req.session && req.session.passport) {
           userObj = req.session.passport.user;
        }


  deleteWorker().catch(err => {
               console.log("Delete worker problem: "+err);
               req.flash('login', "Problems delete worker")
               res.redirect('/workers')
         })


  async function deleteWorker() {
      let worker = await ctSQL.getWorkerById(req.params.id)
      console.log("\ngot worker"+JSON.stringify(worker,null,4));
      res.render('ct-confirm-delete-worker', {
                userObj: userObj,
                postendpoint: '/process_delete_worker',
                worker: worker
        });//render
  } //async function
}); //route add mytime



// insert the new deal and corresponding entity
actions.post('/process_delete_worker', urlencodedParser, (req, res) => {

  //call the async function
  doDeleteWorker().catch(err => {
        console.log("Process Del Worker problem: "+err);
  })

  async function doDeleteWorker() {
            let formData = req.body
            console.log("\nDelete worker - Raw from the Form: "+JSON.stringify(formData)+"\n");
            let worker =  await ctSQL.getWorkerById(formData.workerId);

            var delResults = await ctSQL.deleteWorker(worker.id);
            console.log( "Delted worker #: "+worker.id);
            req.flash('login', "Deleted Worker #: "+worker.id);
            res.redirect('/workers');

   } //async function
}); //process route







// insert the new deal and corresponding entity
actions.post('/process_work_status', urlencodedParser, (req, res) => {

  //call the async function
  changeWorkStatus().catch(err => {
        console.log("Change Work Status problem: "+err);
  })

  async function changeWorkStatus() {
            let formData = req.body
            console.log("\nChange Work Status - Raw from the Form: "+JSON.stringify(formData)+"\n");
            let unit =  await ctSQL.getUnitById (parseInt(formData.unitId));
            console.log( "for Unit: "+unit.name+" the work status is "+unit.unit_work_status);
            let newWS = (unit.unit_work_status === 1) ? 0 : 1;
            let setWSResults = await ctSQL.setWorkStatus(unit.id,newWS)
            // var delResults = await ctSQL.deleteUnit(unit.id);
            // console.log( "Delted unit #: "+unit.id);
            req.flash('login', "Changed work status for unit #"+unit.id+".    ");
            res.redirect('/buildings');

   } //async function
}); //process add-deal route


actions.get('/delete_gl_account/:id', checkAuthentication, (req, res) => {
      if (req.session && req.session.passport) {
         userObj = req.session.passport.user;
      }


deleteGLAccount().catch(err => {
             console.log("Delete problem: "+err);
             req.flash('login', "Problems delete gl.account")
             res.redirect('/home')
       })


async function deleteGLAccount() {
    let gl_account = await ctSQL.getGLAccountById (req.params.id)
    console.log("\ngot GL Account"+JSON.stringify(gl_account,null,4));
    res.render('ct-confirm-delete-gl-account', {
              userObj: userObj,
              postendpoint: '/process_delete_gl_account',
              gl_account
      });//render
} //async function
}); //route add mytime



// insert the new deal and corresponding entity
actions.post('/process_delete_gl_account', urlencodedParser, (req, res) => {

//call the async function
doDeleteGLAccount().catch(err => {
      console.log("Process Del GL Account problem: "+err);
})

async function doDeleteGLAccount() {
          let formData = req.body
          console.log("\nDelete GL Account - Raw from the Form: "+JSON.stringify(formData)+"\n");
          let gl_account =  await ctSQL.getGLAccountById (formData.gl_account_id);

          var delResults = await ctSQL.deleteGLAccount(gl_account.id);
          console.log( "Delted gl_account #: "+gl_account.description);
          req.flash('login', "Deleted gl_account #: "+gl_account.description);
          res.redirect('/home');

 } //async function
}); //process add-deal route






actions.get('/delete_unit/:id', checkAuthentication, (req, res) => {
        if (req.session && req.session.passport) {
           userObj = req.session.passport.user;
        }


  deleteUnit().catch(err => {
               console.log("Delete problem: "+err);
               req.flash('login', "Problems delete unit")
               res.redirect('/home')
         })


  async function deleteUnit() {
      let unit = await ctSQL.getUnitById (req.params.id)
      console.log("\ngot Unit"+JSON.stringify(unit,null,4));
      res.render('ct-confirm-delete-unit', {
                userObj: userObj,
                postendpoint: '/process_delete_unit',
                unit: unit
        });//render
  } //async function
}); //route add mytime



// insert the new deal and corresponding entity
actions.post('/process_delete_unit', urlencodedParser, (req, res) => {

  //call the async function
  doDeleteUnit().catch(err => {
        console.log("Process Del Unit problem: "+err);
  })

  async function doDeleteUnit() {
            let formData = req.body
            console.log("\nDelete Unit - Raw from the Form: "+JSON.stringify(formData)+"\n");
            let unit =  await ctSQL.getUnitById (formData.unitId);

            var delResults = await ctSQL.deleteUnit(unit.id);
            console.log( "Delted unit #: "+unit.id);
            req.flash('login', "Deleted Unit #: "+unit.id);
            res.redirect('/home');

   } //async function
}); //process add-deal route



// the old web-based version of addtime
actions.get('/delete_prop/:id', checkAuthentication, (req, res) => {
        if (req.session && req.session.passport) {
           userObj = req.session.passport.user;
        }


  deleteBuilding().catch(err => {
               console.log("Delete problem: "+err);
               req.flash('login', "Problems delete building ")
               res.redirect('/home')
         })


  async function deleteBuilding() {
      let property= await ctSQL.getPropertyById (req.params.id)
      console.log("\ngot Property"+JSON.stringify(property,null,4));
      res.render('ct-confirm-delete-prop', {
                userObj: userObj,
                postendpoint: '/process_delete_prop',
                property: property
        });//render
  } //async function
}); //route add mytime



// insert the new deal and corresponding entity
actions.post('/process_delete_prop', urlencodedParser, (req, res) => {

  //call the async function
  doDeleteProperty().catch(err => {
        console.log("Process Del Property problem: "+err);
  })

  async function doDeleteProperty() {
            let formData = req.body
            console.log("\nDelete Prop - Raw from the Form: "+JSON.stringify(formData)+"\n");
            let property= await ctSQL.getPropertyById (formData.propId)
            let units =  await ctSQL.getUnitsByPropertyId (property.id);

            units.forEach (async (unit) => {
                  let delUnitResults = await ctSQL.deleteUnit(unit.id);
                  console.log( "Deleted Unit #: "+JSON.stringify(delUnitResults));
            })

            var delPropResults = await ctSQL.deleteProperty(property.id);
            console.log( "Delted property #: "+property.id);
            req.flash('login', "Deleted Bldg. #: "+property.id);
            res.redirect('/home');

   } //async function
}); //process add-deal route


actions.get('/add-gl-account', checkAuthentication, (req, res) => {
      if (req.session && req.session.passport) {
         userObj = req.session.passport.user;
      }

      res.render('add-gl-account', {
              userObj: userObj,
              postendpoint: '/process_add_gl_account'

      });//render

}); //route

// insert the gl account
actions.post('/process_add_gl_account', urlencodedParser, (req, res) => {

      //call the async function
      addGLAccount().catch(err => {
            console.log("Process Add GL Account problem: "+err);
      })
    
      async function addGLAccount() {
                let formData = req.body
                console.log("\nAdd GL Account - Raw from the Form: "+JSON.stringify(formData)+"\n");
                let newGLAccount = {
                  code: parseInt(formData.code),
                  description: formData.description,
                }
    
                var addGLAccountResults = await ctSQL.insertGLAccount(newGLAccount);
                console.log( "Added GL Account #: "+addGLAccountResults.insertId);
                req.flash('login', "Added GL Account #: "+addGLAccountResults.insertId);
                res.redirect('/home');
       } //async function
    }); //process add-deal route
    



actions.get('/add-worker', checkAuthentication, (req, res) => {
          if (req.session && req.session.passport) {
             userObj = req.session.passport.user;
          }

          res.render('add-worker', {
                  userObj: userObj,
                  postendpoint: '/process_add_worker'

          });//render

  }); //route


// insert the new deal and corresponding entity
actions.post('/process_add_worker', urlencodedParser, (req, res) => {

  //call the async function
  addWorker().catch(err => {
        console.log("Process Add Worker problem: "+err);
  })

  async function addWorker() {
            let formData = req.body
            console.log("\nAdd Worker - Raw from the Form: "+JSON.stringify(formData)+"\n");
            let newWorker = {
              first: formData.first,
              last: formData.last,
              phone: formData.phone,
              link: formData.link.toLowerCase(),
              boss_id:null
            }

            var addWorkerResults = await ctSQL.insertWorker(newWorker);
            console.log( "Added worker #: "+addWorkerResults.insertId);
            req.flash('login', "Added Worker #: "+addWorkerResults.insertId);
            res.redirect('/home');
   } //async function
}); //process add-deal route


// insert the new deal and corresponding entity
actions.get('/add-property', checkAuthentication,  (req, res) => {
  //actions.get('/add-deal', (req, res) => {
          if (req.session && req.session.passport) {
             userObj = req.session.passport.user;
          }

          res.render('add-property', {
                  userObj: userObj,
                  postendpoint: '/process_add_property'

          });//render

  }); //route


// insert the new deal and corresponding entity
actions.post('/process_add_property', urlencodedParser, (req, res) => {

  //call the async function
  addProperty().catch(err => {
        console.log("Process Add Property problem: "+err);
  })

  async function addProperty() {
            let formData = req.body
            console.log("\nAdd Property - Raw from the Form: "+JSON.stringify(formData)+"\n");
            let newProperty = {
              name: formData.name,
              location: null
            }

            var addPropResults = await ctSQL.insertProperty(newProperty);
            console.log( "Added property #: "+addPropResults.insertId);
            req.flash('login', "Added Property #: "+addPropResults.insertId);
            res.redirect('/home');

   } //async function
}); //process add-deal route


// insert the new deal and corresponding entity
actions.get('/add-unit', checkAuthentication, (req, res) => {
  if (req.session && req.session.passport) {
     userObj = req.session.passport.user;
  }



  //call the async function
  addUnit().catch(err => {
        console.log("Process Add Unit problem: "+err);
  })

  async function addUnit() {

          if (req.session && req.session.passport) {
             userObj = req.session.passport.user;
          }

          let allProperties  = await ctSQL.getAllProperties();
          res.render('add-unit', {
                  userObj: userObj,
                  properties: allProperties,
                  postendpoint: '/process_add_unit'

          });//render
    } //async function
}); //route


// insert the new deal and corresponding entity
actions.post('/process_add_unit', urlencodedParser, (req, res) => {

  //call the async function
  addUnit().catch(err => {
        console.log("Process Add Unit problem: "+err);
  })

  async function addUnit() {
            let formData = req.body
            console.log("\nAdd Unit - Raw from the Form: "+JSON.stringify(formData)+"\n");
            let newUnit= {
              name: formData.name,
              property_id: formData.property_id,
              unit_work_status: 1
            }

            var addUnitResults = await ctSQL.insertUnit(newUnit);
            console.log( "Added unit #: "+addUnitResults.insertId);
            req.flash('login', "Added Unit #: "+addUnitResults.insertId);

            res.redirect('/home');

   } //async function
}); //process add-deal route










// the old web-based version of addtime
actions.get('/addtime/:link', checkAuthentication, (req, res) => {
        if (req.session && req.session.passport) {
           userObj = req.session.passport.user;
        }


  addCrewTime().catch(err => {
               console.log("Add CrewTime problem: "+err);
               req.flash('login', "Problems adding CrewTime ")
               res.redirect('/home')
         })


  async function addCrewTime() {
      let worker = await ctSQL.getWorkerByLink (req.params.link)
      console.log("\ngot Worker"+JSON.stringify(worker,null,4));
      let properties = await ctSQL.getAllProperties()
      res.render('ct-choose-property-newtime', {
                userObj: userObj,
                postendpoint: '/process-1-newtime',
                worker: worker,
                properties: properties
        });//render
  } //async function
}); //route add mytime



// insert the new transaction - WEB not MOBILE
actions.post('/process-1-newtime', urlencodedParser, (req, res,next) => {

  processOneNewtime().catch(err => {
        console.log("Process One  Newtime problem: "+err);
  })

  async function processOneNewtime() {

    let selected_property_form = req.body
    console.log("\nRaw from the Form, got this "+JSON.stringify(selected_property_form)+"\n");
    let selected_property_id = selected_property_form.selected_property;
    let worker_link = selected_property_form.worker_link;
    let units =  await ctSQL.getUnitsByPropertyId (selected_property_id);
    let worker = await ctSQL.getWorkerByLink(worker_link);
    let property = await ctSQL.getPropertyById(selected_property_id);
    let today = ctSQL.getTodaysDate()
    let hoursBy30 = lodash.range(.5, 9, .5);
    //console.log("\nhoursBy30 looks like "+hoursBy30+"\n");


    res.render('ct-enter-hours-newtime', {
              userObj: userObj,
              postendpoint: '/process-2-newtime',
              units,
              worker,
              property,
              today,
              hoursBy30,

      });//render


  } //async function


}); //route



// insert the new transaction - from WEB FORM NOT MOBILE
actions.post('/process-2-newtime', urlencodedParser, (req, res,next) => {

  processTwoNewtime().catch(err => {
        console.log("Process 2 Newtime problem: "+err);
  })

  async function processTwoNewtime() {



    let newtime_form = req.body
    console.log("\nNewtime2 - Raw from the Form: "+JSON.stringify(newtime_form)+"\n");

    let newTimeEntry = {
            worker_id : newtime_form.worker_id,
            property_id : newtime_form.selected_property_id,
            unit_id : JSON.parse(newtime_form.selcted_unit)[0],
            gl_code: ct.gl_default,
            work_date : newtime_form.work_date,
            work_hours : newtime_form.hours_worked,
            notes:  newtime_form.notes
    }





    console.log("\nAbout to insert new Time Entry transaction with "+JSON.stringify(newTimeEntry, null, 4)+"\n");

    let insertTEResults = await ctSQL.insertTimeEntry(newTimeEntry);
    ct.ctLogger.log('info', '/add-new-time-entry : '+insertTEResults.insertId+" U:"+userObj.email);
    console.log("\nAdded Time Entry -  "+insertTEResults.insertId);

    //   "work_date":"2018-08-21",
    //   "hours_worked":"0.5",
    //   "notes":"",
    //   "worker_link":"delporto37",

        let selected_property = await ctSQL.getPropertyById(newtime_form.selected_property_id)
        res.render('ct-confirm-thankyou-newtime', {
                  worker:   await ctSQL.getWorkerByLink(newtime_form.worker_link),
                  unit_name: JSON.parse(newtime_form.selcted_unit)[1],
                  property_name: selected_property.name,
                  date_worked: newtime_form.work_date,
                  hours_worked: newtime_form.hours_worked,
                  notes: newtime_form.notes

          });//render






  } //async function


}); //route



          function checkAuthentication(req,res,next){

                    if(req.isAuthenticated()){
                           console.log("YES, authenticated"+req.url)
                           //req.flash('login', 'checkAuth success')
                           return next();
                           //res.redirect(req.url);

                    } else {
                        console.log("NO, not authenticated"+req.url)
                        //req.flash('login', 'checkAuth failed, need to login')
                        req.session.return_to = req.url
                        res.redirect("/login");
                    }
          }
