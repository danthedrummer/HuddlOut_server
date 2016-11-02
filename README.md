# HuddlOut
## Server Repository
Third Year Project made with NodeJS.
Collaborators: @reccy, @danthedrummer, @glennncullen, @14552067

## API Documentation
### Authentication
**Check user authentication**
GET: *api/auth/checkAuth*

PARAMS: *authKey*

EXAMPLE: *api/auth/checkAuth?authKey=12345*

RETURNS:    * *int result (0 = success, 1 = requires password login, 2 = requires full login)* 1

**Login**

**Register**