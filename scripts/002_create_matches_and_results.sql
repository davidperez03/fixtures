-- Matches and results tables
-- This script creates tables for fixtures, matches, and results

-- Venues/Stadiums table
CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255),
    country VARCHAR(255),
    capacity INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table (fixtures)
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
    
    -- Teams
    home_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    away_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    
    -- Match details
    match_date TIMESTAMP WITH TIME ZONE,
    venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
    round_number INTEGER,
    match_number INTEGER, -- For ordering within round
    
    -- Match type and status
    match_type VARCHAR(50) DEFAULT 'regular' CHECK (match_type IN ('regular', 'playoff', 'final', 'consolation')),
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'postponed', 'cancelled')),
    
    -- Results
    home_score INTEGER,
    away_score INTEGER,
    
    -- Extra time and penalties (for knockout matches)
    home_score_et INTEGER, -- Extra time
    away_score_et INTEGER,
    home_score_pen INTEGER, -- Penalties
    away_score_pen INTEGER,
    
    -- Winner determination
    winner_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    
    -- Special cases
    is_bye BOOLEAN DEFAULT FALSE, -- For odd number of teams
    walkover BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CHECK (home_team_id != away_team_id OR is_bye = TRUE),
    CHECK (is_bye = FALSE OR away_team_id IS NULL)
);

-- Match events table (goals, cards, substitutions, etc.)
CREATE TABLE IF NOT EXISTS match_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    player_name VARCHAR(255), -- Simplified - no player table for now
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('goal', 'yellow_card', 'red_card', 'substitution', 'other')),
    minute INTEGER,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Standings table (for league and group phases)
CREATE TABLE IF NOT EXISTS standings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Statistics
    matches_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    goal_difference INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    
    -- Position
    position INTEGER,
    
    -- Tiebreaker data
    head_to_head_points INTEGER DEFAULT 0,
    head_to_head_goal_diff INTEGER DEFAULT 0,
    fair_play_points INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(phase_id, group_id, team_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_matches_phase_id ON matches(phase_id);
CREATE INDEX IF NOT EXISTS idx_matches_group_id ON matches(group_id);
CREATE INDEX IF NOT EXISTS idx_matches_home_team ON matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team ON matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_match_events_match_id ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_standings_phase_id ON standings(phase_id);
CREATE INDEX IF NOT EXISTS idx_standings_group_id ON standings(group_id);
CREATE INDEX IF NOT EXISTS idx_standings_team_id ON standings(team_id);

-- Add triggers for updated_at
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_standings_updated_at BEFORE UPDATE ON standings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
