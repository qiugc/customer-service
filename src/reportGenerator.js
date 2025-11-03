const fs = require('fs-extra');
const path = require('path');

class ReportGenerator {
  constructor() {
    this.outputDir = path.join(process.cwd(), 'output');
    this.ensureOutputDir();
  }

  /**
   * 确保输出目录存在
   */
  async ensureOutputDir() {
    await fs.ensureDir(this.outputDir);
  }

  /**
   * 生成测试用例报告
   * @param {Array} testCases - 测试用例数组
   * @param {Object} metadata - 报告元数据
   * @returns {string} 生成的报告文件路径
   */
  async generateReport(testCases, metadata = {}) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportFileName = `test-cases-report-${timestamp}.html`;
      const reportPath = path.join(this.outputDir, reportFileName);

      const htmlContent = this.generateHtmlReport(testCases, metadata);
      await fs.writeFile(reportPath, htmlContent, 'utf8');

      // 同时生成Excel格式报告
      const excelFileName = `test-cases-report-${timestamp}.csv`;
      const excelPath = path.join(this.outputDir, excelFileName);
      const csvContent = this.generateCsvReport(testCases, metadata);
      await fs.writeFile(excelPath, csvContent, 'utf8');

      // 生成JSON格式报告
      const jsonFileName = `test-cases-report-${timestamp}.json`;
      const jsonPath = path.join(this.outputDir, jsonFileName);
      const jsonContent = this.generateJsonReport(testCases, metadata);
      await fs.writeFile(jsonPath, jsonContent, 'utf8');

      console.log(`报告生成成功:`);
      console.log(`HTML报告: ${reportPath}`);
      console.log(`CSV报告: ${excelPath}`);
      console.log(`JSON报告: ${jsonPath}`);

      return reportPath;
    } catch (error) {
      throw new Error(`生成报告失败: ${error.message}`);
    }
  }

  /**
   * 生成HTML格式报告
   */
  generateHtmlReport(testCases, metadata) {
    const stats = this.generateStatistics(testCases);
    
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>测试用例报告 - ${metadata.projectName || '项目'}</title>
    <style>
        ${this.getReportStyles()}
    </style>
</head>
<body>
    <div class="container">
        <header class="report-header">
            <h1>测试用例报告</h1>
            <div class="metadata">
                <div class="meta-item">
                    <label>项目名称:</label>
                    <span>${metadata.projectName || '未指定'}</span>
                </div>
                <div class="meta-item">
                    <label>版本:</label>
                    <span>${metadata.version || '1.0.0'}</span>
                </div>
                <div class="meta-item">
                    <label>生成时间:</label>
                    <span>${new Date().toLocaleString('zh-CN')}</span>
                </div>
                <div class="meta-item">
                    <label>生成者:</label>
                    <span>${metadata.author || '自动生成'}</span>
                </div>
            </div>
        </header>

        <section class="statistics">
            <h2>统计信息</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${stats.total}</div>
                    <div class="stat-label">总测试用例数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.byPriority.high || 0}</div>
                    <div class="stat-label">高优先级</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.byPriority.medium || 0}</div>
                    <div class="stat-label">中优先级</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.byPriority.low || 0}</div>
                    <div class="stat-label">低优先级</div>
                </div>
            </div>
            
            <div class="type-distribution">
                <h3>测试类型分布</h3>
                <div class="type-stats">
                    ${Object.entries(stats.byType).map(([type, count]) => 
                        `<div class="type-item">
                            <span class="type-name">${this.getTypeDisplayName(type)}</span>
                            <span class="type-count">${count}</span>
                        </div>`
                    ).join('')}
                </div>
            </div>
        </section>

        ${this.generateRequirementsSection(metadata.requirements)}

        <section class="test-cases">
            <h2>测试用例详情</h2>
            <div class="filter-controls">
                <label>筛选类型:</label>
                <select id="typeFilter" onchange="filterTestCases()">
                    <option value="">全部</option>
                    ${Object.keys(stats.byType).map(type => 
                        `<option value="${type}">${this.getTypeDisplayName(type)}</option>`
                    ).join('')}
                </select>
                
                <label>筛选优先级:</label>
                <select id="priorityFilter" onchange="filterTestCases()">
                    <option value="">全部</option>
                    <option value="high">高</option>
                    <option value="medium">中</option>
                    <option value="low">低</option>
                </select>
            </div>
            
            <div class="test-cases-list">
                ${testCases.map(testCase => this.generateTestCaseHtml(testCase)).join('')}
            </div>
        </section>
    </div>

    <script>
        ${this.getReportScripts()}
    </script>
</body>
</html>`;
  }

  /**
   * 生成需求信息部分
   */
  generateRequirementsSection(requirements) {
    if (!requirements) return '';

    return `
        <section class="requirements">
            <h2>需求信息</h2>
            <div class="requirements-content">
                <div class="requirement-item">
                    <h3>项目描述</h3>
                    <p>${requirements.description || '无描述'}</p>
                </div>
                
                ${requirements.functionalRequirements && requirements.functionalRequirements.length > 0 ? `
                <div class="requirement-item">
                    <h3>功能需求 (${requirements.functionalRequirements.length}项)</h3>
                    <ul>
                        ${requirements.functionalRequirements.map(req => 
                            `<li><strong>${req.id}:</strong> ${req.description}</li>`
                        ).join('')}
                    </ul>
                </div>
                ` : ''}
                
                ${requirements.userStories && requirements.userStories.length > 0 ? `
                <div class="requirement-item">
                    <h3>用户故事 (${requirements.userStories.length}项)</h3>
                    <ul>
                        ${requirements.userStories.map(story => 
                            `<li><strong>${story.id}:</strong> 作为${story.role}，我希望${story.goal}，以便${story.benefit}</li>`
                        ).join('')}
                    </ul>
                </div>
                ` : ''}
                
                ${requirements.acceptanceCriteria && requirements.acceptanceCriteria.length > 0 ? `
                <div class="requirement-item">
                    <h3>验收标准 (${requirements.acceptanceCriteria.length}项)</h3>
                    <ul>
                        ${requirements.acceptanceCriteria.map(criteria => 
                            `<li><strong>${criteria.id}:</strong> ${criteria.description}</li>`
                        ).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
        </section>
    `;
  }

  /**
   * 生成单个测试用例的HTML
   */
  generateTestCaseHtml(testCase) {
    return `
        <div class="test-case" data-type="${testCase.type}" data-priority="${testCase.priority}">
            <div class="test-case-header">
                <h3>${testCase.id}: ${testCase.title}</h3>
                <div class="test-case-badges">
                    <span class="badge badge-type badge-${testCase.type}">${this.getTypeDisplayName(testCase.type)}</span>
                    <span class="badge badge-priority badge-${testCase.priority}">${this.getPriorityDisplayName(testCase.priority)}</span>
                </div>
            </div>
            
            <div class="test-case-content">
                <div class="test-case-field">
                    <label>描述:</label>
                    <p>${testCase.description}</p>
                </div>
                
                <div class="test-case-field">
                    <label>前置条件:</label>
                    <p>${testCase.preconditions}</p>
                </div>
                
                <div class="test-case-field">
                    <label>测试步骤:</label>
                    <ol class="test-steps">
                        ${testCase.steps.map(step => 
                            `<li>
                                <div class="step-action"><strong>操作:</strong> ${step.action}</div>
                                <div class="step-expected"><strong>预期结果:</strong> ${step.expectedResult}</div>
                            </li>`
                        ).join('')}
                    </ol>
                </div>
                
                <div class="test-case-field">
                    <label>预期结果:</label>
                    <p>${testCase.expectedResult}</p>
                </div>
                
                <div class="test-case-field">
                    <label>后置条件:</label>
                    <p>${testCase.postconditions}</p>
                </div>
                
                <div class="test-case-field">
                    <label>测试数据:</label>
                    <p>${testCase.testData}</p>
                </div>
                
                <div class="test-case-field">
                    <label>测试环境:</label>
                    <p>${testCase.environment}</p>
                </div>
                
                ${testCase.tags && testCase.tags.length > 0 ? `
                <div class="test-case-field">
                    <label>标签:</label>
                    <div class="tags">
                        ${testCase.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    `;
  }

  /**
   * 生成CSV格式报告
   */
  generateCsvReport(testCases, metadata) {
    const headers = [
      '测试用例ID',
      '标题',
      '描述',
      '类型',
      '优先级',
      '需求ID',
      '前置条件',
      '测试步骤',
      '预期结果',
      '后置条件',
      '测试数据',
      '测试环境',
      '标签'
    ];

    const csvRows = [headers.join(',')];

    testCases.forEach(testCase => {
      const steps = testCase.steps.map(step => 
        `${step.step}. ${step.action} -> ${step.expectedResult}`
      ).join('; ');

      const row = [
        testCase.id,
        `"${testCase.title}"`,
        `"${testCase.description}"`,
        testCase.type,
        testCase.priority,
        testCase.requirementId || '',
        `"${testCase.preconditions}"`,
        `"${steps}"`,
        `"${testCase.expectedResult}"`,
        `"${testCase.postconditions}"`,
        `"${testCase.testData}"`,
        testCase.environment,
        testCase.tags ? testCase.tags.join('; ') : ''
      ];

      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * 生成JSON格式报告
   */
  generateJsonReport(testCases, metadata) {
    const report = {
      metadata: {
        projectName: metadata.projectName || '未指定项目',
        version: metadata.version || '1.0.0',
        author: metadata.author || '自动生成',
        generatedAt: new Date().toISOString(),
        totalTestCases: testCases.length
      },
      statistics: this.generateStatistics(testCases),
      requirements: metadata.requirements || {},
      testCases: testCases
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * 生成统计信息
   */
  generateStatistics(testCases) {
    const stats = {
      total: testCases.length,
      byType: {},
      byPriority: {},
      byCategory: {}
    };

    testCases.forEach(testCase => {
      // 按类型统计
      stats.byType[testCase.type] = (stats.byType[testCase.type] || 0) + 1;
      
      // 按优先级统计
      stats.byPriority[testCase.priority] = (stats.byPriority[testCase.priority] || 0) + 1;
      
      // 按分类统计
      stats.byCategory[testCase.category] = (stats.byCategory[testCase.category] || 0) + 1;
    });

    return stats;
  }

  /**
   * 获取类型显示名称
   */
  getTypeDisplayName(type) {
    const typeMap = {
      'functional': '功能测试',
      'performance': '性能测试',
      'security': '安全测试',
      'boundary': '边界测试',
      'negative': '负面测试',
      'acceptance': '验收测试',
      'user-story': '用户故事测试',
      'non-functional': '非功能测试'
    };

    return typeMap[type] || type;
  }

  /**
   * 获取优先级显示名称
   */
  getPriorityDisplayName(priority) {
    const priorityMap = {
      'high': '高',
      'medium': '中',
      'low': '低'
    };

    return priorityMap[priority] || priority;
  }

  /**
   * 获取报告样式
   */
  getReportStyles() {
    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Microsoft YaHei', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        .report-header {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }

        .report-header h1 {
            color: #2c3e50;
            margin-bottom: 20px;
            font-size: 2.5em;
            text-align: center;
        }

        .metadata {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
        }

        .meta-item {
            display: flex;
            align-items: center;
        }

        .meta-item label {
            font-weight: bold;
            margin-right: 10px;
            color: #555;
        }

        .statistics {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }

        .statistics h2 {
            color: #2c3e50;
            margin-bottom: 20px;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }

        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .stat-label {
            font-size: 0.9em;
            opacity: 0.9;
        }

        .type-distribution h3 {
            color: #2c3e50;
            margin-bottom: 15px;
        }

        .type-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
        }

        .type-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 15px;
            background: #f8f9fa;
            border-radius: 5px;
            border-left: 4px solid #3498db;
        }

        .type-name {
            font-weight: 500;
        }

        .type-count {
            font-weight: bold;
            color: #3498db;
        }

        .requirements {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }

        .requirements h2 {
            color: #2c3e50;
            margin-bottom: 20px;
            border-bottom: 2px solid #e74c3c;
            padding-bottom: 10px;
        }

        .requirement-item {
            margin-bottom: 25px;
        }

        .requirement-item h3 {
            color: #e74c3c;
            margin-bottom: 10px;
        }

        .requirement-item ul {
            list-style-type: none;
            padding-left: 0;
        }

        .requirement-item li {
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }

        .test-cases {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .test-cases h2 {
            color: #2c3e50;
            margin-bottom: 20px;
            border-bottom: 2px solid #27ae60;
            padding-bottom: 10px;
        }

        .filter-controls {
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
            display: flex;
            gap: 20px;
            align-items: center;
            flex-wrap: wrap;
        }

        .filter-controls label {
            font-weight: bold;
            color: #555;
        }

        .filter-controls select {
            padding: 5px 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }

        .test-case {
            border: 1px solid #ddd;
            border-radius: 8px;
            margin-bottom: 20px;
            overflow: hidden;
            transition: box-shadow 0.3s ease;
        }

        .test-case:hover {
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .test-case-header {
            background: #f8f9fa;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #ddd;
        }

        .test-case-header h3 {
            color: #2c3e50;
            margin: 0;
            font-size: 1.1em;
        }

        .test-case-badges {
            display: flex;
            gap: 10px;
        }

        .badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: bold;
            text-transform: uppercase;
        }

        .badge-type {
            background: #3498db;
            color: white;
        }

        .badge-priority.badge-high {
            background: #e74c3c;
            color: white;
        }

        .badge-priority.badge-medium {
            background: #f39c12;
            color: white;
        }

        .badge-priority.badge-low {
            background: #95a5a6;
            color: white;
        }

        .test-case-content {
            padding: 20px;
        }

        .test-case-field {
            margin-bottom: 15px;
        }

        .test-case-field label {
            font-weight: bold;
            color: #555;
            display: block;
            margin-bottom: 5px;
        }

        .test-case-field p {
            margin: 0;
            padding: 8px 12px;
            background: #f8f9fa;
            border-radius: 4px;
            border-left: 3px solid #3498db;
        }

        .test-steps {
            list-style: none;
            counter-reset: step-counter;
        }

        .test-steps li {
            counter-increment: step-counter;
            margin-bottom: 10px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 4px;
            border-left: 3px solid #27ae60;
            position: relative;
        }

        .test-steps li::before {
            content: "步骤 " counter(step-counter);
            font-weight: bold;
            color: #27ae60;
            display: block;
            margin-bottom: 5px;
        }

        .step-action, .step-expected {
            margin-bottom: 5px;
        }

        .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
        }

        .tag {
            background: #ecf0f1;
            color: #2c3e50;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
        }

        .hidden {
            display: none !important;
        }

        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .filter-controls {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .test-case-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }
        }
    `;
  }

  /**
   * 获取报告脚本
   */
  getReportScripts() {
    return `
        function filterTestCases() {
            const typeFilter = document.getElementById('typeFilter').value;
            const priorityFilter = document.getElementById('priorityFilter').value;
            const testCases = document.querySelectorAll('.test-case');
            
            testCases.forEach(testCase => {
                const type = testCase.getAttribute('data-type');
                const priority = testCase.getAttribute('data-priority');
                
                const typeMatch = !typeFilter || type === typeFilter;
                const priorityMatch = !priorityFilter || priority === priorityFilter;
                
                if (typeMatch && priorityMatch) {
                    testCase.classList.remove('hidden');
                } else {
                    testCase.classList.add('hidden');
                }
            });
        }

        // 页面加载完成后的初始化
        document.addEventListener('DOMContentLoaded', function() {
            console.log('测试用例报告已加载');
        });
    `;
  }
}

module.exports = ReportGenerator;