const { catchAsync } = require('./utils/errors');
const ProjectService = require('./services/ProjectService');
const TestCaseService = require('./services/TestCaseService');
const TestExecutionService = require('./services/TestExecutionService');
const config = require('../config');

class TestController {
    constructor(database) {
        this.projectService = new ProjectService(database);
        this.testCaseService = new TestCaseService(database);
        this.testExecutionService = new TestExecutionService(database);
    }

    // 项目管理
    createProject = catchAsync(async (req, res) => {
        const project = await this.projectService.createProject(req.body);
        res.status(201).json({ success: true, data: project });
    });

    getProjects = catchAsync(async (req, res) => {
        const projects = await this.projectService.getProjects();
        res.status(200).json({ success: true, data: projects });
    });

    getProject = catchAsync(async (req, res) => {
        const id = parseInt(req.params.id);
        const project = await this.projectService.getProject(id);
        res.status(200).json({ success: true, data: project });
    });

    updateProject = catchAsync(async (req, res) => {
        const id = parseInt(req.params.id);
        const result = await this.projectService.updateProject(id, req.body);
        res.status(200).json({ success: true, data: result });
    });

    deleteProject = catchAsync(async (req, res) => {
        const id = parseInt(req.params.id);
        const result = await this.projectService.deleteProject(id);
        res.status(200).json({ success: true, data: result });
    });

    getProjectStats = catchAsync(async (req, res) => {
        const projectId = parseInt(req.params.id);
        const stats = await this.projectService.getProjectStats(projectId);
        res.status(200).json({ success: true, data: stats });
    });

    // 测试用例管理
    createTestCase = catchAsync(async (req, res) => {
        const testCase = await this.testCaseService.createTestCase(req.body);
        res.status(201).json({ success: true, data: testCase });
    });

    getTestCases = catchAsync(async (req, res) => {
        const projectId = req.query.projectId ? parseInt(req.query.projectId) : null;
        const filters = {
            type: req.query.type,
            priority: req.query.priority,
            status: req.query.status
        };
        const testCases = await this.testCaseService.getTestCases(projectId, filters);
        res.status(200).json({ success: true, data: testCases });
    });

    getTestCase = catchAsync(async (req, res) => {
        const id = parseInt(req.params.id);
        const testCase = await this.testCaseService.getTestCase(id);
        res.status(200).json({ success: true, data: testCase });
    });

    updateTestCase = catchAsync(async (req, res) => {
        const id = parseInt(req.params.id);
        const result = await this.testCaseService.updateTestCase(id, req.body);
        res.status(200).json({ success: true, data: result });
    });

    deleteTestCase = catchAsync(async (req, res) => {
        const id = parseInt(req.params.id);
        const result = await this.testCaseService.deleteTestCase(id);
        res.status(200).json({ success: true, data: result });
    });

    batchImportTestCases = catchAsync(async (req, res) => {
        if (!req.body.testCases || !Array.isArray(req.body.testCases)) {
            res.status(400).json({ success: false, error: '测试用例列表不能为空' });
            return;
        }
        const result = await this.testCaseService.batchImportTestCases(req.body.testCases);
        res.status(201).json({ success: true, data: result });
    });

    generateTestCases = catchAsync(async (req, res) => {
        const { documentType, documentContent, projectId, userRequirements } = req.body;
        const result = await this.testCaseService.generateTestCases(
            documentType, documentContent, projectId, userRequirements
        );
        res.status(201).json({ success: true, data: result });
    });

    // 测试执行管理
    executeTestCase = catchAsync(async (req, res) => {
        const testCaseId = parseInt(req.params.id);
        const result = await this.testExecutionService.executeTestCase(testCaseId, req.body);
        res.status(201).json({ success: true, data: result });
    });

    getTestExecutions = catchAsync(async (req, res) => {
        const testCaseId = parseInt(req.params.id);
        const executions = await this.testExecutionService.getTestExecutions(testCaseId);
        res.status(200).json({ success: true, data: executions });
    });

    getExecutionHistory = catchAsync(async (req, res) => {
        const projectId = parseInt(req.params.projectId);
        const history = await this.testExecutionService.getExecutionHistory(projectId);
        res.status(200).json({ success: true, data: history });
    });
}

module.exports = TestController;