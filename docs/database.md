# Database Schema

## Profiles Table

```sql
create table public.profiles (
    id uuid references auth.users on delete cascade,
    email text,
    role text check (role in ('ADMIN', 'FILMMAKER', 'VIEWER')),
    display_name text,
    phone text,
    providers jsonb[],
    provider_type text,
    created_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    primary key (id)
);
```

### Row Level Security Policies

```sql
-- Enable RLS
alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "Users can read their own profile"
    on public.profiles
    for select
    using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update their own profile"
    on public.profiles
    for update
    using (auth.uid() = id);

-- Allow insert during registration
create policy "Allow insert during registration"
    on public.profiles
    for insert
    with check (auth.uid() = id);
```

### Fields Description

- `id`: UUID from auth.users table
- `email`: User's email address
- `role`: User role (ADMIN, FILMMAKER, or VIEWER)
- `display_name`: User's display name
- `phone`: User's phone number (optional)
- `providers`: Array of authentication providers
- `provider_type`: Type of authentication provider
- `created_at`: Timestamp when the profile was created
- `last_sign_in_at`: Timestamp of the last sign in 