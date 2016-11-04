//Global method declarations
var express = require('express'); //Express app server dependencies
var app = express(); //Express app
var fs = require("fs"); //File system for I/O
var bcrypt = require("bcryptjs"); //BCrypt hashing & salting algorithm
var sanitizer = require("sanitizer"); //Sanitizer for input
var sqlinjection = require("sql-injection"); //SQL injection prevention
app.use(sqlinjection); //Apply SQL injection prevention to the express server
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
app.get("/api/auth/checkAuth", function(req, res) {
   //Params: ?token
   //Returns "invalid token" if invalid (.e.g malformed data or token doesn't exist)
   //Returns "renew token" if relog is required to renew the token since it's expired or password has changed
   //Returns token if successful
   
   var token = req.query.token;
   
   //Checks that the paramaters exist
   if(token === undefined) {
      res.end("invalid token");
   }
   
   //Verify the token
   nJwt.verify(token, secretKey, function(err, verifiedJwt) {
      if(err) {
         if(err.message == "Jwt is expired")
            res.end("renew token");
         else
            res.end("invalid token");
         
         return;
      } else {
         //If token data is valid, check if the user exists
         database.query("SELECT * FROM users WHERE id='" + verifiedJwt.body.sub + "';", function (err, rows, fields){
            dbQueryCheck(err);
            
            //If the user does not exist, it is not valid
            if(rows.length == 0) {
               //If token is invalid
               res.end("invalid token");
               return;
            }
            
            //If the user's password has changed, request token renewal
            if(verifiedJwt.body.pass != rows[0].password) {
               //If user's pw has changed
               res.end("renew token");
               return;
            }
            
            //Token is valid, return the token
            res.end(token);
            return;
         });
      }
   });
});

//User attempts to login
app.get("/api/auth/login", function(req, res) {
   //Params: ?username, ?password
   //Returns "invalid params" if invalid params
   //Returns "invalid username" if invalid username
   //Returns "invalid password" if invalid password
   //Returns token if login successful
   
   var username = req.query.username;
   var password = req.query.password;
   
   //Check if params are valid
   if(username === undefined || password === undefined) {
      res.end("invalid params");
      return;
   }
   
   //Sanitize input
   username = sanitizer.sanitize(username);
   password = sanitizer.sanitize(password);
   
   //Check if username exists
   database.query("SELECT * FROM users WHERE username='" + username + "';", function(err, rows, fields) {
      dbQueryCheck(err);
      
      //Check if the username is valid
      if(rows.length == 0 || username != rows[0].username) {
         res.end("invalid username");
         return;
      }
      
      //Check if the password is valid
      if(!bcrypt.compareSync(password, rows[0].password)) {
         //If password is invalid
         res.end("invalid password");
         return;
      }
      
      //If username and password is valid, create a token and return it
      var claims = {
         sub: rows[0].id,
         pass: rows[0].password,
      }
      
      var jwt = nJwt.create(claims, secretKey);
      jwt.setExpiration(new Date().getTime() + (60*60*1000)); //1 hour expiration
      var token = jwt.compact();
      res.end(token);
      return;
   });
});

//User attempts to register
app.get("/api/auth/register", function(req, res) {
   //Params: ?username, ?password
   //Returns "invalid params" if invalid params
   //Returns "occupied username" if username already taken
   //Returns "invalid username" if invalid username
   //Returns "invalid password" if password is invalid
   //Returns "success" if registration successful
   
   var username = req.query.username;
   var password = req.query.password;
   
   //Check if params are valid
   if(username === undefined || password === undefined) {
      res.end("invalid params");
      return;
   }
   
   //Validate username & password
   if(username.length < 7 || username.length > 20) {
      res.end("invalid username");
   }
   
   if(password.length < 7 || password.length > 50) {
      res.end("invalid password");
   }
   
   //Sanitize data
   username = sanitizer.sanitize(username);
   password = sanitizer.sanitize(password);
   
   //Hash & Salt password
   password = bcrypt.hashSync(password, 8);
   
   //Check if username already exists, else register the user
   database.query("SELECT * FROM users WHERE username='" + username + "';", function(err, rows, fields) {
      dbQueryCheck(err);
      
      if(rows.length > 0) {
         res.end("occupied username");
         return;
      } else {
         database.query("INSERT INTO users (username, password) VALUES ('" + username + "','" + password + "');", function(err, rows, fields) {
            dbQueryCheck(err);
            res.end("success");
            return;
         });
      }
   });
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

//Check for database errors. Shutdown server under event of errors.
function dbQueryCheck(err) {
   if(err) { 
      console.log("Database query error: " + err);
      console.log("\n!!<< FATAL ERROR: STOPPING THE SERVER >>!!");
      process.exit(0);
   };
}

//Init the server
initServer();