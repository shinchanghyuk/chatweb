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

const logger = require('./utils/log4js.js'); 

// JSON 통신 및 form-urlencoded 통신을 받는다는 설정
app.use(express.json()); 
app.use(express.urlencoded( {extended : false } ));

// 라우터
app.use("/monetchat", router);
app.use("/monetchat/user", monetRouter);
app.use("/monetchat/chat", monetChatRouter);

// 노드 PORT
const port = process.env.node_port;

// 데이터베이스 커넥션 파일
const monetchatDB = require('./utils/databases.js');
monetchatDB.connect();

// 정적파일 경로
// frontend/build - 리엑트&노드 같이 사용할 때
// public - 노드만 사용할 때
app.use(express.static(path.join(__dirname, 'frontend/build')));
// app.use(express.static(path.join(__dirname, 'public')));
  
app.listen(port, () => {
    logger.info('app listen port : ' + port);
});