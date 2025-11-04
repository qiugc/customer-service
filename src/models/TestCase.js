class TestCase {
    constructor(id, projectId, caseId, title, description, type, priority, preconditions, testSteps, expectedResult, testData, status, executedBy, executedAt, notes, createdAt, updatedAt) {
        this.id = id;
        this.projectId = projectId;
        this.caseId = caseId;
        this.title = title;
        this.description = description;
        this.type = type;
        this.priority = priority;
        this.preconditions = preconditions;
        this.testSteps = testSteps;
        this.expectedResult = expectedResult;
        this.testData = testData;
        this.status = status;
        this.executedBy = executedBy;
        this.executedAt = executedAt;
        this.notes = notes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    static fromDatabase(row) {
        return new TestCase(
            row.id,
            row.project_id,
            row.case_id,
            row.title,
            row.description,
            row.type,
            row.priority,
            row.preconditions ? JSON.parse(row.preconditions) : [],
            row.test_steps ? JSON.parse(row.test_steps) : [],
            row.test_data ? JSON.parse(row.test_data) : {},
            row.status,
            row.executed_by,
            row.executed_at,
            row.notes,
            row.created_at,
            row.updated_at
        );
    }

    toJSON() {
        return {
            id: this.id,
            projectId: this.projectId,
            caseId: this.caseId,
            title: this.title,
            description: this.description,
            type: this.type,
            priority: this.priority,
            preconditions: this.preconditions,
            testSteps: this.testSteps,
            expectedResult: this.expectedResult,
            testData: this.testData,
            status: this.status,
            executedBy: this.executedBy,
            executedAt: this.executedAt,
            notes: this.notes,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = TestCase;