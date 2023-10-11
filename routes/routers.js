// express로 서버구축
const express = require('express');
const path = require('path');

const router = express.Router();
const emailAuthentication = require('../utils/emailAuthentication');

// 데이터베이스 커넥션 파일
const monetchatDB = require('../utils/databases.js');


// localhost:8080
// monet 채팅서비스 웹 접속
// 리엑트와 같이할 때는 필요없어보임
// router.post('/', (req, res) => {
//     console.log("rouers - root POST");
//     console.log("rouers - root POST path : " + path.join(__dirname, 'frontend/build', 'index.html'));
    
//     res.status(200).sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
//     // res.status(200).sendFile(path.join(__dirname, 'public', 'index.html'));
//     // res.status(200).json({ message: '데이터를 성공적으로 받았습니다.' });
// });

// localhost:8080/userCheck
// 사용자 아이디 중복체크 API
router.post('/userCheck', (req, res) => {
    console.log("rouers - userCheck, req.body : ", req.body);

    // 중복체크 관련 데이터베이스 작업
    const query = 'SELECT COUNT(*) AS totcnt from t_account where userid=?';
    const values = [req.body.userid];

    monetchatDB.executeQuery(query, values, function(err, rows) {
        if(!err) {
            console.log('routers - userCheck executeQuery rows[0].totcnt  : ', rows[0].totcnt);

            if(rows[0].totcnt === 0) {
                res.status(200).send('userCheck success');
            } else {
                res.status(200).send('userCheck fail');   
            }
        } else {
            console.log('routers - userCheck executeQuery Exception  : ', err);
            res.status(500).send(err);
        }
    });
});

// localhost:8080/emailAuthentication
// 사용자 이메일 인증 API
router.post('/emailAuthentication', (req, res) => {
    console.log("rouers - emailAuthentication, req.body : ", req.body);

    let emailcode = getGenerateEmailCode();

    if(emailAuthentication.sendAuthenticationEmail(req.body.email, emailcode)) { 

        const query = 'INSERT INTO t_emailAuthentication (userid, email, emailcode, createtime) VALUES (?, ?, ?, ?)';
        const values = [req.body.userid, req.body.email, emailcode, dateFormat()];

        // 이메일 관련 데이터베이스 작업
        monetchatDB.executeQuery(query, values, function(err, rows) {
            if(!err) {
                res.status(200).send('emailcode send success');
            } else {
                console.log('chatmessage - insert executeQuery Exception  : ', err);
                res.status(500).send(err);
            }
          });
    } else {
        res.status(200).send('emailcode send fail');
    }
});
  

// localhost:8080/emailVerify
// 사용자 이메일 인증코드 확인 API
router.post('/emailVerify', function(req, res) {
    console.log("routers - emailVerify, req.body : ", req.body);

    // 제일 최신 이메일 데이터 가져오기
    let query = 'SELECT COUNT(*) AS totcnt, authenticationCount FROM t_emailAuthentication WHERE status=1 AND userid=? AND email=? AND emailcode=? ORDER BY createtime DESC LIMIT 1';
    let values = [req.body.userid, req.body.email, req.body.emailcode];

    // 이메일 관련 데이터베이스 작업
    monetchatDB.executeQuery(query, values, function(err, rows) {
        if(!err) {
            let result = false;
            let message = '';
            let authenticationCount = rows[0].authenticationCount;

            console.log("routers - emailVerify, authenticationCount : " + authenticationCount);

            if(authenticationCount < 4) { 
                if(rows[0].totcnt === 1) {
                    result = true;
                } else { 
                    result = false;
                }
            } else { 
                result = true;
            }
            
            // 해당 이메일에 대한 인증번호를 마쳤기 때문에 그 이전의 시도한 이메일 데이터가 있다면 그 또한 status를 0으로 변경함
            if(result) {
                console.log("")
                query = 'UPDATE t_emailAuthentication SET status=0 WHERE status=1 AND userid=? AND email=?';
                values = [req.body.userid, req.body.email];

                if(authenticationCount < 4) {
                    message = 'email verify success';
                } else {
                    message = 'email verify reset';
                }
            } else {
                query = 'UPDATE t_emailAuthentication SET authenticationCount=? WHERE status=1 AND userid=? AND email=?';
                values = [authenticationCount, req.body.userid, req.body.email];
                message = 'email verify fail';
            }

            res.status(200).send(message);
        } else {
            console.log('chatmessage - insert executeQuery Exception  : ', err);
            res.status(500).send(err);
        }
    });
});

// localhost:8080/signUp
// 사용자 회원가입 API
router.post('/signUp', (req, res) => {
    console.log("routers - signUp, req.body : ", req.body);

     // 회원가입 쿼리 및 데이터
     const query = 'INSERT INTO t_account (userid, username, email, password, createtime) VALUES (?, ?, ?, ?, ?)';
     const values = [req.body.userid, req.body.username, req.body.email, req.body.password, dateFormat()];
 
     // 이메일 관련 데이터베이스 작업
     monetchatDB.executeQuery(query, values, function(err, rows) {
         if(!err) {
            res.status(200).send('signUp success');
         } else { 
            console.log('routers - signUp executeQuery Exception  : ', err);
            res.status(500).send(err);
         }
     });

});


// localhost:8080/signIn
// 사용자 로그인 API
router.post('/signIn', (req, res) => {
    console.log("routers - signIn, req.body : ", req.body);

    // 중복체크 관련 데이터베이스 작업
    const query = 'SELECT COUNT(*) AS totcnt, username, usertype FROM t_account WHERE userid=? AND password=?';
    const values = [req.body.userid, req.body.password];

    monetchatDB.executeQuery(query, values, function(err, rows) {
        if(!err) {
            console.log("routers - signIn totcnt : " + rows[0].totcnt);
            if(rows[0].totcnt == 1) {
                let result = rows[0];
                console.log("routers - signIn result : ", result);
                // res.status(200).send('signIn success');
                res.status(200).json({ username : result.username, usertype : result.usertype, message : "signIn success"});
            } else {
                res.status(200).send('signIn fail'); 
            }
        } else {
            console.log('routers - signIn executeQuery Exception  : ', err);
            res.status(500).send(err);
        }
    });
});

function getGenerateEmailCode() {
    // 6자리의 무작위 숫자 생성
    let code = '';
    for (let i = 0; i < 6; i++) {
        const randomDigit = Math.floor(Math.random() * 10); // 0부터 9까지의 무작위 숫자 생성
        code += randomDigit.toString(); // 문자열로 변환하여 코드에 추가
    }
    
    return code;  
}

// 현재시간 yyyymmddhhmmss 형식으로 변경해주는 함수
function dateFormat() {
    const now = new Date();

    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}


module.exports = router;


  