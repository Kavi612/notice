-- PostgreSQL Schema for Department Notice Board

-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main Notices Table
CREATE TABLE IF NOT EXISTS notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    department VARCHAR(100) NOT NULL DEFAULT 'All Departments',
    author_id VARCHAR(255) NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    author_role VARCHAR(50) NOT NULL,
    target_roles TEXT[] NOT NULL DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
    priority VARCHAR(20) NOT NULL DEFAULT 'REGULAR',
    category VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    notice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Backward-compatible column additions for existing tables
ALTER TABLE notices ADD COLUMN IF NOT EXISTS author_id VARCHAR(255);
ALTER TABLE notices ADD COLUMN IF NOT EXISTS author_name VARCHAR(255);
ALTER TABLE notices ADD COLUMN IF NOT EXISTS author_role VARCHAR(50);
ALTER TABLE notices ADD COLUMN IF NOT EXISTS target_roles TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE notices ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED';
ALTER TABLE notices ADD COLUMN IF NOT EXISTS priority VARCHAR(20) NOT NULL DEFAULT 'REGULAR';
ALTER TABLE notices ADD COLUMN IF NOT EXISTS category VARCHAR(50) NOT NULL DEFAULT 'GENERAL';
ALTER TABLE notices ADD COLUMN IF NOT EXISTS notice_date DATE NOT NULL DEFAULT CURRENT_DATE;

-- Performance and Query Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_notices_department ON notices (department);
CREATE INDEX IF NOT EXISTS idx_notices_created_at ON notices (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notices_author_id ON notices (author_id);
CREATE INDEX IF NOT EXISTS idx_notices_status ON notices (status);
CREATE INDEX IF NOT EXISTS idx_notices_target_roles ON notices USING GIN (target_roles);
