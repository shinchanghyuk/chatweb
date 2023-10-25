const mysql = require('mysql');
const path = require('path');

let envPath;
switch (process.env.NODE_ENV) {
case "prod":
  envPath = `${__dirname}/../.env.prod`;
    break;
case "dev":
  envPath = `${__dirname}/../.env.development`;
    break;
default:
  envPath = `${__dirname}/../../.env.dev`;
}

require('dotenv').config({ path: envPath }); // envPath 설정
console.log(process.env.database_port);

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