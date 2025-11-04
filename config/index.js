require('dotenv').config();
const path = require('path');

module.exports = {
    port: process.env.PORT || 3000,
    database: {
        path: process.env.DB_PATH || path.join(__dirname, '..', 'data', 'testcases.db')
    },
    upload: {
        dir: process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads'),
        maxSize: process.env.MAX_UPLOAD_SIZE || 10 * 1024 * 1024, // 10MB
        allowedTypes: ['.txt', '.md', '.docx', '.pdf', '.csv', '.json', '.xls', '.xlsx']
    },
    log: {
        level: process.env.LOG_LEVEL || 'info'
    },
    pagination: {
        defaultPageSize: 10,
        maxPageSize: 100
    }
};