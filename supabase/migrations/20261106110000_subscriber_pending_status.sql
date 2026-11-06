-- Kept in its own migration: a new enum value cannot be used in the transaction
-- that adds it, and the revenue foundation migration depends on it being committed.
alter type public.subscriber_status add value if not exists 'pending';
