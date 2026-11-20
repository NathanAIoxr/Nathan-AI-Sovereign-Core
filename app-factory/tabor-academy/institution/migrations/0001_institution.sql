-- Tabor Academy D1 Relational Schema
-- Author: Talking Mammal Nathan Tabor

PRAGMA foreign_keys = ON;

-- Pillar 1: Curriculum
CREATE TABLE IF NOT EXISTS curricula (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    grade_band TEXT NOT NULL,
    standards_json TEXT NOT NULL,
    graduation_requirements TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Pillar 2: Syllabus
CREATE TABLE IF NOT EXISTS syllabi (
    id TEXT PRIMARY KEY,
    curriculum_id TEXT NOT NULL,
    course_code TEXT NOT NULL,
    course_title TEXT NOT NULL,
    instructor TEXT NOT NULL,
    grading_weights_json TEXT NOT NULL,
    policies_text TEXT NOT NULL,
    weekly_schedule TEXT NOT NULL,
    credits REAL NOT NULL DEFAULT 0 CHECK(credits >= 0),
    FOREIGN KEY (curriculum_id) REFERENCES curricula(id)
);

-- Pillar 3: Scope and Sequence
CREATE TABLE IF NOT EXISTS scope_sequence (
    id TEXT PRIMARY KEY,
    syllabus_id TEXT NOT NULL,
    sequence_order INTEGER NOT NULL,
    unit_title TEXT NOT NULL,
    prerequisite_id TEXT,
    target_weeks INTEGER NOT NULL CHECK(target_weeks > 0),
    skill_nodes_json TEXT NOT NULL,
    UNIQUE(syllabus_id, sequence_order),
    FOREIGN KEY (prerequisite_id) REFERENCES scope_sequence(id),
    FOREIGN KEY (syllabus_id) REFERENCES syllabi(id)
);

-- Pillar 4: Lesson Plans
CREATE TABLE IF NOT EXISTS lesson_plans (
    id TEXT PRIMARY KEY,
    scope_id TEXT NOT NULL,
    day_number INTEGER NOT NULL CHECK(day_number > 0),
    duration_minutes INTEGER NOT NULL CHECK(duration_minutes BETWEEN 45 AND 60),
    warm_up_hook TEXT NOT NULL,
    direct_instruction TEXT NOT NULL,
    guided_practice TEXT NOT NULL,
    independent_work TEXT NOT NULL,
    exit_check TEXT NOT NULL,
    FOREIGN KEY (scope_id) REFERENCES scope_sequence(id)
);

-- Pillar 5 & 6: Assessments, Rubrics & Pedagogy
CREATE TABLE IF NOT EXISTS assessments (
    id TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL,
    assessment_type TEXT CHECK(assessment_type IN ('formative', 'summative')) NOT NULL,
    pedagogy_mode TEXT NOT NULL,
    rubric_json TEXT NOT NULL,
    mastery_cutoff REAL NOT NULL DEFAULT 90.0 CHECK(mastery_cutoff BETWEEN 90 AND 100),
    FOREIGN KEY (lesson_id) REFERENCES lesson_plans(id)
);

-- Pillar 7: Instructional Materials & Library (R2 Object Pointers)
CREATE TABLE IF NOT EXISTS library_catalog (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    classification_code TEXT NOT NULL,
    r2_object_key TEXT,
    material_type TEXT NOT NULL,
    public_url TEXT
);

-- Pillar 8: Student Information System (SIS) & Transcripts
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    enrollment_date TEXT NOT NULL,
    status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS transcript_ledger (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    syllabus_id TEXT NOT NULL,
    assessment_id TEXT NOT NULL REFERENCES assessments(id),
    score REAL NOT NULL CHECK(score BETWEEN 90 AND 100),
    mastery_achieved INTEGER CHECK(mastery_achieved = 1) NOT NULL,
    credits_earned REAL NOT NULL CHECK(credits_earned >= 0),
    recorded_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, assessment_id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (syllabus_id) REFERENCES syllabi(id)
);

-- Pillar 9: Governance & Compliance Logs
CREATE TABLE IF NOT EXISTS governance_records (
    id TEXT PRIMARY KEY,
    record_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    effective_date TEXT NOT NULL,
    is_public INTEGER NOT NULL DEFAULT 0 CHECK(is_public IN (0, 1))
);

CREATE TABLE IF NOT EXISTS attendance (
    student_id TEXT NOT NULL REFERENCES students(id),
    syllabus_id TEXT NOT NULL REFERENCES syllabi(id),
    session_date TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('present','absent','excused')),
    PRIMARY KEY (student_id, syllabus_id, session_date)
);

CREATE TRIGGER IF NOT EXISTS transcript_no_update
BEFORE UPDATE ON transcript_ledger BEGIN
    SELECT RAISE(ABORT, 'Transcript ledger rows are append-only');
END;

CREATE TRIGGER IF NOT EXISTS transcript_no_delete
BEFORE DELETE ON transcript_ledger BEGIN
    SELECT RAISE(ABORT, 'Transcript ledger rows are append-only');
END;
