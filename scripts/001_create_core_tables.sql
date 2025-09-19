-- Core tables for the match fixture system
-- This script creates the foundational tables for tournaments, teams, and phases

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    logo_url TEXT,
    stadium VARCHAR(255),
    city VARCHAR(255),
    country VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    tournament_type VARCHAR(50) DEFAULT 'single_phase' CHECK (tournament_type IN ('single_phase', 'multi_phase')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Phases table (eliminatoria, liga, grupos, niveles, combinadas)
CREATE TABLE IF NOT EXISTS phases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phase_type VARCHAR(50) NOT NULL CHECK (phase_type IN ('knockout', 'league', 'groups', 'levels', 'combined')),
    phase_order INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
    
    -- Configuration JSON for phase-specific settings
    config JSONB DEFAULT '{}',
    
    -- Common settings
    home_away_legs INTEGER DEFAULT 1 CHECK (home_away_legs IN (1, 2)), -- 1 = single match, 2 = home/away
    min_rest_days INTEGER DEFAULT 3,
    
    -- League/Groups specific
    rounds INTEGER DEFAULT 1, -- 1 = single round robin, 2 = double round robin
    
    -- Knockout specific
    has_consolation BOOLEAN DEFAULT FALSE,
    
    -- Groups specific
    groups_count INTEGER,
    teams_per_group INTEGER,
    qualified_per_group INTEGER DEFAULT 2,
    
    -- Levels specific
    promoted_per_level INTEGER DEFAULT 2,
    relegated_per_level INTEGER DEFAULT 2,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Groups table (for group phases)
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- Group A, Group B, etc.
    group_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Phase participants (teams in each phase)
CREATE TABLE IF NOT EXISTS phase_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE SET NULL, -- NULL for non-group phases
    seed INTEGER, -- For knockout seeding
    level_number INTEGER, -- For level-based phases
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'eliminated', 'withdrawn')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(phase_id, team_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_phases_tournament_id ON phases(tournament_id);
CREATE INDEX IF NOT EXISTS idx_groups_phase_id ON groups(phase_id);
CREATE INDEX IF NOT EXISTS idx_phase_participants_phase_id ON phase_participants(phase_id);
CREATE INDEX IF NOT EXISTS idx_phase_participants_team_id ON phase_participants(team_id);
CREATE INDEX IF NOT EXISTS idx_phase_participants_group_id ON phase_participants(group_id);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_phases_updated_at BEFORE UPDATE ON phases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
