const TestCaseRepository = require('../repositories/TestCaseRepository');
const TestCaseGenerator = require('../testCaseGenerator');
const DocumentParser = require('../documentParser');
const { AppError } = require('../utils/errors');

class TestCaseService {
    constructor(database) {
        this.testCaseRepository = new TestCaseRepository(database);
        this.testCaseGenerator = new TestCaseGenerator();
        this.documentParser = new DocumentParser();
    }

    async createTestCase(testCaseData) {
        this._validateTestCaseData(testCaseData);
        try {
            return await this.testCaseRepository.createTestCase(testCaseData);
        } catch (error) {
            throw new AppError('创建测试用例失败', 500, error.message);
        }
    }

    async getTestCases(projectId, filters = {}) {
        try {
            return await this.testCaseRepository.getTestCases(projectId, filters);
        } catch (error) {
            throw new AppError('获取测试用例列表失败', 500, error.message);
        }
    }

    async getTestCase(id) {
        try {
            const testCase = await this.testCaseRepository.getTestCase(id);
            if (!testCase) {
                throw new AppError('测试用例不存在', 404);
            }
            return testCase;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('获取测试用例详情失败', 500, error.message);
        }
    }

    async updateTestCase(id, updateData) {
        if (Object.keys(updateData).length === 0) {
            throw new AppError('没有需要更新的字段', 400);
        }
        try {
            const testCase = await this.testCaseRepository.getTestCase(id);
            if (!testCase) {
                throw new AppError('测试用例不存在', 404);
            }
            // 验证更新数据
            this._validateTestCaseData({ ...testCase.toJSON(), ...updateData });
            return await this.testCaseRepository.updateTestCase(id, updateData);
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('更新测试用例失败', 500, error.message);
        }
    }

    async deleteTestCase(id) {
        try {
            const testCase = await this.testCaseRepository.getTestCase(id);
            if (!testCase) {
                throw new AppError('测试用例不存在', 404);
            }
            return await this.testCaseRepository.deleteTestCase(id);
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('删除测试用例失败', 500, error.message);
        }
    }

    async batchImportTestCases(testCases) {
        if (!Array.isArray(testCases) || testCases.length === 0) {
            throw new AppError('测试用例列表不能为空', 400);
        }
        // 验证每个测试用例
        testCases.forEach(testCase => this._validateTestCaseData(testCase));
        try {
            await this.testCaseRepository.batchInsertTestCases(testCases);
            return { count: testCases.length };
        } catch (error) {
            throw new AppError('批量导入测试用例失败', 500, error.message);
        }
    }

    async generateTestCases(documentType, documentContent, projectId, userRequirements = '') {
        if (!documentType || !['txt', 'markdown', 'docx', 'pdf'].includes(documentType)) {
            throw new AppError('无效的文档类型', 400);
        }
        if (!documentContent || typeof documentContent !== 'string') {
            throw new AppError('文档内容不能为空', 400);
        }
        if (!projectId || typeof projectId !== 'number') {
            throw new AppError('项目ID不能为空且必须是数字', 400);
        }
        try {
            // 解析文档
            const parsedText = await this.documentParser.parseDocument(documentType, documentContent);
            // 提取需求
            const requirements = await this.documentParser.extractRequirements(parsedText);
            // 生成测试用例
            const generatedCases = this.testCaseGenerator.generateTestCases(requirements, userRequirements);
            // 准备插入数据库的测试用例
            const testCasesToInsert = generatedCases.map((caseData, index) => ({
                project_id: projectId,
                case_id: `${projectId}-${Date.now()}-${index + 1}`,
                title: caseData.title,
                description: caseData.description,
                type: caseData.type || 'functional',
                priority: caseData.priority || 'P1',
                preconditions: JSON.stringify(caseData.preconditions || []),
                test_steps: JSON.stringify(caseData.steps || []),
                expected_result: caseData.expectedResult,
                test_data: JSON.stringify(caseData.testData || {})
            }));
            // 批量插入数据库
            await this.testCaseRepository.batchInsertTestCases(testCasesToInsert);
            return { count: generatedCases.length, testCases: generatedCases };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('生成测试用例失败', 500, error.message);
        }
    }

    _validateTestCaseData(data) {
        if (!data.project_id || typeof data.project_id !== 'number') {
            throw new AppError('项目ID不能为空且必须是数字', 400);
        }
        if (!data.title || typeof data.title !== 'string') {
            throw new AppError('测试用例标题不能为空且必须是字符串', 400);
        }
        if (!data.test_steps || !Array.isArray(data.test_steps) || data.test_steps.length === 0) {
            throw new AppError('测试步骤不能为空且必须是数组', 400);
        }
        if (!data.expected_result || typeof data.expected_result !== 'string') {
            throw new AppError('预期结果不能为空且必须是字符串', 400);
        }
        // 可选字段验证
        if (data.description && typeof data.description !== 'string') {
            throw new AppError('测试用例描述必须是字符串', 400);
        }
        if (data.type && !['functional', 'non-functional', 'regression', 'smoke', 'security'].includes(data.type)) {
            throw new AppError('测试用例类型无效', 400);
        }
        if (data.priority && !['P0', 'P1', 'P2', 'P3'].includes(data.priority)) {
            throw new AppError('测试用例优先级无效', 400);
        }
        if (data.preconditions && !Array.isArray(data.preconditions)) {
            throw new AppError('前置条件必须是数组', 400);
        }
        if (data.test_data && typeof data.test_data !== 'object') {
            throw new AppError('测试数据必须是对象', 400);
        }
    }
}

module.exports = TestCaseService;