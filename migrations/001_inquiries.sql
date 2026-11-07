CREATE TABLE IF NOT EXISTS morrow_inquiries (
  id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL CHECK (length(name) BETWEEN 2 AND 80),
  email text NOT NULL CHECK (length(email) BETWEEN 3 AND 254),
  message text NOT NULL CHECK (length(message) BETWEEN 5 AND 1000)
);

CREATE TABLE IF NOT EXISTS morrow_notification_outbox (
  id uuid PRIMARY KEY REFERENCES morrow_inquiries(id) ON DELETE CASCADE,
  site text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 0,
  lease_until timestamptz NOT NULL DEFAULT '-infinity',
  lease_token uuid,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  last_error text
);
CREATE OR REPLACE FUNCTION enqueue_morrow_notification_outbox() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO morrow_notification_outbox(id,site) VALUES(NEW.id,'morrow') ON CONFLICT(id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER enqueue_morrow_notification_outbox AFTER INSERT ON morrow_inquiries
FOR EACH ROW EXECUTE FUNCTION enqueue_morrow_notification_outbox();
