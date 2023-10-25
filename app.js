require('dotenv').config({
    path: `.env.${process.env.NODE_ENV}`
});
  
// express로 서버구축
const express = require('express');
const path = require('path');
const app = express();

// 라우터 파일
const router = require('./routes/routers.js');
const monetRouter = require('./routes/monetRouters.js');
const monetChatRouter = require('./routes/monetchatRouters.js');

// JSON 통신 및 form-urlencoded 통신을 받는다는 설정
app.use(express.json()); 
app.use(express.urlencoded( {extended : false } ));

app.use("/", router);
app.use("/monet", monetRouter);
app.use("/monetchat", monetChatRouter);

// const cors = require('cors');
// app.use(cors());

// 노드 PORT
const port = 8080;

// 데이터베이스 커넥션 파일
const monetchatDB = require('./utils/databases.js');
monetchatDB.connect();

// 정적파일 경로
// frontend/build - 리엑트&노드 같이 사용할 때
// public - 노드만 사용할 때
app.use(express.static(path.join(__dirname, 'frontend/build')));
// app.use(express.static(path.join(__dirname, 'public')));
  
app.listen(port, () => {
    console.log(`서버가 포트 ${port}에서 실행 중입니다.`);
});

// // HTTP 서버 생성 (포트 8080을 사용)
// const httpServer = http.createServer((req, res) => {
//   // HTTP 서버 로직
//   // res.writeHead(200, { 'Content-Type': 'text/plain' });
//   // res.end('Hello, HTTP Server!\n');

//   console.log("_dirname : " + path.join(__dirname, 'public', 'index.html'));
//   res.status(200).sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// httpServer.listen(8080, () => {
//   console.log('HTTP 서버가 8080 포트에서 실행 중입니다.');
// });

// const server = http.createServer((req, res) => {
//     // HTTP 서버 로직
//   });

// // HTTP 서버 로직
// httpServer.on('request', (req, res) => {
//   // HTTP 요청 처리\
//   console.log(' on HTTP 서버가 8080 포트에서 실행 중입니다.');
//   console.log("on pain.join 1 : " + path.join(__dirname, 'public', 'index.html'));
//   console.log("on pain.join2  : " +path.join(__dirname, 'public'));

//   //res.writeHead(200, { 'Content-Type': 'text/plain' });
//  //  res.end('Hello, HTTP Server!\n');
//   // res.end(path.join(__dirname, 'public', 'index.html'));

// //  res.sendFile(path.join(__dirname, 'public', 'index.html'));
//   res.writeHead(200, { 'Content-Type': 'text/html' });
//   res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
// });


// WebSocket 서버 생성 및 연결 (포트 8081을 사용)
//createWebSocketServer(httpServer);