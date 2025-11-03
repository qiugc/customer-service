const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const XLSX = require('xlsx');

class TestCaseController {
    constructor(database) {
        this.db = database;
    }

    // 项目管理
    async createProject(req, res) {
        try {
            const { name, version, description } = req.body;
            
            if (!name) {
                return res.status(400).json({ error: '项目名称不能为空' });
            }

            const project = await this.db.createProject({ name, version, description });
            res.json({ success: true, data: project });
        } catch (error) {
            console.error('创建项目失败:', error);
            res.status(500).json({ error: '创建项目失败' });
        }
    }

    async getProjects(req, res) {
        try {
            const projects = await this.db.getProjects();
            res.json({ success: true, data: projects });
        } catch (error) {
            console.error('获取项目列表失败:', error);
            res.status(500).json({ error: '获取项目列表失败' });
        }
    }

    async getProject(req, res) {
        try {
            const { id } = req.params;
            const project = await this.db.getProject(id);
            
            if (!project) {
                return res.status(404).json({ error: '项目不存在' });
            }

            // 获取项目统计信息
            const stats = await this.db.getProjectStats(id);
            
            res.json({ 
                success: true, 
                data: { 
                    ...project, 
                    stats 
                } 
            });
        } catch (error) {
            console.error('获取项目详情失败:', error);
            res.status(500).json({ error: '获取项目详情失败' });
        }
    }

    async updateProject(req, res) {
        try {
            const { id } = req.params;
            const { name, version, description } = req.body;
            
            if (!name) {
                return res.status(400).json({ error: '项目名称不能为空' });
            }

            const updateData = { name, version, description };
            const result = await this.db.updateProject(id, updateData);
            
            if (result.changes === 0) {
                return res.status(404).json({ error: '项目不存在' });
            }

            res.json({ success: true, message: '项目更新成功' });
        } catch (error) {
            console.error('更新项目失败:', error);
            res.status(500).json({ error: '更新项目失败' });
        }
    }

    async deleteProject(req, res) {
        try {
            const { id } = req.params;
            const result = await this.db.deleteProject(id);
            
            if (result.changes === 0) {
                return res.status(404).json({ error: '项目不存在' });
            }

            res.json({ success: true, message: '项目删除成功' });
        } catch (error) {
            console.error('删除项目失败:', error);
            if (error.message.includes('无法删除项目')) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: '删除项目失败' });
            }
        }
    }

    // 测试用例管理
    async createTestCase(req, res) {
        try {
            const {
                project_id, title, description, type, priority,
                preconditions, test_steps, expected_result, test_data
            } = req.body;

            if (!project_id || !title || !type || !priority) {
                return res.status(400).json({ 
                    error: '项目ID、标题、类型和优先级不能为空' 
                });
            }

            // 生成唯一的测试用例ID
            const case_id = `TC_${moment().format('YYYYMMDD')}_${uuidv4().substr(0, 8)}`;

            const testCaseData = {
                project_id,
                case_id,
                title,
                description,
                type,
                priority,
                preconditions: JSON.stringify(preconditions || []),
                test_steps: JSON.stringify(test_steps || []),
                expected_result,
                test_data: JSON.stringify(test_data || {})
            };

            const testCase = await this.db.createTestCase(testCaseData);
            res.json({ success: true, data: testCase });
        } catch (error) {
            console.error('创建测试用例失败:', error);
            res.status(500).json({ error: '创建测试用例失败' });
        }
    }

    async getTestCases(req, res) {
        try {
            const { project_id, type, priority, status } = req.query;
            const filters = { type, priority, status };
            
            const testCases = await this.db.getTestCases(project_id, filters);
            
            // 解析JSON字段
            const processedTestCases = testCases.map(tc => ({
                ...tc,
                preconditions: this.safeJsonParse(tc.preconditions),
                test_steps: this.safeJsonParse(tc.test_steps),
                test_data: this.safeJsonParse(tc.test_data)
            }));

            res.json({ success: true, data: processedTestCases });
        } catch (error) {
            console.error('获取测试用例列表失败:', error);
            res.status(500).json({ error: '获取测试用例列表失败' });
        }
    }

    async getTestCase(req, res) {
        try {
            const { id } = req.params;
            const testCase = await this.db.getTestCase(id);
            
            if (!testCase) {
                return res.status(404).json({ error: '测试用例不存在' });
            }

            // 解析JSON字段
            const processedTestCase = {
                ...testCase,
                preconditions: this.safeJsonParse(testCase.preconditions),
                test_steps: this.safeJsonParse(testCase.test_steps),
                test_data: this.safeJsonParse(testCase.test_data)
            };

            // 获取执行历史
            const executions = await this.db.getTestExecutions(id);

            res.json({ 
                success: true, 
                data: { 
                    ...processedTestCase, 
                    executions 
                } 
            });
        } catch (error) {
            console.error('获取测试用例详情失败:', error);
            res.status(500).json({ error: '获取测试用例详情失败' });
        }
    }

    async updateTestCase(req, res) {
        try {
            const { id } = req.params;
            const updateData = { ...req.body };

            // 处理JSON字段
            if (updateData.preconditions) {
                updateData.preconditions = JSON.stringify(updateData.preconditions);
            }
            if (updateData.test_steps) {
                updateData.test_steps = JSON.stringify(updateData.test_steps);
            }
            if (updateData.test_data) {
                updateData.test_data = JSON.stringify(updateData.test_data);
            }

            const result = await this.db.updateTestCase(id, updateData);
            
            if (result.changes === 0) {
                return res.status(404).json({ error: '测试用例不存在' });
            }

            res.json({ success: true, message: '测试用例更新成功' });
        } catch (error) {
            console.error('更新测试用例失败:', error);
            res.status(500).json({ error: '更新测试用例失败' });
        }
    }

    async deleteTestCase(req, res) {
        try {
            const { id } = req.params;
            const result = await this.db.deleteTestCase(id);
            
            if (result.changes === 0) {
                return res.status(404).json({ error: '测试用例不存在' });
            }

            res.json({ success: true, message: '测试用例删除成功' });
        } catch (error) {
            console.error('删除测试用例失败:', error);
            res.status(500).json({ error: '删除测试用例失败' });
        }
    }

    // 测试执行管理
    async executeTestCase(req, res) {
        try {
            const { id } = req.params;
            const { status, executed_by, notes, defect_id } = req.body;

            if (!status || !executed_by) {
                return res.status(400).json({ 
                    error: '测试状态和执行人不能为空' 
                });
            }

            const validStatuses = ['passed', 'failed', 'blocked', 'pending'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ 
                    error: '无效的测试状态' 
                });
            }

            const executionData = {
                test_case_id: id,
                status,
                executed_by,
                notes,
                defect_id
            };

            const execution = await this.db.createTestExecution(executionData);
            res.json({ success: true, data: execution });
        } catch (error) {
            console.error('执行测试用例失败:', error);
            res.status(500).json({ error: '执行测试用例失败' });
        }
    }

    async getTestExecutions(req, res) {
        try {
            const { id } = req.params;
            const executions = await this.db.getTestExecutions(id);
            res.json({ success: true, data: executions });
        } catch (error) {
            console.error('获取测试执行记录失败:', error);
            res.status(500).json({ error: '获取测试执行记录失败' });
        }
    }

    // 批量导入测试用例
    async importTestCases(req, res) {
        try {
            console.log('开始批量导入测试用例');
            console.log('请求体:', req.body);
            console.log('上传文件:', req.file);
            
            let test_cases = [];
            let project_id = null;

            // 检查是否有文件上传
            if (req.file) {
                console.log('处理文件上传:', req.file.originalname);
                // 处理文件上传
                const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
                project_id = req.body.project_id;
                
                if (!project_id) {
                    console.error('项目ID为空');
                    return res.status(400).json({ error: '项目ID不能为空' });
                }

                console.log('文件扩展名:', fileExtension);
                console.log('文件路径:', req.file.path);

                if (fileExtension === 'csv') {
                    // 处理CSV文件
                    const fs = require('fs');
                    const csvContent = fs.readFileSync(req.file.path, 'utf8');
                    console.log('CSV文件内容长度:', csvContent.length);
                    test_cases = this.parseCSV(csvContent);
                } else if (fileExtension === 'json') {
                    // 处理JSON文件
                    const fs = require('fs');
                    const jsonContent = fs.readFileSync(req.file.path, 'utf8');
                    console.log('JSON文件内容长度:', jsonContent.length);
                    const jsonData = JSON.parse(jsonContent);
                    test_cases = Array.isArray(jsonData) ? jsonData : [jsonData];
                } else if (fileExtension === 'xls' || fileExtension === 'xlsx') {
                    // 处理Excel文件
                    console.log('解析Excel文件');
                    test_cases = this.parseExcel(req.file.path);
                } else {
                    console.error('不支持的文件格式:', fileExtension);
                    return res.status(400).json({ 
                        error: '不支持的文件格式，请使用CSV、JSON、XLS或XLSX格式' 
                    });
                }
                
                console.log('解析得到测试用例数量:', test_cases.length);
            } else {
                console.log('处理直接传递的数据');
                // 处理直接传递的数据
                project_id = req.body.project_id;
                test_cases = req.body.test_cases;

                if (!project_id || !Array.isArray(test_cases)) {
                    console.error('项目ID或测试用例数组为空');
                    return res.status(400).json({ 
                        error: '项目ID和测试用例数组不能为空' 
                    });
                }
            }

            // 获取项目中现有的测试用例标题，用于重复校验
            const existingTestCases = await this.db.getTestCases(project_id);
            const existingTitles = new Set(existingTestCases.map(tc => tc.title.toLowerCase().trim()));

            const results = [];
            const errors = [];
            const duplicates = [];
            const duplicateDetails = [];

            for (let i = 0; i < test_cases.length; i++) {
                try {
                    const testCase = test_cases[i];
                    const title = testCase.title ? testCase.title.trim() : '';
                    
                    // 检查标题是否为空
                    if (!title) {
                        errors.push({ index: i, error: '测试用例标题不能为空' });
                        continue;
                    }
                    
                    // 重复校验
                    if (existingTitles.has(title.toLowerCase())) {
                        duplicates.push({ index: i, title: title });
                        duplicateDetails.push({ title: title });
                        continue;
                    }
                    
                    const case_id = `TC_${moment().format('YYYYMMDD')}_${uuidv4().substr(0, 8)}`;
                    
                    const testCaseData = {
                        project_id,
                        case_id,
                        title: title,
                        description: testCase.description || '',
                        type: testCase.type || 'functional',
                        priority: testCase.priority || 'medium',
                        preconditions: JSON.stringify(testCase.preconditions || []),
                        test_steps: JSON.stringify(testCase.test_steps || []),
                        expected_result: testCase.expected_result || '',
                        test_data: JSON.stringify(testCase.test_data || {})
                    };

                    const result = await this.db.createTestCase(testCaseData);
                    results.push(result);
                    
                    // 将新添加的标题加入到现有标题集合中，避免同一批次内的重复
                    existingTitles.add(title.toLowerCase());
                } catch (error) {
                    console.error(`导入第 ${i + 1} 个测试用例失败:`, error);
                    errors.push({ index: i, error: error.message });
                }
            }

            // 清理上传的临时文件
            if (req.file && req.file.path) {
                try {
                    const fs = require('fs');
                    fs.unlinkSync(req.file.path);
                    console.log('临时文件已清理:', req.file.path);
                } catch (cleanupError) {
                    console.warn('清理临时文件失败:', cleanupError.message);
                }
            }

            console.log('批量导入完成 - 成功:', results.length, '重复:', duplicates.length, '错误:', errors.length);
            res.json({ 
                success: true, 
                data: { 
                    imported: results.length, 
                    duplicates: duplicates.length,
                    errors: errors.length,
                    results,
                    duplicateDetails,
                    errors 
                } 
            });
        } catch (error) {
            console.error('批量导入测试用例失败:', error);
            console.error('错误堆栈:', error.stack);
            
            // 清理上传的临时文件
            if (req.file && req.file.path) {
                try {
                    const fs = require('fs');
                    fs.unlinkSync(req.file.path);
                    console.log('临时文件已清理:', req.file.path);
                } catch (cleanupError) {
                    console.warn('清理临时文件失败:', cleanupError.message);
                }
            }
            
            res.status(500).json({ 
                error: '批量导入测试用例失败',
                details: error.message 
            });
        }
    }

    // 生成测试报表
    async generateTestReport(req, res) {
        try {
            const { project_id, start_date, end_date } = req.query;

            if (!project_id) {
                return res.status(400).json({ error: '项目ID不能为空' });
            }

            // 获取项目信息
            const project = await this.db.getProject(project_id);
            if (!project) {
                return res.status(404).json({ error: '项目不存在' });
            }

            // 获取测试用例
            const testCases = await this.db.getTestCases(project_id);
            
            // 获取统计信息
            const stats = await this.db.getProjectStats(project_id);

            // 按类型和优先级分组统计
            const typeStats = {};
            const priorityStats = {};
            const statusStats = {};

            testCases.forEach(tc => {
                // 类型统计
                if (!typeStats[tc.type]) {
                    typeStats[tc.type] = { total: 0, passed: 0, failed: 0, pending: 0, blocked: 0 };
                }
                typeStats[tc.type].total++;
                typeStats[tc.type][tc.status]++;

                // 优先级统计
                if (!priorityStats[tc.priority]) {
                    priorityStats[tc.priority] = { total: 0, passed: 0, failed: 0, pending: 0, blocked: 0 };
                }
                priorityStats[tc.priority].total++;
                priorityStats[tc.priority][tc.status]++;

                // 状态统计
                if (!statusStats[tc.status]) {
                    statusStats[tc.status] = 0;
                }
                statusStats[tc.status]++;
            });

            const report = {
                project,
                stats,
                typeStats,
                priorityStats,
                statusStats,
                testCases: testCases.map(tc => ({
                    ...tc,
                    preconditions: this.safeJsonParse(tc.preconditions),
                    test_steps: this.safeJsonParse(tc.test_steps),
                    test_data: this.safeJsonParse(tc.test_data)
                })),
                generated_at: moment().format('YYYY-MM-DD HH:mm:ss')
            };

            res.json({ success: true, data: report });
        } catch (error) {
            console.error('生成测试报表失败:', error);
            res.status(500).json({ error: '生成测试报表失败' });
        }
    }

    // 获取测试统计摘要
    async getTestSummary(req, res) {
        try {
            const { project_id } = req.query;

            if (!project_id) {
                return res.status(400).json({ error: '项目ID不能为空' });
            }

            // 获取统计信息
            const stats = await this.db.getProjectStats(project_id);
            
            // 计算通过率
            const totalExecuted = stats.passed_cases + stats.failed_cases + stats.blocked_cases;
            const passRate = totalExecuted > 0 ? Math.round((stats.passed_cases / totalExecuted) * 100) : 0;

            const summary = {
                totalTestCases: stats.total_cases,
                executedTestCases: totalExecuted,
                passedTestCases: stats.passed_cases,
                failedTestCases: stats.failed_cases,
                blockedTestCases: stats.blocked_cases,
                pendingTestCases: stats.pending_cases,
                passRate: passRate
            };

            res.json(summary);
        } catch (error) {
            console.error('获取测试统计摘要失败:', error);
            res.status(500).json({ error: '获取测试统计摘要失败' });
        }
    }

    // 辅助方法
    safeJsonParse(jsonString) {
        try {
            return JSON.parse(jsonString || '[]');
        } catch (error) {
            return [];
        }
    }

    // 解析Excel文件
    parseExcel(filePath) {
        try {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            return jsonData.map(row => {
                // 将Excel列映射到测试用例字段
                return {
                    title: row['标题'] || row['title'] || row['Title'] || '',
                    description: row['描述'] || row['description'] || row['Description'] || '',
                    type: row['类型'] || row['type'] || row['Type'] || 'functional',
                    priority: row['优先级'] || row['priority'] || row['Priority'] || 'medium',
                    preconditions: this.parseArrayField(row['前置条件'] || row['preconditions'] || row['Preconditions'] || ''),
                    test_steps: this.parseArrayField(row['测试步骤'] || row['test_steps'] || row['Test Steps'] || ''),
                    expected_result: row['预期结果'] || row['expected_result'] || row['Expected Result'] || '',
                    test_data: this.parseObjectField(row['测试数据'] || row['test_data'] || row['Test Data'] || '{}')
                };
            });
        } catch (error) {
            console.error('解析Excel文件失败:', error);
            throw new Error('Excel文件格式错误或无法读取');
        }
    }

    // 解析CSV文件
    parseCSV(csvContent) {
        try {
            const lines = csvContent.split('\n').filter(line => line.trim());
            if (lines.length < 2) {
                throw new Error('CSV文件格式错误，至少需要标题行和一行数据');
            }
            
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            const testCases = [];
            
            for (let i = 1; i < lines.length; i++) {
                const values = this.parseCSVLine(lines[i]);
                if (values.length !== headers.length) {
                    console.warn(`第${i + 1}行数据列数不匹配，跳过`);
                    continue;
                }
                
                const testCase = {};
                headers.forEach((header, index) => {
                    const value = values[index] || '';
                    
                    // 映射字段
                    switch (header.toLowerCase()) {
                        case '标题':
                        case 'title':
                            testCase.title = value;
                            break;
                        case '描述':
                        case 'description':
                            testCase.description = value;
                            break;
                        case '类型':
                        case 'type':
                            testCase.type = value || 'functional';
                            break;
                        case '优先级':
                        case 'priority':
                            testCase.priority = value || 'medium';
                            break;
                        case '前置条件':
                        case 'preconditions':
                            testCase.preconditions = this.parseArrayField(value);
                            break;
                        case '测试步骤':
                        case 'test_steps':
                        case 'test steps':
                            testCase.test_steps = this.parseArrayField(value);
                            break;
                        case '预期结果':
                        case 'expected_result':
                        case 'expected result':
                            testCase.expected_result = value;
                            break;
                        case '测试数据':
                        case 'test_data':
                        case 'test data':
                            testCase.test_data = this.parseObjectField(value);
                            break;
                    }
                });
                
                testCases.push(testCase);
            }
            
            return testCases;
        } catch (error) {
            console.error('解析CSV文件失败:', error);
            throw new Error('CSV文件格式错误或无法读取');
        }
    }

    // 解析CSV行（处理引号内的逗号）
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    // 解析数组字段
    parseArrayField(value) {
        if (!value) return [];
        
        try {
            // 尝试解析JSON格式
            return JSON.parse(value);
        } catch {
            // 如果不是JSON，按分号或换行符分割
            return value.split(/[;\n]/).map(item => item.trim()).filter(item => item);
        }
    }

    // 解析对象字段
    parseObjectField(value) {
        if (!value) return {};
        
        try {
            return JSON.parse(value);
        } catch {
            return { data: value };
        }
    }
}

module.exports = TestCaseController;