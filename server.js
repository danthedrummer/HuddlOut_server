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
var nJwt = require("njwt"); //Javascript token generator
var uuid = require('node-uuid'); //UUID generator for client/server authorization
var secretKey = uuid.v4(); //Key used to create tokens, overwritten if already exists in DB
var server; //The server


/*
 * RESTful URIs
*/

/*
 * AUTH
*/

//Check if user token is valid
//Params: ?token
//Returns 0 if invalid
//Returns 1 if relog is required
//Returns token if successful
app.get("/api/auth/checkAuth", function(req, res) {
   var token = req.param("token");
   
   if(typeof token == undefined) {
      res.end("0");
   }
   
   database.query("SELECT * FROM tokens WHERE token='" + token + "';", function (err, rows, fields){
      dbQueryCheck(err);
      
      if(rows.length == 0 || token != rows[0].token) {
         //If token is invalid
         console.log("row length: " + rows.length);
         res.end("0");
         return;
      }
      
      //Get expirationTimestamp
      var expirationTimestamp = new Date(rows[0].expiration.toString().replace(' ', 'T')).getTime();
      
      if(expirationTimestamp < Date.now()) {
         //If token is out of date
         res.end("1");
         return;
      }
      
      //If token is valid
      res.end(token);
      return;
   });
});

//User attempts to login
//Params: ?username, ?password
//Returns -1 if datatype validation fails
//Returns 0 if invalid username
//Returns 1 if invalid password
//Returns token if login successful
app.get("/api/auth/login", function(req, res) {
   //TODO: add login functions
});

//User attempts to register
//Params: ?username, ?password
//Returns -1 if datatype validation fails
//Returns 0 if username already taken
//Returns token if registration successful
app.get("/api/auth/register"), function(req, res) {
   //TODO: add register functions
}

/*
 * TEST
*/

//Test call, returns time
app.get("/api/test/getTime", function (req, res) {
   var d = new Date();
   res.end(d.toString());
});

//Test call, returns a fake token
app.get("/api/test/getAuthKey", function (req, res) {
   console.log(res.query);
   var claims = {
      sub: res.query,
      iss: 'huddlout_auth_signature'
   }
   var jwt = nJwt.create(claims,secretKey);
   var token = jwt.compact();
   res.json(token);
});

//Test call, checks for auth key
app.get("/api/test/checkAuthKey", function(req, res) {
   console.log("POST!");
   var input = req.param("token");
   console.log(input);
   if(typeof input !== undefined)
   {
      console.log(nJwt.verify(input, secretKey));
      console.log("SUCCESS!");
      res.end("SUCCESS!");
      return;
   }
   console.log("FAILED!");
   res.end("FAILED!");
});

/*
 * Server Initialisation Code
*/

//Connect to the database and then the server
function initServer() {
   database.connect(function(err){
      dbQueryCheck(err);

      console.log("Connected to database");
      
      //Create server key if it does not exist
      database.query('SELECT * FROM server_information WHERE var_key="secret_key";', function (err, rows, fields){
         dbQueryCheck(err);
         
         if(rows.length == 0) {
            //Key does not exist in DB
            console.log("Server secret key does not exist. Adding to database.");
            database.query('INSERT INTO server_information (var_key, var_value) VALUES ("secret_key", "' + secretKey + '");', function (err, rows, fields){
               dbQueryCheck(err);
               
               console.log("Secret Key added to database");
               startServer();
            });
         }
         else {
            //Key exists in DB
            secretKey = rows[0].var_value;
            startServer();
         }
      });
   });
   
   //Start Server
   function startServer() {
      server = app.listen(8081, function () {
         var host = server.address().address;
         var port = server.address().port;
         console.log("HuddlOut server is now listening at port " + port);
      });
   }
}

//Check for database errors
function dbQueryCheck(err) {
   if(err) { 
      console.log("Database query error: " + err);
      console.log("Stopping server");
      process.exit(0);
   };
}

//Init the server
initServer();