CREATE TABLE IF NOT EXISTS morrow_inquiries (
  id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL CHECK (length(name) BETWEEN 2 AND 80),
  email text NOT NULL CHECK (length(email) BETWEEN 3 AND 254),
  message text NOT NULL CHECK (length(message) BETWEEN 5 AND 1000)
);
