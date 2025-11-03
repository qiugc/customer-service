#!/usr/bin/env node

/**
 * 测试用例生成器演示脚本
 * 展示如何使用API接口进行测试用例管理
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

async function demo() {
    console.log('🚀 测试用例生成器演示开始...\n');

    try {
        // 1. 创建项目
        console.log('1. 创建测试项目...');
        const projectResponse = await axios.post(`${BASE_URL}/api/projects`, {
            name: '演示项目',
            version: 'v1.0.0',
            description: '这是一个演示项目，用于展示测试用例管理功能'
        });
        
        const projectId = projectResponse.data.data.id;
        console.log(`✅ 项目创建成功，ID: ${projectId}\n`);

        // 2. 创建测试用例
        console.log('2. 创建测试用例...');
        const testCases = [
            {
                project_id: projectId,
                title: '用户登录功能测试',
                description: '验证用户能够正常登录系统',
                type: 'functional',
                priority: 'high',
                preconditions: '用户已注册且账户状态正常',
                steps: JSON.stringify([
                    '打开登录页面',
                    '输入正确的用户名和密码',
                    '点击登录按钮'
                ]),
                expected_result: '用户成功登录，跳转到主页面',
                test_data: JSON.stringify({
                    username: 'testuser',
                    password: 'password123'
                })
            },
            {
                project_id: projectId,
                title: '密码错误登录测试',
                description: '验证输入错误密码时的处理',
                type: 'functional',
                priority: 'medium',
                preconditions: '用户已注册',
                steps: JSON.stringify([
                    '打开登录页面',
                    '输入正确的用户名和错误的密码',
                    '点击登录按钮'
                ]),
                expected_result: '显示密码错误提示信息',
                test_data: JSON.stringify({
                    username: 'testuser',
                    password: 'wrongpassword'
                })
            }
        ];

        for (const testCase of testCases) {
            const response = await axios.post(`${BASE_URL}/api/test-cases`, testCase);
            console.log(`✅ 测试用例创建成功: ${testCase.title}`);
        }
        console.log('');

        // 3. 获取项目下的测试用例
        console.log('3. 获取项目测试用例列表...');
        const testCasesResponse = await axios.get(`${BASE_URL}/api/test-cases?project_id=${projectId}`);
        console.log(`✅ 获取到 ${testCasesResponse.data.data.length} 个测试用例\n`);

        // 4. 执行测试用例
        console.log('4. 执行测试用例...');
        for (const testCase of testCasesResponse.data.data) {
            const executeResponse = await axios.post(`${BASE_URL}/api/test-cases/${testCase.id}/execute`, {
                status: Math.random() > 0.3 ? 'passed' : 'failed', // 随机结果
                executed_by: '演示用户',
                notes: '演示执行'
            });
            console.log(`✅ 测试用例 "${testCase.title}" 执行完成`);
        }
        console.log('');

        // 5. 获取测试统计报告
        console.log('5. 生成测试统计报告...');
        const reportResponse = await axios.get(`${BASE_URL}/api/reports/test-summary?project_id=${projectId}`);
        const report = reportResponse.data;
        
        console.log('📊 测试统计报告:');
        console.log(`   总测试用例数: ${report.totalTestCases}`);
        console.log(`   已执行用例数: ${report.executedTestCases}`);
        console.log(`   通过用例数: ${report.passedTestCases}`);
        console.log(`   失败用例数: ${report.failedTestCases}`);
        console.log(`   通过率: ${report.passRate}%`);
        console.log('');

        // 6. 获取项目详情
        console.log('6. 获取项目详情...');
        const projectDetailResponse = await axios.get(`${BASE_URL}/api/projects/${projectId}`);
        const projectDetail = projectDetailResponse.data.data;
        
        console.log('📋 项目详情:');
        console.log(`   项目名称: ${projectDetail.name}`);
        console.log(`   项目版本: ${projectDetail.version}`);
        console.log(`   项目描述: ${projectDetail.description}`);
        console.log(`   创建时间: ${new Date(projectDetail.created_at).toLocaleString()}`);
        console.log(`   测试用例数: ${projectDetail.stats ? projectDetail.stats.total_cases : 0}`);
        console.log('');

        console.log('🎉 演示完成！');
        console.log('💡 提示: 你可以访问 http://localhost:3000/manage.html 查看管理界面');

    } catch (error) {
        console.error('❌ 演示过程中出现错误:', error.message);
        if (error.response) {
            console.error('   响应状态:', error.response.status);
            console.error('   响应数据:', error.response.data);
        }
    }
}

// 检查服务器是否运行
async function checkServer() {
    try {
        await axios.get(`${BASE_URL}/api/template`);
        return true;
    } catch (error) {
        return false;
    }
}

async function main() {
    console.log('检查服务器状态...');
    const serverRunning = await checkServer();
    
    if (!serverRunning) {
        console.log('❌ 服务器未运行，请先启动服务器:');
        console.log('   npm start');
        console.log('   然后访问: http://localhost:3000');
        return;
    }
    
    console.log('✅ 服务器运行正常\n');
    await demo();
}

if (require.main === module) {
    main();
}

module.exports = { demo, checkServer };