/*
  # Oracle Support Chatbot Schema

  1. New Tables
    - `chat_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `messages`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references chat_sessions)
      - `content` (text)
      - `role` (text) - either 'user' or 'assistant'
      - `created_at` (timestamp)
    
    - `oracle_knowledge`
      - `id` (uuid, primary key)
      - `topic` (text)
      - `problem` (text)
      - `solution` (text)
      - `tools` (text[])
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    title text NOT NULL DEFAULT 'New Chat',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid REFERENCES chat_sessions ON DELETE CASCADE NOT NULL,
    content text NOT NULL,
    role text NOT NULL CHECK (role IN ('user', 'assistant')),
    created_at timestamptz DEFAULT now()
);

-- Create oracle_knowledge table
CREATE TABLE IF NOT EXISTS oracle_knowledge (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    topic text NOT NULL,
    problem text NOT NULL,
    solution text NOT NULL,
    tools text[] DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE oracle_knowledge ENABLE ROW LEVEL SECURITY;

-- Policies for chat_sessions
CREATE POLICY "Users can view their own chat sessions"
    ON chat_sessions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat sessions"
    ON chat_sessions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policies for messages
CREATE POLICY "Users can view messages in their sessions"
    ON messages
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in their sessions"
    ON messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- Policies for oracle_knowledge
CREATE POLICY "Everyone can view oracle knowledge"
    ON oracle_knowledge
    FOR SELECT
    TO authenticated
    USING (true);