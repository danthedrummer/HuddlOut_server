# HuddlOut
## Server Repository
Third Year Project made with NodeJS.
Collaborators: @reccy, @danthedrummer, @glennncullen, @14552067

## API Documentation
### Authentication
####Check user authentication

**GET:** *api/auth/checkAuth*

**PARAMS:** *token*

**EXAMPLE:** *api/auth/checkAuth?token=eyJ0eXAiOsfdGciOiJIUzI1NiJ9.eyJzdWIiOjEsInBhc3MiOiJ0ZXN0X3B3IiwianRpIjoiMGIzZWM5ZWUtYjk4NS00MDZiLTkyODktNTQ0ODYwNTEwYzRlIiwiaWF0IjoxNDAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDB9.B4a3bGA-07xaGMNygjTF3HnO-J02HhGdUOM_Klj-M2g*

**RETURNS:** *"invalid token" = malformed data or token doesn't exist, "renew token" = relog is required to renew the token since it's expired or password has changed, token = token authorised*


**GET:** *api/auth/login*

**PARAMS:** *username, password*

**EXAMPLE:** *api/auth/checkAuth?username=john+doe?password=2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824*

**RETURNS:** *"invalid params" = params are invalid, "invalid username" = username is invalid, "invalid password" = password is invalid, token = token authorised*


**GET:** *api/auth/register (NOT YET IMPLEMENTED)*