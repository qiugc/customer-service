const fs = require('fs-extra');
const path = require('path');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const { marked } = require('marked');

class DocumentParser {
  constructor() {
    this.supportedFormats = ['.txt', '.md', '.docx', '.pdf'];
  }

  /**
   * 解析文档并提取需求信息
   * @param {string} filePath - 文档文件路径
   * @param {string} mimeType - 文件MIME类型
   * @returns {Object} 解析后的需求信息
   */
  async parseDocument(filePath, mimeType) {
    try {
      const ext = path.extname(filePath).toLowerCase();
      let content = '';

      switch (ext) {
        case '.txt':
          content = await this.parseTxtFile(filePath);
          break;
        case '.md':
          content = await this.parseMarkdownFile(filePath);
          break;
        case '.docx':
          content = await this.parseDocxFile(filePath);
          break;
        case '.pdf':
          content = await this.parsePdfFile(filePath);
          break;
        default:
          throw new Error(`不支持的文件格式: ${ext}`);
      }

      return this.extractRequirements(content);
    } catch (error) {
      throw new Error(`解析文档失败: ${error.message}`);
    }
  }

  /**
   * 解析TXT文件
   */
  async parseTxtFile(filePath) {
    return await fs.readFile(filePath, 'utf8');
  }

  /**
   * 解析Markdown文件
   */
  async parseMarkdownFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    return marked(content);
  }

  /**
   * 解析DOCX文件
   */
  async parseDocxFile(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  /**
   * 解析PDF文件
   */
  async parsePdfFile(filePath) {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }

  /**
   * 从文档内容中提取需求信息
   * @param {string} content - 文档内容
   * @returns {Object} 结构化的需求信息
   */
  extractRequirements(content) {
    const requirements = {
      title: this.extractTitle(content),
      description: this.extractDescription(content),
      functionalRequirements: this.extractFunctionalRequirements(content),
      nonFunctionalRequirements: this.extractNonFunctionalRequirements(content),
      userStories: this.extractUserStories(content),
      acceptanceCriteria: this.extractAcceptanceCriteria(content),
      businessRules: this.extractBusinessRules(content),
      constraints: this.extractConstraints(content),
      assumptions: this.extractAssumptions(content)
    };

    return requirements;
  }

  /**
   * 提取文档标题
   */
  extractTitle(content) {
    // 查找标题模式
    const titlePatterns = [
      /^#\s+(.+)$/m,  // Markdown H1
      /^(.+)\n=+$/m,  // 下划线标题
      /项目名称[：:]\s*(.+)/i,
      /系统名称[：:]\s*(.+)/i,
      /需求文档[：:]\s*(.+)/i
    ];

    for (const pattern of titlePatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return '未命名项目';
  }

  /**
   * 提取项目描述
   */
  extractDescription(content) {
    const descPatterns = [
      /项目描述[：:]\s*([^。！？\n]+)/i,
      /系统描述[：:]\s*([^。！？\n]+)/i,
      /概述[：:]\s*([^。！？\n]+)/i,
      /简介[：:]\s*([^。！？\n]+)/i
    ];

    for (const pattern of descPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    // 如果没有找到明确的描述，取前200个字符作为描述
    return content.substring(0, 200).replace(/\n/g, ' ').trim() + '...';
  }

  /**
   * 提取功能需求
   */
  extractFunctionalRequirements(content) {
    const requirements = [];
    
    // 查找功能需求章节
    const functionalSection = this.extractSection(content, [
      '功能需求', '功能要求', 'functional requirements', 'features'
    ]);

    if (functionalSection) {
      // 提取编号的需求项
      const numberedItems = functionalSection.match(/\d+[\.\)]\s*([^。！？\n]+)/g);
      if (numberedItems) {
        numberedItems.forEach((item, index) => {
          const cleanItem = item.replace(/^\d+[\.\)]\s*/, '').trim();
          if (cleanItem.length > 5) {
            requirements.push({
              id: `FR_${String(index + 1).padStart(3, '0')}`,
              description: cleanItem,
              priority: this.determinePriority(cleanItem),
              category: 'functional'
            });
          }
        });
      }

      // 提取列表项
      const listItems = functionalSection.match(/[-*]\s*([^。！？\n]+)/g);
      if (listItems) {
        listItems.forEach((item, index) => {
          const cleanItem = item.replace(/^[-*]\s*/, '').trim();
          if (cleanItem.length > 5) {
            requirements.push({
              id: `FR_${String(requirements.length + 1).padStart(3, '0')}`,
              description: cleanItem,
              priority: this.determinePriority(cleanItem),
              category: 'functional'
            });
          }
        });
      }
    }

    return requirements;
  }

  /**
   * 提取非功能需求
   */
  extractNonFunctionalRequirements(content) {
    const requirements = [];
    
    const nfrSection = this.extractSection(content, [
      '非功能需求', '性能需求', 'non-functional requirements', 'performance'
    ]);

    if (nfrSection) {
      const items = nfrSection.match(/[-*\d+\.]\s*([^。！？\n]+)/g);
      if (items) {
        items.forEach((item, index) => {
          const cleanItem = item.replace(/^[-*\d+\.]\s*/, '').trim();
          if (cleanItem.length > 5) {
            requirements.push({
              id: `NFR_${String(index + 1).padStart(3, '0')}`,
              description: cleanItem,
              type: this.determineNFRType(cleanItem),
              category: 'non-functional'
            });
          }
        });
      }
    }

    return requirements;
  }

  /**
   * 提取用户故事
   */
  extractUserStories(content) {
    const stories = [];
    
    // 查找用户故事模式
    const storyPatterns = [
      /作为\s*([^，,]+)[，,]\s*我希望\s*([^，,]+)[，,]\s*以便\s*([^。！？\n]+)/g,
      /As\s+a\s+([^,]+),\s*I\s+want\s+([^,]+),?\s*so\s+that\s+([^。！？\n]+)/gi
    ];

    storyPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        stories.push({
          id: `US_${String(stories.length + 1).padStart(3, '0')}`,
          role: match[1].trim(),
          goal: match[2].trim(),
          benefit: match[3].trim(),
          priority: 'medium'
        });
      }
    });

    return stories;
  }

  /**
   * 提取验收标准
   */
  extractAcceptanceCriteria(content) {
    const criteria = [];
    
    const acSection = this.extractSection(content, [
      '验收标准', '验收条件', 'acceptance criteria'
    ]);

    if (acSection) {
      const items = acSection.match(/[-*\d+\.]\s*([^。！？\n]+)/g);
      if (items) {
        items.forEach((item, index) => {
          const cleanItem = item.replace(/^[-*\d+\.]\s*/, '').trim();
          if (cleanItem.length > 5) {
            criteria.push({
              id: `AC_${String(index + 1).padStart(3, '0')}`,
              description: cleanItem
            });
          }
        });
      }
    }

    return criteria;
  }

  /**
   * 提取业务规则
   */
  extractBusinessRules(content) {
    const rules = [];
    
    const rulesSection = this.extractSection(content, [
      '业务规则', '业务逻辑', 'business rules'
    ]);

    if (rulesSection) {
      const items = rulesSection.match(/[-*\d+\.]\s*([^。！？\n]+)/g);
      if (items) {
        items.forEach((item, index) => {
          const cleanItem = item.replace(/^[-*\d+\.]\s*/, '').trim();
          if (cleanItem.length > 5) {
            rules.push({
              id: `BR_${String(index + 1).padStart(3, '0')}`,
              description: cleanItem
            });
          }
        });
      }
    }

    return rules;
  }

  /**
   * 提取约束条件
   */
  extractConstraints(content) {
    const constraints = [];
    
    const constraintsSection = this.extractSection(content, [
      '约束条件', '限制条件', 'constraints'
    ]);

    if (constraintsSection) {
      const items = constraintsSection.match(/[-*\d+\.]\s*([^。！？\n]+)/g);
      if (items) {
        items.forEach((item, index) => {
          const cleanItem = item.replace(/^[-*\d+\.]\s*/, '').trim();
          if (cleanItem.length > 5) {
            constraints.push({
              id: `CON_${String(index + 1).padStart(3, '0')}`,
              description: cleanItem
            });
          }
        });
      }
    }

    return constraints;
  }

  /**
   * 提取假设条件
   */
  extractAssumptions(content) {
    const assumptions = [];
    
    const assumptionsSection = this.extractSection(content, [
      '假设条件', '假设', 'assumptions'
    ]);

    if (assumptionsSection) {
      const items = assumptionsSection.match(/[-*\d+\.]\s*([^。！？\n]+)/g);
      if (items) {
        items.forEach((item, index) => {
          const cleanItem = item.replace(/^[-*\d+\.]\s*/, '').trim();
          if (cleanItem.length > 5) {
            assumptions.push({
              id: `ASM_${String(index + 1).padStart(3, '0')}`,
              description: cleanItem
            });
          }
        });
      }
    }

    return assumptions;
  }

  /**
   * 提取文档中的特定章节
   */
  extractSection(content, sectionNames) {
    for (const sectionName of sectionNames) {
      const pattern = new RegExp(`${sectionName}[：:]?([\\s\\S]*?)(?=\\n\\s*(?:[一二三四五六七八九十]|\\d+[\\.、]|#{1,6}\\s|$))`, 'i');
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    return null;
  }

  /**
   * 确定需求优先级
   */
  determinePriority(text) {
    const highPriorityKeywords = ['必须', '关键', '重要', '核心', 'critical', 'high', 'must'];
    const lowPriorityKeywords = ['可选', '建议', '优化', 'optional', 'low', 'nice to have'];
    
    const lowerText = text.toLowerCase();
    
    if (highPriorityKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'high';
    } else if (lowPriorityKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'low';
    }
    
    return 'medium';
  }

  /**
   * 确定非功能需求类型
   */
  determineNFRType(text) {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('性能') || lowerText.includes('响应') || lowerText.includes('performance')) {
      return 'performance';
    } else if (lowerText.includes('安全') || lowerText.includes('security')) {
      return 'security';
    } else if (lowerText.includes('可用性') || lowerText.includes('usability')) {
      return 'usability';
    } else if (lowerText.includes('可靠性') || lowerText.includes('reliability')) {
      return 'reliability';
    } else if (lowerText.includes('兼容性') || lowerText.includes('compatibility')) {
      return 'compatibility';
    }
    
    return 'other';
  }
}

module.exports = DocumentParser;