//Global method declarations
var express = require('express'); //Express app server dependencies
var app = express(); //Express app
var fs = require("fs"); //File system for I/O
var bcrypt = require("bcryptjs"); //BCrypt hashing & salting algorithm
var sanitizer = require("sanitizer"); //Sanitizer for input
var mysql = require("mysql"); //MySQL connection dependencies
var database = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    database : 'huddlout'
}); //My SQL database connection
var server; //The server


/*
 * RESTful URIs
*/

//Test call, returns time
app.get("/getTime", function (req, res) {
   var d = new Date();
   res.end(d.toString());
})


/*
 * Server Starts here
*/

//Connect to the database and then the server
database.connect(function(err){
   if (err){
      console.log("Error connecting to database: " + err);
      console.log("Stopping server");
      process.exit(0);
   }
   else
   {
      console.log("Connected to database");
      
      //Start Server
      server = app.listen(8081, function () {
         var host = server.address().address;
         var port = server.address().port;
         console.log("HuddlOut server is now listening at http://%s:%s", host, port);
      });
   }
});