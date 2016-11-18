# HuddlOut
## Server Repository
Third Year Project made with NodeJS.
Collaborators: @reccy, @danthedrummer, @glennncullen, @14552067



## API Documentation

*Note: All functions that require a token will return the same errors as /api/auth/checkAuth if the token is malformed or outdated.*

### Authentication
#### Check user authentication

**GET:** *api/auth/checkAuth*

**PARAMS:** *token*

**EXAMPLE:** *api/auth/checkAuth?token=token123*

**RETURNS:** *"invalid token" = malformed data or token doesn't exist, "renew token" = relog is required to renew the token since it's expired or password has changed, token = token authorised*

#### Login user

**GET:** *api/auth/login*

**PARAMS:** *username, password*

**EXAMPLE:** *api/auth/checkAuth?username=john%20doe&password=plain_pw*

**RETURNS:** *"invalid params" = params are invalid, "invalid username" = username is invalid, "invalid password" = password is invalid, token = token authorised*

#### Register user

**GET:** *api/auth/register*

**PARAMS:** *username, password*

**EXAMPLE:** *api/auth/register?username=john%20doe&password=plain_pw*

**RETURNS:** *"invalid params" if invalid params, "occupied username" if username already taken, "invalid username" if invalid username, "invalid password" if password is invalid, "success" if registration successful*

**NOTES:** *Username must be between 7 and 20 characters. Password must be between 7 and 50 characters.*

#### Change password

**GET:** *api/auth/changePassword*

**PARAMS:** *token, oldPassword, newPassword*

**EXAMPLE:** *api/auth/register?token=token123&oldPassword=oldPw&newPassword=newPw*

**RETURNS:** *"invalid params" if invalid params, "invalid id" if token sub is invalid, "invalid password" if password is invalid, token if update successful*

### Groups
#### Create Group

**GET:** *api/group/create*

**PARAMS:** *token, name, activity*

**EXAMPLE:** *api/auth/checkAuth?token=token123&name=the%20sesh&activity=pub*

**RETURNS:** *"invalid params" if invalid params, "success" if registration successful*

#### Delete Group

**GET:** *api/group/delete*

**PARAMS:** *token, groupId*

**EXAMPLE:** *api/auth/checkAuth?token=token123&groupId=5*

**RETURNS:** *"invalid params" if invalid params, "not found" if group membership not found, "invalid role" if user is not group admin, "success" if deletion successful*

#### Get Members

**GET:** *api/group/getMembers*

**PARAMS:** *token, groupId*

**EXAMPLE:** *api/auth/getMembers?token=token123&groupId=5*

**RETURNS:** *"invalid params" if invalid params, list of group members if successful*

### Users
#### Get Profile

**GET:** *api/user/getProfile*

**PARAMS:** *token, userId*

**EXAMPLE:** *api/user/getProfile?token=token123&userId=1*

**RETURNS:** *"invalid params" if invalid params, "not found" if user does not exist, profile as JSON if user found*