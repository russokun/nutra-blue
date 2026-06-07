-- Add INSERT policy for ai_messages (owner-only writes)
CREATE POLICY "Insertar mensajes propios" ON ai_messages
    FOR INSERT
    WITH CHECK (user_id = auth.uid());
