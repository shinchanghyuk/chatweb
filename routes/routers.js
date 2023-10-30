// express로 서버구축
const express = require('express');
const path = require('path');

const router = express.Router();

const baseUrl = process.env.base_url;

const logger = require('../utils/log4js.js'); 

const cors = require('cors');
router.use(cors(baseUrl));


// localhost:8080
router.get('/', (req, res) => {
    logger.info("routers, START");
    res.sendFile(path.resolve('frontend/build/index.html'));
});

// 회원가입 화면에서 새로고침 시 동작
router.get('/monetRegister', (req, res) => {
    logger.info("routers - monetRegister");
    res.sendFile(path.resolve('frontend/build/index.html'));
});

// 메인화면에서 새로고침 시 동작
router.get('/monetMain', (req, res) => {
    logger.info("routers - monetMain");
    res.sendFile(path.resolve('frontend/build/index.html'));
});

// 아이디/비밀번호 찾기에서 새로고침 시 동작
router.get('/monetForget', (req, res) => {
    logger.info("routers - monetForget");
    res.sendFile(path.resolve('frontend/build/index.html'));
});

module.exports = router;


  