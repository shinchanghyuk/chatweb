// WebSocket 서버 주소 설정 함수
const createWebSocket = (userid, roomid) => {
  let ws;

  const webSocketUrl = process.env.REACT_APP_WEBSOCKET_URL;

  // 웹 소켓 서버 주소
  const wsServer = webSocketUrl + '?userid=' + userid + '&type=room&roomid=' + roomid;
  const wsServerInit = webSocketUrl + '?userid=' + userid + '&type=user';

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