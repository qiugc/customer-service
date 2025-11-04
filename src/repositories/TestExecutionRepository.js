const TestExecution = require('../models/TestExecution');

class TestExecutionRepository {
    constructor(database) {
        this.db = database;
    }

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
                    resolve(new TestExecution(
                        this.lastID, test_case_id, status, executed_by, null, notes, defect_id
                    ));
                }
            });
        });
    }

    async updateTestExecution(id, updateData) {
        return new Promise((resolve, reject) => {
            const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
            const values = Object.values(updateData);
            values.push(id);

            const sql = `UPDATE test_executions SET ${fields} WHERE id = ?`;
            
            this.db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    async getTestExecution(id) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM test_executions WHERE id = ?`;
            
            this.db.get(sql, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else if (!row) {
                    resolve(null);
                } else {
                    resolve(TestExecution.fromDatabase(row));
                }
            });
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
                    resolve(rows.map(row => TestExecution.fromDatabase(row)));
                }
            });
        });
    }

    async getExecutionHistory(projectId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT te.*, tc.title as test_case_title, tc.case_id as test_case_id
                FROM test_executions te 
                LEFT JOIN test_cases tc ON te.test_case_id = tc.id
                WHERE tc.project_id = ? 
                ORDER BY te.executed_at DESC
            `;
            
            this.db.all(sql, [projectId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map(row => ({
                        ...TestExecution.fromDatabase(row).toJSON(),
                        testCaseTitle: row.test_case_title,
                        testCaseId: row.test_case_id
                    })));
                }
            });
        });
    }
}

module.exports = TestExecutionRepository;