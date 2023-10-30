const log4js = require('log4js');
const logPath = process.env.log_path;

log4js.configure({
    appenders: {
        dateFile: {
            type: 'dateFile',
            filename: logPath + 'monetchat_',
            pattern: 'yyyy-MM-dd.log',
            alwaysIncludePattern: true,
            compress: true, // 압축 활성화
            maxLogSize: 100000000, // 100MB
        }
    },
    categories: { default: { appenders: ['dateFile'], level: 'info' } }
});

const logger = log4js.getLogger(); 
module.exports = logger;
