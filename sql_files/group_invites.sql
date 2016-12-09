/*select group_memberships.*, groups.group_name, groups.activity_type
    from group_memberships
inner join groups
    on group_memberships.group_id = groups.group_id
where group_memberships.profile_id = 6 and group_memberships.group_role = 'INVITED'

union

select user_profiles.first_name, user_profiles.last_name
    from user_profiles
inner join group_memberships
    on user_profiles.profile_id = group_memberships.profile_id
where group_memberships.group_role = 'Admin' and group_memberships.group_id =
(
    select group_id from group_memberships
    where profile_id = 6 and group_role = 'INVITED'
);*/

select group_memberships.*, groups.group_name, groups.activity_type,
(
    select user_profiles.first_name
        from user_profiles
    inner join group_memberships
        on user_profiles.profile_id = group_memberships.profile_id
    where group_memberships.group_role = 'Admin' and group_memberships.group_id =
    (
        select group_id from group_memberships
        where profile_id = 6 and group_role = 'INVITED'
    ))
    from group_memberships
inner join groups
    on group_memberships.group_id = groups.group_id
where group_memberships.profile_id = 6 and group_memberships.group_role = 'INVITED';