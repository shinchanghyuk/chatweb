// WebSocket 서버 주소 설정 함수
const createWebSocket = (userid, roomid) => {
  let ws;

  // 웹 소켓 서버 주소
  const wsServer = 'ws://localhost:8081?userid=' + userid + '&type=room&roomid=' + roomid;
  const wsServerInit = 'ws://localhost:8081?userid=' + userid + '&type=user';

  if (roomid === undefined || roomid === '' || roomid.length === 0) {
    ws = new WebSocket(wsServerInit);
  } else {
    ws = new WebSocket(wsServer);
  }

  return ws;
};

module.exports = {
  createWebSocket,
};