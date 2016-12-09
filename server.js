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
   host: 'localhost',
   user: 'root',
   database: 'huddlout'
}); //My SQL database connection
var nJwt = require("njwt"); //Javascript token generator
var uuid = require('node-uuid'); //UUID generator for client/server authorization
var secretKey = uuid.v4(); //Key used to create tokens, overwritten if already exists in DB
var server; //The server
var dir_profile_pictures = __dirname + "/profile_pictures/"; //Directory for profile pictures
var deleteGroups = false; //If the server should delete groups after 24hr lifetime

/*
 * API URIs
 */

/*
 * AUTH
 */

//Checks the token and returns it's state
function checkAuth(token, callback) {

   //Checks that the paramaters exist
   if (token === undefined) {
      callback("invalid token");
      return;
   }

   //Verify the token
   nJwt.verify(token, secretKey, function(err, verifiedJwt) {
      if (err) {
         if (err.message == "Jwt is expired") {
            callback("renew token");
            return;
         }
         else {
            callback("invalid token");
            return;
         }
      }
      else {
         //If token data is valid, check if the user exists
         database.query("SELECT * FROM users WHERE id='" + verifiedJwt.body.sub + "';", function(err, rows, fields) {
            dbQueryCheck(err);

            //If the user does not exist, it is not valid
            if (rows.length == 0) {
               //If token is invalid
               callback("invalid token");
               return;
            }

            //If the user's password has changed, request token renewal
            if (verifiedJwt.body.pass != rows[0].password) {
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
      if (err) {
         callback("error");
      }
      else {
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

   checkAuth(token, function(response) {
      res.end(response);
   });
});

//User attempts to login
app.get("/api/auth/login", function(req, res) {
   
   //https://huddlout-server-reccy.c9users.io:8081/api/auth/login?username=glennncullen&password=1234567
   //Params: ?username, ?password
   //Returns "invalid params" if invalid params
   //Returns "invalid username" if invalid username
   //Returns "invalid password" if invalid password
   //Returns token and profile_id if login successful

   var username = req.query.username;
   var password = req.query.password;

   //Check if params are valid
   if (username === undefined || password === undefined) {
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
      if (rows.length == 0 || username != rows[0].username) {
         res.end("invalid username");
         return;
      }

      //Check if the password is valid
      if (!bcrypt.compareSync(password, rows[0].password)) {
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
      jwt.setExpiration(new Date().getTime() + (60 * 60 * 1000)); //1 hour expiration
      var token = jwt.compact();
      
      var returnObject = {auth:token, id:rows[0].profile_id};
      
      res.end(JSON.stringify(returnObject));
      return;
   });
});

//User attempts to register
app.get("/api/auth/register", function(req, res) {
   //Params: ?username, ?password, ?firstName, ?lastName
   //Returns "invalid params" if invalid params
   //Returns "occupied username" if username already taken
   //Returns "invalid username" if invalid username
   //Returns "invalid password" if password is invalid
   //Returns "invalid firstname" if invalid firstname
   //Returns "invalid lastname" if invalid lastname
   //Returns token and profile id if registration successful

   // Examples:
   // https://huddlout-server-reccy.c9users.io:8081/api/auth/register?username=paulwins&password=abcdefg&firstName=Paul&lastName=Reid
   // https://huddlout-server-reccy.c9users.io:8081/api/auth/register?username=glennncullen&password=1234567&firstName=Glenn&lastName=Cullennn
   // https://huddlout-server-reccy.c9users.io:8081/api/auth/register?username=aaron meaney&password=hunter2&firstName=Aaron&lastName=Meaney

   var username = req.query.username;
   var password = req.query.password;
   var firstName = req.query.firstName;
   var lastName = req.query.lastName;
   
   //Check if params are valid
   if (username === undefined || password === undefined || firstName === undefined || lastName === undefined) {
      res.end("invalid params");
      return;
   }

   //Validate username, password, firstName & lastName
   if (username.length < 7 || username.length > 20) {
      res.end("invalid username");
      return;
   }

   if (password.length < 7 || password.length > 50) {
      res.end("invalid password");
      return;
   }
   
   if(firstName.length < 1 || firstName.length > 20) {
      res.end("invalid firstname");
      return;
   }
   
   if(lastName.length < 1 || lastName.length > 20) {
      res.end("invalid lastname");
      return;
   }

   //Sanitize data
   username = sanitizer.sanitize(username);
   password = sanitizer.sanitize(password);
   firstName = sanitizer.sanitize(firstName);
   lastName = sanitizer.sanitize(lastName);

   //Hash & Salt password
   password = bcrypt.hashSync(password, 8);

   //Check if username already exists, else register the user
   database.query("SELECT * FROM users WHERE username='" + username + "';", function(err, rows, fields) {
      dbQueryCheck(err);

      if (rows.length > 0) {
         res.end("occupied username");
         return;
      }
      else {
         database.beginTransaction(function(err) {
            dbQueryCheck(err);
            
            database.query("INSERT INTO user_profiles(first_name, last_name) VALUES ('" + firstName + "', '" + lastName + "');", function(err, rows, fields) {
               dbQueryCheck(err);
               
               database.query("INSERT INTO users (username, password, profile_id) VALUES ('" + username + "','" + password + "', (SELECT MAX(profile_id) FROM user_profiles));", function(err, rows, fields) {
                  dbQueryCheck(err);

                  //Login
                  database.query("SELECT * FROM users WHERE username='" + username + "';", function(err, rows, fields) {
                     dbQueryCheck(err);
                     
                     //Get profile id
                     var profileId = rows[0].profile_id;

                     //Create a token and return it
                     var claims = {
                        sub: rows[0].id,
                        pass: rows[0].password,
                     }

                     var jwt = nJwt.create(claims, secretKey);
                     jwt.setExpiration(new Date().getTime() + (60 * 60 * 1000)); //1 hour expiration
                     var token = jwt.compact();

                     //Commit changes
                     database.commit(function(err) {
                        if (err) {
                           database.rollback(function() {
                              dbQueryCheck(err);
                           });
                        }
                     });
                     
                     var returnObject = {auth:token, id:profileId};
                     
                     res.end(JSON.stringify(returnObject));
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
   if (token === undefined || oldPassword === undefined || newPassword === undefined) {
      res.end("invalid params");
      return;
   }

   //Sanitize data
   oldPassword = sanitizer.sanitize(oldPassword);
   newPassword = sanitizer.sanitize(newPassword);

   //Validate the auth token
   isAuthValid(token, function(isValid) {
      if (isValid) {
         //Returns the token sub
         getTokenSub(token, function(sub) {
            //Searched database for user with sub/id match
            database.query("SELECT * FROM users WHERE id='" + sub + "';", function(err, rows, fields) {
               dbQueryCheck(err);

               //Check if the id is valid
               if (rows.length == 0 || sub != rows[0].id) {
                  res.end("invalid id");
                  return;
               }

               //Check if the password is valid
               if (!bcrypt.compareSync(oldPassword, rows[0].password)) {
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
      }
      else {
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

//Deletes any group that has exceeded the 24 hour lifetime
function verifyGroups() {
   
   console.log("Verifying groups...");
   
   //Begin transaction
   database.beginTransaction(function(err) {
      dbQueryCheck(err);
      
      //Find groups that exceed lifetime
      database.query("SELECT group_id FROM groups WHERE expiry_date <= NOW();", function(err, rows, fields) {
         dbQueryCheck(err);
         
         var delGroups = rows;
         
         for(var i = 0; i < delGroups.length; i++) {
            console.log("Deleting group " + delGroups[i].group_id);
            deleteGroupCron(delGroups[i].group_id);
         }
      });
   });
}

//Deletes a group - should only be called by the server!!!
function deleteGroupCron(groupId) {
   //Begin transaction
   database.beginTransaction(function(err) {
      dbQueryCheck(err);

      //Delete memberships
      database.query("DELETE FROM group_memberships WHERE group_id='" + groupId + "';", function(err, rows, fields) {
         dbQueryCheck(err);

         //Delete group
         database.query("DELETE FROM groups WHERE group_id='" + groupId + "';", function(err, rows, fields) {
            dbQueryCheck(err);

            //Commit changes
            database.commit(function(err) {
               if (err) {
                  database.rollback(function() {
                     dbQueryCheck(err);
                  });
               }
            });

            return;
         });
      });
   });
}

//User attempts to create a new group
app.get("/api/group/create", function(req, res) {
   //Params: ?token, ?name, ?activity
   //Returns "invalid params" if invalid params
   //Returns group id if registration successful

   var token = req.query.token; //Auth token
   var name = req.query.name; //Name of group
   var activity = req.query.activity; //Activity type

   //Check if params are valid
   if (token === undefined || name === undefined || activity === undefined) {
      res.end("invalid params");
      return;
   }

   //Sanitize input
   name = sanitizer.sanitize(name);
   activity = activity === null ? null : sanitizer.sanitize(activity);

   isAuthValid(token, function(isValid) {
      if (isValid) {

         //Begin transaction
         database.beginTransaction(function(err) {
            dbQueryCheck(err);

            //Insert group record
            database.query("INSERT INTO groups (group_name, start_date, expiry_date, activity_type) VALUES ('" + name + "', NOW(), NOW() + INTERVAL 1 DAY, '" + activity + "');", function(err, rows, fields) {
               dbQueryCheck(err);

               //Get user token sub
               getTokenSub(token, function(sub) {

                  //Get profile id
                  database.query("SELECT profile_id FROM users WHERE id='" + sub + "';", function(err, rows, fields) {
                     dbQueryCheck(err);

                     var profileId = rows[0].profile_id;

                     //Insert user as admin of group
                     database.query("INSERT INTO group_memberships (profile_id, group_id, group_role) VALUES ('" + profileId + "', (SELECT group_id FROM groups WHERE group_name='" + name + "' ORDER BY group_id DESC LIMIT 1), 'ADMIN');", function(err, rows, fields) {
                        dbQueryCheck(err);

                        database.query("SELECT group_id FROM groups WHERE group_name='" + name + "' ORDER BY group_id DESC LIMIT 1", function(err, rows, fields) {
                           dbQueryCheck(err);

                           var groupId = rows[0].group_id;

                           //Commit changes
                           database.commit(function(err) {
                              if (err) {
                                 database.rollback(function() {
                                    dbQueryCheck(err);
                                 });
                              }
                           });

                           res.end(groupId.toString());
                           return;
                        });
                     });
                  });
               });
            });
         });
      }
      else {
         checkAuth(token, function(response) {
            res.end(response);
            return;
         });
      }
   });
});

//User attempts to delete a group
app.get("/api/group/delete", function(req, res) {
   //Params: ?token, ?groupId
   //Returns "invalid params" if invalid params
   //Returns "not found" if group membership not found
   //Returns "invalid role" if user is not group admin
   //Returns "success" if deletion successful

   var token = req.query.token;
   var groupId = req.query.groupId;

   //Check if params are valid
   if (token === undefined || groupId === undefined) {
      res.end("invalid params");
      return;
   }

   //Sanitize group ID
   groupId = sanitizer.sanitize(groupId);

   isAuthValid(token, function(isValid) {
      if (isValid) {

         //Begin transaction
         database.beginTransaction(function(err) {
            dbQueryCheck(err);

            //Get user token sub
            getTokenSub(token, function(sub) {

               //Check if user is owner of the group
               database.query("SELECT * FROM group_memberships WHERE profile_id=(SELECT profile_id FROM users WHERE id='" + sub + "') AND group_id='" + groupId + "';", function(err, rows, fields) {
                  dbQueryCheck(err);

                  if (rows.length == 0) {
                     res.end("not found");
                     return;
                  }

                  if (rows[0].group_role != "ADMIN") {
                     res.end("invalid role");
                     return;
                  }

                  //Delete memberships
                  database.query("DELETE FROM group_memberships WHERE group_id='" + groupId + "';", function(err, rows, fields) {
                     dbQueryCheck(err);

                     //Delete group
                     database.query("DELETE FROM groups WHERE group_id='" + groupId + "';", function(err, rows, fields) {
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
         });
      }
      else {
         checkAuth(token, function(response) {
            res.end(response);
            return;
         });
      }
   });
});

//User attempts to leave a group
app.get("/api/group/leave", function(req, res) {
   //Params: ?token, ?groupId
   //Returns "invalid params" if invalid params
   //Returns "not found" if group membership not found
   //Returns "invalid role" if user is group admin
   //Returns "success" if deletion successful

   var token = req.query.token;
   var groupId = req.query.groupId;

   //Check if params are valid
   if (token === undefined || groupId === undefined) {
      res.end("invalid params");
      return;
   }

   //Sanitize group ID
   groupId = sanitizer.sanitize(groupId);

   isAuthValid(token, function(isValid) {
      if (isValid) {

         //Begin transaction
         database.beginTransaction(function(err) {
            dbQueryCheck(err);

            //Get user token sub
            getTokenSub(token, function(sub) {

               //Check if user is owner of the group
               database.query("SELECT * FROM group_memberships WHERE profile_id=(SELECT profile_id FROM users WHERE id='" + sub + "') AND group_id='" + groupId + "';", function(err, rows, fields) {
                  dbQueryCheck(err);

                  if (rows.length == 0) {
                     res.end("not found");
                     return;
                  }

                  if (rows[0].group_role == "ADMIN") {
                     res.end("invalid role");
                     return;
                  }

                  //Get membership ID to delete
                  var membershipId = rows[0].membership_id;

                  //Delete memberships
                  database.query("DELETE FROM group_memberships WHERE membership_id='" + membershipId + "';", function(err, rows, fields) {
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
      }
      else {
         checkAuth(token, function(response) {
            res.end(response);
            return;
         });
      }
   });
});

//User attempts to view group members
app.get("/api/group/getMembers", function(req, res) {
   //Params: ?token, ?groupId
   //Returns "invalid params" if invalid params
   //Returns "not member" if user is not member of the group
   //Returns list of ids of group member profiles if successful

   var token = req.query.token;
   var groupId = req.query.groupId;

   //Check if params are valid
   if (token === undefined || groupId === undefined) {
      res.end("invalid params");
      return;
   }

   //Sanitize input
   groupId = sanitizer.sanitize(groupId);

   isAuthValid(token, function(isValid) {
      if (isValid) {

         //Get user token sub
         getTokenSub(token, function(sub) {

            //Check if user is in group
            database.query("SELECT * FROM group_memberships WHERE profile_id=(SELECT profile_id FROM users WHERE id='" + sub + "') AND group_id='" + groupId + "';", function(err, rows, fields) {
               dbQueryCheck(err);

               if (rows.length == 0) {
                  res.end("not member");
                  return;
               }

               //Get profile ids of members of the group
               database.query("SELECT profile_id FROM group_memberships WHERE group_id='" + groupId + "';", function(err, rows, fields) {
                  dbQueryCheck(err);

                  var userIds = [];

                  for (var i = 0; i < rows.length; i++) {
                     userIds.push(rows[i].profile_id);
                  }

                  res.end(JSON.stringify(userIds));
                  return;
               });
            });
         });
      }
      else {
         checkAuth(token, function(response) {
            res.end(response);
            return;
         });
      }
   });
});

//User attempts to view groups they are a member of
app.get("/api/group/getGroups", function(req, res) {
   //Params: ?token
   //Returns "invalid params" if invalid params
   //Returns "no groups" if user is not member of a group
   //Returns JSON of groups if successful

   var token = req.query.token;

   //Check if params are valid
   if (token === undefined) {
      res.end("invalid params");
      return;
   }

   isAuthValid(token, function(isValid) {
      if (isValid) {

         //Get user token sub
         getTokenSub(token, function(sub) {

            //Check if user is in group
            database.query("SELECT group_id FROM group_memberships WHERE profile_id=(SELECT profile_id FROM users WHERE id='" + sub + "');", function(err, rows, fields) {
               dbQueryCheck(err);

               var groups = [];

               if (rows.length == 0) {
                  res.end("not member");
                  return;
               }
               
               for (var i = 0; i < rows.length; i++) {
                  var group = {}
                  group.group_id = rows[i].group_id;
                  groups.push(group);
               }
               
               //Iterate through groups
               database.query("SELECT * FROM groups;", function(err, rows, fields) {
                  dbQueryCheck(err);
                  
                  for(var i = 0; i < rows.length; i++) {
                     for(var j = 0; j < groups.length; j++) {
                        if(rows[i].group_id == groups[j].group_id) {
                           groups[j].group_name = rows[i].group_name;
                           groups[j].activity = rows[i].activity_type;
                        }
                     }
                  }
                  
                  res.end(JSON.stringify(groups));
                  return;
               });
            });
         });
      }
      else {
         checkAuth(token, function(response) {
            res.end(response);
            return;
         });
      }
   });
});

//User attempts to invite a member to the group
app.get("/api/group/inviteMember", function(req, res) {
   //Params: ?token, ?groupId, ?profileId
   //Returns "invalid params" if invalid params
   //Returns "membership not found" if the membership is not found
   //Returns "invalid role" if user is not an admin or moderator
   //Returns "user not found" if invited user does not exist
   //Returns "invitation already exists" if invited user already contains an invite
   //Returns "already member" if user is already part of the group
   //Returns "success" if invitation successful

   var token = req.query.token;
   var groupId = req.query.groupId;
   var profileId = req.query.profileId;

   //Check if params are valid
   if (token === undefined || groupId === undefined || profileId === undefined) {
      res.end("invalid params");
      return;
   }

   //Sanitize params
   groupId = sanitizer.sanitize(groupId);
   profileId = sanitizer.sanitize(profileId);

   isAuthValid(token, function(isValid) {
      if (isValid) {

         //Begin transaction
         database.beginTransaction(function(err) {
            dbQueryCheck(err);

            //Get user token sub
            getTokenSub(token, function(sub) {

               //Check if user is owner of the group
               database.query("SELECT * FROM group_memberships WHERE profile_id=(SELECT profile_id FROM users WHERE id='" + sub + "') AND group_id='" + groupId + "';", function(err, rows, fields) {
                  dbQueryCheck(err);

                  if (rows.length == 0) {
                     res.end("membership not found");
                     return;
                  }

                  if (rows[0].group_role != "ADMIN" && rows[0].group_role != "MODERATOR") {
                     res.end("invalid role");
                     return;
                  }

                  //Check if invited user exists
                  database.query("SELECT * FROM user_profiles WHERE profile_id='" + profileId + "';", function(err, rows, fields) {
                     dbQueryCheck(err);

                     if (rows.length == 0) {
                        res.end("user not found")
                     }

                     //Check if user is already a member
                     database.query("SELECT * FROM group_memberships WHERE profile_id='" + profileId + "' AND group_id='" + groupId + "';", function(err, rows, fields) {
                        dbQueryCheck(err);

                        if (rows.length > 0) {
                           if (rows[0].group_role == "INVITED") {
                              res.end("invitation already exists");
                              return;
                           }
                           else {
                              res.end("already member");
                              return;
                           }
                        }

                        //Add invitation to database
                        database.query("INSERT INTO group_memberships (profile_id, group_id, group_role) VALUES ('" + profileId + "','" + groupId + "','INVITED');", function(err, rows, fields) {
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
            });
         });
      }
      else {
         checkAuth(token, function(response) {
            res.end(response);
            return;
         });
      }
   });
});

//Client checks if there are any group invites
app.get("/api/group/checkInvites", function(req, res) {
   //Params: ?token
   //Returns "invalid params" if invalid params
   //Returns "user not found" if the user profile cannot be found
   //Returns "no invites" if there are no invites
   //Returns array of group ids if there are invites

   var token = req.query.token;

   if (token === undefined) {
      res.end("invalid params");
   }

   isAuthValid(token, function(isValid) {
      if (isValid) {

         //Begin transaction
         database.beginTransaction(function(err) {
            dbQueryCheck(err);

            //Get user token sub
            getTokenSub(token, function(sub) {

               //Get profile id
               database.query("SELECT profile_id FROM users WHERE id='" + sub + "';", function(err, rows, fields) {
                  dbQueryCheck(err);

                  if (rows.length == 0) {
                     res.end("user not found");
                     return;
                  }

                  var profileId = rows[0].profile_id;

                  //Get invites
                  database.query("SELECT group_memberships.*, groups.group_name, groups.activity_type FROM group_memberships INNER JOIN groups ON group_memberships.group_id = groups.group_id WHERE profile_id='" + profileId + "' AND group_role='INVITED';", function(err, rows, fields) {
                     dbQueryCheck(err);

                     if (rows.length == 0) {
                        res.end("no invites");
                        return;
                     }
                     
                     var invites = [];

                     for (var i = 0; i < rows.length; i++) {
                        invites.push(rows[i]);
                     }

                     res.end(JSON.stringify(invites));
                     return;
                  });
               });
            });
         });

      }
      else {
         checkAuth(token, function(response) {
            res.end(response);
            return;
         });
      }
   });
});

//User accepts or denies a group invite
app.get("/api/group/resolveInvite", function(req, res) {
   //Params: ?token, ?groupId, ?action (accept/deny)
   //Returns "invalid params" if invalid params
   //Returns "user not found" if the user profile cannot be found
   //Returns "no invites" if no invites where found
   //Returns "success" if action completes successfully

   var token = req.query.token;
   var groupId = req.query.groupId;
   var action = req.query.action;

   if (token === undefined || action === undefined || groupId === null || (action != "accept" && action != "deny")) {
      res.end("invalid params");
      return;
   }

   var joinGroup = (action == "accept");

   isAuthValid(token, function(isValid) {
      if (isValid) {

         //Begin transaction
         database.beginTransaction(function(err) {
            dbQueryCheck(err);

            //Get user token sub
            getTokenSub(token, function(sub) {

               //Get profile id
               database.query("SELECT profile_id FROM users WHERE id='" + sub + "';", function(err, rows, fields) {
                  dbQueryCheck(err);

                  if (rows.length == 0) {
                     res.end("user not found")
                     return;
                  }

                  var profileId = rows[0].profile_id;

                  //Check if group invite is valid
                  database.query("SELECT membership_id FROM group_memberships WHERE profile_id='" + profileId + "' AND group_id='" + groupId + "' AND group_role='INVITED';", function(err, rows, fields) {
                     dbQueryCheck(err);

                     if (rows.length == 0) {
                        res.end("no invites");
                        return;
                     }

                     var membershipId = rows[0].membership_id;

                     if (joinGroup) {
                        //Add user to the group
                        database.query("UPDATE group_memberships SET group_role='MEMBER' WHERE membership_id='" + membershipId + "';", function(err, rows, fields) {
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
                     }
                     else {
                        //Delete invitation
                        database.query("DELETE FROM group_memberships WHERE membership_id='" + membershipId + "';", function(err, rows, fields) {
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
                     }
                  });
               });
            });
         });

      }
      else {
         checkAuth(token, function(response) {
            res.end(response);
            return;
         });
      }
   });
});

//User attempts to kick a member from the group
app.get("/api/group/kickMember", function(req, res) {
   //Params: ?token, ?groupId, ?profileId
   //Returns "invalid params" if invalid params
   //Returns "membership not found" if user is not member of the group
   //Returns "invalid role" if user is not an admin or moderator
   //Returns "dont kick yourself" if user tried to kick themself
   //Returns "user not found" if user is not in the group
   //Returns "already kicked" if user was already kicked
   //Returns "success" if kick is successful

   var token = req.query.token;
   var groupId = req.query.groupId;
   var profileId = req.query.profileId;

   //Check if params are valid
   if (token === undefined || groupId === undefined || profileId === undefined) {
      res.end("invalid params");
      return;
   }

   //Sanitize group ID
   groupId = sanitizer.sanitize(groupId);
   profileId = sanitizer.sanitize(profileId);

   isAuthValid(token, function(isValid) {
      if (isValid) {

         //Begin transaction
         database.beginTransaction(function(err) {
            dbQueryCheck(err);

            //Get user token sub
            getTokenSub(token, function(sub) {

               //Check if user is owner of the group
               database.query("SELECT * FROM group_memberships WHERE profile_id=(SELECT profile_id FROM users WHERE id='" + sub + "') AND group_id='" + groupId + "';", function(err, rows, fields) {
                  dbQueryCheck(err);

                  if (rows.length == 0) {
                     res.end("membership not found");
                     return;
                  }

                  if (rows[0].group_role != "ADMIN" && rows[0].group_role != "MODERATOR") {
                     res.end("invalid role");
                     return;
                  }

                  //Check if user exists
                  database.query("SELECT * FROM group_memberships WHERE profile_id='" + profileId + "' AND group_id='" + groupId + "';", function(err, rows, fields) {
                     dbQueryCheck(err);

                     if (rows.length == 0) {
                        res.end("user not found");
                        return;
                     }

                     if (rows[0].group_role == "KICKED") {
                        res.end("already kicked");
                        return;
                     }

                     if (rows[0].group_role == "ADMIN") {
                        res.end("dont kick yourself");
                        return;
                     }

                     var membershipId = rows[0].membership_id;

                     //Check if user exists
                     database.query("UPDATE group_memberships SET group_role='KICKED' WHERE membership_id='" + membershipId + "';", function(err, rows, fields) {
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
         });

      }
      else {
         checkAuth(token, function(response) {
            res.end(response);
            return;
         });
      }
   });
});

//Client checks if they have been kicked from any groups
app.get("/api/group/checkKicks", function(req, res) {
   //Params: ?token
   //Returns "invalid params" if invalid params
   //Returns "not kicked" if there are no kicks
   //Returns array of group ids that the user has been kicked from

   var token = req.query.token;

   //Check if params are valid
   if (token === undefined) {
      res.end("invalid params");
      return;
   }

   isAuthValid(token, function(isValid) {
      if (isValid) {

         //Begin transaction
         database.beginTransaction(function(err) {
            dbQueryCheck(err);

            //Get user token sub
            getTokenSub(token, function(sub) {

               //Check if user is owner of the group
               database.query("SELECT * FROM group_memberships WHERE profile_id=(SELECT profile_id FROM users WHERE id='" + sub + "') AND group_role='KICKED';", function(err, rows, fields) {
                  dbQueryCheck(err);

                  if (rows.length == 0) {
                     res.end("not kicked");
                     return;
                  }

                  var kicks = [];

                  for (var i = 0; i < rows.length; i++) {
                     kicks.push(rows[i].group_id);
                  }

                  //Delete user records from kicked groups
                  database.query("DELETE FROM group_memberships WHERE profile_id=(SELECT profile_id FROM users WHERE id='" + sub + "') AND group_role='KICKED';", function(err, rows, fields) {
                     dbQueryCheck(err);

                     //Commit changes
                     database.commit(function(err) {
                        if (err) {
                           database.rollback(function() {
                              dbQueryCheck(err);
                           });
                        }
                     });

                     res.end(JSON.stringify(kicks));
                     return;
                  });
               });
            });
         });

      }
      else {
         checkAuth(token, function(response) {
            res.end(response);
            return;
         });
      }
   });
});

//User attempts to create a vote in a group
app.get("/api/group/createVote", function(req, res) {
   //Params: ?token, ?groupId, ?name, ?desc, ?duration, ?option1, ?option2, ?option3, ?option4
   //Returns "invalid params" if invalid params
   //Returns "no groups" if user is not member of the group
   //Returns "success" if vote is created successfully

   var token = req.query.token;
   var groupId = req.query.groupId;
   var name = req.query.name;
   var desc = req.query.desc;
   var duration = req.query.duration;
   var option1 = req.query.option1;
   var option2 = req.query.option2;
   var option3 = req.query.option3;
   var option4 = req.query.option4;

   //Check if params are valid
   if (token === undefined || groupId === undefined || name === undefined || desc === undefined || duration === undefined || option1 === undefined || option2 === undefined) {
      res.end("invalid params");
      return;
   }
   
   //Sanitize inputs
   var groupId = sanitizer.sanitize(groupId);
   var name = sanitizer.sanitize(name);
   var desc = sanitizer.sanitize(desc);
   var duration = sanitizer.sanitize(duration);
   var option1 = sanitizer.sanitize(option1);
   var option2 = sanitizer.sanitize(option2);
   var option3 = option3 === undefined ? null : sanitizer.sanitize(option3);
   var option4 = option4 === undefined ? null : sanitizer.sanitize(option4);
   
   isAuthValid(token, function(isValid) {
      if (isValid) {
         
         //Begin transaction
         database.beginTransaction(function(err) {
            dbQueryCheck(err);
            
            //Get user token sub
            getTokenSub(token, function(sub) {
      
               //Check if user is in group
               database.query("SELECT * FROM group_memberships WHERE profile_id=(SELECT profile_id FROM users WHERE id='" + sub + "') AND group_id='" + groupId + "';", function(err, rows, fields) {
                  dbQueryCheck(err);

                  if (rows.length == 0) {
                     res.end("no groups");
                     return;
                  }
                  
                  //Create vote 
                  database.query("INSERT INTO vote (group_id, name, description, expiry_date, creation_date) VALUES ('" + groupId + "','" + name + "','" + desc + "', NOW() + INTERVAL " + duration + " MINUTE, NOW());", function(err, rows, fields) {
                     dbQueryCheck(err);
                     
                     //Create option 1
                     database.query("INSERT INTO vote_option (vote_id, name) VALUES ((SELECT MAX(vote_id) FROM vote),'" + option1 + "');", function(err, rows, fields) {
                        dbQueryCheck(err);
                        
                        //Create option 2
                        database.query("INSERT INTO vote_option (vote_id, name) VALUES ((SELECT MAX(vote_id) FROM vote),'" + option2 + "');", function(err, rows, fields) {
                           dbQueryCheck(err);
                           
                           if(option3 === null) {
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
                           }
                           
                           //Create option 3
                           database.query("INSERT INTO vote_option (vote_id, name) VALUES ((SELECT MAX(vote_id) FROM vote),'" + option3 + "');", function(err, rows, fields) {
                              dbQueryCheck(err);
                              
                              if(option4 === null) {
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
                              }
                              
                              //Create option 4
                              database.query("INSERT INTO vote_option (vote_id, name) VALUES ((SELECT MAX(vote_id) FROM vote),'" + option4 + "');", function(err, rows, fields) {
                                 dbQueryCheck(err);

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
                  });
               });
            });
         });
      }
      else {
         checkAuth(token, function(response) {
            res.end(response);
            return;
         });
      }
   });
});

//User attempts to get a list of votes and counts in a group
app.get("/api/group/getVotes", function(req, res) {
   //Params: ?token, ?groupId
   //Returns "invalid params" if invalid params
   //Returns "no groups" if user is not member of the group
   //Returns "no votes" if no votes were made
   //Returns JSON of votes if successful

   var token = req.query.token;
   var groupId = req.query.groupId;

   //Check if params are valid
   if (token === undefined || groupId === undefined) {
      res.end("invalid params");
      return;
   }

   isAuthValid(token, function(isValid) {
      if (isValid) {
         
         //Begin transaction
         database.beginTransaction(function(err) {
            dbQueryCheck(err);
            
            //Get user token sub
            getTokenSub(token, function(sub) {
      
               //Check if user is in group
               database.query("SELECT * FROM group_memberships WHERE profile_id=(SELECT profile_id FROM users WHERE id='" + sub + "') AND group_id='" + groupId + "';", function(err, rows, fields) {
                  dbQueryCheck(err);

                  if (rows.length == 0) {
                     res.end("no groups");
                     return;
                  }
                  
                  //Get votes
                  database.query("SELECT * FROM vote WHERE group_id='" + groupId + "';", function(err, rows, fields) {
                     dbQueryCheck(err);
                     
                     if(rows.length == 0) {
                        res.end("no votes");
                        return;
                     }
                     
                     var votes = rows;
                     
                     //Get votes
                     database.query("SELECT * FROM vote_option;", function(err, rows, fields) {
                        dbQueryCheck(err);
                        
                        for(var i = 0; i < votes.length; i++) {
                           votes[i].options = [];
                           
                           for(var j = 0; j < rows.length; j++) {
                              if(votes[i].vote_id == rows[j].vote_id) {
                                 var optionJSON = {};
                                 optionJSON.option_id = rows[j].option_id;
                                 optionJSON.name = rows[j].name;
                                 optionJSON.count = 0;
                                 votes[i].options.push(optionJSON);
                              }
                           }
                        }

                        //Get vote count
                        database.query("SELECT * FROM ballot;", function(err, rows, fields) {
                           dbQueryCheck(err);
                           
                           for(var i = 0; i < votes.length; i++) {
                              for(var j = 0; j < rows.length; j++) {
                                 for(var k = 0; k < votes[i].options.length; k++) {
                                    if(votes[i].options[k].option_id == rows[j].option_id) {
                                       votes[i].options[k].count++;
                                    }
                                 }
                              }
                           }
                           
                           res.end(JSON.stringify(votes));
                           return;
                        });
                     });
                  });
               });
            });
         });
      }
      else {
         checkAuth(token, function(response) {
            res.end(response);
            return;
         });
      }
   });
});

//User attempts to select a candidate in a vote
app.get("/api/group/submitVote", function(req, res) {
   //Params: ?token, ?optionId
   //Returns "invalid params" if invalid params
   //Returns "invalid vote option" if option was not found
   //Returns "vote expired" if the vote has expired
   //Returns "no groups" if the user does not belong to the correct group
   //Returns "update success" if vote re-submission is successful
   //Returns "vote success" if new vote submission is successful

   var token = req.query.token;
   var optionId = req.query.optionId;
   
   //Check if params are valid
   if (token === undefined || optionId === undefined) {
      res.end("invalid params");
      return;
   }
   
   var optionId = sanitizer.sanitize(optionId);

   isAuthValid(token, function(isValid) {
      if (isValid) {
         
         //Begin transaction
         database.beginTransaction(function(err) {
            dbQueryCheck(err);
         
            //Get user token sub
            getTokenSub(token, function(sub) {
               
               //Get option vote
               database.query("SELECT vote_id FROM vote_option WHERE option_id='" + optionId + "';", function(err, rows, fields) {
                  dbQueryCheck(err);
                  
                  //Check if the vote option exists
                  if(rows.length == 0) {
                     res.end("invalid vote option");
                     return;
                  }
                  
                  var voteId = rows[0].vote_id;
                  
                  //Get user profile id
                  database.query("SELECT profile_id FROM users WHERE id='" + sub + "';", function(err, rows, fields) {
                     dbQueryCheck(err);

                     var thisProfileId = rows[0].profile_id;
                     
                     //Check group membership
                     database.query("SELECT * FROM group_memberships WHERE profile_id='" + thisProfileId + "' AND group_id=(SELECT group_id FROM vote WHERE vote_id='" + voteId + "');", function(err, rows, fields) {
                        dbQueryCheck(err);
                        
                        //Check if the user belongs to the group holding the vote
                        if(rows.length == 0) {
                           res.end("no groups");
                           return;
                        }
                        
                        var groupId = rows[0].group_id;
                        
                        //Check if vote is still open
                        database.query("SELECT expiry_date FROM vote WHERE vote_id='" + voteId + "' AND expiry_date > NOW();", function(err, rows, fields) {
                           dbQueryCheck(err);
                           
                           if(rows.length == 0) {
                              res.end("vote expired");
                              return;
                           }
                           
                           //Get vote options related to the voteId
                           database.query("SELECT option_id FROM vote_option WHERE vote_id='" + voteId + "';", function(err, rows, fields) {
                              dbQueryCheck(err);
                              
                              var voteOptions = [];
                              
                              for(var i = 0; i < rows.length; i++) {
                                 voteOptions.push(rows[i].option_id);
                              }
                              
                              //Check if the user already voted on this vote
                              database.query("SELECT * FROM ballot;", function(err, rows, fields) {
                                 dbQueryCheck(err);
                                 
                                 var alreadyVoted = false;
                                 var ballotId = null;
   
                                 for(var i = 0; i < rows.length && !alreadyVoted; i++) {
                                    for(var j = 0; j < voteOptions.length && !alreadyVoted; j++) {
                                       if(voteOptions[j] == rows[i].option_id) {
                                          alreadyVoted = true;
                                          ballotId = rows[i].ballot_id;
                                       }
                                    }
                                 }
                                 
                                 //If user already voted, update the vote. Otherwise, create a new vote
                                 if(alreadyVoted) {
                                    //Update ballot entry
                                    database.query("UPDATE ballot SET option_id='" + optionId + "' WHERE ballot_id='" + ballotId + "';", function(err, rows, fields) {
                                       dbQueryCheck(err);
                                       
                                       database.commit(function(err) {
                                          if (err) {
                                             database.rollback(function() {
                                                dbQueryCheck(err);
                                             });
                                          }
                                       });
                                       
                                       res.end("update success");
                                       return;
                                    });
                                 } else {
                                    //Create new ballot entry
                                    database.query("INSERT INTO ballot(profile_id, option_id) VALUES('" + thisProfileId + "','" + optionId + "');", function(err, rows, fields) {
                                       dbQueryCheck(err);
                                       
                                       database.commit(function(err) {
                                          if (err) {
                                             database.rollback(function() {
                                                dbQueryCheck(err);
                                             });
                                          }
                                       });
                                       
                                       res.end("vote success");
                                       return;
                                    });
                                 }
                              });
                           });
                        });
                     });
                  });
               });
            });
         });
      }
      else {
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

//User attempts to edit their profile
app.get("/api/user/edit", function(req, res) {
   //Params: ?token, ?firstName, ?lastName, ?profilePicture, ?age, ?description, ?privacy
   //Returns "invalid params" if invalid params
   //Returns "description invalid range" if the description value is too large
   //Returns "privacy invalid value" if privacy does not match either "PUBLIC" or "PRIVATE"
   //Returns "success" if edit is successful

   var token = req.query.token; //Auth token
   var firstName = req.query.firstName; //First Name
   var lastName = req.query.lastName; //Last Name
   var profilePicture = req.query.profilePicture //Profile Picture
   var age = req.query.age; //Age
   var desc = req.query.desc; //Description
   var privacy = req.query.privacy; //Privacy setting (PUBLIC, PRIVATE)

   //Check if params are valid
   if (token === undefined ||
      (firstName === undefined &&
         lastName === undefined &&
         profilePicture === undefined &&
         age === undefined &&
         desc === undefined &&
         privacy === undefined)) {
      res.end("invalid params");
      return;
   }

   //Sanitize input
   firstName = firstName === undefined ? undefined : sanitizer.sanitize(firstName);
   lastName = lastName === undefined ? undefined : sanitizer.sanitize(lastName);
   profilePicture = profilePicture === undefined ? undefined : sanitizer.sanitize(profilePicture);
   age = age === undefined ? undefined : sanitizer.sanitize(age);
   desc = desc === undefined ? undefined : sanitizer.sanitize(desc);
   privacy = privacy === undefined ? undefined : sanitizer.sanitize(privacy).toUpperCase();

   //Validate input
   if (desc !== undefined && desc.length > 500) {
      res.end("description invalid range");
      return;
   }

   if (privacy !== undefined && (privacy != "PUBLIC" && privacy != "PRIVATE")) {
      res.end("privacy invalid value");
      return;
   }

   //Get queries for paramaters
   var firstNameQuery = firstName === undefined ? undefined : "first_name='" + firstName + "'";
   var lastNameQuery = lastName === undefined ? undefined : "last_name='" + lastName + "'";
   var profilePictureQuery = profilePicture === undefined ? undefined : "profile_picture='" + profilePicture + "'";
   var ageQuery = age === undefined ? undefined : "age='" + age + "'";
   var descQuery = desc === undefined ? undefined : "description='" + desc + "'";
   var privacyQuery = privacy === undefined ? undefined : "privacy='" + privacy + "'";

   isAuthValid(token, function(isValid) {
      if (isValid) {

         //Begin transaction
         database.beginTransaction(function(err) {
            dbQueryCheck(err);

            //Get user token sub
            getTokenSub(token, function(sub) {

               //Get profile id
               database.query("SELECT profile_id FROM users WHERE id='" + sub + "';", function(err, rows, fields) {
                  dbQueryCheck(err);

                  //Build SQL query
                  var profileId = rows[0].profile_id;
                  var queryArray = [firstNameQuery, lastNameQuery, profilePictureQuery, ageQuery, descQuery, privacyQuery];
                  var dbQuery = "UPDATE user_profiles SET " + buildSQLQuery(queryArray) + " WHERE profile_id='" + profileId + "';";

                  //Update the DB
                  database.query(dbQuery, function(err, rows, fields) {
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
      }
      else {
         checkAuth(token, function(response) {
            res.end(response);
            return;
         });
      }
   });
});

//Client gets user profile record of ID. Returns this this user's profile if profileId is not specified.
app.get("/api/user/getProfile", function(req, res) {
   //Params: ?token, ?profileId (optional)
   //Returns "invalid params" if invalid params
   //Returns "not found" if user does not exist
   //Returns profile as JSON if user profile is found

   var token = req.query.token;
   var profileId = req.query.profileId;

   //Check if params are valid
   if (token === undefined) {
      res.end("invalid params");
      return;
   }
   
   //Sanitize profileId
   profileId = sanitizer.sanitize(profileId);

   isAuthValid(token, function(isValid) {
      if (isValid) {

         //Get user token sub
         getTokenSub(token, function(sub) {

            //Get profile id
            database.query("SELECT profile_id FROM users WHERE id='" + sub + "';", function(err, rows, fields) {
               dbQueryCheck(err);

               var thisId = rows[0].profile_id;
               
               //Set profileId to thisId if undefined
               if(profileId === undefined) {
                  profileId = thisId;
               }
               
               //Get user profile
               database.query("SELECT * FROM user_profiles WHERE profile_id='" + profileId + "';", function(err, rows, fields) {
                  dbQueryCheck(err);

                  if (rows.length == 0) {
                     res.end("not found");
                     return;
                  }

                  var profile = rows[0];

                  //Look for relationship
                  database.query("SELECT * FROM user_relationships WHERE ((profile_a='" + thisId + "' AND profile_b='" + profileId + "') OR (profile_a='" + profileId + "' AND profile_b='" + thisId + "')) AND (relationship_type='Friend' OR relationship_type='Best Friend');", function(err, rows, fields) {
                     dbQueryCheck(err);

                     //Check if the other user is this user's friend
                     var isFriend = false;
                     if (rows.length > 0) {
                        isFriend = true;
                     }

                     //Return a private profile if the user is not this user's friend, this isn't the user's profile and the profile is private
                     if (!isFriend && thisId != profileId && profile.privacy == "PRIVATE") {
                        var privateProfile = {};
                        privateProfile.profile_id = profile.profile_id;
                        privateProfile.first_name = profile.first_name;
                        privateProfile.last_name = profile.last_name;
                        privateProfile.privacy = profile.privacy;

                        res.end(JSON.stringify(privateProfile));
                        return;
                     }

                     //Returns the public profile
                     res.end(JSON.stringify(profile));
                     return;
                  });
               });
            });
         });

      }
      else {
         checkAuth(token, function(response) {
            res.end(response);
            return;
         });
      }
   });
});

//Client gets list of profile pictures
app.get("/api/user/getProfilePictures", function(req, res) {
   //Params: ?token
   //Returns "invalid params" if invalid params
   //Returns list (string) of profile pictures

   var token = req.query.token;

   //Check if params are valid
   if (token === undefined) {
      res.end("invalid params");
      return;
   }

   isAuthValid(token, function(isValid) {
      if (isValid) {
         var picList = [];

         //Populate array with list of pictures
         fs.readdir(dir_profile_pictures, (err, files) => {
            if (err) {
               console.log("File I/O error: " + err);
               console.log("\n!!<< FATAL ERROR: STOPPING THE SERVER >>!!");
               process.exit(0);
            }
            files.forEach(file => {
               picList.push(file.toString());
            });
            res.end(JSON.stringify(picList));
            return;
         })
      }
      else {
         checkAuth(token, function(response) {
            res.end(response);
            return;
         });
      }
   });
});

//Client attempts to download a picture
app.get('/api/user/downloadPicture', function(req, res) {
   //Params: ?token, ?imageName
   //Returns "invalid params" if invalid params
   //Returns an error if the file cannot be found, or a backtracking has been attempted
   //Returns a profile picture file if file is found

   var token = req.query.token;
   var imageName = req.query.imageName;

   //Check if params are valid
   if (token === undefined || imageName === undefined) {
      res.end("invalid params");
      return;
   }

   //Prevent URL backtracking
   var file = imageName.replace('../', '');

   isAuthValid(token, function(isValid) {
      if (isValid) {

         //Download the file
         res.sendFile(dir_profile_pictures + imageName, function(err) {
            if (err) {
               res.end(err.toString());
            }
         });
         return;
      }
      else {
         checkAuth(token, function(response) {
            res.end(response);
            return;
         });
      }
   });
});

//User sends a friend request
app.get("/api/user/sendFriendRequest", function(req, res) {
   //Params: ?token, ?username
   //Returns "invalid params" if invalid params
   //Returns "relationship already exists" if user_a already has a relationship with user_b
   //Returns "user not found" if user_b cannot be found
   //Returns "success" if friend request is successfully created
   
   var token = req.query.token; //Auth token
   var username = req.query.username; //Name of friend

   //Check if params are valid
   if (token === undefined || username === undefined) {
      res.end("invalid params");
      return;
   }

   //username input
   username = sanitizer.sanitize(username);

   isAuthValid(token, function(isValid) {
      if (isValid) {

         //Begin transaction
         database.beginTransaction(function(err) {
            dbQueryCheck(err);

            //Get user token sub
            getTokenSub(token, function(sub) {

               //Get this profile id
               database.query("SELECT profile_id FROM users WHERE id='" + sub + "';", function(err, rows, fields) {
                  dbQueryCheck(err);

                  var thisId = rows[0].profile_id;
                  
                  //Get other profile id
                  database.query("SELECT profile_id FROM users WHERE username='" + username + "';", function(err, rows, fields) {
                     dbQueryCheck(err);
                     
                     var profileId = rows[0].profile_id;
                     
                     //Check if other user exists
                     database.query("SELECT * FROM user_profiles WHERE profile_id='" + profileId + "';", function(err, rows, fields) {
                        dbQueryCheck(err);
   
                        if (rows.length == 0) {
                           res.end("user not found");
                           return;
                        }
   
                        //Check if relationship already exists
                        database.query("SELECT * FROM user_relationships WHERE profile_a='" + profileId + "' OR profile_b='" + profileId + "';", function(err, rows, fields) {
                           dbQueryCheck(err);
   
                           for (var i = 0; i < rows.length; i++) {
   
                              //Check if a relationship already exists
                              if ((rows[i].profile_a == thisId || rows[i].profile_b == thisId) && (rows[i].profile_a == profileId || rows[i].profile_b == profileId)) {
                                 res.end("relationship already exists");
                                 return;
                              }
                           }
   
                           //Insert friend request
                           database.query("INSERT INTO user_relationships (profile_a, profile_b, relationship_type) VALUES ('" + thisId + "', '" + profileId + "', 'Invite');", function(err, rows, fields) {
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
               });
            });
         });
      }
      else {
         checkAuth(token, function(response) {
            res.end(response);
            return;
         });
      }
   });
});

//Client checks for friend requests
app.get("/api/user/getFriendRequests", function(req, res) {
   //Params: ?token
   //Returns "invalid params" if invalid params
   //Returns "no requests found" if there are no friend requests
   //Returns list of friend requests
   
   var token = req.query.token; //Auth token
   
   //Check if params are valid
   if (token === undefined) {
      res.end("invalid params");
      return;
   }

   isAuthValid(token, function(isValid) {
      if (isValid) {

         //Get user token sub
         getTokenSub(token, function(sub) {

            //Get profile id
            database.query("SELECT profile_id FROM users WHERE id='" + sub + "';", function(err, rows, fields) {
               dbQueryCheck(err);

               var thisId = rows[0].profile_id;

               //Check if relationship already exists
               database.query("SELECT * FROM user_relationships WHERE profile_b='" + thisId + "' AND relationship_type='Invite';", function(err, rows, fields) {
                  dbQueryCheck(err);
                  
                  //Check if there are any requests
                  if (rows.length == 0) {
                     res.end("no requests found");
                  }
                  
                  //Populate relationship ids
                  var relationships = [];

                  for (var i = 0; i < rows.length; i++) {
                     relationships.push(rows[i]);
                  }
                  
                  //Get friend's list
                  database.query("SELECT * FROM user_profiles;", function(err, rows, fields) {
                     dbQueryCheck(err);
                     
                     for(var i = 0; i < rows.length; i++) {
                        for(var j = 0; j < relationships.length; j++) {
                           if(relationships[j].profile_a == rows[i].profile_id) {
                              relationships[j].first_name = rows[i].first_name;
                              relationships[j].last_name = rows[i].last_name;
                              relationships[j].profile_picture = rows[i].profile_picture;
                              relationships[j].age = rows[i].age;
                              relationships[j].description = rows[i].description;
                              relationships[j].privacy = rows[i].privacy;
                           }
                        }
                     }
                     
                     //Return list of ids
                     res.end(JSON.stringify(relationships));
                     return;
                  });
               });
            });
         });
      }
      else {
         checkAuth(token, function(response) {
            res.end(response);
            return;
         });
      }
   });
});

//Client resolves a friend request
app.get("/api/user/resolveFriendRequest", function(req, res) {
   //Params: ?token, ?profileId, ?action
   //Returns "invalid params" if invalid params
   //Returns "cannot befriend yourself" if user tried to befriend themself
   //Returns "invite not found" if invite does not exist
   //Returns "success" if friend request action completes

   var token = req.query.token; //Auth token
   var profileId = req.query.profileId; //Name of other profile
   var action = req.query.action; //Activity type

   //Check if params are valid
   if (token === undefined || profileId === undefined || action === undefined || (action != "accept" && action != "deny")) {
      res.end("invalid params");
      return;
   }

   //Sanitize input
   profileId = sanitizer.sanitize(profileId);
   action = sanitizer.sanitize(action);

   isAuthValid(token, function(isValid) {
      if (isValid) {

         //Begin transaction
         database.beginTransaction(function(err) {
            dbQueryCheck(err);

            //Get user token sub
            getTokenSub(token, function(sub) {

               //Get profile id
               database.query("SELECT profile_id FROM users WHERE id='" + sub + "';", function(err, rows, fields) {
                  dbQueryCheck(err);

                  var thisId = rows[0].profile_id;

                  //Check is user is having an existential crisis ;_;
                  if (thisId == profileId) {
                     res.end("cannot befriend yourself");
                     return;
                  }

                  //Check if user exists
                  database.query("SELECT * FROM user_relationships WHERE profile_a='" + profileId + "' AND profile_b='" + thisId + "' AND relationship_type='Invite';", function(err, rows, fields) {
                     dbQueryCheck(err);

                     if (rows.length == 0) {
                        res.end("invite not found");
                        return;
                     }

                     var relationshipId = rows[0].relationship_id;
                     var dbQuery = "";

                     if (action == "accept") {
                        dbQuery = "UPDATE user_relationships SET relationship_type='Friend' WHERE relationship_id='" + relationshipId + "';";
                     }
                     else {
                        dbQuery = "DELETE FROM user_relationships WHERE relationship_id='" + relationshipId + "'";
                     }

                     //Accept/Deny invite
                     database.query(dbQuery, function(err, rows, fields) {
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
         });
      }
      else {
         checkAuth(token, function(response) {
            res.end(response);
            return;
         });
      }
   });
});

//Client gets list of friends
app.get("/api/user/viewFriends", function(req, res) {
   //Params: ?token
   //Returns "invalid params" if invalid params
   //Returns "no friends" if user has no friends
   //Returns list of friends with limited information if user has friends

   var token = req.query.token; //Auth token

   //Check if params are valid
   if (token === undefined) {
      res.end("invalid params");
      return;
   }

   isAuthValid(token, function(isValid) {
      if (isValid) {

         //Begin transaction
         database.beginTransaction(function(err) {
            dbQueryCheck(err);

            //Get user token sub
            getTokenSub(token, function(sub) {

               //Get profile id
               database.query("SELECT profile_id FROM users WHERE id='" + sub + "';", function(err, rows, fields) {
                  dbQueryCheck(err);

                  var thisId = rows[0].profile_id;

                  //Get profile id
                  database.query("SELECT * FROM user_relationships WHERE (profile_a='" + thisId + "' OR profile_b='" + thisId + "') AND (relationship_type='Friend' OR relationship_type='Best Friend');", function(err, rows, fields) {
                     dbQueryCheck(err);

                     //Check if user has any friends
                     if (rows.length == 0) {
                        res.end("no friends");
                        return;
                     }
                     
                     //Populate list of ids
                     var friendList = [];
                     
                     for (var i = 0; i < rows.length; i++) {
                        var relationship = {};
                        if (rows[i].profile_a == thisId) {
                           relationship.profile = rows[i].profile_b;
                        }
                        else {
                           relationship.profile = rows[i].profile_a;
                        }
                        relationship.relationship_type = rows[i].relationship_type;
                        friendList.push(relationship);
                     }
                     
                     //Get friend's list
                     database.query("SELECT * FROM user_profiles;", function(err, rows, fields) {
                        dbQueryCheck(err);
                        
                        for(var i = 0; i < rows.length; i++) {
                           for(var j = 0; j < friendList.length; j++) {
                              if(friendList[j].profile == rows[i].profile_id) {
                                 friendList[j].first_name = rows[i].first_name;
                                 friendList[j].last_name = rows[i].last_name;
                                 friendList[j].desc = rows[i].description;
                                 friendList[j].profile_picture = rows[i].profile_picture;
                              }
                           }
                        }
                        
                        //Return list of ids
                        res.end(JSON.stringify(friendList));
                        return;
                     });
                  });
               });
            });
         });
      }
      else {
         checkAuth(token, function(response) {
            res.end(response);
            return;
         });
      }
   });
});

//Client deletes a friend
app.get("/api/user/deleteFriend", function(req, res) {
   //Params: ?token, ?profileId
   //Returns "invalid params" if invalid params
   //Returns "friend not found" if friend cannot be found
   //Returns "success" if friend is deleted

   var token = req.query.token; //Auth token
   var profileId = req.query.profileId; //Friend profile

   //Check if params are valid
   if (token === undefined || profileId === undefined) {
      res.end("invalid params");
      return;
   }

   //Sanitize input
   profileId = sanitizer.sanitize(profileId);

   isAuthValid(token, function(isValid) {
      if (isValid) {

         //Begin transaction
         database.beginTransaction(function(err) {
            dbQueryCheck(err);

            //Get user token sub
            getTokenSub(token, function(sub) {

               //Get this id
               database.query("SELECT profile_id FROM users WHERE id='" + sub + "';", function(err, rows, fields) {
                  dbQueryCheck(err);

                  var thisId = rows[0].profile_id;

                  //Look for relationship
                  database.query("SELECT * FROM user_relationships WHERE ((profile_a='" + thisId + "' AND profile_b='" + profileId + "') OR (profile_a='" + profileId + "' AND profile_b='" + thisId + "')) AND (relationship_type='Friend' OR relationship_type='Best Friend');", function(err, rows, fields) {
                     dbQueryCheck(err);

                     //Check if user has any friends
                     if (rows.length == 0) {
                        res.end("friend not found");
                        return;
                     }

                     var relationshipId = rows[0].relationship_id;

                     //Delete relationship
                     database.query("DELETE FROM user_relationships WHERE relationship_id='" + relationshipId + "';", function(err, rows, fields) {
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
         });
      }
      else {
         checkAuth(token, function(response) {
            res.end(response);
            return;
         });
      }
   });
});

/*
 * Miscellaneous Functions
 */

//Builds an SQL query from optional paramaters
function buildSQLQuery(queryArray) {
   var finalQuery = "";
   var validQueries = [];

   //Remove undefined or null entries
   for (var i = 0; i < queryArray.length; i++) {
      if (queryArray[i] != null) {
         validQueries.push(queryArray[i]);
      }
   }

   //Concatenate valid queries
   for (var i = 0; i < validQueries.length; i++) {

      finalQuery += validQueries[i];

      if (i < validQueries.length - 1) {
         finalQuery += ", ";
      }
   }

   console.log(finalQuery);

   //Return query
   return finalQuery;
}

/*
 * Server Initialisation Code
 */

//Connect to the database and then the server
function initServer() {
   database.connect(function(err) {
      dbQueryCheck(err);

      console.log("Connected to database");

      //Create server key if it does not exist
      database.query('SELECT * FROM server_information WHERE var_key="secret_key";', function(err, rows, fields) {
         dbQueryCheck(err);

         if (rows.length == 0) {
            //Key does not exist in DB
            console.log("Server secret key does not exist. Adding to database.");
            database.query('INSERT INTO server_information (var_key, var_value) VALUES ("secret_key", "' + secretKey + '");', function(err, rows, fields) {
               dbQueryCheck(err);

               console.log("Secret Key added to database");
               startServer();
            });
         }
         else {
            //Key exists in DB
            secretKey = rows[0].var_value;
            
            //Delete expired groups
            if(deleteGroups) {
               setInterval(function() {
                  verifyGroups();
               }, 2 * 60 * 1000);
               verifyGroups();
               console.log("Group verification job started");
            } else {
               console.log("Group verification job disabled");
            }
            startServer();
         }
      });
   });

   //Start Server
   function startServer() {
      server = app.listen(8081, function() {
         var host = server.address().address;
         var port = server.address().port;
         console.log("HuddlOut server is now listening at port " + port);
      });
   }
}

//Check for database errors. Shutdown server under event of errors
function dbQueryCheck(err) {
   if (err) {
      console.log("Database query error: " + err);
      console.log("\n!!<< FATAL ERROR: STOPPING THE SERVER >>!!");
      process.exit(0);
   };
}

//Init the server
initServer();
