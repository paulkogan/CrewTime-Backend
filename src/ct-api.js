'use strict';

const express = require('express');
const api = express.Router();
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

module.exports = api;



//    *********     List of API Calls ***********








//======== IRA api calls
// getcapcallswithdetails
// getccdetails
// getcapitalcalls
// getdealfinancials
// getownership
// getdeals
// getalltransactions
// transforentity
// searchentities


// =============== APIs ===============


api.get('/api/gettimeentriesforworker/:id',  (req, res) => {

    //call the async function
    api_getteforworker().catch(err => {
          console.log("Get TEs for worker problem: "+err);
          res.send({err});
    })

    async function api_getteforworker() {
          let timeEntries=  await ctSQL.getMobileTimeEntriesByWorkerId(req.params.id);
           console.log("Get TimeEntries for Worker "+JSON.stringify(timeEntries, null, 4));
          if (!timeEntries) timeEntries = {
            id: 0,
            property: "Sorry, no time entries found",
            unit: "Please check with the office"
          }
          res.send(JSON.stringify(timeEntries, null, 4));
      } //async function getdealfinancials
}); //route - cc-details




   api.get('/api/getallworkers',  (req, res) => {
       //call the async function
       api_getallworkers().catch(err => {
             console.log("Get allworkers problem: "+err);
             res.send({err});
       })

       async function api_getallworkers() {
             let allWorkers =  await ctSQL.getAllWorkers();

             res.send(JSON.stringify(allWorkers, null,4));
         } //async function
   }); //route -



   api.get('/api/getallproperties',  (req, res) => {
       //call the async function
       api_getallproperties().catch(err => {
             console.log("Get all properties problem: "+err);
             res.send({err});
       })

       async function api_getallproperties() {
             let allProperties =  await ctSQL.getAllProperties();
             //console.log("GOT all properties "+JSON.stringify(allProperties,null,4));
             let allPropsUnits = await Promise.all(
                       allProperties.map ( async (property) => {
                                //console.log("Getting units for  "+JSON.stringify(property,null,4));
                                // TICKET - IF BUILDING HAS NO UNITS
                                try {
                                      let units =  await ctSQL.getWorkingUnitsByPropertyId(property.id);
                                      property.units = units;
                                      return property
                                } catch(err) {
                                      let units = []
                                      property.units = units;
                                      return property
                                }
                     })
              )

              //not elegant but a separate filter pass gets the job done
              let allPropsWithUnits = allPropsUnits.filter((property)=>{
                  if (property.units.length<1) {
                      return false
                  } else {
                      return true
                  }
              })


             res.send(JSON.stringify(allPropsWithUnits, null,4));
         } //async function
   }); //route -





   api.get('/api/getworkerbylink/:link',  (req, res) => {

       //call the async function
       api_getworkerbylink().catch(err => {
             console.log("Get worker by Link problem: "+err);
             res.send({err});
       })

       async function api_getworkerbylink() {
             let workerDetails =  await ctSQL.getWorkerByLink(req.params.link);
              console.log("Get worker by Link details "+workerDetails);
             if (!workerDetails) workerDetails = {
               id: 0,
               first: "Sorry, could not find profile.",
               last: "Please check your link."
             }
             res.send(JSON.stringify(workerDetails, null, 4));
         } //async function getdealfinancials
   }); //route - cc-details




   api.get('/api/getunitsbypropid/:propid',  (req, res) => {
       //call the async function
       api_getunitsbypropid().catch(err => {
             console.log("Get units by propid problem: "+err);
             res.send({err});
       })

       async function api_getunitsbypropid() {
             let units =  await ctSQL.getWorkingUnitsByPropertyId(req.params.propid);
             res.send(JSON.stringify(units, null, 4));
         } //async function getdealfinancials
   }); //route - cc-details
