delete from user_relationships
where profile_a = 6 or profile_b = 6;

insert into user_relationships
    (profile_a, profile_b, relationship_type)
values 
    (1, 6, 'Invite'),
    (2, 6, 'Invite'),
    (3, 6, 'Invite'),
    (4, 6, 'Invite'),
    (5, 6, 'Invite'),
    (7, 6, 'Invite'),
    (8, 6, 'Invite'),
    (9, 6, 'Invite'),
    (12, 6, 'Invite'),
    (13, 6, 'Invite'),
    (14, 6, 'Invite'),
    (16, 6, 'Invite'),
    (17, 6, 'Invite'),
    (18, 6, 'Invite');