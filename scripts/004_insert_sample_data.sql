-- Sample data for testing the fixture system
-- This script inserts sample teams, tournaments, and basic configuration

-- Insert sample venues
INSERT INTO venues (name, city, country, capacity) VALUES
('Estadio Nacional', 'Santiago', 'Chile', 45000),
('Estadio Monumental', 'Santiago', 'Chile', 47000),
('Estadio San Carlos de Apoquindo', 'Santiago', 'Chile', 20000),
('Estadio Santa Laura', 'Santiago', 'Chile', 22000),
('Estadio Sausalito', 'Viña del Mar', 'Chile', 18000),
('Estadio El Teniente', 'Rancagua', 'Chile', 14000),
('Estadio Municipal de Concepción', 'Concepción', 'Chile', 30000),
('Estadio CAP', 'Talcahuano', 'Chile', 10500);

-- Insert sample teams
INSERT INTO teams (name, short_name, city, country) VALUES
('Club Universidad de Chile', 'U. de Chile', 'Santiago', 'Chile'),
('Club de Fútbol Universidad Católica', 'U. Católica', 'Santiago', 'Chile'),
('Club Social y Deportivo Colo-Colo', 'Colo-Colo', 'Santiago', 'Chile'),
('Club de Deportes Santiago Wanderers', 'Wanderers', 'Valparaíso', 'Chile'),
('Club de Deportes Antofagasta', 'Antofagasta', 'Antofagasta', 'Chile'),
('Club Deportivo Palestino', 'Palestino', 'Santiago', 'Chile'),
('Club de Deportes La Serena', 'La Serena', 'La Serena', 'Chile'),
('Club Deportivo Huachipato', 'Huachipato', 'Talcahuano', 'Chile'),
('Club de Deportes Temuco', 'Temuco', 'Temuco', 'Chile'),
('Club Deportivo Ñublense', 'Ñublense', 'Chillán', 'Chile'),
('Club de Deportes Cobresal', 'Cobresal', 'El Salvador', 'Chile'),
('Club Deportivo O''Higgins', 'O''Higgins', 'Rancagua', 'Chile');

-- Insert sample tournament
INSERT INTO tournaments (name, description, start_date, end_date, status, tournament_type) VALUES
('Campeonato Nacional 2024', 'Torneo de liga con 12 equipos', '2024-03-01', '2024-12-15', 'draft', 'single_phase');

-- Get the tournament ID for the sample tournament
-- Note: In a real application, you would handle this differently
-- For now, we'll create a sample league phase

-- Insert sample league phase
INSERT INTO phases (tournament_id, name, phase_type, phase_order, config, rounds, min_rest_days) 
SELECT 
    t.id,
    'Liga Regular',
    'league',
    1,
    '{"points_for_win": 3, "points_for_draw": 1, "points_for_loss": 0}',
    2, -- Double round robin
    3
FROM tournaments t WHERE t.name = 'Campeonato Nacional 2024';

-- Insert all teams as participants in the league phase
INSERT INTO phase_participants (phase_id, team_id, status)
SELECT 
    p.id,
    t.id,
    'active'
FROM phases p
CROSS JOIN teams t
WHERE p.name = 'Liga Regular';

-- Initialize standings for all teams
INSERT INTO standings (phase_id, team_id, matches_played, wins, draws, losses, goals_for, goals_against, goal_difference, points, position)
SELECT 
    p.id,
    t.id,
    0, 0, 0, 0, 0, 0, 0, 0,
    ROW_NUMBER() OVER (ORDER BY t.name)
FROM phases p
CROSS JOIN teams t
WHERE p.name = 'Liga Regular';

-- Insert some basic tournament rules
INSERT INTO tournament_rules (tournament_id, rule_type, rule_config, is_active)
SELECT 
    t.id,
    'points_system',
    '{"win": 3, "draw": 1, "loss": 0}',
    true
FROM tournaments t WHERE t.name = 'Campeonato Nacional 2024';

INSERT INTO tournament_rules (tournament_id, rule_type, rule_config, is_active)
SELECT 
    t.id,
    'tiebreaker_order',
    '["points", "goal_difference", "goals_for", "head_to_head"]',
    true
FROM tournaments t WHERE t.name = 'Campeonato Nacional 2024';
