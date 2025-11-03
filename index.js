const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');
const DocumentParser = require('./src/documentParser');
const TestCaseGenerator = require('./src/testCaseGenerator');
const ReportGenerator = require('./src/reportGenerator');
const Database = require('./src/database');
const TestCaseController = require('./src/testCaseController');

const app = express();
const PORT = process.env.PORT || 3000;

// 初始化数据库
const database = new Database();
const testCaseController = new TestCaseController(database);

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// 确保上传目录存在
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('创建上传目录:', uploadDir);
}

// 文件上传配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('文件上传目标目录:', uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    console.log('生成文件名:', filename);
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.txt', '.md', '.docx', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型。支持的格式：.txt, .md, .docx, .pdf'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// 批量导入专用的multer配置
const importUpload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.json', '.xls', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型。支持的格式：.csv, .json, .xls, .xlsx'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// 基础路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 项目管理API
app.post('/api/projects', (req, res) => testCaseController.createProject(req, res));
app.get('/api/projects', (req, res) => testCaseController.getProjects(req, res));
app.get('/api/projects/:id', (req, res) => testCaseController.getProject(req, res));
app.put('/api/projects/:id', (req, res) => testCaseController.updateProject(req, res));
app.delete('/api/projects/:id', (req, res) => testCaseController.deleteProject(req, res));

// 测试用例管理API
app.post('/api/test-cases', (req, res) => testCaseController.createTestCase(req, res));
app.get('/api/test-cases', (req, res) => testCaseController.getTestCases(req, res));
app.get('/api/test-cases/:id', (req, res) => testCaseController.getTestCase(req, res));
app.put('/api/test-cases/:id', (req, res) => testCaseController.updateTestCase(req, res));
app.delete('/api/test-cases/:id', (req, res) => testCaseController.deleteTestCase(req, res));

// 测试执行API
app.post('/api/test-cases/:id/execute', (req, res) => testCaseController.executeTestCase(req, res));
app.get('/api/test-cases/:id/executions', (req, res) => testCaseController.getTestExecutions(req, res));

// 批量导入API（支持文件上传）
app.post('/api/test-cases/import', importUpload.single('file'), (req, res) => testCaseController.importTestCases(req, res));

// 测试报表API
app.get('/api/reports/test-report', (req, res) => testCaseController.generateTestReport(req, res));
app.get('/api/reports/test-summary', (req, res) => testCaseController.getTestSummary(req, res));

// 上传需求文档并生成测试用例（增强版，支持保存到数据库）
app.post('/generate-test-cases', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传需求文档' });
    }

    const filePath = req.file.path;
    const options = {
      testType: req.body.testType || 'functional',
      priority: req.body.priority || 'medium',
      includeNegativeTests: req.body.includeNegativeTests === 'true',
      includePerformanceTests: req.body.includePerformanceTests === 'true',
      includeSecurityTests: req.body.includeSecurityTests === 'true'
    };

    console.log('开始处理文档:', req.file.originalname);

    // 解析文档
    const parser = new DocumentParser();
    const requirements = await parser.parseDocument(filePath, req.file.mimetype);

    // 生成测试用例
    const generator = new TestCaseGenerator();
    const testCases = await generator.generateTestCases(requirements, options);

    // 如果提供了项目ID，保存到数据库
    let savedTestCases = [];
    if (req.body.projectId) {
      try {
        for (const testCase of testCases) {
          const savedTestCase = await database.createTestCase({
            project_id: req.body.projectId,
            case_id: testCase.id,
            title: testCase.title,
            description: testCase.description,
            type: testCase.type,
            priority: testCase.priority,
            preconditions: testCase.preconditions,
            test_steps: testCase.steps,
            expected_result: testCase.expectedResult,
            test_data: testCase.testData || {}
          });
          savedTestCases.push(savedTestCase);
        }
      } catch (dbError) {
        console.warn('保存到数据库失败，但继续生成报告:', dbError);
      }
    }

    // 生成报告
    const reportGenerator = new ReportGenerator();
    const reportPath = await reportGenerator.generateReport(testCases, {
      projectName: req.body.projectName || '项目测试用例',
      version: req.body.version || '1.0.0',
      author: req.body.author || '自动生成',
      requirements: requirements
    });

    // 清理上传的文件
    await fs.remove(filePath);

    res.json({
      success: true,
      message: '测试用例生成成功',
      testCasesCount: testCases.length,
      savedToDatabase: savedTestCases.length,
      reportPath: reportPath,
      downloadUrl: `/download/${path.basename(reportPath)}`
    });

  } catch (error) {
    console.error('生成测试用例时出错:', error);
    res.status(500).json({ 
      error: '生成测试用例失败', 
      details: error.message 
    });
  }
});

// 下载生成的报告
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'output', filename);
  
  if (fs.existsSync(filePath)) {
    res.download(filePath, (err) => {
      if (err) {
        console.error('下载文件时出错:', err);
        res.status(500).json({ error: '下载失败' });
      }
    });
  } else {
    res.status(404).json({ error: '文件不存在' });
  }
});

// 获取测试用例模板
app.get('/api/template', (req, res) => {
  const template = {
    testCase: {
      id: "TC_001",
      title: "测试用例标题",
      description: "测试用例描述",
      priority: "High/Medium/Low",
      type: "Functional/Performance/Security/UI",
      preconditions: "前置条件",
      steps: [
        {
          step: 1,
          action: "操作步骤",
          expectedResult: "预期结果"
        }
      ],
      postconditions: "后置条件",
      testData: "测试数据",
      environment: "测试环境"
    }
  };
  
  res.json(template);
});

// 错误处理中间件
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '文件大小超过限制（最大10MB）' });
    }
  }
  
  console.error('服务器错误:', error);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
async function startServer() {
  try {
    // 初始化数据库
    await database.init();
    
    app.listen(PORT, () => {
      console.log(`测试用例生成器服务已启动`);
      console.log(`访问地址: http://localhost:${PORT}`);
      console.log(`API文档: http://localhost:${PORT}/api/template`);
      console.log(`数据库已初始化完成`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('正在关闭服务器...');
  await database.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('正在关闭服务器...');
  await database.close();
  process.exit(0);
});

startServer();

module.exports = app;