-- Run this script in the Supabase SQL Editor to create the tables.

CREATE TYPE user_role AS ENUM ('STUDENT', 'ADMIN');
CREATE TYPE mentorship_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED');
CREATE TYPE project_status AS ENUM ('SUBMITTED', 'MENTOR_APPROVED', 'ADMIN_APPROVED', 'REJECTED', 'CHANGES_REQUESTED');

CREATE TABLE "User" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" TEXT UNIQUE NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" user_role DEFAULT 'STUDENT',
    "bio" TEXT,
    "isAcceptingMentees" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE "Skill" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT UNIQUE NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE "UserSkill" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "skillId" UUID NOT NULL REFERENCES "Skill"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE("userId", "skillId")
);
