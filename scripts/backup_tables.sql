-- backup_tables.sql
-- Backup tables before deletion

-- Create backup schema
CREATE SCHEMA IF NOT EXISTS backup_schema;

-- Backup Customer table (98 rows)
CREATE TABLE backup_schema."Customer_backup" AS 
SELECT * FROM "Customer";

-- Backup Post table (1 row)  
CREATE TABLE backup_schema."Post_backup" AS 
SELECT * FROM "Post";

-- Backup VenueToVenueType table (38 rows)
CREATE TABLE backup_schema."VenueToVenueType_backup" AS 
SELECT * FROM "VenueToVenueType";

-- Export data to verify backup
\copy backup_schema."Customer_backup" TO 'customer_backup.csv' WITH CSV HEADER;
\copy backup_schema."Post_backup" TO 'post_backup.csv' WITH CSV HEADER;
\copy backup_schema."VenueToVenueType_backup" TO 'venue_relationship_backup.csv' WITH CSV HEADER;

SELECT 'Backup completed' AS status; 