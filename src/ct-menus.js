'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const hbs = require('hbs');

const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: false })
const mysql = require('mysql');
//const calc =  require('./ira-calc');
const ctSQL =  require('./ct-model');
const actions =  require('./ct-actions');
const ct =  require('../ct');
const passport  = require('passport');
const winston = require('winston');
const j2csvParser = require('json2csv').parse;


//default session info
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

module.exports = router;


//============ CT Routes ======================

router.get('/buildings',  (req, res) => {
          if (req.session && req.session.passport) {
             userObj = req.session.passport.user;

           }

 //call the async function
 buildings_units().catch(err => {
       console.log("Show timeentriesForId problem: "+err);
 })





async function buildings_units() {
                  let allBuildings = await ctSQL.getAllProperties()

                  let allBuildingsUnits = await Promise.all(
                       allBuildings.map( async (building) => {
                              let units = await ctSQL.getUnitsByPropertyId(building.id);
                              //let xBuilding = Object.assign({},building);
                              building.units = units
                              building.name = building.name.slice(0,15)
                              //console.log("Got building: "+JSON.stringify(xBuilding,null,4));
                              return building

                        })
                   )


                //  console.log("Here are ALL the buildings same bld: "+JSON.stringify(allBuildingsUnits,null,4));


                  res.render('ct-list-buildings', {
                          userObj: userObj,
                          sessioninfo: JSON.stringify(req.session),
                          message: req.flash('login') + "Showing "+allBuildingsUnits.length+" buildings.",
                          buildings: allBuildingsUnits
                  });//render





   } //async function

}); //  buildings route








router.get('/timeentries/:id', (req, res) => {
    if (req.session && req.session.passport) {
                 userObj = req.session.passport.user;
    }

    //call the async function
    showTimeEntriesForId().catch(err => {
          console.log("Show timeentriesForId problem: "+err);
    })



    async function showTimeEntriesForId() {
         try {
                var worker = await ctSQL.getWorkerById(req.params.id);
                console.log("\nGot worker  "+JSON.stringify(worker ,null,5));
                 //ct.ctLogger.log('info', '/timeentries/id : '+worker.name+"  U:"+userObj.email);

                var timeEntries = await ctSQL.getTimeEntriesById(req.params.id);
                console.log("\nGot timeEntries for id here is 1st  "+JSON.stringify(timeEntries[0],null,5));


                 if(!timeEntries[0]) {
                     timeEntries = await ctSQL.getAllTimeEntries();
                    console.log("\nGot ALL timeEntries here is 1st  "+JSON.stringify(timeEntries[0],null,5));
                 }

          //if no id match
          } catch (err ){
                console.log(err+ " -- No worker for    "+ req.params.id);
                let timeEntries = await ctSQL.getAllTimeEntries();

          }


          if (!worker) {
                      var worker = {
                        id:0,
                        first: "Select",
                        last: "filter"
                      }
         }



          //Build the Worker Filter List
          let workersForFilter = await ctSQL.getAllWorkers();

          //console.log("\nGot workers for filter, here is 1st  "+JSON.stringify(workersForFilter[0],null,5));
          console.log("\nGot selected worker  "+JSON.stringify(worker ,null,5));

          res.render('ct-list-timeentries', {
                  userObj: userObj,
                  sessioninfo: JSON.stringify(req.session),
                  message: req.flash('login') + "  Showing "+timeEntries.length+" time entries",
                  timeEntries: timeEntries,
                  filterList: workersForFilter,
                  selectedWorker: worker,
                  postendpoint: '/process_timeentries_filter'
          });//render

    } //async function
}); //route - timeEntries





//need this because we hit a submit button to send search
router.post('/process_timeentries_filter', urlencodedParser, (req, res) => {

          if (req.session && req.session.passport) {
             userObj = req.session.passport.user;
           }

           let filterLink = req.body.filter_id
           console.log("\nGot filter_id "+filterLink);
           res.redirect('/timeentries/'+filterLink);

})





router.get('/workers',  (req, res) => {
          if (req.session && req.session.passport) {
             userObj = req.session.passport.user;

           }
          ctSQL.getAllWorkers().then(
                function(workers) {
                          res.render('ct-list-workers', {
                                  userObj: userObj,
                                  sessioninfo: JSON.stringify(req.session),
                                  message: req.flash('login') + "Showing "+workers.length+" workers.",
                                  workers: workers
                          });//render


                }, function(err) {   //failed
                               console.log("List workers problem: "+err);
                               return;
                } //  success function
          ); //getAll Entities then
}); //  entities route





async function createTECSVforDownload(responseArray) {

        let columns = Object.keys(responseArray[0]);
        console.log(" Columns are: " + columns +"\n")

        let fields = []
        columns.forEach((column,index) => {
              fields[index] = {
                label:column,
                value:column
              }
        })


        console.log(" Fields are: " + JSON.stringify(fields,null,4) +"\n")
        let options = { fields };
      //console.log("in create CSV - Trans JSON data has  " + JSON.stringify(responseArray,null,4) +"\n")
        const csv = j2csvParser(responseArray, options);
        console.log("\nTHE CSV is "+csv);
        return csv;

}



router.get('/download_csv/:id', (req, res) => {

      downloadCSVTimeEntries().catch(err => {
            console.log("DownloadTimeEntries problem: "+err);
      })
      let fileName = "file";
      async function downloadCSVTimeEntries() {
            try {

                  let filerWorker = await ctSQL.getWorkerById(req.params.id)
                  var timeEntries = await ctSQL.getTimeEntriesById(req.params.id);
                  console.log("\nGot timeEntries for entity  "+JSON.stringify(timeEntries,null,5));
                  fileName = filerWorker.last+"_CT_TimeEntries.csv"
            } catch (err ){

                  var timeEntries = await ctSQL.getAllTimeEntries();
                  console.log("\nGot All timeEntries "+JSON.stringify(timeEntries,null,5));
                  fileName = "All_CT_TimeEntries.csv"

            }

            var  selectTimeEntries = timeEntries.map(function(element) {
                        return  {
                          id: element.id,
                          worker_name: element.worker_name,
                          property_name: element.property_name,
                          unit_name: element.unit_name,
                          work_date: element.work_date,
                          work_hours: element.work_hours,
                          time_stamp: element.time_stamp,
                          date_stamp: element.date_stamp,
                          notes: element.notes
                        }
            });


                  let timeEntriesCSV = await createTECSVforDownload(selectTimeEntries);
                  console.log("In CT-menus, the CSV file is \n"+timeEntriesCSV+"\n")
                  res.setHeader('Content-disposition', 'attachment; filename='+fileName);
                  res.set('Content-Type', 'text/csv');
                  res.status(200).send(timeEntriesCSV);

    }; //async function

}); //route








router.get('/showlogs',  (req, res) => {
        if (req.session && req.session.passport) {
           userObj = req.session.passport.user;
        }

        asyncShowFile().catch(err => {
               console.log("readFile problem: "+err);
               req.flash('login', "Problems getting file : "+filePath+".  ")
               res.redirect('/home')
         })


        async function asyncShowFile() {
              let fileName = "iralog3.log"
              let filePath = path.resolve(__dirname, fileName)
              console.log("FilePath is : "+filePath )

              try {
                        let fileContent = await fs.readFileSync(filePath, 'utf8')
                        //console.log("Got from file: "+fileContent)
                        var logRows = []

                        while (fileContent.length > 2) {
                          let startLine = fileContent.indexOf("<*");
                          let endLine = fileContent.indexOf("*>");
                          let logLine = fileContent.slice(startLine, endLine+2);
                          //console.log("line is:  "+logLine)
                          let user = logLine.slice(logLine.indexOf("U:")+2,logLine.indexOf("*>"))
                          let message = logLine.slice(logLine.indexOf("Z ")+2,logLine.indexOf("U:")-1)
                          //let dateTime = logLine.slice(2,logLine.indexOf("Z")
                          let dateTime = (logLine.slice(2,logLine.indexOf("Z")-4)).replace(/T/," ")
                          // message = message.replace(/(?<=7)T/g,"  "); //JS does not support look behind!!

                          let logRow = {
                                  user:user,
                                  message:message,
                                  time:dateTime
                          }
                          logRows.push(logRow)
                          //trim the row you just got
                          fileContent = fileContent.slice(endLine+2)
                        }

                        res.render('show-logs', {
                                userObj: userObj,
                                sessioninfo: req.session,
                                message: req.flash('login') + " ",
                                logFilename: fileName,
                                logRows:logRows

                        });//render

              } catch (err){
                        console.log(err+ " -- File   ");
                        req.flash('login', "Could not read log file "+ filePath +" with err"+err);
                        res.redirect('/home/');
             } //trycatch
        } //asyncfunction
}); //route showlogs





  router.get('/home', (req, res) => {

    if (req.session && req.session.passport) {
       userObj = req.session.passport.user;
     }


      let reportMenuOptions = []
      reportMenuOptions[0] = {name:"Workers & Links to Forms", link:"/workers"}
      reportMenuOptions[1] = {name:"Time Entries with XLS Download", link:"/timeentries/0"}
      reportMenuOptions[2] = {name:"Properties with Units", link:"/buildings"}
      //reportMenuOptions[2] = {name:"Commitments", link:"/commitments"}




      let adminMenuOptions = []

      adminMenuOptions[0] = {name:"Add Worker", link:"/add-worker"}
      adminMenuOptions[1] = {name:"Add Property", link:"/add-property"}
      adminMenuOptions[2] = {name:"Add Unit", link:"/add-unit"}



      res.render('home', {
              userObj: userObj,
              message: req.flash('login'),
              sessionInfo: JSON.stringify(req.session),
              reportmenuoptions: reportMenuOptions,
              adminmenuoptions: adminMenuOptions,
              ctVersion: ct.version
      });

  });

  router.get('/shutdown123', (req, res) => {
          shutDownServer()
          res.send("Good--bye!")
  })



  router.get('/', function(req, res) {
        res.redirect('/home')

 })


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




     hbs.registerHelper('formatUSD', function(amount, options) {
                 if (!amount) return "$0.00";
                 if (typeof(amount) === 'string') return amount;
                 if (amount >= 0) {
                    return "$"+amount.toFixed(0).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
                 } else {
                    return "($"+(-1*amount).toFixed(0).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")+")";
                 }
     }); //function




     hbs.registerHelper('ifEqual', function(v1, v2, options) {
               if(v1 === v2) {
                   return options.fn(this);
               }
               return options.inverse(this);

     });

     hbs.registerHelper('ifLessThan', function(v1, v2, options) {
               if(v1 < v2) {
                   return options.fn(this);
               }
               return options.inverse(this);

     });

     hbs.registerHelper('ifGreaterThan', function(v1, v2, options) {
               if(v1 > v2) {
                   return options.fn(this);
               }
               return options.inverse(this);

     });

     hbs.registerHelper('ifIncludes', function(v1, v2, options) {
               if(v1.toString().includes(v2)) {
                   return options.fn(this);
               }
               return options.inverse(this);

     });
