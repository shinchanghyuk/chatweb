// express로 서버구축
const express = require('express');
const path = require('path');

const router = express.Router();
const emailAuthentication = require('../utils/emailAuthentication');

// 데이터베이스 커넥션 파일
const monetchatDB = require('../utils/databases.js');
const webSocket = require('../utils/webSocketServer.js');

const cors = require('cors');
router.use(cors('http://3.37.92.0'));

// // localhost:8080/notification
// router.get('/notification', (req, res) => {
//     console.log("monetRouters, notification, req.body : ", req.body);
// });

// localhost:8080/monetchat/user/userCheck
// 사용자 아이디 중복체크 API
router.post('/userCheck', (req, res) => {
    console.log("monetRouters - userCheck, req.body : ", req.body);

    // 중복체크 관련 데이터베이스 작업
    const query = 'SELECT COUNT(*) AS totcnt from t_account where userid=?';
    const values = [req.body.userid];

    monetchatDB.executeQuery(query, values, function(err, rows) {
        if(!err) {
            console.log('monetRouters - userCheck executeQuery rows[0].totcnt  : ', rows[0].totcnt);

            if(rows[0].totcnt === 0) {
                res.status(200).send('userCheck success');
            } else {
                res.status(200).send('userCheck fail');   
            }
        } else {
            console.log('monetRouters - userCheck executeQuery Exception  : ', err);
            res.status(500).send(err);
        }
    });
});

// localhost:8080/monetchat/user/emailAuthentication
// 사용자 이메일 인증 API
router.post('/emailAuthentication', (req, res) => {
    console.log("monetRouters - emailAuthentication, req.body : ", req.body);

    let emailcode = getGenerateEmailCode();

    // 비밀번호 재설정일 때(전송된 데이터가 유효한 데이터인지 검증 )
    if(req.body.type === 'find') {
        const query = 'SELECT COUNT(*) AS totcnt FROM t_account WHERE userid=? AND email=?';
        const values = [req.body.userid, req.body.email];

        monetchatDB.executeQuery(query, values, function(err, rows) {
            if(!err) {
                if(rows[0].totcnt !== 1) {
                    console.log("monetRouters - emailAuthentication, userData invaild");
                    res.status(200).send('userData invaild');
                } else {
                    console.log("monetRouters - emailAuthentication, userData vaild, emailSend");
                    emailSend(req.body.userid, req.body.email, emailcode).then(result => {
                        console.log('monetRouters - emailAuthentication, result : ', result);
                        res.status(200).send(result);
                    }).catch(error => {
                        console.error('monetRouters - emailAuthentication Exception : ', error);
                        res.status(500).send(error);
                    });

                }
            }
        });
    } else {
        emailSend(req.body.userid, req.body.email, emailcode).then(result => {
            console.log('monetRouters - emailAuthentication, result : ', result);
            res.status(200).send(result);
        }).catch(error => {
            console.error('monetRouters - emailAuthentication Exception : ', error);
            res.status(500).send(error);
        });
    }
});

// 이메일 전송 함수
function emailSend(userid, email, emailcode) {
    let result= '';

    return new Promise((resolve, reject) => {
        if(emailAuthentication.sendAuthenticationEmail(email, emailcode)) {
            const query = 'INSERT INTO t_emailAuthentication (userid, email, emailcode, createtime) VALUES (?, ?, ?, ?)';
            const values = [userid, email, emailcode, dateFormat()];
        
            // 이메일 관련 데이터베이스 작업
            monetchatDB.executeQuery(query, values, function(err, rows) {
                if(!err) {
                    result = 'emailcode send success';
                    resolve(result);
                } else {
                    console.log('monetRouters - emailAuthentication chatmessage - insert executeQuery Exception  : ', err);
                    reject(err);
                }
            });
        } else {
            result = 'emailcode send fail';
            resolve(result);
        }
    });
}
  

// localhost:8080/monetchat/user/emailVerify
// 사용자 이메일 인증코드 확인 API
router.post('/emailVerify', function(req, res) {
    console.log("monetRouters - emailVerify, req.body : ", req.body);

    // 제일 최신 이메일 데이터 가져오기
    let query = 'SELECT COUNT(*) AS totcnt, authenticationCount FROM t_emailAuthentication WHERE status=1 AND userid=? AND email=? AND emailcode=? ORDER BY createtime DESC LIMIT 1';
    let values = [req.body.userid, req.body.email, req.body.emailcode];

    // 이메일 관련 데이터베이스 작업
    monetchatDB.executeQuery(query, values, function(err, rows) {
        if(!err) {
            let result = false;
            let message = '';
            let authenticationCount = rows[0].authenticationCount;

            console.log("monetRouters - emailVerify, totcnt : " + rows[0].totcnt + ", authenticationCount : " + authenticationCount);

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
                console.log("monetRouters - emailVerify, authentication success");

                query = 'UPDATE t_emailAuthentication SET status=0 WHERE status=1 AND userid=? AND email=?';
                values = [req.body.userid, req.body.email];

                if(authenticationCount < 4) {
                    message = 'email verify success';
                } else {
                    message = 'email verify reset';
                }
            } else {
                console.log("monetRouters - emailVerify, authentication fail");

                query = 'UPDATE t_emailAuthentication SET authenticationCount=? WHERE status=1 AND userid=? AND email=?';
                values = [authenticationCount, req.body.userid, req.body.email];
                message = 'email verify fail';
            }

            monetchatDB.executeQuery(query, values, function(err, rows) {
                if(!err) {
                    console.log("monetRouters - emailVerify, status modify executeQuery");
                    res.status(200).send(message);
                } else {
                    console.log("monetRouters - emailVerify, status modify executeQuery Exception : ", err);
                    res.status(500).send(err);
                }
            });
        } else {
            console.log('monetRouters - emailVerify - insert executeQuery Exception  : ', err);
            res.status(500).send(err);
        }
    });
});

// localhost:8080/monetchat/user/signUp
// 사용자 회원가입 API
router.post('/signUp', (req, res) => {
    console.log("monetRouters - signUp, req.body : ", req.body);

     // 회원가입 쿼리 및 데이터
     const query = 'INSERT INTO t_account (userid, username, email, password, createtime) VALUES (?, ?, ?, ?, ?)';
     const values = [req.body.userid, req.body.username, req.body.email, req.body.password, dateFormat()];
 
     // 이메일 관련 데이터베이스 작업
     monetchatDB.executeQuery(query, values, function(err, rows) {
         if(!err) {
            res.status(200).send('signUp success');
         } else { 
            console.log('monetRouters - signUp executeQuery Exception  : ', err);
            res.status(500).send(err);
         }
     });
});

// localhost:8080/monetchat/user/signIn
// 사용자 로그인 API
router.post('/signIn', (req, res) => {
    console.log("monetRouters - signIn, req.body : ", req.body);

    // 중복체크 관련 데이터베이스 작업
    const query = 'SELECT COUNT(*) AS totcnt, username, usertype FROM t_account WHERE userid=? AND password=?';
    const values = [req.body.userid, req.body.password];

    let message = '';

    monetchatDB.executeQuery(query, values, function(err, rows) {
        if(!err) {
            console.log("monetRouters - signIn totcnt : " + rows[0].totcnt);
            if(rows[0].totcnt == 1) {
                let result = rows[0];
                console.log("monetRouters - signIn result : ", result);

                webSocket.userWebsocketSearch(req.body.userid).then(response => {
                    if(!response) {
                        message = 'signIn success(normal)'
                    } else {    
                        message = 'signIn success(abnormal)'
                    }
                    // res.status(200).send('signIn success');
                    res.status(200).json({ username : result.username, usertype : result.usertype, message : message});
                }).catch(error => {
                    console.error('monetchatRouters, Updated user list Exception : ', error);
                });
            } else {
                message = 'signIn fail';
                res.status(200).json({message: message}); 
            }
        } else {
            console.log('monetRouters - signIn executeQuery Exception  : ', err);
            res.status(500).send(err);
        }
    });
});

// localhost:8080/monetchat/user/signIdFind
// 사용자 아이디 찾기 API
router.post('/signIdFind', (req, res) => {
    console.log("monetRouters - signIdFind, req.body : ", req.body);

    const query = 'SELECT COUNT(*) AS totcnt, userid FROM t_account WHERE username=? AND email=? AND status=1';
    const values = [req.body.username, req.body.email];

    let message = '';

    monetchatDB.executeQuery(query, values, function(err, rows) {
        if(!err) {
            console.log("monetRouters - signIdFind totcnt : " + rows[0].totcnt);
            if(rows[0].totcnt == 1) {
                let result = rows[0];
                console.log("monetRouters - signIdFind result : ", result);

                message = 'signIdFind success'

                res.status(200).json({ userid : result.userid, message : message});
            } else {
                message = 'signIdFind fail';
                res.status(200).json({message: message}); 
            }
        } else {
            console.log('monetRouters - signIn executeQuery Exception  : ', err);
            res.status(500).send(err);
        }
    });
});

// localhost:8080/monetchat/user/signPwFind
// 사용자 비밀번호 재설정 API
router.post('/signPwSetting', (req, res) => {
    console.log("monetRouters - signPwSetting, req.body : ", req.body);

    const query = 'SELECT COUNT(*) AS totcnt, userid FROM t_account WHERE userid=? AND status=1';
    const values = [req.body.userid];

    let message = '';

    monetchatDB.executeQuery(query, values, function(err, rows) {
        if(!err) {
            console.log("monetRouters - signPwSetting totcnt : " + rows[0].totcnt);
            if(rows[0].totcnt == 1) {
                const query = 'UPDATE t_account SET password=? WHERE userid=? AND status=1';
                const values = [req.body.password, req.body.userid];

                monetchatDB.executeQuery(query, values, function(err, rows) {
                    if(!err) {
                        console.log('monetRouters - signPwSetting executeQuery');

                        message = 'signPwSetting success'
                        res.status(200).json({ message : message});
                    } else {
                        console.log('monetRouters - signPwSetting UPDATE executeQuery Exception  : ', err);
                        res.status(500).send(err);
                    }
                });
            } else {
                message = 'signPwSetting fail';
                res.status(200).json({message: message}); 
            }
        } else {
            console.log('monetRouters - signPwSetting executeQuery Exception  : ', err);
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


  