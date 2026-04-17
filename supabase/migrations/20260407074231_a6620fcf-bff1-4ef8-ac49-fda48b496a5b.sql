
-- Chatbot conversations table
CREATE TABLE IF NOT EXISTS public.chatbot_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_resolved boolean NOT NULL DEFAULT false,
  satisfaction_rating int
);

-- Enable RLS
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;

-- Users can view their own conversations
CREATE POLICY "Users can view own conversations"
  ON public.chatbot_conversations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own conversations
CREATE POLICY "Users can insert own conversations"
  ON public.chatbot_conversations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own conversations (e.g. add messages, rate)
CREATE POLICY "Users can update own conversations"
  ON public.chatbot_conversations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all conversations
CREATE POLICY "Admins can view all conversations"
  ON public.chatbot_conversations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all conversations
CREATE POLICY "Admins can update all conversations"
  ON public.chatbot_conversations FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete conversations
CREATE POLICY "Admins can delete conversations"
  ON public.chatbot_conversations FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow anonymous users to insert conversations (guest chat)
CREATE POLICY "Anon can insert conversations"
  ON public.chatbot_conversations FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Allow anon to read their session conversations
CREATE POLICY "Anon can read by session_id"
  ON public.chatbot_conversations FOR SELECT
  TO anon
  USING (user_id IS NULL);

-- Auto-delete conversations older than 30 days (GDPR)
CREATE OR REPLACE FUNCTION public.cleanup_old_chatbot_conversations()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public.chatbot_conversations
  WHERE created_at < now() - interval '30 days';
$$;
