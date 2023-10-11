// WebSocket 서버 주소 설정 함수
const createWebSocket = (userid, roomid) => {
  let ws;

  // 웹 소켓 서버 주소
  const wsServer = 'ws://localhost:8081?userid=' + userid + '&roomid=' + roomid;
  // const wsServerInit = 'ws://localhost:8081?userid=' + userid;

  // if (roomid === undefined || roomid === '' || roomid.length === 0) {
  //   ws = new WebSocket(wsServerInit);
  // } else {
    ws = new WebSocket(wsServer);
  // }

  return ws;
};

module.exports = {
  createWebSocket,
};







// const webSocket = {
//   connect: async (userid, roomid) => {
//     return new Promise((resolve, reject) => {

//       let ws;

//       // 웹 소켓 서버 주소
//       const wsServer = 'ws://localhost:8081?userid=' + userid + '&roomid=' + roomid;
//       // const wsServer = 'ws://localhost:8081?userid=' + userid + '&touserid=' + touserid + '&roomid=' + roomid;
//       // const wsServer = 'ws://localhost:8081?userid=' + userid + '&touserid=shin' + Math.floor(Math.random() * 10000) + '&roomid=fa0b9ab675c04c0b81a89c6fac0377b2';
//       const wsServerInit = 'ws://localhost:8081?userid=' + userid;

//       if(roomid === undefined || roomid === '' || roomid.length === 0) {
//         ws = new WebSocket(wsServerInit);
//       } else {
//         ws = new WebSocket(wsServer);
//       }

//       // const ws = new WebSocket(wsServerInit);

//       // // 웹 소켓 연결 생성
//       // const ws = new WebSocket(wsServer);
  
//       ws.onopen = () => {
//         console.log('웹 소켓 연결이 열렸습니다.');
//         resolve(ws); // 연결이 열렸을 때 WebSocket 객체를 resolve하여 Promise를 완료합니다.
//       };
  
//       ws.onmessage = (event) => {
//         const message = event.data;
//         console.log('받은 메시지:', message);

//         MonetChat.handleReceiveMessage(message);
//         // 메시지 처리 로직
//       };
  
//       ws.onerror = (error) => {
//         console.log('웹 소켓 연결이 닫혔습니다.');
//         reject(error);
//         // 연결 종료 시 로직
//       };
//     });
    
//       // return {
//       //   sendMessage,
//       // };
//   },
//   sendMessage: (ws, userid, roomid, message, createtime) => {
//     const messageData = {
//       message: message,
//       userid: userid,
//       roomid: roomid,
//       createtime: createtime
//       // 다른 필드를 추가할 수 있음
//   };

//     if (ws.readyState === WebSocket.OPEN) {
//       const jsonMessage = JSON.stringify(messageData);

//       console.log('메시지 전송:', jsonMessage);
//       ws.send(jsonMessage);
//     } else {
//       console.warn('웹 소켓 연결이 열려있지 않습니다.');
//     }
//   },
// };
  
// export default webSocket;