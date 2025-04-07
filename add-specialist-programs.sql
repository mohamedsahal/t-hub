-- Add product_type enum value 'specialist_program'
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'specialist_program';

-- Create specialist_programs table
CREATE TABLE IF NOT EXISTS specialist_programs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  price DOUBLE PRECISION NOT NULL,
  duration INTEGER NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE NOT NULL,
  has_discounted BOOLEAN DEFAULT FALSE,
  discounted_price DOUBLE PRECISION,
  discount_expiry_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create specialist_program_courses junction table
CREATE TABLE IF NOT EXISTS specialist_program_courses (
  id SERIAL PRIMARY KEY,
  program_id INTEGER NOT NULL REFERENCES specialist_programs(id),
  course_id INTEGER NOT NULL REFERENCES courses(id),
  "order" INTEGER DEFAULT 1 NOT NULL,
  is_required BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create specialist_program_enrollments table
CREATE TABLE IF NOT EXISTS specialist_program_enrollments (
  id SERIAL PRIMARY KEY,
  program_id INTEGER NOT NULL REFERENCES specialist_programs(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  status enrollment_status DEFAULT 'active' NOT NULL,
  enrollment_date TIMESTAMP DEFAULT NOW() NOT NULL,
  completion_date TIMESTAMP,
  payment_id INTEGER
);