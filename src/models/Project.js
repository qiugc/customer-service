class Project {
    constructor(id, name, version, description, createdAt, updatedAt) {
        this.id = id;
        this.name = name;
        this.version = version;
        this.description = description;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    static fromDatabase(row) {
        return new Project(
            row.id,
            row.name,
            row.version,
            row.description,
            row.created_at,
            row.updated_at
        );
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            version: this.version,
            description: this.description,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Project;