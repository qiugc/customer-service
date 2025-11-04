class TestExecution {
    constructor(id, testCaseId, status, executedBy, executedAt, notes, defectId) {
        this.id = id;
        this.testCaseId = testCaseId;
        this.status = status;
        this.executedBy = executedBy;
        this.executedAt = executedAt;
        this.notes = notes;
        this.defectId = defectId;
    }

    static fromDatabase(row) {
        return new TestExecution(
            row.id,
            row.test_case_id,
            row.status,
            row.executed_by,
            row.executed_at,
            row.notes,
            row.defect_id
        );
    }

    toJSON() {
        return {
            id: this.id,
            testCaseId: this.testCaseId,
            status: this.status,
            executedBy: this.executedBy,
            executedAt: this.executedAt,
            notes: this.notes,
            defectId: this.defectId
        };
    }
}

module.exports = TestExecution;