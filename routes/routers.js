// express로 서버구축
const express = require('express');
const path = require('path');

const router = express.Router();

// localhost:8080
router.get('/', (req, res) => {
    console.log("routers, START");

    res.sendFile(path.resolve('frontend/build/index.html'));
});



// // 회원가입 화면에서 새로고침 시 동작
// router.get('/monetRegister', (req, res) => {
//     console.log("routers - monetRegister");
//     res.sendFile(path.resolve('frontend/build/index.html'));
// });

// // 메인화면에서 새로고침 시 동작
// router.get('/monetMain', (req, res) => {
//     console.log("routers - monetMain");
//     res.sendFile(path.resolve('frontend/build/index.html'));
// });

// // 아이디/비밀번호 찾기에서 새로고침 시 동작
// router.get('/monetForget', (req, res) => {
//     console.log("routers - monetForget");
//     res.sendFile(path.resolve('frontend/build/index.html'));
// });

module.exports = router;


  