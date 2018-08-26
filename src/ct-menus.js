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


        // let fields = [
        //
        //     {
        //       label:"Worker",
        //       value:columns[0]
        //     },
        //     {
        //       label:"Property",
        //       value:columns[1]
        //     },
        //     {
        //       label:"Unit",
        //       value:columns[2]
        //     },
        //     {
        //       label:"Work-Date",
        //       value:columns[3]
        //     },
        //     {
        //       label:"Hours",
        //       value:columns[4]
        //     },
        //     {
        //       label:"Notes",
        //       value:columns[5]
        //     }
        //
        // ]
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















//==========  IRA ROUTES ===========================


router.get('/dealdetails/:id',  checkAuthentication, (req, res) => {



    if (req.session && req.session.passport) {
                 userObj = req.session.passport.user;
    }

    //call the async function
    pullDealComponents().catch(err => {
          console.log("Deal Components problem: "+err);
    })

    async function pullDealComponents() {
          var entity = await ctSQL.getEntityById(req.params.id);
          console.log("have Entity   "+ JSON.stringify(entity));

          let capitalCalls =  await ctSQL.getCapitalCallsForEntity(entity.id);
          console.log("Got bacck Capital Calls "+JSON.stringify(capitalCalls, null, 4))

          var dealFinancials = await ctSQL.getDealById(entity.deal_id);
          console.log("Before Ownership, have Entity   "+ entity.name+"   and Deal is  "+JSON.stringify(dealFinancials));
          var investors = await ctSQL.getOwnershipForEntity(entity.id)
          if (investors.length>0) {
                                let results = calc.totalupInvestors(investors)
                                let expandInvestors = results[0]
                                let totalCapital =  results[1].totalCapital
                                let totalCapitalPct = results[1].totalCapitalPct
                                let expandDeal = calc.calculateDeal(dealFinancials)
                                // console.log("\nrendering ownership and Deal is "+JSON.stringify(deals, null, 4))
                                res.render('deal-details', {
                                        userObj: userObj,
                                        message:  "Showing "+expandInvestors.length+" investors",
                                        investors: expandInvestors,
                                        capitalCalls: capitalCalls,
                                        totalCapital: calc.formatCurrency(totalCapital),
                                        totalCapitalPct: totalCapitalPct,
                                        deal:expandDeal,
                                        entity:entity
                                });

            } else { //no ownership data
                                let expandDeal = calc.calculateDeal(dealFinancials)
                                res.render('deal-details', {
                                      userObj: userObj,
                                      message:  "No ownership information found ",
                                      dealName: expandDeal.name,
                                      deal:expandDeal,
                                      capitalCalls: capitalCalls
                                }); //  render
            }  //if-else  - no ownership get name of entity
      } //async function pullDealComponents
}); //route - deal details







//pull up info for this one capital call
router.get('/capitalcall/:id', checkAuthentication, (req, res) => {
      if (req.session && req.session.passport) {
         userObj = req.session.passport.user;
       }

       showCapCallDetails().catch(err => {
             console.log("cap call details problem: "+err);
             req.flash('login', "Problems getting Capital Call for "+req.params.id+".  ")
             res.redirect('/home')
       })


       //move this to calc
       async function showCapCallDetails() {
             let foundCapCall = await ctSQL.getCapitalCallById(req.params.id);
             console.log("in CC Details, have CC   "+ JSON.stringify(foundCapCall));

            let capCallTransactions = await ctSQL.getTransactionsForCapitalCall (foundCapCall.id, [8]);
            console.log("Capp Call transactions are: "+JSON.stringify(capCallTransactions,null,4))

            let dealEntity = await ctSQL.getEntityById(foundCapCall.deal_entity_id);



            let totalRaised = capCallTransactions.reduce((total, item) => {
                  return total + item.t_amount;
              }, 0);




                            console.log("rendering Cap Call")
                            res.render('capitalcall-details', {
                                    userObj: userObj,
                                    message:  "Showing "+capCallTransactions.length+" transactions. ",
                                    capCall: foundCapCall,
                                    dealEntity: dealEntity,
                                    transactions: CapCallTransaction,
                                    totalRaised

                            });


       } //async function
  }); //route - ownership







router.get('/portfolio/:id', (req, res) => {
    if (req.session && req.session.passport) {
       userObj = req.session.passport.user;
     }

     showInvestorPortfolio().catch(err => {
           console.log("investor portfolio problem: "+err);
           req.flash('login', "Problems getting Portfolio info for entity no. "+req.params.id+".  ")
           res.redirect('/home')
     })

     async function showInvestorPortfolio() {
              let foundInvestor = await ctSQL.getEntityById(req.params.id);
              let results = await calc.totalupInvestorPortfolio(foundInvestor.id)
              let portfolioDeals = results[0]
              if (portfolioDeals.length >0 ) {
                          let totalInvestmentValue =  results[1]
                          let totalPortfolioValue =  results[2]
                          let totalDistributions =  results[3]*-1 //make it positive here
                          let portfolioValueGain =  totalPortfolioValue-totalInvestmentValue
                          let portfolioCashGain = portfolioValueGain+ totalDistributions
                          let portfolioIRR = parseFloat(portfolioCashGain/totalInvestmentValue)*100
                          console.log("\nRendering Investor Portfolio, totalDistrib is  : " + totalDistributions+"")
                          console.log("\nexample 2nd Deal : " + JSON.stringify(portfolioDeals[1],null,6)+"\n\n")
                          ct.ctLogger.log('info', '/portfolio/id    : '+foundInvestor.name+"  U:"+userObj.email);
                          res.render('portfolio-details', {
                                  userObj: userObj,
                                  message:  "Showing "+portfolioDeals.length+" investments ",
                                  investorName: portfolioDeals[0].investor_name,
                                  investments: portfolioDeals, //including rollover transactions
                                  totalPortfolioValue,
                                  totalInvestmentValue,
                                  portfolioValueGain,
                                  totalDistributions,
                                  portfolioCashGain,
                                  portfolioIRR: portfolioIRR.toFixed(2)
                          });

                    } else { //no ownership data
                          req.flash('login', "No portfolio info for "+foundInvestor.name+".  ")
                          res.redirect('/home/')

                } //if ownership
     } //async function
}); //route - ownership



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













  router.get('/transactions/:id', checkAuthentication, (req, res) => {
      if (req.session && req.session.passport) {
                   userObj = req.session.passport.user;
      }

      //call the async function
      showTransForEntity().catch(err => {
            console.log("Show trandsactions for entity problem: "+err);
      })

      async function showTransForEntity() {
            try {
                  var entity = await ctSQL.getEntityById(req.params.id);
                  console.log("have Entity   "+ JSON.stringify(entity));
                  ct.ctLogger.log('info', '/transactions/id : '+entity.name+"  U:"+userObj.email);
                  var transactions = await ctSQL.getTransactionsForInvestment(entity.id);
                  console.log("\nGot transactions for entity, here is 1st  "+JSON.stringify(transactions[0],null,5));

                  //add delete flag to each
                  for (let j=0; j<transactions.length; j++) {

                              let hasOwnTrans = await ctSQL.getOwnTransByTransID(transactions[j].id);
                              transactions[j].can_delete = (hasOwnTrans ? false : true);
                              //console.log ("for "+transactions[j].id+" can delete is: "+transactions[j].can_delete)

                  };

            } catch (err ){
                  console.log(err+ " -- No entity for    "+ req.params.id);
                  var transactions = await ctSQL.getAllTransactions();

                  for (let j=0; j<transactions.length; j++) {
                              transactions[j].can_delete = false;
                               //return e;
                  };

                  var entity = {
                    id:0,
                    name: "Select filter"
                  }
            }




            //shorten names to 30 chars for display in pulldown
            var rawEntities = await ctSQL.getEntitiesByTypes([1,3,4]);

            var entitiesForFilter = rawEntities.map(function(plank) {
                        plank.name = plank.name.substring(0,30);
                        return plank;
            });
            entity.name = entity.name.substring(0,30);

            //console.log("\nGot "+entitiesForFilter.length+" entities for Filter ");


            res.render('list-transactions', {
                    userObj: userObj,
                    sessioninfo: JSON.stringify(req.session),
                    message: req.flash('login') + "  Showing "+transactions.length+" transactions",
                    transactions: transactions,
                    filterList: entitiesForFilter,
                    selectedEntity: entity,
                    postendpoint: '/process_transactions_filter'
            });//render

      } //async function
  }); //route - transactions





  //need this because we hit a submit button to send search
  router.post('/process_transactions_filter', urlencodedParser, (req, res) => {

            if (req.session && req.session.passport) {
               userObj = req.session.passport.user;
             }

             let filterEntity = req.body.filter_ent
             console.log("\nGot Filter entity"+filterEntity)
             res.redirect('/transactions/'+filterEntity);

  })






//MENU - list of entities and theor Ownership status
  router.get('/setownership', checkAuthentication, (req, res) => {
            if (req.session && req.session.passport) {
               userObj = req.session.passport.user;

             }
            ctSQL.getEntitiesByTypes([1,3,4]).then(
                  function(entities) {
                            //console.log("in get all ENTITIES, we got:   "+JSON.stringify(entities[0]))
                            var expandEntities = entities;

                            for (let index = 0; index < entities.length; index++) {
                                   if(  (expandEntities[index].ownership===0) && (expandEntities[index].type === 1)    ) {
                                              expandEntities[index].canSetOwnership = true
                                    } //if
                            }//for

                            //console.log("\nEntities for Manage Owenership menu "+JSON.stringify(entities,null,4));
                            res.render('setown-entities', {
                                    userObj: userObj,
                                    sessioninfo: JSON.stringify(req.session),
                                    message: req.flash('login') + "Showing "+entities.length+" entities.",
                                    //message: "Showing "+entities.length+" entities.",
                                    entities: expandEntities
                            });//render


                  }, function(err) {   //failed
                                 console.log("List entities problem: "+err);
                                 return;
                  } //  success function
            ); //getAll Entities then
  }); // setownership route


//show existing ownership
router.get('/ownership/:id', checkAuthentication, (req, res) => {
      if (req.session && req.session.passport) {
         userObj = req.session.passport.user;
       }

       showOwnershipInfo().catch(err => {
             console.log("ownership info problem: "+err);
             req.flash('login', "Problems getting Ownership "+req.params.id+".  ")
             res.redirect('/home')
       })

       async function showOwnershipInfo() {
             let foundEntity = await ctSQL.getEntityById(req.params.id);
             //console.log("in OWN, have Entity   "+ JSON.stringify(foundEntity));
             if (foundEntity.ownership_status === 1) {
                            let investors = await ctSQL.getOwnershipForEntity(foundEntity.id);
                            console.log("show-Ownership rows with DATE JOIN are: "+JSON.stringify(investors,null,4))
                            let results = calc.totalupInvestors(investors)
                            let expandInvestors = results[0]
                            let totalCapital =  results[1].totalCapital
                            let totalCapitalPct = (results[1].totalCapitalPct*1).toFixed(2)



                            console.log("rendering ownership")
                            res.render('entity-details', {
                                    userObj: userObj,
                                    message:  "Showing "+expandInvestors.length+" investors ",
                                    entity: foundEntity,
                                    impliedValue: foundEntity.implied_value,
                                    investors: expandInvestors,
                                    totalCapital: totalCapital,
                                    totalCapitalPct: totalCapitalPct
                            });

                      } else { //no ownership data
                            res.redirect('/setownership/'+req.params.id)

                  } //if ownership
       } //async function
  }); //route - ownership






//===========TOP LEVEL MENUS =============================

router.get('/entities', checkAuthentication, (req, res) => {
          if (req.session && req.session.passport) {
             userObj = req.session.passport.user;

           }
          ctSQL.getAllEntities().then(
                function(entities) {
                          console.log("in get all ENTITIES #6  "+JSON.stringify(entities[5], null, 4))

                          var expandEntities = entities.map((ent) => {
                                      ent.short_name = ent.name.substring(0,30);
                                      return ent
                          });



                          res.render('list-entities', {
                                  userObj: userObj,
                                  sessioninfo: JSON.stringify(req.session),
                                  message: req.flash('login') + "Showing "+entities.length+" entities.",
                                  entities: expandEntities
                          });//render


                }, function(err) {   //failed
                               console.log("List entities problem: "+err);
                               return;
                } //  success function
          ); //getAll Entities then
}); //  entities route






router.get('/deals', checkAuthentication, (req, res) => {
          if (req.session && req.session.passport) {
             userObj = req.session.passport.user;
             console.log("Session info is: "+JSON.stringify(req.session,null,4));
           }
          ctSQL.getEntitiesByTypes([1]).then(
                function(entities) {
                          //console.log("in get all ENTITIES, we got:   "+JSON.stringify(entities[0]))
                          var expandEntities = entities;

                          for (let index = 0; index < entities.length; index++) {
                                 if(  (expandEntities[index].ownership===0) && (expandEntities[index].type === 1)    ) {
                                            expandEntities[index].canSetOwnership = true
                                  } //if
                          }//for


                          res.render('list-deals', {
                                  userObj: userObj,
                                  sessioninfo: JSON.stringify(req.session),
                                  message: req.flash('login') + "Showing "+entities.length+" deals.",
                                  entities: expandEntities
                          });//render


                }, function(err) {   //failed
                               console.log("List deals problem: "+err);
                               return;
                } //  success function
          ); //getAll Entities then
}); //  entities route








  router.get('/home', (req, res) => {

    if (req.session && req.session.passport) {
       userObj = req.session.passport.user;
     }


      let reportMenuOptions = []
      reportMenuOptions[0] = {name:"Workers & Links to Forms", link:"/workers"}
      reportMenuOptions[1] = {name:"Review Time Entries with Filter", link:"/timeentries/0"}
      reportMenuOptions[2] = {name:"Properties with Units", link:"/home"}
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
