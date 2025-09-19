-- Rules and constraints tables
-- This script creates tables for tournament rules, scheduling constraints, and validation

-- Tournament rules table
CREATE TABLE IF NOT EXISTS tournament_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    phase_id UUID REFERENCES phases(id) ON DELETE CASCADE, -- NULL = applies to whole tournament
    
    -- Rule configuration
    rule_type VARCHAR(100) NOT NULL,
    rule_config JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scheduling constraints table
CREATE TABLE IF NOT EXISTS scheduling_constraints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    
    -- Constraint type and details
    constraint_type VARCHAR(100) NOT NULL CHECK (constraint_type IN (
        'venue_availability', 'team_rest_days', 'no_consecutive_home_away', 
        'blackout_dates', 'preferred_times', 'venue_conflicts'
    )),
    
    -- Affected entities
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    
    -- Constraint configuration
    constraint_config JSONB NOT NULL DEFAULT '{}',
    priority INTEGER DEFAULT 1, -- 1 = highest priority
    is_hard_constraint BOOLEAN DEFAULT TRUE, -- TRUE = must be satisfied, FALSE = preferred
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Phase transitions table (for multi-phase tournaments)
CREATE TABLE IF NOT EXISTS phase_transitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
    to_phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
    
    -- Qualification rules
    qualification_type VARCHAR(50) NOT NULL CHECK (qualification_type IN (
        'top_n', 'bottom_n', 'winners', 'runners_up', 'best_third', 'all'
    )),
    qualification_count INTEGER, -- How many teams qualify
    
    -- Additional criteria
    criteria_config JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(from_phase_id, to_phase_id)
);

-- Fixture generation log table (for tracking and debugging)
CREATE TABLE IF NOT EXISTS fixture_generation_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
    
    -- Generation details
    algorithm_used VARCHAR(100),
    generation_status VARCHAR(50) CHECK (generation_status IN ('success', 'failed', 'partial')),
    
    -- Metrics
    total_matches INTEGER,
    constraints_satisfied INTEGER,
    constraints_violated INTEGER,
    generation_time_ms INTEGER,
    
    -- Details
    error_message TEXT,
    generation_config JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tournament_rules_tournament_id ON tournament_rules(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_rules_phase_id ON tournament_rules(phase_id);
CREATE INDEX IF NOT EXISTS idx_scheduling_constraints_tournament_id ON scheduling_constraints(tournament_id);
CREATE INDEX IF NOT EXISTS idx_scheduling_constraints_team_id ON scheduling_constraints(team_id);
CREATE INDEX IF NOT EXISTS idx_scheduling_constraints_venue_id ON scheduling_constraints(venue_id);
CREATE INDEX IF NOT EXISTS idx_phase_transitions_from_phase ON phase_transitions(from_phase_id);
CREATE INDEX IF NOT EXISTS idx_phase_transitions_to_phase ON phase_transitions(to_phase_id);
CREATE INDEX IF NOT EXISTS idx_fixture_generation_log_phase_id ON fixture_generation_log(phase_id);

-- Add triggers for updated_at
CREATE TRIGGER update_tournament_rules_updated_at BEFORE UPDATE ON tournament_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
