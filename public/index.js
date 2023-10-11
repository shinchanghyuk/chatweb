// 웹 소켓 연결 객체를 저장할 변수
let socket;

// 웹 소켓 시작 함수
function websocketStart() {
  // 웹 소켓 서버 주소
  const useridInput =  document.getElementById('userid-input');
  const serverAddress = 'ws://localhost:8081?userid='+useridInput + Math.floor(Math.random() * 10000) + '&roomid=testroom';
  // const wsServer = new WebSocket('ws://localhost:8081?userid=shin' + Math.floor(Math.random() * 10000) + '&roomid=fa0b9ab675c04c0b81a89c6fac0377b2');

  // 웹 소켓 연결 설정
  socket = new WebSocket(serverAddress);

    // 이벤트
    socket.addEventListener("open", () => {
        console.log("서버에 연결되었음.");
    });

    socket.addEventListener("message", (message) => {
        console.log("서버로 부터의 메시지 : ", message);
    });

    socket.addEventListener("close", () => {
        console.log("서버가 종료됨.")
    });
}

document.getElementById('send-button').addEventListener('click', () => {
    const messageInput = document.getElementById('message-input');
    const useridInput =  document.getElementById('userid-input');

    const messageData = {
        message: messageInput.value,
        userid: useridInput.value,
        // 다른 필드를 추가할 수 있음
    };

    sendMessage(messageData);
});

function sendMessage(messageData) {
    // 웹 소켓으로 서버로 메세지 전송
    const messageJson = JSON.stringify(messageData);
    websocket.send(messageJson);
}
