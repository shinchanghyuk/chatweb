// express로 서버구축
const express = require('express');
const path = require('path');

const webSocket = require('../utils/webSocketServer.js');

// 퇴장했을 때 웹 소켓으로 보내는 로직추가( 웹 소켓 체크 - t_chatMessage에 넣기 )

const router = express.Router();

// UUID 생성
const uuid = require('uuid');

// 데이터베이스 커넥션 파일
const monetchatDB = require('../utils/databases.js');

// localhost:8080/monetchat
// monet 채팅서비스 메인화면
router.post('/', (req, res) => {  
    console.log("monetchatRouters, req.body : ", req.body);

    let query = '';
    let values = '';
    let message = '';

    if (req.body.searchType === 'user') {
        // 다른 사용자 정보 데이터 조회 쿼리 - 그룹도 추가해야할 수도 있을 듯함
        query = 'SELECT * FROM t_account WHERE userid !=?';
        values = [req.body.userid];
        message = 'chatuser search success';
    } else if(req.body.searchType === 'room') {
        // 채팅방 데이터 조회 쿼리
        query = 'SELECT cr.*, ca.* FROM t_chatroom cr LEFT JOIN t_chatAccount ca ON cr.roomid = ca.roomid ' +
        'WHERE cr.roomid IN (SELECT roomid FROM t_chataccount WHERE userid = ? AND status = 1) ' +
        'AND ca.userid = ? AND cr.status = 1 AND ca.status = 1';
        values = [req.body.userid, req.body.userid];
        message = 'chatroom search success';
    }

    monetchatDB.executeQuery(query, values, function(err, rows) {
        if(!err) {
        let result = rows;
        res.status(200).json({ result: result, message: message });
        } else { 
        console.log('monetchatRouters, executeQuery Exception  : ', err);
        res.status(500).send(err);
        }
    });
});

// localhost:8080/monetchat/enter
// monet 채팅서비스 채팅방 들어갔을 때 API
router.post('/enter', (req, res) => {
    console.log("monetchatRouters - enter req.body : ", req.body);

    // touserid 인지 roomid인지 구분 후 다르게 쿼리타야 함
    if(req.body.touserid === undefined || req.body.touserid === '' || req.body.touserid.length === 0) { // 채팅방을 클릭했을 때
        const query = 'SELECT count(*) AS roomcnt, title FROM t_chatroom WHERE roomid IN (' +
        'SELECT roomid FROM t_chataccount WHERE roomid = ? AND userid=? AND status=1)'
        const values = [req.body.roomid, req.body.userid];

        monetchatDB.executeQuery(query, values, function(err, rows) {
            if(!err) {
                console.log("monetchatRouters - enter chatRoom Search cnt : ", rows[0].roomcnt);
                
                // 기존에 채팅한 데이터가 있을경우
                if(rows[0].roomcnt > 0) {
                    res.status(200).json({ roomid: req.body.roomid, title: rows[0].title, message: 'chatroom enter success' });
                } else { }      
            } else { 
                console.log('monetchatRouters - enter executeQuery Exception  : ', err);
                res.status(500).send(err);
            }
        });

    } else { // 사용자를 클릭했을 때, 1대1방만 체크하도록 함
        const query = 'SELECT count(*) AS roomcnt, roomid, title FROM t_chatroom WHERE status=1 AND chattype=1 AND roomid IN (' +
            'SELECT roomid FROM t_chataccount WHERE userid = ? AND status=1 AND roomid IN (' +
            'SELECT roomid FROM t_chataccount WHERE userid = ? AND status=1))';
        const values = [req.body.userid, req.body.touserid];

        monetchatDB.executeQuery(query, values, function(err, rows) {
            if(!err) {
               let result = rows[0].roomcnt;
               console.log("monetchatRouters - enter result : ", result);
 
                if(result > 0) { // 기존의 채팅을 했을경우
                    // 기존 채팅데이터가 있을 경우
                    res.status(200).json({ roomid: rows[0].roomid, title: rows[0].title, message: 'chatroom enter success' });
                } else { 
                    // const roomid = 'ee30bc94deab4e49bcd74dd5b9a29e65';
                    const roomid = uuid.v4().replace(/-/g, '');
                    let title = '';
                    let createtime = dateFormat();

                    if(req.body.title === undefined || req.body.title === '' || req.body.title.length === 0) { 
                        title = '새로운 채팅방';
                    }
            
                    const query = 'SELECT * FROM t_account WHERE (userid=? OR userid=?) AND status=1';
                    const values = [req.body.userid, req.body.touserid];

                    monetchatDB.executeQuery(query, values, function(err, rows) {
                        if(!err) {
                            console.log("monetchatRouters - enter chatRoom account data : ", rows.length);
                            
                            const queries = [
                                'INSERT INTO t_chatroom (roomid, title, createtime) VALUES(?, ?, ?)',
                                'INSERT INTO t_chatAccount (roomid, userid, username, createtime) VALUES(?, ?, ?, ?)',
                                'INSERT INTO t_chatAccount (roomid, userid, username, createtime) VALUES(?, ?, ?, ?)',
                            ];
                            
                            const values = [
                                [roomid, title, createtime],
                                [roomid, rows[0].userid, rows[0].username, createtime],
                                [roomid, rows[1].userid, rows[1].username, createtime],   
                            ];
                        
                            for(let i = 0; i < queries.length; i++) {
                                monetchatDB.executeQuery(queries[i], values[i], function(err, rows) {
                                    if(!err) {
                                        if(i+1 == queries.length) {
                                            res.status(200).json({ roomid: roomid, title: title, message: 'chatroom enter success' });
                                        }
                                    } else { 
                                        console.log('routers - enter executeQuery Exception  : ', err);
                                        res.status(500).send(err);
                                    }
                                });
                            }
                        } else { 
                            console.log('monetchatRouters - enter executeQuery Exception  : ', err);
                            res.status(500).send(err);
                        }
                    });
                }
            } else { 
               console.log('monetchatRouters - enter executeQuery Exception  : ', err);
               res.status(500).send(err);
            }
        });
    }
});

// localhost:8080/monetchat/chatmessage
// monet 채팅서비스 채팅방 들어간 후 메세지 불러오는 API
// 사용자가 들어갔을 때, 최초 들어간 시간을 비교하여 데이터를 가져옴
router.post('/chatmessage', (req, res) => {
    console.log('monetchatRouters - chatmessage, req.body : ', req.body);

    const query = 'SELECT * FROM t_chatmessage WHERE roomid=? AND status=1 AND createtime >= (' + 
        'SELECT createtime FROM t_chatAccount WHERE userid=? AND roomid=? AND status=1)';

    const values = [req.body.roomid, req.body.userid, req.body.roomid];

    monetchatDB.executeQuery(query, values, function(err, rows) {
        if(!err) {
            res.status(200).json({ result: rows, message: 'chatmessage search success' });
        } else { 
            console.log('monetchatRouters - chatmessage executeQuery Exception  : ', err);
            res.status(500).send(err);
        }
    });
});

// localhost:8080/monetchat/exit
// monet 채팅서비스 채팅방 나가기 API
router.post('/exit', (req, res) => {
    // 나간 사용자의 테이블 status 변경

    let deletetime = dateFormat();
    let accountCount = '';
    const query = 'UPDATE t_chatAccount SET status=0, deletetime=? WHERE roomid=? AND userid=? AND status=1';
        // 'UPDATE t_chatMessage SET status=0 WHERE roomid=? AND senderid=? AND status=1'

    const values = [deletetime, req.body.roomid, req.body.userid];
        // [req.body.roomid, req.body.userid]

    monetchatDB.executeQuery(query, values, function(err, rows) {
        if(!err) {          
            console.log('monetchatRouters - exit chatInfo status change executeQuery');

            // 채팅방에 나간 사용자 외에 다른 사용자가 있는지 체크
            const query = 'SELECT count(*) AS totcnt FROM t_chatAccount WHERE roomid=? AND status=1';
            const values = [req.body.roomid];

            monetchatDB.executeQuery(query, values, function(err, rows) {
                if(!err) {
                    console.log('monetchatRouters - exit chatRoom search executeQuery user length : ' + rows[0].totcnt);
                    accountCount = rows[0].totcnt;
                    if(accountCount === 0) {
                        const queries = [
                            'UPDATE t_chatRoom SET status=0, deletetime=? WHERE roomid=? AND status=1',
                            'UPDATE t_chatMessage SET status=0, deletetime=? WHERE roomid=? AND status=1',
                        ]
                        const values = [deletetime, req.body.roomid];

                        for(let i=0; i < queries.length; i++) {
                            monetchatDB.executeQuery(queries[i], values, function(err, rows) {
                                if(!err) {
                                    if(i+1 === queries.length) {
                                        console.log('monetchatRouters - exit chatRoom status change executeQuery');
                                    } 
                                } else {
                                    console.log('monetchatRouters - exit chatRoom status change executeQuery Exception  : ', err);
                                    res.status(500).send(err);
                                }
                            });
                        }
                    } else { // 사용자가 있을경우
                        webSocket.exitMessageSend(req.body.roomid, req.body.userid, req.body.username, accountCount);

                        // webSocket.exitMessageSend(req.body.roomid, req.body.userid, req.body.username, message);
                        // const clientsInfo = webSocket.clientsRoom.get(roomid);

                        // let message = rqe.body.username + "님이 채팅방을 퇴장하였습니다.";
                        // let createtime = dateFormat();

                        // // 채팅방에 남아있는 사용자에게 나갔다는 메세지 전송
                        // for (const client of clientsInfo) {
                        //     if (client.ws !== null && client.ws.readyState === 1) {
                        //         if(userid !== client.userid) {
                        //             client.ws.send(JSON.stringify({message: message}));
                        //         }
                                
                        //         const query = 'INSERT INTO t_chatMessage (roomid, senderid, sendername, chatmessage, createtime, readcount, accountCount) VALUES (?, ?, ?, ?, ?, ?, ?)';
                        //         const values = [req.body.roomid, req.body.userid, req.body.username, message, createtime, webSocket.clientsRoom.get(roomid).length, rows[0].totcnt];
                        
                        //         monetchatDB.executeQuery(query, values, function(err, rows) {
                        //             if(!err) {
                        //                 console.log('monetchatRouters - exit chatRoom message Insert executeQuery');
                        //             } else { 
                        //                 console.log('monetchatRouters - exit chatRoom message Insert executeQuery Exception : ', err);
                        //                 res.status(500).send(err);
                        //             }
                        //         });
                        //     } else {
                        //         console.log("webSocketServer - ws close client.ws.readyState : ", client.ws.readyState);
                        //     }
                        // }
                    }
    
                    res.status(200).json({ message: 'chatroom exit success' });
                } else { 
                    console.log('monetchatRouters - exit chatRoom search executeQuery Exception  : ', err);
                    res.status(500).send(err);
                }
            });
        } else { 
            console.log('monetchatRouters - exit chatInfo status change executeQuery Exception  : ', err);
            res.status(500).send(err);
        }
    });
});

// localhost:8080/invite
// monet 채팅서비스 채팅방 들어갔을 때 API
router.post('/invite', (req, res) => {  
    console.log('monetchatRouters - invite, req.body : ', req.body);

    // 채팅방에 있는 사용자인지 체크, 기존 사용자일 경우 이미 있다고 응답
    const query = 'SELECT count(*) AS totcnt FROM t_chatAccount WHERE roomid=? AND userid=? AND status=1';
    const values = [req.body.roomid, req.body.userid];
    let createtime = dateFormat();

    monetchatDB.executeQuery(query, values, function(err, rows) {
        if(!err) {
            console.log('monetchatRouters - invite chatAccount user check');
         
            // 신규 사용자일 때
            if(rows[0].totcnt == 0 ){
                // 1대1 방이 아니라 다중방이 되었기 때문에 chatType을 변경함
                const query = 'UPDATE t_chatRoom SET chatType=2 WHERE roomid=? AND chatType=1';
                const values = [req.body.roomid];
                
                monetchatDB.executeQuery(query, values, function(err, rows) {
                    if(!err) {
                        console.log('monetchatRouters - invite chatRoom type Change executeQuery');

                        // t_chatAccount에 해당 사용자 삽입
                        const query = 'INSERT INTO t_chatAccount (roomid, userid, username, createtime) VALUES(?, ?, ?, ?)';
                        const values = [req.body.roomid, req.body.userid, req.body.username, createtime];
                        
                        monetchatDB.executeQuery(query, values, function(err, rows) {
                            if(!err) {
                                console.log('monetchatRouters - invite chatInfo insert executeQuery');
                                
                                // 동기작업
                                const invitePromises = [webSocket.inviteMessageSend(req.body.roomid, req.body.userid, req.body.username)];
                                // webSocket.inviteMessageSend(req.body.roomid, req.body.userid, req.body.username, accountCount);
                                
                                Promise.all(invitePromises).then(() => {
                                    console.log('monetchatRouters - invite chatInfo Promise');
                                    res.status(200).json({ message: 'chatroom invite success' });
                                }).catch((error) => {
                                    res.status(500).json({ message: error });
                                });
                            } else {
                                console.log('monetchatRouters - invite chatInfo insert executeQuery Exception : ', err);
                                res.status(500).send(err);
                            }
                        });
                    } else {
                        console.log('monetchatRouters - invite chatRoom type Change executeQuery Exception : ', err);
                        res.status(500).send(err);
                    }
                });
            } else {
                res.status(200).json({ message: 'chatroom invite fail - user already invite' });
            }
        } else {
            console.log('monetchatRouters - invite chatAccount user check Exception : ', err);
        }
    });
});

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

