/*  Populates the groups table with sample data  */

insert into groups(group_name, start_date, expiry_date, activity_type)
values
    ("Mofuggers", now(), now() + interval 1 day, "Dranking"),
    ("Ghostbusters", now(), now() + interval 1 day, "Busting"),
    ("Hipstlers", now(), now() + interval 1 day, "Revolting"),
    ("Sesh", now(), now() + interval 1 day, "Cutting"),
    ("Day Drinkers", now(), now() + interval 1 day, "Fighting");
    
/*  Populates the user_relationships table with sample data  */

insert into user_relationships(profile_a, profile_b, relationship_type)
values
    (6, 18, 'Friend'),
    (6, 17, 'Friend'),
    (6, 5, 'Friend'),
    (6, 16, 'Friend');
    
/*  Populates the group_memberships table with sample data  */

insert into group_memberships(profile_id, group_id, group_role)
values
    (6, 1, 'Member'),
    (6, 2, 'Member'),
    (6, 3, 'Fuhrer'),
    (6, 4, 'Member'),
    (6, 5, 'Admin');