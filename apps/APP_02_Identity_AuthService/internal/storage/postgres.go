// Package storage provides database adapters for the authentication service.
//
// Copyright (c) 2024, The AI Core Infrastructure Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
package storage

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/lib/pq" // PostgreSQL driver
)

// Ensure PostgresStorage implements the AuthStorage interface.
var _ AuthStorage = (*PostgresStorage)(nil)

// User represents a user in the system.
type User struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"password_hash"` // Stored hash, not plain text
	FirstName    string    `json:"first_name"`
	LastName     string    `json:"last_name"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// Role represents a role in the system.
type Role struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Permission represents a specific action or resource access.
type Permission struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// AuthStorage defines the interface for authentication and authorization data storage.
type AuthStorage interface {
	// InitSchema initializes the database schema, creating tables if they don't exist.
	InitSchema(ctx context.Context) error

	// User management
	CreateUser(ctx context.Context, user *User) error
	GetUserByID(ctx context.Context, id string) (*User, error)
	GetUserByEmail(ctx context.Context, email string) (*User, error)
	UpdateUser(ctx context.Context, user *User) error
	DeleteUser(ctx context.Context, id string) error

	// Role management
	CreateRole(ctx context.Context, role *Role) error
	GetRoleByID(ctx context.Context, id string) (*Role, error)
	GetRoleByName(ctx context.Context, name string) (*Role, error)
	UpdateRole(ctx context.Context, role *Role) error
	DeleteRole(ctx context.Context, id string) error
	GetAllRoles(ctx context.Context) ([]Role, error)

	// Permission management
	CreatePermission(ctx context.Context, permission *Permission) error
	GetPermissionByID(ctx context.Context, id string) (*Permission, error)
	GetPermissionByName(ctx context.Context, name string) (*Permission, error)
	UpdatePermission(ctx context.Context, permission *Permission) error
	DeletePermission(ctx context.Context, id string) error
	GetAllPermissions(ctx context.Context) ([]Permission, error)

	// User-Role assignments
	AssignRoleToUser(ctx context.Context, userID, roleID string) error
	RemoveRoleFromUser(ctx context.Context, userID, roleID string) error
	GetUserRoles(ctx context.Context, userID string) ([]Role, error)

	// Role-Permission assignments
	AssignPermissionToRole(ctx context.Context, roleID, permissionID string) error
	RemovePermissionFromRole(ctx context.Context, roleID, permissionID string) error
	GetRolePermissions(ctx context.Context, roleID string) ([]Permission, error)

	// Authorization check
	CheckUserPermission(ctx context.Context, userID, permissionName string) (bool, error)

	// Close closes the database connection.
	Close() error
}

// PostgresStorage implements AuthStorage for PostgreSQL.
type PostgresStorage struct {
	db *sql.DB
}

// NewPostgresStorage creates a new PostgresStorage instance.
// The dsn (Data Source Name) is the connection string for the PostgreSQL database.
func NewPostgresStorage(dsn string) (*PostgresStorage, error) {
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database connection: %w", err)
	}

	// Ping the database to verify the connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err = db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(25)
	db.SetConnMaxLifetime(5 * time.Minute)

	return &PostgresStorage{db: db}, nil
}

// Close closes the underlying database connection.
func (s *PostgresStorage) Close() error {
	return s.db.Close()
}

// InitSchema creates the necessary tables if they do not exist.
func (s *PostgresStorage) InitSchema(ctx context.Context) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction for schema initialization: %w", err)
	}
	defer func() {
		if r := recover(); r != nil {
			_ = tx.Rollback()
			panic(r)
		}
	}()

	// Users table
	_, err = tx.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS users (
			id VARCHAR(255) PRIMARY KEY,
			email VARCHAR(255) UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			first_name VARCHAR(255),
			last_name VARCHAR(255),
			is_active BOOLEAN NOT NULL DEFAULT TRUE,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		);
		CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
	`)
	if err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("failed to create users table: %w", err)
	}

	// Roles table
	_, err = tx.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS roles (
			id VARCHAR(255) PRIMARY KEY,
			name VARCHAR(255) UNIQUE NOT NULL,
			description TEXT,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		);
		CREATE INDEX IF NOT EXISTS idx_roles_name ON roles (name);
	`)
	if err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("failed to create roles table: %w", err)
	}

	// Permissions table
	_, err = tx.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS permissions (
			id VARCHAR(255) PRIMARY KEY,
			name VARCHAR(255) UNIQUE NOT NULL,
			description TEXT,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		);
		CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions (name);
	`)
	if err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("failed to create permissions table: %w", err)
	}

	// User_Roles join table
	_, err = tx.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS user_roles (
			user_id VARCHAR(255) NOT NULL,
			role_id VARCHAR(255) NOT NULL,
			assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			PRIMARY KEY (user_id, role_id),
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
			FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
		);
		CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles (user_id);
		CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles (role_id);
	`)
	if err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("failed to create user_roles table: %w", err)
	}

	// Role_Permissions join table
	_, err = tx.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS role_permissions (
			role_id VARCHAR(255) NOT NULL,
			permission_id VARCHAR(255) NOT NULL,
			assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			PRIMARY KEY (role_id, permission_id),
			FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
			FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
		);
		CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions (role_id);
		CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions (permission_id);
	`)
	if err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("failed to create role_permissions table: %w", err)
	}

	return tx.Commit()
}

// CreateUser inserts a new user into the database.
func (s *PostgresStorage) CreateUser(ctx context.Context, user *User) error {
	query := `
		INSERT INTO users (id, email, password_hash, first_name, last_name, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	now := time.Now().UTC()
	_, err := s.db.ExecContext(ctx, query,
		user.ID, user.Email, user.PasswordHash, user.FirstName, user.LastName, user.IsActive, now, now)
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok && pqErr.Code.Name() == "unique_violation" {
			return fmt.Errorf("%w: user with email '%s' already exists", ErrConflict, user.Email)
		}
		return fmt.Errorf("failed to create user: %w", err)
	}
	user.CreatedAt = now
	user.UpdatedAt = now
	return nil
}

// GetUserByID retrieves a user by their ID.
func (s *PostgresStorage) GetUserByID(ctx context.Context, id string) (*User, error) {
	user := &User{}
	query := `
		SELECT id, email, password_hash, first_name, last_name, is_active, created_at, updated_at
		FROM users WHERE id = $1
	`
	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.FirstName, &user.LastName,
		&user.IsActive, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("%w: user with ID '%s' not found", ErrNotFound, id)
		}
		return nil, fmt.Errorf("failed to get user by ID: %w", err)
	}
	return user, nil
}

// GetUserByEmail retrieves a user by their email address.
func (s *PostgresStorage) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	user := &User{}
	query := `
		SELECT id, email, password_hash, first_name, last_name, is_active, created_at, updated_at
		FROM users WHERE email = $1
	`
	err := s.db.QueryRowContext(ctx, query, email).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.FirstName, &user.LastName,
		&user.IsActive, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("%w: user with email '%s' not found", ErrNotFound, email)
		}
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}
	return user, nil
}

// UpdateUser updates an existing user's information.
func (s *PostgresStorage) UpdateUser(ctx context.Context, user *User) error {
	query := `
		UPDATE users
		SET email = $2, password_hash = $3, first_name = $4, last_name = $5, is_active = $6, updated_at = $7
		WHERE id = $1
	`
	now := time.Now().UTC()
	res, err := s.db.ExecContext(ctx, query,
		user.ID, user.Email, user.PasswordHash, user.FirstName, user.LastName, user.IsActive, now)
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok && pqErr.Code.Name() == "unique_violation" {
			return fmt.Errorf("%w: user with email '%s' already exists", ErrConflict, user.Email)
		}
		return fmt.Errorf("failed to update user: %w", err)
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected after user update: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("%w: user with ID '%s' not found for update", ErrNotFound, user.ID)
	}
	user.UpdatedAt = now
	return nil
}

// DeleteUser deletes a user by their ID.
func (s *PostgresStorage) DeleteUser(ctx context.Context, id string) error {
	query := `DELETE FROM users WHERE id = $1`
	res, err := s.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected after user deletion: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("%w: user with ID '%s' not found for deletion", ErrNotFound, id)
	}
	return nil
}

// CreateRole inserts a new role into the database.
func (s *PostgresStorage) CreateRole(ctx context.Context, role *Role) error {
	query := `
		INSERT INTO roles (id, name, description, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)
	`
	now := time.Now().UTC()
	_, err := s.db.ExecContext(ctx, query, role.ID, role.Name, role.Description, now, now)
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok && pqErr.Code.Name() == "unique_violation" {
			return fmt.Errorf("%w: role with name '%s' already exists", ErrConflict, role.Name)
		}
		return fmt.Errorf("failed to create role: %w", err)
	}
	role.CreatedAt = now
	role.UpdatedAt = now
	return nil
}

// GetRoleByID retrieves a role by its ID.
func (s *PostgresStorage) GetRoleByID(ctx context.Context, id string) (*Role, error) {
	role := &Role{}
	query := `
		SELECT id, name, description, created_at, updated_at
		FROM roles WHERE id = $1
	`
	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&role.ID, &role.Name, &role.Description, &role.CreatedAt, &role.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("%w: role with ID '%s' not found", ErrNotFound, id)
		}
		return nil, fmt.Errorf("failed to get role by ID: %w", err)
	}
	return role, nil
}

// GetRoleByName retrieves a role by its name.
func (s *PostgresStorage) GetRoleByName(ctx context.Context, name string) (*Role, error) {
	role := &Role{}
	query := `
		SELECT id, name, description, created_at, updated_at
		FROM roles WHERE name = $1
	`
	err := s.db.QueryRowContext(ctx, query, name).Scan(
		&role.ID, &role.Name, &role.Description, &role.CreatedAt, &role.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("%w: role with name '%s' not found", ErrNotFound, name)
		}
		return nil, fmt.Errorf("failed to get role by name: %w", err)
	}
	return role, nil
}

// UpdateRole updates an existing role's information.
func (s *PostgresStorage) UpdateRole(ctx context.Context, role *Role) error {
	query := `
		UPDATE roles
		SET name = $2, description = $3, updated_at = $4
		WHERE id = $1
	`
	now := time.Now().UTC()
	res, err := s.db.ExecContext(ctx, query, role.ID, role.Name, role.Description, now)
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok && pqErr.Code.Name() == "unique_violation" {
			return fmt.Errorf("%w: role with name '%s' already exists", ErrConflict, role.Name)
		}
		return fmt.Errorf("failed to update role: %w", err)
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected after role update: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("%w: role with ID '%s' not found for update", ErrNotFound, role.ID)
	}
	role.UpdatedAt = now
	return nil
}

// DeleteRole deletes a role by its ID.
func (s *PostgresStorage) DeleteRole(ctx context.Context, id string) error {
	query := `DELETE FROM roles WHERE id = $1`
	res, err := s.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete role: %w", err)
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected after role deletion: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("%w: role with ID '%s' not found for deletion", ErrNotFound, id)
	}
	return nil
}

// GetAllRoles retrieves all roles from the database.
func (s *PostgresStorage) GetAllRoles(ctx context.Context) ([]Role, error) {
	query := `SELECT id, name, description, created_at, updated_at FROM roles`
	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query all roles: %w", err)
	}
	defer rows.Close()

	var roles []Role
	for rows.Next() {
		var role Role
		if err := rows.Scan(&role.ID, &role.Name, &role.Description, &role.CreatedAt, &role.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan role: %w", err)
		}
		roles = append(roles, role)
	}
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating over roles: %w", err)
	}
	return roles, nil
}

// CreatePermission inserts a new permission into the database.
func (s *PostgresStorage) CreatePermission(ctx context.Context, permission *Permission) error {
	query := `
		INSERT INTO permissions (id, name, description, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)
	`
	now := time.Now().UTC()
	_, err := s.db.ExecContext(ctx, query, permission.ID, permission.Name, permission.Description, now, now)
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok && pqErr.Code.Name() == "unique_violation" {
			return fmt.Errorf("%w: permission with name '%s' already exists", ErrConflict, permission.Name)
		}
		return fmt.Errorf("failed to create permission: %w", err)
	}
	permission.CreatedAt = now
	permission.UpdatedAt = now
	return nil
}

// GetPermissionByID retrieves a permission by its ID.
func (s *PostgresStorage) GetPermissionByID(ctx context.Context, id string) (*Permission, error) {
	permission := &Permission{}
	query := `
		SELECT id, name, description, created_at, updated_at
		FROM permissions WHERE id = $1
	`
	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&permission.ID, &permission.Name, &permission.Description, &permission.CreatedAt, &permission.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("%w: permission with ID '%s' not found", ErrNotFound, id)
		}
		return nil, fmt.Errorf("failed to get permission by ID: %w", err)
	}
	return permission, nil
}

// GetPermissionByName retrieves a permission by its name.
func (s *PostgresStorage) GetPermissionByName(ctx context.Context, name string) (*Permission, error) {
	permission := &Permission{}
	query := `
		SELECT id, name, description, created_at, updated_at
		FROM permissions WHERE name = $1
	`
	err := s.db.QueryRowContext(ctx, query, name).Scan(
		&permission.ID, &permission.Name, &permission.Description, &permission.CreatedAt, &permission.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("%w: permission with name '%s' not found", ErrNotFound, name)
		}
		return nil, fmt.Errorf("failed to get permission by name: %w", err)
	}
	return permission, nil
}

// UpdatePermission updates an existing permission's information.
func (s *PostgresStorage) UpdatePermission(ctx context.Context, permission *Permission) error {
	query := `
		UPDATE permissions
		SET name = $2, description = $3, updated_at = $4
		WHERE id = $1
	`
	now := time.Now().UTC()
	res, err := s.db.ExecContext(ctx, query, permission.ID, permission.Name, permission.Description, now)
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok && pqErr.Code.Name() == "unique_violation" {
			return fmt.Errorf("%w: permission with name '%s' already exists", ErrConflict, permission.Name)
		}
		return fmt.Errorf("failed to update permission: %w", err)
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected after permission update: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("%w: permission with ID '%s' not found for update", ErrNotFound, permission.ID)
	}
	permission.UpdatedAt = now
	return nil
}

// DeletePermission deletes a permission by its ID.
func (s *PostgresStorage) DeletePermission(ctx context.Context, id string) error {
	query := `DELETE FROM permissions WHERE id = $1`
	res, err := s.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete permission: %w", err)
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected after permission deletion: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("%w: permission with ID '%s' not found for deletion", ErrNotFound, id)
	}
	return nil
}

// GetAllPermissions retrieves all permissions from the database.
func (s *PostgresStorage) GetAllPermissions(ctx context.Context) ([]Permission, error) {
	query := `SELECT id, name, description, created_at, updated_at FROM permissions`
	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query all permissions: %w", err)
	}
	defer rows.Close()

	var permissions []Permission
	for rows.Next() {
		var permission Permission
		if err := rows.Scan(&permission.ID, &permission.Name, &permission.Description, &permission.CreatedAt, &permission.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan permission: %w", err)
		}
		permissions = append(permissions, permission)
	}
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating over permissions: %w", err)
	}
	return permissions, nil
}

// AssignRoleToUser assigns a role to a user.
func (s *PostgresStorage) AssignRoleToUser(ctx context.Context, userID, roleID string) error {
	query := `
		INSERT INTO user_roles (user_id, role_id, assigned_at)
		VALUES ($1, $2, $3)
	`
	_, err := s.db.ExecContext(ctx, query, userID, roleID, time.Now().UTC())
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			if pqErr.Code.Name() == "unique_violation" {
				return fmt.Errorf("%w: user '%s' already has role '%s'", ErrConflict, userID, roleID)
			}
			if pqErr.Code.Name() == "foreign_key_violation" {
				return fmt.Errorf("%w: user or role does not exist", ErrNotFound)
			}
		}
		return fmt.Errorf("failed to assign role to user: %w", err)
	}
	return nil
}

// RemoveRoleFromUser removes a role from a user.
func (s *PostgresStorage) RemoveRoleFromUser(ctx context.Context, userID, roleID string) error {
	query := `DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2`
	res, err := s.db.ExecContext(ctx, query, userID, roleID)
	if err != nil {
		return fmt.Errorf("failed to remove role from user: %w", err)
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected after removing role from user: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("%w: user '%s' does not have role '%s'", ErrNotFound, userID, roleID)
	}
	return nil
}

// GetUserRoles retrieves all roles assigned to a specific user.
func (s *PostgresStorage) GetUserRoles(ctx context.Context, userID string) ([]Role, error) {
	query := `
		SELECT r.id, r.name, r.description, r.created_at, r.updated_at
		FROM roles r
		JOIN user_roles ur ON r.id = ur.role_id
		WHERE ur.user_id = $1
	`
	rows, err := s.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query roles for user '%s': %w", userID, err)
	}
	defer rows.Close()

	var roles []Role
	for rows.Next() {
		var role Role
		if err := rows.Scan(&role.ID, &role.Name, &role.Description, &role.CreatedAt, &role.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan role for user '%s': %w", userID, err)
		}
		roles = append(roles, role)
	}
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating over user roles: %w", err)
	}
	return roles, nil
}

// AssignPermissionToRole assigns a permission to a role.
func (s *PostgresStorage) AssignPermissionToRole(ctx context.Context, roleID, permissionID string) error {
	query := `
		INSERT INTO role_permissions (role_id, permission_id, assigned_at)
		VALUES ($1, $2, $3)
	`
	_, err := s.db.ExecContext(ctx, query, roleID, permissionID, time.Now().UTC())
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			if pqErr.Code.Name() == "unique_violation" {
				return fmt.Errorf("%w: role '%s' already has permission '%s'", ErrConflict, roleID, permissionID)
			}
			if pqErr.Code.Name() == "foreign_key_violation" {
				return fmt.Errorf("%w: role or permission does not exist", ErrNotFound)
			}
		}
		return fmt.Errorf("failed to assign permission to role: %w", err)
	}
	return nil
}

// RemovePermissionFromRole removes a permission from a role.
func (s *PostgresStorage) RemovePermissionFromRole(ctx context.Context, roleID, permissionID string) error {
	query := `DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2`
	res, err := s.db.ExecContext(ctx, query, roleID, permissionID)
	if err != nil {
		return fmt.Errorf("failed to remove permission from role: %w", err)
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected after removing permission from role: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("%w: role '%s' does not have permission '%s'", ErrNotFound, roleID, permissionID)
	}
	return nil
}

// GetRolePermissions retrieves all permissions assigned to a specific role.
func (s *PostgresStorage) GetRolePermissions(ctx context.Context, roleID string) ([]Permission, error) {
	query := `
		SELECT p.id, p.name, p.description, p.created_at, p.updated_at
		FROM permissions p
		JOIN role_permissions rp ON p.id = rp.permission_id
		WHERE rp.role_id = $1
	`
	rows, err := s.db.QueryContext(ctx, query, roleID)
	if err != nil {
		return nil, fmt.Errorf("failed to query permissions for role '%s': %w", roleID, err)
	}
	defer rows.Close()

	var permissions []Permission
	for rows.Next() {
		var permission Permission
		if err := rows.Scan(&permission.ID, &permission.Name, &permission.Description, &permission.CreatedAt, &permission.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan permission for role '%s': %w", roleID, err)
		}
		permissions = append(permissions, permission)
	}
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating over role permissions: %w", err)
	}
	return permissions, nil
}

// CheckUserPermission checks if a user has a specific permission.
// This involves joining users, user_roles, roles, role_permissions, and permissions tables.
func (s *PostgresStorage) CheckUserPermission(ctx context.Context, userID, permissionName string) (bool, error) {
	query := `
		SELECT EXISTS (
			SELECT 1
			FROM users u
			JOIN user_roles ur ON u.id = ur.user_id
			JOIN roles r ON ur.role_id = r.id
			JOIN role_permissions rp ON r.id = rp.role_id
			JOIN permissions p ON rp.permission_id = p.id
			WHERE u.id = $1 AND p.name = $2 AND u.is_active = TRUE
		)
	`
	var hasPermission bool
	err := s.db.QueryRowContext(ctx, query, userID, permissionName).Scan(&hasPermission)
	if err != nil {
		return false, fmt.Errorf("failed to check user permission: %w", err)
	}
	return hasPermission, nil
}

// Custom error types for better error handling and API consistency.
var (
	ErrNotFound = fmt.Errorf("resource not found")
	ErrConflict = fmt.Errorf("resource conflict")
)