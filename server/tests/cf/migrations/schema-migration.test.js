// Tests for database migrations

import { describe, it } from 'mocha';
import { expect } from 'chai';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Database Migrations', function () {
  describe('0001_create_tables.sql', function () {
    let migrationContent;

    before(function () {
      const migrationPath = join(__dirname, '../../../migrations/0001_create_tables.sql');
      migrationContent = readFileSync(migrationPath, 'utf8');
    });

    it('should contain CREATE TABLE statements', function () {
      expect(migrationContent).to.include('CREATE TABLE IF NOT EXISTS users');
      expect(migrationContent).to.include('CREATE TABLE IF NOT EXISTS teams');
      expect(migrationContent).to.include('CREATE TABLE IF NOT EXISTS monitors');
      expect(migrationContent).to.include('CREATE TABLE IF NOT EXISTS checks');
      expect(migrationContent).to.include('CREATE TABLE IF NOT EXISTS notifications');
      expect(migrationContent).to.include('CREATE TABLE IF NOT EXISTS invite_tokens');
      expect(migrationContent).to.include('CREATE TABLE IF NOT EXISTS maintenance_windows');
      expect(migrationContent).to.include('CREATE TABLE IF NOT EXISTS status_pages');
    });

    it('should contain CREATE INDEX statements', function () {
      expect(migrationContent).to.include('CREATE INDEX IF NOT EXISTS');
      expect(migrationContent).to.include('idx_checks_monitorId');
      expect(migrationContent).to.include('idx_users_email');
      expect(migrationContent).to.include('idx_monitors_teamId');
    });

    it('should define proper column types', function () {
      // Check for common column types
      expect(migrationContent).to.include('TEXT PRIMARY KEY');
      expect(migrationContent).to.include('TEXT,');
      expect(migrationContent).to.include('BOOLEAN');
      expect(migrationContent).to.include('INTEGER');
      expect(migrationContent).to.include('REAL');
    });

    it('should define proper constraints', function () {
      // Check for common constraints
      expect(migrationContent).to.include('UNIQUE');
      expect(migrationContent).to.include('PRIMARY KEY');
    });
  });
});