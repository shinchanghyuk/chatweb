const mysql = require('mysql');

const fs = require('fs');
const path = require('path');

const rawConfig = fs.readFileSync('config.json');
const config = JSON.parse(rawConfig);

// 설정 파일에서 데이터베이스 연결 정보 추출
const dbHost = config.database.host;
const dbUser = config.database.user;
const dbPassword = config.database.password;
const dbName = config.database.database;

// MySQL 연결 설정
const connection = mysql.createConnection({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbName,
});

// const connection = mysql.createConnection({
//   host: 'localhost',
//   user: 'monetchat',
//   password: 'fnehfvmsla1!',
//   database: 'monetchatDB',
// });

// MySQL 연결
function connect() {
  connection.connect((err) => {
    if (err) {
      console.error('MySQL 연결 오류:', err);
    } else {
      console.log('MySQL 연결 성공');
    }
  });
}

// 쿼리 실행 함수
function executeQuery(query, values, callback) {
  connection.query(query, values, (err, rows, fields) => {
    if (err) {
      console.error('쿼리 오류:', err);
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