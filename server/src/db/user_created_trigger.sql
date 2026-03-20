create function finish_user_registration()
returns trigger
language plpgsql
security definer  -- ← add this so the function has permission to insert
as $$
begin
  insert into public."User"(id, username, created_at)
  values(
    new.id,
    new.raw_user_metadata->>'username',
    new.created_at
  );
  return new;
end;
$$;

create trigger new_user_trigger
after insert on auth.users
for each row
execute function finish_user_registration();