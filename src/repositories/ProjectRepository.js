const Project = require('../models/Project');

class ProjectRepository {
    constructor(database) {
        this.db = database;
    }

    async createProject(projectData) {
        return new Promise((resolve, reject) => {
            const { name, version, description } = projectData;
            const sql = `INSERT INTO projects (name, version, description) VALUES (?, ?, ?)`;
            
            this.db.run(sql, [name, version, description], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(new Project(this.lastID, name, version, description, null, null));
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
                    resolve(rows.map(row => Project.fromDatabase(row)));
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
                } else if (!row) {
                    resolve(null);
                } else {
                    resolve(Project.fromDatabase(row));
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
}

module.exports = ProjectRepository;