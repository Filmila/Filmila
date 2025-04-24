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

## Films Table

```sql
create table public.films (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    description text,
    filmmaker text references profiles(email),
    status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
    views integer default 0,
    revenue decimal(10,2) default 0,
    upload_date timestamp with time zone default now(),
    video_url text,
    thumbnail_url text
);

-- Enable RLS
alter table public.films enable row level security;

-- Allow filmmakers to read their own films
create policy "Filmmakers can view their own films"
    on public.films
    for select
    using (filmmaker = auth.jwt() ->> 'email');

-- Allow filmmakers to insert their own films
create policy "Filmmakers can upload films"
    on public.films
    for insert
    with check (filmmaker = auth.jwt() ->> 'email');

-- Allow admins to read all films
create policy "Admins can view all films"
    on public.films
    for select
    using (auth.jwt() ->> 'role' = 'ADMIN');

-- Allow admins to update film status
create policy "Admins can update film status"
    on public.films
    for update
    using (auth.jwt() ->> 'role' = 'ADMIN');
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