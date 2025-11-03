const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, '..', 'data', 'testcases.db');
        this.db = null;
    }

    async init() {
        try {
            // 确保数据目录存在
            await fs.ensureDir(path.dirname(this.dbPath));
            
            // 连接数据库
            this.db = new sqlite3.Database(this.dbPath);
            
            // 创建表
            await this.createTables();
            
            console.log('数据库初始化成功');
        } catch (error) {
            console.error('数据库初始化失败:', error);
            throw error;
        }
    }

    createTables() {
        return new Promise((resolve, reject) => {
            const sql = `
                -- 项目表
                CREATE TABLE IF NOT EXISTS projects (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    version TEXT,
                    description TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                -- 测试用例表
                CREATE TABLE IF NOT EXISTS test_cases (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_id INTEGER,
                    case_id TEXT UNIQUE NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT,
                    type TEXT NOT NULL,
                    priority TEXT NOT NULL,
                    preconditions TEXT,
                    test_steps TEXT,
                    expected_result TEXT,
                    test_data TEXT,
                    status TEXT DEFAULT 'pending',
                    executed_by TEXT,
                    executed_at DATETIME,
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (project_id) REFERENCES projects (id)
                );

                -- 测试执行记录表
                CREATE TABLE IF NOT EXISTS test_executions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    test_case_id INTEGER,
                    status TEXT NOT NULL,
                    executed_by TEXT NOT NULL,
                    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    notes TEXT,
                    defect_id TEXT,
                    FOREIGN KEY (test_case_id) REFERENCES test_cases (id)
                );

                -- 需求文档表
                CREATE TABLE IF NOT EXISTS requirements (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_id INTEGER,
                    filename TEXT NOT NULL,
                    content TEXT,
                    parsed_data TEXT,
                    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (project_id) REFERENCES projects (id)
                );
            `;

            this.db.exec(sql, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    // 项目相关操作
    async createProject(projectData) {
        return new Promise((resolve, reject) => {
            const { name, version, description } = projectData;
            const sql = `INSERT INTO projects (name, version, description) VALUES (?, ?, ?)`;
            
            this.db.run(sql, [name, version, description], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, ...projectData });
                }
            });
        });
    }

    async getProjects() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM projects ORDER BY created_at DESC`;
            
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async getProject(id) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM projects WHERE id = ?`;
            
            this.db.get(sql, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async updateProject(id, updateData) {
        return new Promise((resolve, reject) => {
            const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
            const values = Object.values(updateData);
            values.push(id);

            const sql = `UPDATE projects SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
            
            this.db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    async deleteProject(id) {
        return new Promise((resolve, reject) => {
            // 首先检查项目下是否有测试用例
            const checkSql = `SELECT COUNT(*) as count FROM test_cases WHERE project_id = ?`;
            
            this.db.get(checkSql, [id], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (row.count > 0) {
                    reject(new Error('无法删除项目：项目下还有测试用例，请先删除所有测试用例'));
                    return;
                }
                
                // 如果没有测试用例，则删除项目
                const deleteSql = `DELETE FROM projects WHERE id = ?`;
                this.db.run(deleteSql, [id], function(deleteErr) {
                    if (deleteErr) {
                        reject(deleteErr);
                    } else {
                        resolve({ changes: this.changes });
                    }
                });
            });
        });
    }

    // 测试用例相关操作
    async createTestCase(testCaseData) {
        return new Promise((resolve, reject) => {
            const {
                project_id, case_id, title, description, type, priority,
                preconditions, test_steps, expected_result, test_data
            } = testCaseData;
            
            const sql = `
                INSERT INTO test_cases 
                (project_id, case_id, title, description, type, priority, 
                 preconditions, test_steps, expected_result, test_data)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            this.db.run(sql, [
                project_id, case_id, title, description, type, priority,
                preconditions, test_steps, expected_result, test_data
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, ...testCaseData });
                }
            });
        });
    }

    async getTestCases(projectId, filters = {}) {
        return new Promise((resolve, reject) => {
            let sql = `
                SELECT tc.*, p.name as project_name 
                FROM test_cases tc 
                LEFT JOIN projects p ON tc.project_id = p.id
                WHERE 1=1
            `;
            const params = [];

            if (projectId) {
                sql += ` AND tc.project_id = ?`;
                params.push(projectId);
            }

            if (filters.type) {
                sql += ` AND tc.type = ?`;
                params.push(filters.type);
            }

            if (filters.priority) {
                sql += ` AND tc.priority = ?`;
                params.push(filters.priority);
            }

            if (filters.status) {
                sql += ` AND tc.status = ?`;
                params.push(filters.status);
            }

            sql += ` ORDER BY tc.created_at DESC`;

            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async getTestCase(id) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT tc.*, p.name as project_name 
                FROM test_cases tc 
                LEFT JOIN projects p ON tc.project_id = p.id
                WHERE tc.id = ?
            `;
            
            this.db.get(sql, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async updateTestCase(id, updateData) {
        return new Promise((resolve, reject) => {
            const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
            const values = Object.values(updateData);
            values.push(id);

            const sql = `UPDATE test_cases SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
            
            this.db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    async deleteTestCase(id) {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM test_cases WHERE id = ?`;
            
            this.db.run(sql, [id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    // 测试执行记录相关操作
    async createTestExecution(executionData) {
        return new Promise((resolve, reject) => {
            const { test_case_id, status, executed_by, notes, defect_id } = executionData;
            const sql = `
                INSERT INTO test_executions 
                (test_case_id, status, executed_by, notes, defect_id)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            this.db.run(sql, [test_case_id, status, executed_by, notes, defect_id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    // 同时更新测试用例的状态
                    const updateSql = `
                        UPDATE test_cases 
                        SET status = ?, executed_by = ?, executed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `;
                    
                    this.db.run(updateSql, [status, executed_by, test_case_id], (updateErr) => {
                        if (updateErr) {
                            reject(updateErr);
                        } else {
                            resolve({ id: this.lastID, ...executionData });
                        }
                    });
                }
            }.bind(this));
        });
    }

    async getTestExecutions(testCaseId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM test_executions 
                WHERE test_case_id = ? 
                ORDER BY executed_at DESC
            `;
            
            this.db.all(sql, [testCaseId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // 统计相关操作
    async getProjectStats(projectId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    COUNT(*) as total_cases,
                    SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as passed_cases,
                    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_cases,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_cases,
                    SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked_cases
                FROM test_cases 
                WHERE project_id = ?
            `;
            
            this.db.get(sql, [projectId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async close() {
        if (this.db) {
            return new Promise((resolve) => {
                this.db.close((err) => {
                    if (err) {
                        console.error('关闭数据库时出错:', err);
                    }
                    resolve();
                });
            });
        }
    }
}

module.exports = Database;