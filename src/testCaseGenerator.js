class TestCaseGenerator {
  constructor() {
    this.testCaseCounter = 1;
  }

  /**
   * 根据需求生成测试用例
   * @param {Object} requirements - 解析后的需求信息
   * @param {Object} options - 生成选项
   * @returns {Array} 生成的测试用例数组
   */
  async generateTestCases(requirements, options = {}) {
    const testCases = [];
    
    try {
      // 为功能需求生成测试用例
      if (requirements.functionalRequirements && requirements.functionalRequirements.length > 0) {
        const functionalTestCases = this.generateFunctionalTestCases(requirements.functionalRequirements, options);
        testCases.push(...functionalTestCases);
      }

      // 为用户故事生成测试用例
      if (requirements.userStories && requirements.userStories.length > 0) {
        const userStoryTestCases = this.generateUserStoryTestCases(requirements.userStories, options);
        testCases.push(...userStoryTestCases);
      }

      // 为验收标准生成测试用例
      if (requirements.acceptanceCriteria && requirements.acceptanceCriteria.length > 0) {
        const acceptanceTestCases = this.generateAcceptanceTestCases(requirements.acceptanceCriteria, options);
        testCases.push(...acceptanceTestCases);
      }

      // 生成边界值测试用例
      if (options.includeBoundaryTests !== false) {
        const boundaryTestCases = this.generateBoundaryTestCases(requirements, options);
        testCases.push(...boundaryTestCases);
      }

      // 生成负面测试用例
      if (options.includeNegativeTests) {
        const negativeTestCases = this.generateNegativeTestCases(requirements, options);
        testCases.push(...negativeTestCases);
      }

      // 生成性能测试用例
      if (options.includePerformanceTests) {
        const performanceTestCases = this.generatePerformanceTestCases(requirements, options);
        testCases.push(...performanceTestCases);
      }

      // 生成安全测试用例
      if (options.includeSecurityTests) {
        const securityTestCases = this.generateSecurityTestCases(requirements, options);
        testCases.push(...securityTestCases);
      }

      // 为非功能需求生成测试用例
      if (requirements.nonFunctionalRequirements && requirements.nonFunctionalRequirements.length > 0) {
        const nfrTestCases = this.generateNonFunctionalTestCases(requirements.nonFunctionalRequirements, options);
        testCases.push(...nfrTestCases);
      }

      return testCases;
    } catch (error) {
      throw new Error(`生成测试用例失败: ${error.message}`);
    }
  }

  /**
   * 为功能需求生成测试用例
   */
  generateFunctionalTestCases(functionalRequirements, options) {
    const testCases = [];

    functionalRequirements.forEach(requirement => {
      // 正向测试用例
      const positiveTestCase = {
        id: this.generateTestCaseId(),
        title: `验证${requirement.description}的正常功能`,
        description: `测试${requirement.description}在正常条件下的功能表现`,
        type: 'functional',
        priority: requirement.priority || options.priority || 'medium',
        requirementId: requirement.id,
        preconditions: this.generatePreconditions(requirement),
        steps: this.generateTestSteps(requirement, 'positive'),
        expectedResult: this.generateExpectedResult(requirement, 'positive'),
        postconditions: '系统状态正常，数据完整',
        testData: this.generateTestData(requirement, 'positive'),
        environment: 'Test Environment',
        category: 'functional',
        tags: ['functional', 'positive', requirement.priority || 'medium']
      };

      testCases.push(positiveTestCase);

      // 如果需求涉及输入验证，生成输入验证测试用例
      if (this.requiresInputValidation(requirement)) {
        const validationTestCase = {
          id: this.generateTestCaseId(),
          title: `验证${requirement.description}的输入验证`,
          description: `测试${requirement.description}的输入数据验证功能`,
          type: 'functional',
          priority: requirement.priority || options.priority || 'medium',
          requirementId: requirement.id,
          preconditions: this.generatePreconditions(requirement),
          steps: this.generateValidationTestSteps(requirement),
          expectedResult: '系统正确验证输入数据，拒绝无效输入并显示相应错误信息',
          postconditions: '系统状态正常',
          testData: this.generateTestData(requirement, 'validation'),
          environment: 'Test Environment',
          category: 'functional',
          tags: ['functional', 'validation', requirement.priority || 'medium']
        };

        testCases.push(validationTestCase);
      }
    });

    return testCases;
  }

  /**
   * 为用户故事生成测试用例
   */
  generateUserStoryTestCases(userStories, options) {
    const testCases = [];

    userStories.forEach(story => {
      const testCase = {
        id: this.generateTestCaseId(),
        title: `用户故事: ${story.role}能够${story.goal}`,
        description: `验证${story.role}能够${story.goal}，以便${story.benefit}`,
        type: 'functional',
        priority: story.priority || options.priority || 'medium',
        requirementId: story.id,
        preconditions: `用户已登录系统，具有${story.role}权限`,
        steps: this.generateUserStoryTestSteps(story),
        expectedResult: `${story.role}成功完成${story.goal}，实现${story.benefit}`,
        postconditions: '用户目标达成，系统状态正常',
        testData: this.generateUserStoryTestData(story),
        environment: 'Test Environment',
        category: 'user-story',
        tags: ['user-story', 'functional', story.priority || 'medium']
      };

      testCases.push(testCase);
    });

    return testCases;
  }

  /**
   * 为验收标准生成测试用例
   */
  generateAcceptanceTestCases(acceptanceCriteria, options) {
    const testCases = [];

    acceptanceCriteria.forEach(criteria => {
      const testCase = {
        id: this.generateTestCaseId(),
        title: `验收测试: ${criteria.description}`,
        description: `验证系统是否满足验收标准: ${criteria.description}`,
        type: 'acceptance',
        priority: options.priority || 'high',
        requirementId: criteria.id,
        preconditions: '系统已部署到测试环境，测试数据已准备',
        steps: this.generateAcceptanceTestSteps(criteria),
        expectedResult: `系统满足验收标准: ${criteria.description}`,
        postconditions: '验收标准得到验证',
        testData: this.generateAcceptanceTestData(criteria),
        environment: 'Test Environment',
        category: 'acceptance',
        tags: ['acceptance', 'verification', 'high']
      };

      testCases.push(testCase);
    });

    return testCases;
  }

  /**
   * 生成边界值测试用例
   */
  generateBoundaryTestCases(requirements, options) {
    const testCases = [];
    const boundaryScenarios = [
      { name: '最小值边界', type: 'min-boundary' },
      { name: '最大值边界', type: 'max-boundary' },
      { name: '空值处理', type: 'null-boundary' },
      { name: '超长输入', type: 'length-boundary' }
    ];

    boundaryScenarios.forEach(scenario => {
      const testCase = {
        id: this.generateTestCaseId(),
        title: `边界值测试: ${scenario.name}`,
        description: `测试系统在${scenario.name}条件下的行为`,
        type: 'boundary',
        priority: options.priority || 'medium',
        requirementId: 'BOUNDARY_TEST',
        preconditions: '系统正常运行，测试环境已准备',
        steps: this.generateBoundaryTestSteps(scenario),
        expectedResult: `系统正确处理${scenario.name}情况，不出现异常`,
        postconditions: '系统状态稳定',
        testData: this.generateBoundaryTestData(scenario),
        environment: 'Test Environment',
        category: 'boundary',
        tags: ['boundary', scenario.type, 'edge-case']
      };

      testCases.push(testCase);
    });

    return testCases;
  }

  /**
   * 生成负面测试用例
   */
  generateNegativeTestCases(requirements, options) {
    const testCases = [];
    const negativeScenarios = [
      { name: '无效输入测试', type: 'invalid-input' },
      { name: '权限不足测试', type: 'unauthorized' },
      { name: '网络异常测试', type: 'network-error' },
      { name: '并发冲突测试', type: 'concurrency' }
    ];

    negativeScenarios.forEach(scenario => {
      const testCase = {
        id: this.generateTestCaseId(),
        title: `负面测试: ${scenario.name}`,
        description: `测试系统在${scenario.name}情况下的错误处理`,
        type: 'negative',
        priority: options.priority || 'medium',
        requirementId: 'NEGATIVE_TEST',
        preconditions: '系统正常运行',
        steps: this.generateNegativeTestSteps(scenario),
        expectedResult: `系统正确处理${scenario.name}，显示适当的错误信息`,
        postconditions: '系统恢复正常状态',
        testData: this.generateNegativeTestData(scenario),
        environment: 'Test Environment',
        category: 'negative',
        tags: ['negative', scenario.type, 'error-handling']
      };

      testCases.push(testCase);
    });

    return testCases;
  }

  /**
   * 生成性能测试用例
   */
  generatePerformanceTestCases(requirements, options) {
    const testCases = [];
    const performanceScenarios = [
      { name: '响应时间测试', type: 'response-time', metric: '响应时间 < 2秒' },
      { name: '并发用户测试', type: 'concurrent-users', metric: '支持100并发用户' },
      { name: '负载测试', type: 'load-test', metric: '系统稳定运行' },
      { name: '压力测试', type: 'stress-test', metric: '优雅降级' }
    ];

    performanceScenarios.forEach(scenario => {
      const testCase = {
        id: this.generateTestCaseId(),
        title: `性能测试: ${scenario.name}`,
        description: `验证系统的${scenario.name}性能指标`,
        type: 'performance',
        priority: options.priority || 'medium',
        requirementId: 'PERFORMANCE_TEST',
        preconditions: '性能测试环境已准备，监控工具已配置',
        steps: this.generatePerformanceTestSteps(scenario),
        expectedResult: `系统满足性能要求: ${scenario.metric}`,
        postconditions: '性能数据已收集和分析',
        testData: this.generatePerformanceTestData(scenario),
        environment: 'Performance Test Environment',
        category: 'performance',
        tags: ['performance', scenario.type, 'non-functional']
      };

      testCases.push(testCase);
    });

    return testCases;
  }

  /**
   * 生成安全测试用例
   */
  generateSecurityTestCases(requirements, options) {
    const testCases = [];
    const securityScenarios = [
      { name: 'SQL注入测试', type: 'sql-injection' },
      { name: 'XSS攻击测试', type: 'xss' },
      { name: '身份验证测试', type: 'authentication' },
      { name: '授权测试', type: 'authorization' },
      { name: '数据加密测试', type: 'encryption' }
    ];

    securityScenarios.forEach(scenario => {
      const testCase = {
        id: this.generateTestCaseId(),
        title: `安全测试: ${scenario.name}`,
        description: `验证系统的${scenario.name}安全防护`,
        type: 'security',
        priority: 'high',
        requirementId: 'SECURITY_TEST',
        preconditions: '安全测试环境已准备，测试工具已配置',
        steps: this.generateSecurityTestSteps(scenario),
        expectedResult: `系统成功防御${scenario.name}攻击`,
        postconditions: '系统安全状态正常',
        testData: this.generateSecurityTestData(scenario),
        environment: 'Security Test Environment',
        category: 'security',
        tags: ['security', scenario.type, 'vulnerability']
      };

      testCases.push(testCase);
    });

    return testCases;
  }

  /**
   * 为非功能需求生成测试用例
   */
  generateNonFunctionalTestCases(nonFunctionalRequirements, options) {
    const testCases = [];

    nonFunctionalRequirements.forEach(requirement => {
      const testCase = {
        id: this.generateTestCaseId(),
        title: `非功能测试: ${requirement.description}`,
        description: `验证系统的非功能需求: ${requirement.description}`,
        type: requirement.type || 'non-functional',
        priority: options.priority || 'medium',
        requirementId: requirement.id,
        preconditions: this.generateNFRPreconditions(requirement),
        steps: this.generateNFRTestSteps(requirement),
        expectedResult: `系统满足非功能需求: ${requirement.description}`,
        postconditions: '非功能需求得到验证',
        testData: this.generateNFRTestData(requirement),
        environment: 'Test Environment',
        category: 'non-functional',
        tags: ['non-functional', requirement.type || 'other']
      };

      testCases.push(testCase);
    });

    return testCases;
  }

  // 辅助方法

  generateTestCaseId() {
    return `TC_${String(this.testCaseCounter++).padStart(4, '0')}`;
  }

  generatePreconditions(requirement) {
    const commonPreconditions = [
      '系统已正常启动并运行',
      '用户已成功登录系统',
      '测试数据已准备完毕',
      '网络连接正常'
    ];

    if (requirement.description.includes('登录') || requirement.description.includes('认证')) {
      return '系统已启动，用户未登录';
    }

    return commonPreconditions.join('；');
  }

  generateTestSteps(requirement, testType) {
    const steps = [];
    
    if (testType === 'positive') {
      steps.push(
        { step: 1, action: '打开系统主界面', expectedResult: '系统主界面正常显示' },
        { step: 2, action: `执行${requirement.description}相关操作`, expectedResult: '操作界面正常显示' },
        { step: 3, action: '输入有效的测试数据', expectedResult: '数据输入成功' },
        { step: 4, action: '点击确认/提交按钮', expectedResult: '操作执行成功' },
        { step: 5, action: '验证操作结果', expectedResult: '结果符合预期' }
      );
    }

    return steps;
  }

  generateValidationTestSteps(requirement) {
    return [
      { step: 1, action: '打开相关功能界面', expectedResult: '界面正常显示' },
      { step: 2, action: '输入无效数据（如空值、超长字符串、特殊字符等）', expectedResult: '数据输入完成' },
      { step: 3, action: '尝试提交数据', expectedResult: '系统显示验证错误信息' },
      { step: 4, action: '修正输入数据为有效值', expectedResult: '数据修正完成' },
      { step: 5, action: '重新提交数据', expectedResult: '数据提交成功' }
    ];
  }

  generateUserStoryTestSteps(story) {
    return [
      { step: 1, action: `以${story.role}身份登录系统`, expectedResult: '登录成功，显示相应权限界面' },
      { step: 2, action: `导航到${story.goal}相关功能`, expectedResult: '功能界面正常显示' },
      { step: 3, action: `执行${story.goal}操作`, expectedResult: '操作过程顺畅' },
      { step: 4, action: '完成操作并确认结果', expectedResult: `成功实现${story.benefit}` }
    ];
  }

  generateAcceptanceTestSteps(criteria) {
    return [
      { step: 1, action: '准备验收测试环境和数据', expectedResult: '环境和数据准备完毕' },
      { step: 2, action: `执行与"${criteria.description}"相关的操作`, expectedResult: '操作执行完成' },
      { step: 3, action: '检查系统行为和输出结果', expectedResult: '行为和结果符合验收标准' },
      { step: 4, action: '验证数据完整性和一致性', expectedResult: '数据完整且一致' }
    ];
  }

  generateBoundaryTestSteps(scenario) {
    const stepMap = {
      'min-boundary': [
        { step: 1, action: '输入最小允许值', expectedResult: '系统接受输入' },
        { step: 2, action: '输入小于最小值的数据', expectedResult: '系统拒绝输入并提示错误' }
      ],
      'max-boundary': [
        { step: 1, action: '输入最大允许值', expectedResult: '系统接受输入' },
        { step: 2, action: '输入大于最大值的数据', expectedResult: '系统拒绝输入并提示错误' }
      ],
      'null-boundary': [
        { step: 1, action: '输入空值或null', expectedResult: '系统正确处理空值情况' }
      ],
      'length-boundary': [
        { step: 1, action: '输入超长字符串', expectedResult: '系统正确处理超长输入' }
      ]
    };

    return stepMap[scenario.type] || [
      { step: 1, action: `执行${scenario.name}测试`, expectedResult: '系统正确处理边界情况' }
    ];
  }

  generateNegativeTestSteps(scenario) {
    const stepMap = {
      'invalid-input': [
        { step: 1, action: '输入无效格式的数据', expectedResult: '系统显示格式错误提示' },
        { step: 2, action: '输入恶意代码', expectedResult: '系统过滤恶意代码' }
      ],
      'unauthorized': [
        { step: 1, action: '使用无权限用户尝试访问', expectedResult: '系统拒绝访问并提示权限不足' }
      ],
      'network-error': [
        { step: 1, action: '模拟网络中断', expectedResult: '系统显示网络错误提示' },
        { step: 2, action: '恢复网络连接', expectedResult: '系统自动重连或提示重试' }
      ],
      'concurrency': [
        { step: 1, action: '多用户同时操作同一资源', expectedResult: '系统正确处理并发冲突' }
      ]
    };

    return stepMap[scenario.type] || [
      { step: 1, action: `执行${scenario.name}`, expectedResult: '系统正确处理异常情况' }
    ];
  }

  generatePerformanceTestSteps(scenario) {
    return [
      { step: 1, action: '启动性能监控工具', expectedResult: '监控工具正常运行' },
      { step: 2, action: `执行${scenario.name}`, expectedResult: '测试负载正常施加' },
      { step: 3, action: '收集性能数据', expectedResult: '性能数据收集完成' },
      { step: 4, action: '分析性能指标', expectedResult: `性能指标满足要求：${scenario.metric}` }
    ];
  }

  generateSecurityTestSteps(scenario) {
    const stepMap = {
      'sql-injection': [
        { step: 1, action: '在输入框中输入SQL注入代码', expectedResult: '系统过滤或转义恶意SQL代码' }
      ],
      'xss': [
        { step: 1, action: '输入XSS攻击脚本', expectedResult: '系统过滤或转义恶意脚本' }
      ],
      'authentication': [
        { step: 1, action: '测试弱密码登录', expectedResult: '系统拒绝弱密码' },
        { step: 2, action: '测试暴力破解防护', expectedResult: '系统启动防护机制' }
      ],
      'authorization': [
        { step: 1, action: '测试越权访问', expectedResult: '系统拒绝越权操作' }
      ],
      'encryption': [
        { step: 1, action: '检查数据传输加密', expectedResult: '敏感数据已加密传输' }
      ]
    };

    return stepMap[scenario.type] || [
      { step: 1, action: `执行${scenario.name}`, expectedResult: '系统安全防护正常' }
    ];
  }

  generateNFRTestSteps(requirement) {
    const typeMap = {
      'performance': [
        { step: 1, action: '执行性能测试', expectedResult: '性能指标达标' }
      ],
      'security': [
        { step: 1, action: '执行安全测试', expectedResult: '安全要求满足' }
      ],
      'usability': [
        { step: 1, action: '执行可用性测试', expectedResult: '用户体验良好' }
      ],
      'reliability': [
        { step: 1, action: '执行可靠性测试', expectedResult: '系统稳定可靠' }
      ]
    };

    return typeMap[requirement.type] || [
      { step: 1, action: `验证${requirement.description}`, expectedResult: '非功能需求得到满足' }
    ];
  }

  generateExpectedResult(requirement, testType) {
    if (testType === 'positive') {
      return `${requirement.description}功能正常工作，操作成功完成，结果符合预期`;
    }
    return '系统行为符合预期';
  }

  generateTestData(requirement, testType) {
    const dataMap = {
      'positive': '有效的测试数据集',
      'validation': '包含有效和无效数据的测试集',
      'boundary': '边界值测试数据',
      'negative': '异常和错误数据集'
    };

    return dataMap[testType] || '标准测试数据集';
  }

  generateUserStoryTestData(story) {
    return `${story.role}相关的测试数据和权限配置`;
  }

  generateAcceptanceTestData(criteria) {
    return `验收测试专用数据集，覆盖${criteria.description}的各种场景`;
  }

  generateBoundaryTestData(scenario) {
    const dataMap = {
      'min-boundary': '最小值和小于最小值的数据',
      'max-boundary': '最大值和大于最大值的数据',
      'null-boundary': '空值、null、undefined等数据',
      'length-boundary': '超长字符串和边界长度数据'
    };

    return dataMap[scenario.type] || '边界值测试数据';
  }

  generateNegativeTestData(scenario) {
    const dataMap = {
      'invalid-input': '无效格式、恶意代码、特殊字符等',
      'unauthorized': '无权限用户账号',
      'network-error': '网络异常模拟数据',
      'concurrency': '并发操作测试数据'
    };

    return dataMap[scenario.type] || '异常测试数据';
  }

  generatePerformanceTestData(scenario) {
    return `${scenario.name}专用的大量测试数据和负载配置`;
  }

  generateSecurityTestData(scenario) {
    return `${scenario.name}相关的安全测试数据和攻击向量`;
  }

  generateNFRTestData(requirement) {
    return `${requirement.type}测试相关的专用数据集`;
  }

  generateNFRPreconditions(requirement) {
    const typeMap = {
      'performance': '性能测试环境已配置，监控工具已准备',
      'security': '安全测试环境已隔离，安全工具已配置',
      'usability': '可用性测试环境和用户已准备',
      'reliability': '可靠性测试环境和长期测试计划已准备'
    };

    return typeMap[requirement.type] || '测试环境已准备，相关工具已配置';
  }

  requiresInputValidation(requirement) {
    const validationKeywords = ['输入', '录入', '填写', '提交', '表单', 'input', 'form', 'submit'];
    return validationKeywords.some(keyword => 
      requirement.description.toLowerCase().includes(keyword)
    );
  }
}

module.exports = TestCaseGenerator;