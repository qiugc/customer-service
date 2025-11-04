const TestExecutionRepository = require('../repositories/TestExecutionRepository');
const TestCaseRepository = require('../repositories/TestCaseRepository');
const { AppError } = require('../utils/errors');

class TestExecutionService {
    constructor(database) {
        this.testExecutionRepository = new TestExecutionRepository(database);
        this.testCaseRepository = new TestCaseRepository(database);
    }

    async executeTestCase(testCaseId, executionData) {
        if (!testCaseId || typeof testCaseId !== 'number') {
            throw new AppError('测试用例ID不能为空且必须是数字', 400);
        }
        if (!executionData || !executionData.status) {
            throw new AppError('执行状态不能为空', 400);
        }
        if (!executionData.executed_by) {
            throw new AppError('执行人员不能为空', 400);
        }
        try {
            // 检查测试用例是否存在
            const testCase = await this.testCaseRepository.getTestCase(testCaseId);
            if (!testCase) {
                throw new AppError('测试用例不存在', 404);
            }
            // 创建执行记录
            const execution = await this.testExecutionRepository.createTestExecution({
                test_case_id: testCaseId,
                status: executionData.status,
                executed_by: executionData.executed_by,
                notes: executionData.notes || '',
                defect_id: executionData.defect_id || null
            });
            // 更新测试用例状态
            await this.testCaseRepository.updateTestCase(testCaseId, {
                status: executionData.status,
                executed_by: executionData.executed_by,
                executed_at: new Date().toISOString()
            });
            return execution;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('执行测试用例失败', 500, error.message);
        }
    }

    async getTestExecutions(testCaseId) {
        if (!testCaseId || typeof testCaseId !== 'number') {
            throw new AppError('测试用例ID不能为空且必须是数字', 400);
        }
        try {
            // 检查测试用例是否存在
            const testCase = await this.testCaseRepository.getTestCase(testCaseId);
            if (!testCase) {
                throw new AppError('测试用例不存在', 404);
            }
            return await this.testExecutionRepository.getTestExecutions(testCaseId);
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('获取测试执行记录失败', 500, error.message);
        }
    }

    async getExecutionHistory(projectId) {
        if (!projectId || typeof projectId !== 'number') {
            throw new AppError('项目ID不能为空且必须是数字', 400);
        }
        try {
            return await this.testExecutionRepository.getExecutionHistory(projectId);
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('获取执行历史失败', 500, error.message);
        }
    }
}

module.exports = TestExecutionService;