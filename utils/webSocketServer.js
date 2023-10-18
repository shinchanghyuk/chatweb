const WebSocket = require('ws');

// 데이터베이스 커넥션 파일
const monetchatDB = require('../utils/databases.js');

// 웹 소켓 포트
const wss = new WebSocket.Server({ port: 8081 });

// 접속한 사용자를 저장할 맵
const clientsUser = new Map();

// 접속한 사용자&채팅방 저장할 맵
const clientsRoom = new Map();

// 클라이언트가 연결될 때 실행
wss.on('connection', (ws, req) => {
    console.log("webSocketServer - connection");

    // userid, roomid URL에 들어있는 값 파싱
    const { userid, type, roomid} = req.url.split('?')[1].split('&').reduce((acc, param) => {
        const [key, value] = param.split('=');
        acc[key] = value;
        return acc;
      }, {});  

    // 채팅방 정보저장
    const roomInfo = {
        ws,
        userid,
    };

    // 사용자 정보저장
    const userInfo = {
        ws
    };

    let createtime = dateFormat();
    
    if(roomid === undefined || roomid === '' || roomid.length === 0 ) { // 사용자 웹 소켓일 경우 
        if(!clientsUser.has(userid)) {
            clientsUser.set(userid, []);
            clientsUser.get(userid).push(userInfo); 

            // 웹 소켓에 있는 사용자에게 자신이 online 인것을 알려줘야 하므로 사용자 웹 소켓으로 메세지 전송
            const userids = Array.from(clientsUser.keys());

            console.log('webSocketServer - connection userids : ' + userids + 'length : ' + userids.length);
            let message = userid + "님이 로그인 하였습니다.";
            for(let i = 0; i < userids.length; i++) {        
                if(clientsUser.has(userids[i])) {
                    if(userids[i] !== userid) {
                        if (clientsUser.get(userids[i])[0].ws !== null && clientsUser.get(userids[i])[0].ws.readyState === 1) {
                            clientsUser.get(userids[i])[0].ws.send(JSON.stringify({ userid:userid, message: message, createtime : createtime}));
                        }
                    }
                } else {
                    console.log('webSocketServer - connection has not clientsUser');
                }
            }
        }
    } else { // 이미 클라이언트 정보가 저장되어있을 때
        if(!clientsRoom.has(roomid)) { 
            clientsRoom.set(roomid, []);
        }
        
        clientsRoom.get(roomid).push(roomInfo);
        
        // 기존 채팅방에 있던 사용자인지 체크
        // modifytime으로는 최초 입장인지 체크
        // ca.modifytime AS modifytime, 
        const query = 'SELECT COUNT(*) AS totcnt, ca.modifytime, a.username AS username FROM t_chatAccount ca JOIN t_account a ON ca.userid = a.userid ' +
        'WHERE ca.roomid = ? AND ca.status = 1 AND ca.userid=?';

        const values = [roomid, roomInfo.userid];

        monetchatDB.executeQuery(query, values, function(err, rows) {
            if(!err) {
                console.log("webSocketServer - connection chatAccount user search : " + rows[0].totcnt);
                let username = rows[0].username;
                let modifytime = rows[0].modifytime;
                
                // 기존에 채팅방에 있던 사용자이며, 메세지를 읽지 않은 사용자가 들어왔을 경우 readCount+1 함
                if(rows[0].totcnt == 1) {
                    let query = 'UPDATE t_chatMessage SET readCount=readCount + 1 WHERE senderid!=? AND roomid=? AND status=1 AND createtime >= ';
                    
                    // 신규 사용자일 때
                    if(modifytime === undefined || modifytime === null || modifytime === '') {
                        query = query + '(SELECT createtime FROM t_chatAccount WHERE userid=? AND roomid=? AND status=1)';
                    
                    // 기존 사용자일 때
                    } else {
                        query = query + 'IFNULL((SELECT modifytime FROM t_chatAccount WHERE userid=? AND roomid=? AND status=1), 0)';
                    }

                    // 채팅방에 들어왔을 때 readCount를 조정함
                    // const query = 'UPDATE t_chatMessage SET readCount=readCount + 1 WHERE senderid!=? AND roomid=? AND status=1 AND createtime > ' +
                    //     'IFNULL((SELECT modifytime FROM t_chatAccount WHERE userid=? AND roomid=? AND status=1), 0) AND ' +
                    //     'createtime >= (SELECT createtime FROM t_chatAccount WHERE userid=? AND roomid=? AND status=1)'
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
    }

    console.log('사용자 정보 : ', clientsUser);
    console.log('채팅방 정보 : ', clientsRoom);
    // console.log(`현재 유저 : ${wss.clients.size} 명`);

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
        let chatUserList = '';

        // parsedMessage (userid, message)
        const parsedMessage = JSON.parse(message);
        console.log('webSocketServer - message Parsed Message:', parsedMessage); 

        if(parsedMessage.createtime === undefined || parsedMessage.createtime === '' || parsedMessage.createtime.length === 0) { 
            createtime = dateFormat();
        } else {
            createtime = parsedMessage.createtime;
        }

        // 채팅방에 속한 사용자의 수 및 사용자 조회
        // const query = 'SELECT count(*) AS totcnt, userid FROM t_chatAccount WHERE roomid=? AND status=1 GROUP BY userid';
        const query = 'SELECT userid FROM t_chatAccount WHERE roomid=? AND status=1';
        const values = [parsedMessage.roomid];
        
        monetchatDB.executeQuery(query, values, function(err, rows) {
            if(!err) {
                if (rows.length > 0) { // 결과가 하나 이상의 행을 반환하는지 확인
                    chatUserList = rows.map(row => row.userid);
                    console.log("webSocketServer - message chatMessage chatUserList : ", chatUserList);
                    console.log("webSocketServer - message chatMessage length : " + chatUserList.length);
                }

                let accountCount = chatUserList.length;
                const clientsRoomInfo = clientsRoom.get(parsedMessage.roomid);

                // 마지막 채팅메세지 읽은시간 수정 쿼리
                // 현재 웹소켓에 접속하고 있는 사용자만 modifytime 수정
                const query = 'UPDATE t_chatAccount SET modifytime=? WHERE roomid=? AND userid=? AND status=1';
                for(let i = 0; i < clientsRoomInfo.length; i++) {
                    const values = [createtime, parsedMessage.roomid, clientsRoomInfo[i].userid];

                    console.log("webSocketServer - message chatAccount clientsRoomInfo[i].userid : ", clientsRoomInfo[i].userid);

                    monetchatDB.executeQuery(query, values, function(err, rows) {
                        if(!err) {
                            console.log("webSocketServer - message chatAccount modifytime change executeQuery");

                            if(i+1 === clientsRoomInfo.length) {
                                // 채팅메세지 삽입 쿼리 
                                // readCount - 현재 웹 소켓으로 연결된 사용자 수
                                // accountCount - DB의 t_chatAccount의 사용자 수
                                const query = 'INSERT INTO t_chatMessage (roomid, senderid, sendername, chatmessage, createtime, readcount, accountCount) VALUES (?, ?, ?, ?, ?, ?, ?)';
                                const values = [parsedMessage.roomid, parsedMessage.userid, parsedMessage.username, parsedMessage.message, createtime, clientsRoomInfo.length, accountCount];
                        
                                monetchatDB.executeQuery(query, values, function(err, rows) {
                                    if(!err) {
                                        // 같은 채팅방에 있는 사용자에게 웹 소켓으로 메세지를 전송함
                                        const clientsRoomInfo = clientsRoom.get(parsedMessage.roomid);
                                        console.log("webSocketServer - message chatMessage insert, clientsRoomInfo.length : " + clientsRoomInfo.length);

                                        for (const client of clientsRoomInfo) {
                                            if (client.ws !== null && client.ws.readyState === WebSocket.OPEN) {
                                                if (client) {
                                                    const userid = client.userid;

                                                    console.log("webSocketServer - message chatMessage insert userid : " + userid + ", parsedMessage.userid : " + parsedMessage.userid);
                                                    client.ws.send(JSON.stringify({ userid: parsedMessage.userid, username: parsedMessage.username, message: parsedMessage.message, 
                                                        createtime : createtime, readCount:clientsRoomInfo.length, accountCount}));
                                                } else { 
                                                    console.log("webSocketServer - message chatMessage insert client empty");
                                                }
                                            } else { 
                                                console.log("webSocketServer - message chatMessage insert fail");
                                            }
                                        }
                                        
                                        let newMessage = '새로운 메세지가 도착하였습니다.';
                                        console.log("webSocketServer - message title :" + parsedMessage.title);
                                        for(clientUser of chatUserList) {
                                            if(clientsUser.has(clientUser)) {
                                                if(clientUser !== parsedMessage.userid) {
                                                    if (clientsUser.get(clientUser)[0].ws !== null && clientsUser.get(clientUser)[0].ws.readyState === 1) {
                                                        clientsUser.get(clientUser)[0].ws.send(JSON.stringify({ roomid:parsedMessage.roomid, title:parsedMessage.title, senderid:parsedMessage.userid, message: newMessage, createtime : createtime}));
                                                    } else {
                                                        console.log("webSocketServer - message clientuser not webSocket connection");
                                                    }
                                                } else {
                                                    console.log("webSocketServer - message clientuser and sender is equals");
                                                }
                                            } else {
                                                console.log("webSocketServer - message user is not Login Status");
                                            }
                                        }
                                    } else { 
                                        console.log('webSocketServer - message chatMessage executeQuery Exception  : ', err);
                                    }
                                });
                            }
                        } else {
                            console.log("webSocketServer - message chatAccount modifytime change executeQuery Exception : ", err);
                        }
                    });
                }
            } else {
                console.log('webSocketServer - message chatMessage user search executeQuery Exception  : ', err);
            }
        });
    });

  // 클라이언트와 연결이 끊겼을 때, 채팅방 또는 사용자의 웹 소켓 끊어짐을 구분해야함
  ws.on('close', () => {
    console.log("webSocketServer - close, userid : " + userid + ", type : " + type);

    if(type === 'user') {
        console.log("webSocketServer - close clientUser userid : " + userid);
        if (clientsUser.has(userid)) {

            // 웹 소켓에 있는 사용자에게 자신이 offline 인것을 알려줘야 하므로 사용자 웹 소켓으로 메세지 전송
            const userids = Array.from(clientsUser.keys());

            let message = userid + "님이 로그아웃 하였습니다.";
            for(let i = 0; i < userids.length; i++) {                        
                if(clientsUser.has(userids[i])) {
                    if (clientsUser.get(userids[i])[0].ws !== null && clientsUser.get(userids[i])[0].ws.readyState === 1) {
                        clientsUser.get(userids[i])[0].ws.send(JSON.stringify({ userid:userid, message: message, createtime : createtime}));
                    }
                }
            }

            console.log("webSocketServer - close clientUser has userid :" + userid + ", delete");
            clientsUser.delete(userid);
        } else {
            console.log("webSocketServer - close clientUser empty");
        }
    } else if(type === 'room') {
        console.log('webSocketServer - close roomid : ' + roomid);
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

            let createtime = dateFormat();

            //modifyTime을 현재시간으로 변경, 채팅방 나간시점
            const query = 'UPDATE t_chatAccount SET modifytime=? WHERE userid=? AND roomid=? AND status=1';
            const values = [createtime, userid, roomid];
        
            monetchatDB.executeQuery(query, values, function(err, rows) {
                if(!err) {
                    console.log("webSocketServer - close chatAccount modifytime Change");
                    
                } else {
                    console.log("webSocketServer - close chatAccount modifytime Change Exception : ", err);
                }
            });
        } else { 
            console.log("ws - close : clientsRoom not exist");
        }
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
    console.log('webSocketServer - exitMessageSend, roomid : ' + roomid);

    const clientsRoomInfo = clientsRoom.get(roomid);
    let createtime = dateFormat();
    let message = username + "님이 채팅방을 퇴장하였습니다.";

    if(clientsRoomInfo) {
        const query = 'INSERT INTO t_chatMessage (roomid, senderid, sendername, chatmessage, createtime, readcount, accountCount) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const values = [roomid, userid, username, message, createtime, clientsRoomInfo.length, accountCount];
        
        monetchatDB.executeQuery(query, values, function(err, rows) {
            if(!err) {
                console.log('webSocketServer - exitMessageSend chatRoom exit message Insert executeQuery');
            } else { 
                console.log('webSocketServer - exitMessageSend chatRoom exit message Insert executeQuery Exception : ', err);
            }
        });
    
        // 채팅방에 있는 사용자에게 나갔다는 메세지 전송
        for (const client of clientsRoomInfo) {
            if (client.ws !== null && client.ws.readyState === 1) {
                if(userid !== client.userid) {
                    client.ws.send(JSON.stringify({ userid: userid, username: username, message: message, 
                        createtime : createtime, readCount:clientsRoomInfo.length, accountCount}));
                }
            } else {
                console.log("webSocketServer - exitMessageSend client.ws.readyState : ", client.ws.readyState);
            }
        }
    }
}

function userConnectionSearch(userList) {
    console.log('webSocketServer - userConnectionSearch, userList : ', userList);

    return new Promise((resolve, reject) => {
        const updatedUserList = userList.map(user => {
            if (clientsUser.has(user.userid)) {
                user.status = 1; // 현재 로그인 하고 있는 사용자이면 status 1
            } else {
                user.status = 0; // 로그아웃 상태인 사용자이면 status 0
            }

            return user;
        });
  
        resolve(updatedUserList);
    });
}

// 채팅방에서 다른 사용자 초대했을 때 동작
function inviteMessageSend(roomid, title, userid, username) { 
    console.log('webSocketServer - inviteMessageSend, roomid : ' + roomid + ', userid : ' + userid + ', username : ' + username );

    return new Promise((resolve, reject) => {

        // 해당 채팅방에 있는 사용자 수 확인
        const query = 'SELECT count(*) AS totcnt FROM t_chatAccount WHERE roomid=? AND status=1';
        const values = [roomid];
       
        monetchatDB.executeQuery(query, values, function(err, rows) {
            if(!err) {
                let accountCount = rows[0].totcnt;
                console.log('webSocketServer - inviteMessageSend chatAccount search executeQuery');
     
                let createtime = dateFormat();
                let message = username + "님이 채팅방에 초대되었습니다.";
                const clientsRoomInfo = clientsRoom.get(roomid);

                const query = 'INSERT INTO t_chatMessage (roomid, senderid, sendername, chatmessage, createtime, readcount, accountCount) VALUES (?, ?, ?, ?, ?, ?, ?)';
                const values = [roomid, userid, username, message, createtime, clientsRoomInfo.length, accountCount];

                monetchatDB.executeQuery(query, values, function(err, rows) {
                    if(!err) {
                        console.log('webSocketServer - inviteMessageSend chatMessage insert executeQuery');

                        // 채팅방에 있는 사용자에게 초대되었다는 메세지 전송
                        for (const client of clientsRoomInfo) {
                            if (client.ws !== null && client.ws.readyState === 1) {
                                if(userid !== client.userid) {
                                    client.ws.send(JSON.stringify({ userid: userid, username: username, message: message, 
                                        createtime : createtime, readCount:clientsRoomInfo.length, accountCount}));
                                }
                            } else {
                                console.log("webSocketServer - inviteMessageSend clientsRoom ws.readyState : ", client.ws.readyState);
                            }
                        }

                        // 초대된 사용자에게 초대되었다는 메세지 전송
                        if(clientsUser.has(userid)) {
                            message = title + '에 초대되었습니다.';

                            if (clientsUser.get(userid)[0].ws !== null && clientsUser.get(userid)[0].ws.readyState === 1) {
                                clientsUser.get(userid)[0].ws.send(JSON.stringify({ roomid:roomid, title:title, message: message, createtime : createtime}));
                            }
                        } else {
                            console.log('webSocketServer - inviteMessageSend clientsUser empty');
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
    exitMessageSend,
    userConnectionSearch
};