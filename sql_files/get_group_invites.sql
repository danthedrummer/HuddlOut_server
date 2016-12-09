SELECT group_memberships.*, groups.group_name, groups.activity_type 
FROM group_memberships 
INNER JOIN groups ON group_memberships.group_id = groups.group_id 
WHERE profile_id='" + profileId + "' AND group_role='INVITED'; 