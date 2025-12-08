-- Insert page mappings for Ace Handyman Services
-- Franchise ID: 1bd52965-5055-48f3-97df-af529fd4d120

-- First, delete any existing mappings for this franchise
DELETE FROM fdd_item_page_mappings WHERE franchise_slug = 'ace-handyman-services';

-- Insert Items 1-23
INSERT INTO fdd_item_page_mappings (franchise_slug, mapping_type, item_number, label, page_number) VALUES
('ace-handyman-services', 'item', 1, 'Item 1', 8),
('ace-handyman-services', 'item', 2, 'Item 2', 9),
('ace-handyman-services', 'item', 3, 'Item 3', 12),
('ace-handyman-services', 'item', 4, 'Item 4', 13),
('ace-handyman-services', 'item', 5, 'Item 5', 14),
('ace-handyman-services', 'item', 6, 'Item 6', 17),
('ace-handyman-services', 'item', 7, 'Item 7', 19),
('ace-handyman-services', 'item', 8, 'Item 8', 21),
('ace-handyman-services', 'item', 9, 'Item 9', 22),
('ace-handyman-services', 'item', 10, 'Item 10', 23),
('ace-handyman-services', 'item', 11, 'Item 11', 25),
('ace-handyman-services', 'item', 12, 'Item 12', 30),
('ace-handyman-services', 'item', 13, 'Item 13', 32),
('ace-handyman-services', 'item', 14, 'Item 14', 33),
('ace-handyman-services', 'item', 15, 'Item 15', 33),
('ace-handyman-services', 'item', 16, 'Item 16', 33),
('ace-handyman-services', 'item', 17, 'Item 17', 34),
('ace-handyman-services', 'item', 18, 'Item 18', 35),
('ace-handyman-services', 'item', 19, 'Item 19', 61),
('ace-handyman-services', 'item', 20, 'Item 20', 64),
('ace-handyman-services', 'item', 21, 'Item 21', 65),
('ace-handyman-services', 'item', 22, 'Item 22', 66),
('ace-handyman-services', 'item', 23, 'Item 23', 67);

-- Insert Exhibits A-N
INSERT INTO fdd_item_page_mappings (franchise_slug, mapping_type, item_number, label, page_number) VALUES
('ace-handyman-services', 'exhibit', 1, 'Exhibit A - Franchise Agreement with Exhibits', 69),
('ace-handyman-services', 'exhibit', 2, 'Exhibit B - Nondisclosure and Noncompetition Agreement', 153),
('ace-handyman-services', 'exhibit', 3, 'Exhibit C - Statement of Prospective Franchises', 161),
('ace-handyman-services', 'exhibit', 4, 'Exhibit D - Multi-Territory Addendum to Franchise Agreements', 165),
('ace-handyman-services', 'exhibit', 5, 'Exhibit E - Form of Successor Franchise Rider to Franchise Agreement', 169),
('ace-handyman-services', 'exhibit', 6, 'Exhibit F - Current Form of General Release', 174),
('ace-handyman-services', 'exhibit', 7, 'Exhibit G - Operations Manual Table of Contents', 177),
('ace-handyman-services', 'exhibit', 8, 'Exhibit H - List of Franchisees', 182),
('ace-handyman-services', 'exhibit', 9, 'Exhibit I - List of Franchisees Who Have Left the System', 193),
('ace-handyman-services', 'exhibit', 10, 'Exhibit J - Financial Statements', 195),
('ace-handyman-services', 'exhibit', 11, 'Exhibit K - List of State Franchise Administrators and Agents for Service of Process', 235),
('ace-handyman-services', 'exhibit', 12, 'Exhibit L - State Specific Addendum to Disclosure Document', 239),
('ace-handyman-services', 'exhibit', 13, 'Exhibit M - AHF Data Collection Agreement', 251),
('ace-handyman-services', 'exhibit', 14, 'Exhibit N - IGX Participation Agreement', 255);

-- Insert Quick Links
INSERT INTO fdd_item_page_mappings (franchise_slug, mapping_type, item_number, label, page_number) VALUES
('ace-handyman-services', 'quick_link', 1, 'Cover', 1),
('ace-handyman-services', 'quick_link', 2, 'Table of Contents', 7),
('ace-handyman-services', 'quick_link', 3, 'Item 19', 61),
('ace-handyman-services', 'quick_link', 4, 'Financial Statements', 67),
('ace-handyman-services', 'quick_link', 5, 'Exhibits', 69);
