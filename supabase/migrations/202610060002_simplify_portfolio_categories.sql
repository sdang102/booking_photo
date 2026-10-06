update public.categories
set name = case slug
  when 'portrait' then 'Chân Dung'
  when 'concept' then 'Concept'
  when 'couple' then 'Couple'
  else name
end,
is_active = slug in ('portrait', 'concept', 'couple')
where slug in ('portrait', 'concept', 'couple', 'pre-wedding', 'family', 'event');
