const mysql = require('mysql');

const logger = require('./log4js.js'); 

// 설정 파일에서 데이터베이스 연결 정보 추출
const dbHost = process.env.database_host;
const dbUser = process.env.database_user;
const dbPassword = process.env.database_password;
const dbName = process.env.database_database;
const dbPort = process.env.database_port;

// MySQL 연결 설정
const connection = mysql.createConnection({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  port: dbPort
});

// MySQL 연결
function connect() {
  connection.connect((err) => {
    if (err) {
      logger.error('databases - connection Exception : ', err);
    } else {
      logger.info('databases - connection success');
    }
  });
}

// 쿼리 실행 함수
function executeQuery(query, values, callback) {
  connection.query(query, values, (err, rows, fields) => {
    if (err) {
      logger.error('databases executeQuery Exception : ', err);
      callback(err, null, null);
    } else {
      callback(null, rows, fields);
    }
  });
}

// 모듈로 내보내기
module.exports = {
    executeQuery,
    connect,
};