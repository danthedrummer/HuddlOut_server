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
 * Database getters for object
*/

/*
 * RESTful URIs
*/

/*
 * AUTH
*/

//Checks the token and returns it's state
function checkAuth(token, callback) {
   
   //Checks that the paramaters exist
   if(token === undefined) {
      callback("invalid token");
      return;
   }
   
   //Verify the token
   nJwt.verify(token, secretKey, function(err, verifiedJwt) {
      if(err) {
         if(err.message == "Jwt is expired") {
            callback("renew token");
            return;
         }
         else {
            callback("invalid token");
            return;
         }
      } else {
         //If token data is valid, check if the user exists
         database.query("SELECT * FROM users WHERE id='" + verifiedJwt.body.sub + "';", function (err, rows, fields){
            dbQueryCheck(err);
            
            //If the user does not exist, it is not valid
            if(rows.length == 0) {
               //If token is invalid
               callback("invalid token");
               return;
            }
            
            //If the user's password has changed, request token renewal
            if(verifiedJwt.body.pass != rows[0].password) {
               //If user's pw has changed
               callback("renew token");
               return;
            }
            
            //Token is valid, return the token
            callback(token);
            return;
         });
      }
   });
}

//Checks if the token is valid
function isAuthValid(token, callback) {
   checkAuth(token, function(response) {
      callback(response == token);
   });
}

//Returns the sub claim from a token
function getTokenSub(token, callback) {
   nJwt.verify(token, secretKey, function(err, verifiedJwt) {
      if(err) {
         callback("error");
      } else {
         callback(verifiedJwt.body.sub);
      }
   });
}

//Check if user token is valid
app.get("/api/auth/checkAuth", function(req, res) {
   //Params: ?token
   //Returns "invalid token" if invalid (.e.g malformed data or token doesn't exist)
   //Returns "renew token" if relog is required to renew the token since it's expired or password has changed
   //Returns token if successful
   
   var token = req.query.token;
   
   checkAuth(token, function(response){
      res.end(response);
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
// https://huddlout-server-reccy.c9users.io:8081/api/auth/register?username=paulwins&password=abcdefg
// https://huddlout-server-reccy.c9users.io:8081/api/auth/register?username=glennncullen&password=1234567
// https://huddlout-server-reccy.c9users.io:8081/api/auth/register?username=aaron meaney&password=hunter2
app.get("/api/auth/register", function(req, res) {
   //Params: ?username, ?password
   //Returns "invalid params" if invalid params
   //Returns "occupied username" if username already taken
   //Returns "invalid username" if invalid username
   //Returns "invalid password" if password is invalid
   //Returns token if registration successful
   
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
      return;
   }
   
   if(password.length < 7 || password.length > 50) {
      res.end("invalid password");
      return;
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
         database.beginTransaction(function(err){
            dbQueryCheck(err);
            
            database.query("INSERT INTO user_profiles(first_name) VALUES ('" + username + "');", function(err, rows, fields) {
               dbQueryCheck(err);
               database.query("INSERT INTO users (username, password, profile_id) VALUES ('" + username + "','" + password + "', (SELECT profile_id FROM user_profiles WHERE first_name='" + username + "'));", function(err, rows, fields) {
                  dbQueryCheck(err);
                  
                  //Login
                  database.query("SELECT * FROM users WHERE username='" + username + "';", function(err, rows, fields) {
                     dbQueryCheck(err);
      
                     //Create a token and return it
                     var claims = {
                        sub: rows[0].id,
                        pass: rows[0].password,
                     }
                     
                     var jwt = nJwt.create(claims, secretKey);
                     jwt.setExpiration(new Date().getTime() + (60*60*1000)); //1 hour expiration
                     var token = jwt.compact();
                     
                     //Commit changes
                     database.commit(function(err) {
                        if (err) { 
                           database.rollback(function() {
                              dbQueryCheck(err);
                           });
                        }
                     });
                     
                     res.end(token);
                     return;
                  });
               });
            });
         });
      }
   });
});

//User attempts to change their password
app.get("/api/auth/changePassword", function(req, res) {
   //Params: ?token, ?oldPassword, ?newPassword
   //Returns "invalid params" if invalid params
   //Returns "invalid id" if token sub is invalid
   //Returns "invalid password" if invalid old password
   //Returns token if update successful
   
   var token = req.query.token;
   var oldPassword = req.query.oldPassword;
   var newPassword = req.query.newPassword;
   
   //Check if params are valid
   if(token === undefined || oldPassword === undefined || newPassword === undefined) {
      res.end("invalid params");
      return;
   }
   
   //Sanitize data
   oldPassword = sanitizer.sanitize(oldPassword);
   newPassword = sanitizer.sanitize(newPassword);
   
   //Validate the auth token
   isAuthValid(token, function(isValid){
      if(isValid) {
         //Returns the token sub
         getTokenSub(token, function(sub){
            //Searched database for user with sub/id match
            database.query("SELECT * FROM users WHERE id='" + sub + "';", function(err, rows, fields) {
               dbQueryCheck(err);
               
               //Check if the id is valid
               if(rows.length == 0 || sub != rows[0].id) {
                  res.end("invalid id");
                  return;
               }
               
               //Check if the password is valid
               if(!bcrypt.compareSync(oldPassword, rows[0].password)) {
                  //If password is invalid
                  res.end("invalid password");
                  return;
               }
               
               newPassword = bcrypt.hashSync(newPassword, 8);
               
               database.query("UPDATE users SET password='" + newPassword + "' WHERE id='" + sub + "';", function(err, rows, fields) {
                  dbQueryCheck(err);
                  res.end(token);
                  return;
               });
            });
         });
      } else {
         checkAuth(token, function(response) {
            res.end(response);
            return;
         });
      }
   });
});

/*
 * GROUP
*/

//User attempts to create a new group
app.get("/api/group/create", function(req, res) {
   //Params: ?token, ?name, ?activity
   //Returns "invalid params" if invalid params
   //Returns "success" if registration successful
   
   var token = req.query.token;     //Auth token
   var name = req.query.name;       //Name of group
   var activity = req.query.activity;   //Activity type
   
   //Check if params are valid
   if(token === undefined || name === undefined || activity === undefined) {
      res.end("invalid params");
      return;
   }
   
   //Sanitize input
   name = sanitizer.sanitize(name);
   activity = activity === null ? null : sanitizer.sanitize(activity);
   
   isAuthValid(token, function(isValid){
      if(isValid) {
         
         database.beginTransaction(function(err){
            dbQueryCheck(err);
            
            database.query("INSERT INTO groups (group_name, start_date, expiry_date, activity_type) VALUES ('" + name + "', NOW(), NOW() + INTERVAL 1 DAY, '" + activity + "');", function(err, rows, fields) {
               dbQueryCheck(err);
               
               getTokenSub(token, function(sub){
                  database.query("INSERT INTO group_memberships (profile_id, group_id, group_role) VALUES ('" + sub + "', (SELECT group_id FROM groups WHERE group_name='" + name + "' ORDER BY group_id DESC LIMIT 1), 'ADMIN');", function(err, rows, fields) {
                     dbQueryCheck(err);
                     
                     //Commit changes
                     database.commit(function(err) {
                        if (err) { 
                           database.rollback(function() {
                              dbQueryCheck(err);
                           });
                        }
                     });
                     
                     res.end("success");
                     return;
                  });
               });
            });
         });
      } else {
         checkAuth(token, function(response) {
            res.end(response);
            return;
         });
      }
   });
});

//User attempts to delete a group (In progress) //TODO: Add membership deletion
app.get("/api/group/delete", function(req, res) {
   //Params: ?token, ?groupId
   //Returns "invalid params" if invalid params
   //Returns "success" if registration successful
   
   var token = req.query.token;
   var groupId = req.query.groupId;
   
   //Check if params are valid
   if(groupId === undefined) {
      res.end("invalid params");
      return;
   }
   
   //Sanitize group ID
   groupId = sanitizer.sanitize(groupId);
   
   isAuthValid(token, function(isValid){
      if(isValid) {
         
         //Delete group by ID
         database.query("DELETE FROM groups WHERE ID='" + groupId + "';", function(err, rows, fields) {
            dbQueryCheck(err);
            
            res.end("success");
         });
         
         return;
         
      } else {
         checkAuth(token, function(response) {
            res.end(response);
            return;
         });
      }
   });
});

//User attempts to view group members (In progress)
app.get("/api/group/getMembers", function(req, res) {
   
   var token = req.query.token;
   var groupId = req.query.groupId;
   
   //Check if params are valid
   if(token === undefined || groupId === undefined) {
      res.end("invalid params");
      return;
   }
   
   //Sanitize input
   groupId = sanitizer.sanitize(groupId);
   
   isAuthValid(token, function(isValid){
      if(isValid) {
         //Select all users by group ID
         database.query("SELECT * FROM user_profiles WHERE id=( SELECT profile_id FROM memberships WHERE group_id='" + groupId + "' );", function(err, rows, fields) {
            dbQueryCheck(err);
            res.end(rows);
            return;
         });
      } else {
         checkAuth(token, function(response) {
            res.end(response);
            return;
         });
      }
   });
});

//User attempts to invite a member to the group (In progress)
app.get("/api/group/inviteMember", function(req, res) {
   //Params: ?token, ?groupId
   //Returns "invalid params" if invalid params
   //Returns "success" if registration successful
   
   var token = req.query.token;
   var groupId = req.query.groupId;
   
   //Check if params are valid
   if(token === undefined || groupId === undefined) {
      res.end("invalid params");
      return;
   }
   
   //Sanitize group ID
   groupId = sanitizer.sanitize(groupId);
   
   isAuthValid(token, function(isValid){
      if(isValid) {
         
         //Delete group by ID
         database.query("DELETE FROM groups WHERE ID='" + groupId + "';", function(err, rows, fields) {
            dbQueryCheck(err);
            
            res.end("success");
         });
         
         return;
         
      } else {
         checkAuth(token, function(response) {
            res.end(response);
            return;
         });
      }
   });
});

//User attempts to kick a member from the group (In progress)
app.get("/api/group/kickMember", function(req, res) {
   //Params: ?token, ?groupId
   //Returns "invalid params" if invalid params
   //Returns "success" if registration successful
   
   var token = req.query.token;
   var groupId = req.query.groupId;
   
   //Check if params are valid
   if(token === undefined || groupId === undefined) {
      res.end("invalid params");
      return;
   }
   
   //Sanitize group ID
   groupId = sanitizer.sanitize(groupId);
   
   isAuthValid(token, function(isValid){
      if(isValid) {
         
         //Delete group by ID
         database.query("DELETE FROM groups WHERE ID='" + groupId + "';", function(err, rows, fields) {
            dbQueryCheck(err);
            
            res.end("success");
         });
         
         return;
         
      } else {
         checkAuth(token, function(response) {
            res.end(response);
            return;
         });
      }
   });
});

/*
 * USERS
*/

//Client gets user profile record
app.get("/api/user/getProfile", function(req, res) {
   //Params: ?token, ?userId
   //Returns "invalid params" if invalid params
   //Returns "not found" if user does not exist
   //Returns profile as JSON if registration successful
   
   var token = req.query.token;
   var userId = req.query.userId;
   
   //Check if params are valid
   if(token === undefined || userId === undefined) {
      res.end("invalid params");
      return;
   }
   
   //Sanitize userId
   userId = sanitizer.sanitize(userId);
   
   isAuthValid(token, function(isValid){
      if(isValid) {
         
         //Delete group by ID
         database.query("SELECT * FROM user_profiles WHERE profile_id='" + userId + "';", function(err, rows, fields) {
            dbQueryCheck(err);
            
            if(rows.length == 0) {
               res.end("not found");
               return;
            }
            
            res.end(JSON.stringify(rows[0]));
            return;
         });
      } else {
         checkAuth(token, function(response) {
            res.end(response);
            return;
         });
      }
   });
});

/*
 * TEST
*/

//User does a thing
app.get("/api/test/doSomething", function(req, res) {
   
   var token = req.query.token;
   var print = req.query.print;
   
   isAuthValid(token, function(isValid){
      if(isValid) {
         if(print === undefined) {
            res.end("undefined string");
            return;
         }
         res.end("returned string: " + print);
         return;
      } else {
         checkAuth(token, function(response) {
            res.end(response);
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