
-- Check file owner and user ID
select f.id, f.owner_id, u.id as user_id, u.email 
from files f, users u 
where f.id = 'e7b11e8c-9c5d-43b7-9383-edbde0cbcb8e' 
and u.email = 'hadionga3@gmail.com';
