# HuddlOut
## Server Repository
Third Year Project made with NodeJS.
Collaborators: @reccy, @danthedrummer, @glennncullen, @14552067

## API Documentation
### Authentication
####Check user authentication

**GET:** *api/auth/checkAuth*

**PARAMS:** *token*

**EXAMPLE:** *api/auth/checkAuth?token=token123*

**RETURNS:** *"invalid token" = malformed data or token doesn't exist, "renew token" = relog is required to renew the token since it's expired or password has changed, token = token authorised*


**GET:** *api/auth/login*

**PARAMS:** *username, password*

**EXAMPLE:** *api/auth/checkAuth?username=john+doe&password=hashed_pw*

**RETURNS:** *"invalid params" = params are invalid, "invalid username" = username is invalid, "invalid password" = password is invalid, token = token authorised*


**GET:** *api/auth/register (NOT YET IMPLEMENTED)*