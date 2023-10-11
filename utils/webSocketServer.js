const WebSocket = require('ws');

// 데이터베이스 커넥션 파일
const monetchatDB = require('../utils/databases.js');

// 웹 소켓 포트
const wss = new WebSocket.Server({ port: 8081 });

// 접속한 사용자를 저장할 맵
// const clients = new Map();

// 접속한 사용자&채팅방 저장할 맵
const clientsRoom = new Map();

// 클라이언트가 연결될 때 실행
wss.on('connection', (ws, req) => {
    console.log("webSocketServer - connection");

    // userid, roomid URL에 들어있는 값 파싱
    const { userid, roomid } = req.url.split('?')[1].split('&').reduce((acc, param) => {
        const [key, value] = param.split('=');
        acc[key] = value;
        return acc;
      }, {});  

    // 채팅방 정보저장
    const roomInfo = {
        ws,
        userid,
    };
    
    if(roomid === undefined || roomid === '' || roomid.length === 0 ) {
        // clients.get(userid).push(null);
    // clients.get(userid).push(clientsInfo);
    } else { // 이미 클라이언트 정보가 저장되어있을 때
        if(!clientsRoom.has(roomid)) { 
            clientsRoom.set(roomid, []);
        }

        clientsRoom.get(roomid).push(roomInfo);
    }

    console.log('웹소켓 정보 : ', clientsRoom);
    console.log(`현재 유저 : ${wss.clients.size} 명`);

    // 기존 채팅방에 있던 사용자인지 체크
    // modifytime으로는 최초 입장인지 체크
    // ca.modifytime AS modifytime, 
    const query = 'SELECT COUNT(*) AS totcnt, a.username AS username FROM t_chatAccount ca JOIN t_account a ON ca.userid = a.userid ' +
            'WHERE ca.roomid = ? AND ca.status = 1 AND ca.userid=?';
        
    const values = [roomid, roomInfo.userid];

    // const query = 'SELECT count(*) AS totcnt, modifytime, FROM t_chatAccount WHERE roomid=? AND status=1 AND userid IN ( ' + 
    //     'SELECT username WHERE t_account where userid=?';
    
    // const values = [roomid, roomInfo.userid, roomInfo.userid];

    let createtime = dateFormat();

    monetchatDB.executeQuery(query, values, function(err, rows) {
        if(!err) {
            console.log("webSocketServer - connection chatAccount user search : " + rows[0].totcnt);
            let username = rows[0].username;
            
            // 기존에 채팅방에 있던 사용자이며, 메세지를 읽지 않은 사용자가 들어왔을 경우 readCount+1 함
            if(rows[0].totcnt == 1) {
                // 채팅방에 들어왔을 때 readCount를 조정함
                const query = 'UPDATE t_chatMessage SET readCount=readCount + 1 WHERE senderid!=? AND roomid=? AND status=1 AND createtime > ' +
                    'IFNULL((SELECT modifytime FROM t_chatAccount WHERE userid=? AND roomid=? AND status=1), 0)';

                const values = [roomInfo.userid, roomid, roomInfo.userid, roomid];

                monetchatDB.executeQuery(query, values, function(err, rows) {
                    if(!err) {
                        console.log("webSocketServer - connection chatMessage readCount Change");
                        
                        // 채팅방에 들어온 사용자의 modifyTime을 현재시간으로 변경
                        const query = 'UPDATE t_chatAccount SET modifytime=? WHERE userid=? AND roomid=? AND status=1';
                        const values = [createtime, roomInfo.userid, roomid];
        
                        monetchatDB.executeQuery(query, values, function(err, rows) {
                            if(!err) {
                                console.log("webSocketServer - connection chatAccount modifytime Change");
                                
                                let message = username + "님이 채팅방에 입장하였습니다.";

                                for (const client of clientsRoom.get(roomid)) {
                                    if (client.ws !== null && client.ws.readyState === 1) {
                                        if(userid !== client.userid) {
                                            client.ws.send(JSON.stringify({message: message}));
                                            // client.ws.send(JSON.stringify({ userid: userid, username: username, message: message, 
                                            //     createtime : createtime, readCount:clientsRoom.get(roomid).length, accountCount}));
                                        } else { 
                                            client.ws.send(JSON.stringify({message: '채팅방에 입장하였습니다.'}));
                                        }
                                    } else {
                                        console.log("webSocketServer - connection init message send client.ws.readyState : ", client.ws.readyState);
                                    }
                                }

                                // if(modifytime === undefined || modifytime === null || modifytime.length === 0) {
                                //     let message = username + "님이 채팅방에 입장하였습니다.";

                                //     for (const client of clientsRoom.get(roomid)) {
                                //         if (client.ws !== null && client.ws.readyState === 1) {
                                //             if(userid !== client.userid) {
                                //                 client.ws.send(JSON.stringify({message}));
                                //                 // client.ws.send(JSON.stringify({ userid: userid, username: username, message: message, 
                                //                 //     createtime : createtime, readCount:clientsRoom.get(roomid).length, accountCount}));
                                //             } else { 
                                //                 client.ws.send(JSON.stringify({message: '채팅방에 입장하였습니다.'}));
                                //             }
                                //         } else {
                                //             console.log("webSocketServer - chatAccount modifytime change client.ws.readyState : ", client.ws.readyState);
                                //         }
                                //     }

                                    // // 채팅방에 속한 사용자의 수 조회
                                    // const query = 'SELECT count(*) AS totcnt FROM t_chatAccount WHERE roomid=?';
                                    // const values = [roomid];
                                    
                                    // monetchatDB.executeQuery(query, values, function(err, rows) {
                                    //     if(!err) {
                                    //         console.log("webSocketServer - connection chatMessage user search : " + rows[0].totcnt);
                                    
                                    //         let accountCount = rows[0].totcnt;                                            
                                    //         let message = username + "님이 채팅방에 입장하였습니다.";

                                    //         // 사용자가 들어왔다는 메세지 t_chatMessage에 저장
                                    //         const query = 'INSERT INTO t_chatMessage (roomid, senderid, sendername, chatmessage, createtime, readcount, accountCount) VALUES (?, ?, ?, ?, ?, ?, ?)';
                                    //         const values = [roomid, roomInfo.userid, username, message, createtime, clientsRoom.get(roomid).length, accountCount];
                                        
                                    //         monetchatDB.executeQuery(query, values, function(err, rows) {
                                    //             if(!err) {
                                    //                 console.log('webSocketServer - chatMessage executeQuery');
                                    //                 // 채팅방에 있는 사용자에게 들어왔다는 메세지 전송
                                    //                 for (const client of clientsRoom.get(roomid)) {
                                    //                     if (client.ws !== null && client.ws.readyState === 1) {
                                    //                         if(userid !== client.userid) {
                                    //                             // client.ws.send(JSON.stringify({message}));
                                    //                             client.ws.send(JSON.stringify({ userid: userid, username: username, message: message, 
                                    //                                 createtime : createtime, readCount:clientsRoom.get(roomid).length, accountCount}));
                                    //                         } else { 
                                    //                             client.ws.send(JSON.stringify({message: '채팅방에 입장하였습니다.'}));
                                    //                         }
                                    //                     } else {
                                    //                         console.log("webSocketServer - chatAccount modifytime change client.ws.readyState : ", client.ws.readyState);
                                    //                     }
                                    //                 }                                    
                                    //             } else { 
                                    //                 console.log('webSocketServer - chatMessage insert executeQuery Exception  : ', err);
                                    //             }
                                    //         });
                                    //     } else {
                                    //         console.log("webSocketServer - connection chatMessage user search executeQuery Exception : ", err);
                                    //     }
                                    // });
                            } else {
                                console.log('webSocketServer - chatAccount modifytime Change executeQuery Exception  : ', err);
                            }
                        });
                    } else { 
                        console.log('webSocketServer - chatMessage readCount Change executeQuery Exception  : ', err);
                    }
                });
            }
        }
    });

    // } else {
    //     // 클라이언트 정보를 저장
    //     if (!clientsRoom.has(roomid)) {
    //         clientsRoom.set(roomid, []);
    //     }
        
    //     clientsRoom.get(roomid).push(clientsRoomInfo);

    //     console.log('들어온 유저2 : ', clients);
    //     console.log(`현재 유저2 : ${wss.clients.size} 명`);
    // }

    // wss.clients.forEach(client => {
    //     client.send(`새로운 유저가 접속했습니다. 현재 유저 ${wss.clients.size} 명`);
    // })

    // 클라이언트로부터 메시지를 받았을 때
    ws.on('message', (message) => {
        if (message instanceof Buffer) {
            // 버퍼인 경우, 버퍼를 문자열로 변환
            message = message.toString('utf8'); // 'utf8' 인코딩을 사용하여 디코딩
        }

        console.log('websocketServer - message : ', message.toString());
        console.log('websocketServer - message : ', JSON.parse(message));

        let createtime = '';

        // parsedMessage (userid, message)
        const parsedMessage = JSON.parse(message);
        console.log('webSocketServer - message Parsed Message:', parsedMessage); 

        if(parsedMessage.createtime === undefined || parsedMessage.createtime === '' || parsedMessage.createtime.length === 0) { 
            createtime = dateFormat();
        } else {
            createtime = parsedMessage.createtime;
        }

        // 채팅방에 속한 사용자의 수 조회
        const query = 'SELECT count(*) AS totcnt FROM t_chatAccount WHERE roomid=? AND status=1';
        const values = [parsedMessage.roomid];
        
        monetchatDB.executeQuery(query, values, function(err, rows) {
            if(!err) {
                console.log("webSocketServer - chatMessage user search : " + rows[0].totcnt);

                let accountCount = rows[0].totcnt;
                const clientsInfo = clientsRoom.get(parsedMessage.roomid);

                // 마지막 채팅메세지 읽은시간 수정 쿼리
                // 현재 웹소켓에 접속하고 있는 사용자만 modifytime 수정
                const query = 'UPDATE t_chatAccount SET modifytime=? WHERE roomid=? AND userid=? AND status=1';
                for(let i = 0; i < clientsInfo.length; i++) {
                    const values = [createtime, parsedMessage.roomid, clientsInfo[i].userid];

                    console.log("webSocketServer - chatAccount clientsInfo[i].userid : ", clientsInfo[i].userid);

                    monetchatDB.executeQuery(query, values, function(err, rows) {
                        if(!err) {
                            console.log("webSocketServer - chatAccount modifytime change executeQuery");

                            if(i+1 === clientsInfo.length) {
                                // 채팅메세지 삽입 쿼리 
                                // readCount - 현재 웹 소켓으로 연결된 사용자 수
                                // accountCount - DB의 t_chatAccount의 사용자 수
                                const query = 'INSERT INTO t_chatMessage (roomid, senderid, sendername, chatmessage, createtime, readcount, accountCount) VALUES (?, ?, ?, ?, ?, ?, ?)';
                                const values = [parsedMessage.roomid, parsedMessage.userid, parsedMessage.username, parsedMessage.message, createtime, clientsInfo.length, accountCount];
                        
                                monetchatDB.executeQuery(query, values, function(err, rows) {
                                    if(!err) {
                                        // 같은 채팅방에 있는 사용자에게 웹 소켓으로 메세지를 전송함
                                        const clientsInfo = clientsRoom.get(parsedMessage.roomid);
                                        console.log("webSocketServer - chatMessage insert,  clientsInfo : ", clientsInfo + ", clientsInfo.length : " + clientsInfo.length);

                                        for (const client of clientsInfo) {
                                            if (client.ws !== null && client.ws.readyState === WebSocket.OPEN) {
                                                if (client) {
                                                    // roomInfo 객체가 존재하는 경우
                                                    // for (const clientUsers of client) {
                                                    const userid = client.userid;

                                                    console.log("webSocketServer - chatMessage insert userid : " + userid + ", parsedMessage.userid : " + parsedMessage.userid);
                                                    client.ws.send(JSON.stringify({ userid: parsedMessage.userid, username: parsedMessage.username, message: parsedMessage.message, 
                                                        createtime : createtime, readCount:clientsInfo.length, accountCount}));
                                                    
                                                    // client.ws.send(JSON.stringify({ message:'새로운 메세지가 전송되었습니다.'}));
                                                
                                                    // if(userid !== parsedMessage.userid) {
                                                    // client.ws.send(JSON.stringify({ userid: parsedMessage.userid, message: parsedMessage.message, createtime : createtime}));                
                                                    // }
                                                } else { 
                                                    console.log("webSocketServer - chatMessage insert client empty");
                                                }
                                            } else { 
                                                console.log("webSocketServer - chatMessage insert fail");
                                            }
                                        }
                                    } else { 
                                        console.log('webSocketServer - chatMessage executeQuery Exception  : ', err);
                                    }
                                });
                            }
                        } else {
                            console.log("webSocketServer - chatAccount modifytime change executeQuery Exception : ", err);
                        }
                    });
                }
            } else {
                console.log('webSocketServer - chatMessage user search executeQuery Exception  : ', err);
            }
        });
    });

  // 클라이언트와 연결이 끊겼을 때, 채팅방 또는 사용자의 웹 소켓 끊어짐을 구분해야함
  ws.on('close', () => {
    console.log("webSocketServer - ws close");
    
    // const clientsInfo = clientsRoom.get(roomid);

    // let message = userid + "님이 채팅방을 퇴장하였습니다.";
    // let createtime = dateFormat();

    // // 채팅방에 속한 사용자의 수 조회
    // const query = 'SELECT count(*) AS totcnt, a.username AS username FROM t_chatAccount ca LEFT JOIN t_account a ON ca.userid=a.userid ' + 
    // 'WHERE ca.userid IN (SELECT userid FROM t_chataccount WHERE userid = ? AND status = 1) ';
    // const values = [userid];
    
    // monetchatDB.executeQuery(query, values, function(err, rows) {
    //     if(!err) {
    //         console.log("webSocketServer - chatMessage user search : " + rows[0].totcnt);

    //         let accountCount = rows[0].totcnt;
    //         let username = rows[0].username;
    //     } else {
    //         console.log("webSocketServer - chatMessage user search : " + rows[0].totcnt);
    //     }
    // });

    // 채팅방에 남아있는 사용자에게 나갔다는 메세지 전송
    // for (const client of clientsInfo) {
    //     if (client.ws !== null && client.ws.readyState === 1) {
    //         if(userid !== client.userid) {
    //             client.ws.send(JSON.stringify({message: message}));
    //         }
            
            // const query = 'INSERT INTO t_chatMessage (roomid, senderid, sendername, chatmessage, createtime, readcount, accountCount) VALUES (?, ?, ?, ?, ?, ?, ?)';
            // const values = [roomid, userid, parsedMessage.username, message, createtime, clientsRoom.get(parsedMessage.roomid).length, accountCount];
    
            // monetchatDB.executeQuery(query, values, function(err, rows) {

            //     if(!err) {
            //     }
            // });
        // } else {
        //     console.log("webSocketServer - ws close client.ws.readyState : ", client.ws.readyState);
        // }
    // }
        
    if (clientsRoom.has(roomid)) {
        const roomInfoArray = clientsRoom.get(roomid); // 해당 roomid의 배열 가져오기
              
        // roomInfoArray 배열에서 useridToRemove를 찾아 제거
        const updatedRoomInfoArray = roomInfoArray.filter(roomInfo => roomInfo.userid !== userid);
        
        // 제거한 배열을 다시 clientsRoom Map에 설정
        clientsRoom.set(roomid, []);

        if(updatedRoomInfoArray.length > 0) { // 채팅방에 사용자가 있을 때
            for(let i = 0; i < updatedRoomInfoArray.length; i++) {
                clientsRoom.get(roomid).push(updatedRoomInfoArray[i]);
            }
        } else { // 채팅방에 사용자가 없을 때
            clientsRoom.delete(roomid);
        }
        
        if(clientsRoom.has(roomid)) {
            console.log("ws - close : clientsRoom : ", clientsRoom.get(roomid) + ", length : " + clientsRoom.get(roomid).length);
        }
    } else { 
        console.log("ws - close : clientsRoom not exist");
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

function exitMessageSend(roomid, userid, username, accountCount) { 
    console.log('webSocketServer - exitMessageSend');

    const clientsInfo = clientsRoom.get(roomid);
    let createtime = dateFormat();
    let message = username + "님이 채팅방을 퇴장하였습니다.";


    if(clientsInfo) {
        const query = 'INSERT INTO t_chatMessage (roomid, senderid, sendername, chatmessage, createtime, readcount, accountCount) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const values = [roomid, userid, username, message, createtime, clientsInfo.length, accountCount];
        
        monetchatDB.executeQuery(query, values, function(err, rows) {
            if(!err) {
                console.log('webSocketServer - exitMessageSend chatRoom exit message Insert executeQuery');
            } else { 
                console.log('webSocketServer - exitMessageSend chatRoom exit message Insert executeQuery Exception : ', err);
            }
        });
    
        // 채팅방에 있는 사용자에게 나갔다는 메세지 전송
        for (const client of clientsInfo) {
            if (client.ws !== null && client.ws.readyState === 1) {
                if(userid !== client.userid) {
                    client.ws.send(JSON.stringify({ userid: userid, username: username, message: message, 
                        createtime : createtime, readCount:clientsInfo.length, accountCount}));
                }
            } else {
                console.log("webSocketServer - exitMessageSend client.ws.readyState : ", client.ws.readyState);
            }
        }
    }
}

function inviteMessageSend(roomid, userid, username, accountCount) { 
    console.log('webSocketServer - inviteMessageSend');

    return new Promise((resolve, reject) => {

        // 해당 채팅방에 있는 사용자 수 확인
        const query = 'SELECT count(*) AS totcnt FROM t_chatAccount WHERE roomid=? AND status=1';
        const values = [roomid];
       
        monetchatDB.executeQuery(query, values, function(err, rows) {
            if(!err) {
                console.log('webSocketServer - inviteMessageSend chatAccount search executeQuery');
     
                let createtime = dateFormat();
                let message = username + "님이 채팅방에 초대되었습니다.";
                const clientsInfo = clientsRoom.get(roomid);

                const query = 'INSERT INTO t_chatMessage (roomid, senderid, sendername, chatmessage, createtime, readcount, accountCount) VALUES (?, ?, ?, ?, ?, ?, ?)';
                const values = [roomid, userid, username, message, createtime, clientsInfo.length, accountCount];

                monetchatDB.executeQuery(query, values, function(err, rows) {
                    if(!err) {
                        console.log('webSocketServer - inviteMessageSend chatMessage insert executeQuery');

                        // 채팅방에 있는 사용자에게 초대되었다는 메세지 전송
                        for (const client of clientsInfo) {
                            if (client.ws !== null && client.ws.readyState === 1) {
                                if(userid !== client.userid) {
                                    client.ws.send(JSON.stringify({ userid: userid, username: username, message: message, 
                                        createtime : createtime, readCount:clientsInfo.length, accountCount}));
                                }
                            } else {
                                console.log("webSocketServer - inviteMessageSend client.ws.readyState : ", client.ws.readyState);
                            }
                        }
                        console.log('webSocketServer - inviteMessageSend chatMessage insert resolve');
                        resolve();
                    } else {
                        console.log('webSocketServer - inviteMessageSend chatMessage insert executeQuery Exception : ', err);
                        reject();
                    }
                });
            } else {
                console.log('webSocketServer - inviteMessageSend chatAccount search executeQuery Exception : ', err);
            }
        });
    });
}

// 모듈로 내보내기
module.exports = {
    inviteMessageSend,
    exitMessageSend
};