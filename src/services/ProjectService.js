const ProjectRepository = require('../repositories/ProjectRepository');
const { AppError } = require('../utils/errors');

class ProjectService {
    constructor(database) {
        this.projectRepository = new ProjectRepository(database);
    }

    async createProject(projectData) {
        // 验证项目数据
        this._validateProjectData(projectData);

        try {
            return await this.projectRepository.createProject(projectData);
        } catch (error) {
            throw new AppError('创建项目失败', 500, error.message);
        }
    }

    async getProjects() {
        try {
            return await this.projectRepository.getProjects();
        } catch (error) {
            throw new AppError('获取项目列表失败', 500, error.message);
        }
    }

    async getProject(id) {
        try {
            const project = await this.projectRepository.getProject(id);
            if (!project) {
                throw new AppError('项目不存在', 404);
            }
            return project;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('获取项目详情失败', 500, error.message);
        }
    }

    async updateProject(id, updateData) {
        // 验证更新数据
        if (Object.keys(updateData).length === 0) {
            throw new AppError('没有需要更新的字段', 400);
        }

        try {
            // 检查项目是否存在
            const project = await this.projectRepository.getProject(id);
            if (!project) {
                throw new AppError('项目不存在', 404);
            }

            return await this.projectRepository.updateProject(id, updateData);
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('更新项目失败', 500, error.message);
        }
    }

    async deleteProject(id) {
        try {
            // 检查项目是否存在
            const project = await this.projectRepository.getProject(id);
            if (!project) {
                throw new AppError('项目不存在', 404);
            }

            return await this.projectRepository.deleteProject(id);
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('删除项目失败', 500, error.message);
        }
    }

    async getProjectStats(projectId) {
        try {
            // 检查项目是否存在
            const project = await this.projectRepository.getProject(projectId);
            if (!project) {
                throw new AppError('项目不存在', 404);
            }

            return await this.projectRepository.getProjectStats(projectId);
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('获取项目统计信息失败', 500, error.message);
        }
    }

    _validateProjectData(projectData) {
        if (!projectData.name || typeof projectData.name !== 'string') {
            throw new AppError('项目名称不能为空且必须是字符串', 400);
        }

        if (!projectData.version || typeof projectData.version !== 'string') {
            throw new AppError('项目版本不能为空且必须是字符串', 400);
        }

        if (projectData.description && typeof projectData.description !== 'string') {
            throw new AppError('项目描述必须是字符串', 400);
        }
    }
}

module.exports = ProjectService;