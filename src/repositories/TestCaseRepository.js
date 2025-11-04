const TestCase = require('../models/TestCase');

class TestCaseRepository {
    constructor(database) {
        this.db = database;
    }

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
                    resolve(new TestCase(
                        this.lastID, project_id, case_id, title, description, 
                        type, priority, JSON.parse(preconditions || '[]'), 
                        JSON.parse(test_steps || '[]'), expected_result, 
                        JSON.parse(test_data || '{}'), 'pending', null, null, 
                        null, null, null
                    ));
                }
            });
        });
    }

    async batchInsertTestCases(testCases) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO test_cases 
                (project_id, case_id, title, description, type, priority, 
                 preconditions, test_steps, expected_result, test_data)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            this.db.serialize(() => {
                this.db.run('BEGIN TRANSACTION');
                const stmt = this.db.prepare(sql);
                
                testCases.forEach(testCase => {
                    stmt.run([
                        testCase.project_id, testCase.case_id, testCase.title, 
                        testCase.description, testCase.type, testCase.priority, 
                        testCase.preconditions, testCase.test_steps, 
                        testCase.expected_result, testCase.test_data
                    ]);
                });
                
                stmt.finalize();
                this.db.run('COMMIT', (err) => {
                    if (err) {
                        this.db.run('ROLLBACK');
                        reject(err);
                    } else {
                        resolve();
                    }
                });
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
                    resolve(rows.map(row => TestCase.fromDatabase(row)));
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
                } else if (!row) {
                    resolve(null);
                } else {
                    resolve(TestCase.fromDatabase(row));
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
}

module.exports = TestCaseRepository;