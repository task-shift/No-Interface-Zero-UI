-- Create verification table
CREATE TABLE IF NOT EXISTS verification (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    token TEXT,
    status VARCHAR(50),
    date_created DATE DEFAULT CURRENT_DATE,
    time_created TIME DEFAULT CURRENT_TIME
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_email ON verification(email);

-- Create index on token for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_token ON verification(token);

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_verification_status ON verification(status);