-- Create course_type enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_type') THEN
        CREATE TYPE course_type AS ENUM ('short_course', 'group_course', 'bootcamp', 'diploma');
    END IF;
END $$;

-- Create exam_type enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exam_type') THEN
        CREATE TYPE exam_type AS ENUM ('quiz', 'midterm', 'final', 're_exam');
    END IF;
END $$;

-- Create exam_status enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exam_status') THEN
        CREATE TYPE exam_status AS ENUM ('pending', 'completed', 'failed', 'passed');
    END IF;
END $$;

-- Create installment_status enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'installment_status') THEN
        CREATE TYPE installment_status AS ENUM ('pending', 'completed', 'failed');
    END IF;
END $$;

-- Create semesters table if it doesn't exist
CREATE TABLE IF NOT EXISTS semesters (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create course_sections table if it doesn't exist
CREATE TABLE IF NOT EXISTS course_sections (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id),
    semester_id INTEGER REFERENCES semesters(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    content_url TEXT,
    video_url TEXT,
    is_published BOOLEAN DEFAULT TRUE,
    unlock_date TIMESTAMP
);

-- Create exams table if it doesn't exist
CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id),
    section_id INTEGER REFERENCES course_sections(id),
    semester_id INTEGER REFERENCES semesters(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    passing_score REAL NOT NULL,
    max_score REAL NOT NULL,
    time_limit INTEGER,
    max_attempts INTEGER DEFAULT 1,
    type exam_type NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create exam_questions table if it doesn't exist
CREATE TABLE IF NOT EXISTS exam_questions (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER NOT NULL REFERENCES exams(id),
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL DEFAULT 'multiple_choice',
    options JSONB,
    correct_answer TEXT,
    points REAL NOT NULL DEFAULT 1.0,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- Create exam_results table if it doesn't exist
CREATE TABLE IF NOT EXISTS exam_results (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER NOT NULL REFERENCES exams(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    score REAL NOT NULL,
    answers JSONB,
    status exam_status NOT NULL,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    graded_by INTEGER REFERENCES users(id),
    graded_at TIMESTAMP,
    feedback TEXT,
    time_spent INTEGER
);