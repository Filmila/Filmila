-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    -- Add constraint for notification type
    CONSTRAINT notifications_type_check 
    CHECK (type IN ('success', 'error', 'info', 'warning'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
    ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
    ON public.notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
    ON public.notifications
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can update their own notifications (e.g., mark as read)
CREATE POLICY "Users can update their own notifications"
    ON public.notifications
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to create notifications
CREATE POLICY "Allow authenticated users to create notifications"
    ON public.notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow service role to manage all notifications
CREATE POLICY "Allow service role to manage notifications"
    ON public.notifications
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true); 