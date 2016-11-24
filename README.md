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

**EXAMPLE:** *api/auth/login?username=john%20doe&password=plain_pw*

**RETURNS:** *"invalid params" = params are invalid, "invalid username" = username is invalid, "invalid password" = password is invalid, token = token authorised*

#### Register user

**GET:** *api/auth/register*

**PARAMS:** *username, password*

**EXAMPLE:** *api/auth/register?username=john%20doe&password=plain_pw*

**RETURNS:** *"invalid params" if invalid params, "occupied username" if username already taken, "invalid username" if invalid username, "invalid password" if password is invalid, token if registration successful*

**NOTES:** *Username must be between 7 and 20 characters. Password must be between 7 and 50 characters.*

**PRIVACY TYPES:** *PUBLIC - Account can be accessed by other users, PRIVATE - Account cannot be accessed by other users*

#### Change password

**GET:** *api/auth/changePassword*

**PARAMS:** *token, oldPassword, newPassword*

**EXAMPLE:** *api/auth/changePassword?token=token123&oldPassword=oldPw&newPassword=newPw*

**RETURNS:** *"invalid params" if invalid params, "invalid id" if token sub is invalid, "invalid password" if password is invalid, token if update successful*

### Groups
#### Create Group

**GET:** *api/group/create*

**PARAMS:** *token, name, activity*

**EXAMPLE:** *api/group/create?token=token123&name=the%20sesh&activity=pub*

**RETURNS:** *"invalid params" if invalid params, group id if registration successful*

#### Delete Group

**GET:** *api/group/delete*

**PARAMS:** *token, groupId*

**EXAMPLE:** *api/group/delete?token=token123&groupId=5*

**RETURNS:** *"invalid params" if invalid params, "not found" if group membership not found, "invalid role" if user is not group admin, "success" if deletion successful*

#### Leave Group

**GET:** *api/group/leave*

**PARAMS:** *token, groupId*

**EXAMPLE:** *api/group/leave?token=token123&groupId=5*

**RETURNS:** *"invalid params" if invalid params, "not found" if group membership not found, "invalid role" if user is group admin, "success" if deletion successful*

#### Invite Member

**GET:** *api/group/inviteMember*

**PARAMS:** *token, groupId, profileId*

**EXAMPLE:** *api/group/inviteMember?token=token123&groupId=5&profileId=12*

**RETURNS:** *"invalid params" if invalid params, "membership not found" if the membership is not found, "invalid role" if user is not an admin or moderator, "user not found" if invited user does not exist, "invitation already exists" if invited user already contains an invite, "already member" if user is already part of the group, "success" if invitation successful*

#### Check Invites

**GET:** *api/group/checkInvites*

**PARAMS:** *token*

**EXAMPLE:** *api/group/checkInvites?token=token123*

**RETURNS:** *"invalid params" if invalid params, "user not found" if the user profile cannot be found, "no invites" if there are no invites, array of group ids if there are invites*

#### Resolve Invite

**GET:** *api/group/resolveInvite*

**PARAMS:** *token, groupId, action (accept / deny)*

**EXAMPLE:** *api/group/resolveInvite?token=token123&groupId=2&action=accept*

**RETURNS:** *"invalid params" if invalid params, "user not found" if the user profile cannot be found, "no invites" if no invites where found, "success" if action completes successfully*

#### Kick Member

**GET:** *api/group/kickMember*

**PARAMS:** *token, groupId, profileId*

**EXAMPLE:** *api/group/kickMember?token=token123&groupId=2&profileId=3*

**RETURNS:** *"invalid params" if invalid params, "membership not found" if user is not member of the group, "invalid role" if user is not an admin or moderator, "dont kick yourself" if user tried to kick themself, "user not found" if user is not in the group, "already kicked" if user was already kicked, "success" if kick is successful*

#### Check Kicks

**GET:** *api/group/checkKicks*

**PARAMS:** *token*

**EXAMPLE:** *api/group/checkKicks?token=token123*

**RETURNS:** *"invalid params" if invalid params, "not kicked" if there are no kicks, array of group ids that the user has been kicked from*

#### Get Members

**GET:** *api/group/getMembers*

**PARAMS:** *token, groupId*

**EXAMPLE:** *api/group/getMembers?token=token123&groupId=5*

**RETURNS:** *"invalid params" if invalid params, "not member" if user is not member of the group, list of profile ids of group member profiles if successful*

**MEMBERSHIP TYPES:** *ADMIN - Full control (Only owner is admin), MODERATOR - All admin control except for group deletion, MEMBER - No control, INVITED - Invited user, KICKED - Kicked user*

#### Get Groups

**GET:** *api/group/getGroups*

**PARAMS:** *token*

**EXAMPLE:** *api/group/getGroups?token=token123*

**RETURNS:** *"invalid params" if invalid params, "no groups" if user is not member of a group, list of ids of groups if successful*

### Users
#### Edit Profile

**GET:** *api/user/editProfile*

**PARAMS:** *token, firstName, lastName, profilePicture, age, description, privacy*

**EXAMPLE:** *api/user/edit?token=123&firstName=John&lastName=Doe&profilePicture=3&age=23&description=I%20like%20programming!&privacy=PRIVATE*

**RETURNS:** *"invalid params" if invalid params, "description invalid range" if the description value is too large, "privacy invalid value" if privacy does not match either "PUBLIC" or "PRIVATE", "success" if edit is successful*

#### Get Profile

**GET:** *api/user/getProfile*

**PARAMS:** *token, profileId*

**EXAMPLE:** *api/user/getProfile?token=token123&profileId=1*

**RETURNS:** *"invalid params" if invalid params, "not found" if user does not exist, profile as JSON if user found*

#### Get Profile Pictures

**GET:** *api/user/getProfilePictures*

**PARAMS:** *token*

**EXAMPLE:** *api/user/getProfilePictures?token=token123*

**RETURNS:** *"invalid params" if invalid params, list (string) of profile pictures*

#### Download Picture

**GET:** *api/user/downloadPicture*

**PARAMS:** *token, imageName*

**EXAMPLE:** *api/user/downloadPicture?token=token123&imageName=airplane.bmp*

**RETURNS:** *"invalid params" if invalid params, error if the file cannot be found or a backtracking has been attempted, profile picture bitmap file if file is found*

#### Send Friend Request

**GET:** *api/user/sendFriendRequest*

**PARAMS:** *token, profileId*

**EXAMPLE:** *api/user/sendFriendRequest?token=token123&profileId=6*

**RETURNS:** *"invalid params" if invalid params, "relationship already exists" if user_a already has a relationship with user_b, "user not found" if user_b cannot be found, "success" if friend request is successfully created*

#### Get Friend Requests

**GET:** *api/user/getFriendRequests*

**PARAMS:** *token*

**EXAMPLE:** *api/user/getFriendRequests?token=token123*

**RETURNS:** *"invalid params" if invalid params, "no requests found" if there are no friend requests, list of friend requests*

#### Resolve Friend Request

**GET:** *api/user/resolveFriendRequest*

**PARAMS:** *token, profileId, action*

**EXAMPLE:** *api/user/resolveFriendRequest?token=token123&profileId=7&action=accept*

**RETURNS:** *"invalid params" if invalid params, "cannot befriend yourself" if user tried to befriend themself, "invite not found" if invite does not exist, "success" if friend request action completes*

#### View Friends

**GET:** *api/user/viewFriends*

**PARAMS:** *token*

**EXAMPLE:** *api/user/viewFriends?token=token123*

**RETURNS:** *"invalid params" if invalid params, "no friends" if user has no friends, list of friend ids and relationshp types if user has friends*

#### Delete Friend

**GET:** *api/user/deleteFriend*

**PARAMS:** *token, profileId*

**EXAMPLE:** *api/user/deleteFriend?token=token123&profileId=12*

**RETURNS:** *"invalid params" if invalid params, "friend not found" if friend cannot be found, "success" if friend is deleted*