import React, { useState, useEffect } from 'react';
import WebSocket from '../utils/webSocket';

import { useNavigate, useLocation } from 'react-router-dom';
import Modal from 'react-modal';
import axios from 'axios';

function MonetChat() {
  // 웹소켓
  // const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  // 데이터
  const [message, setMessage] = useState('');
  const [userid, setUserid] = useState('');

  const [userData, setUserData] = useState([]);
  const [username, setUsername] = useState('');
  const [usertype, setUsertype] = useState('');

  const [roomid, setRoomid] = useState('');
  const [title, setTitle] = useState('');

  // 채팅 데이터
  const [chatData, setChatData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // useNavigate을 사용하여 navigate 객체를 가져옴
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('monetChat - useEffect');
  
    init();
    console.log("monetChat - useEffect location.state : " + location.state);

    setRoomid(location.state.roomid);
    setTitle(location.state.title);
    setUserData(location.state.userData)
  
    // WebSocket 연결 생성
    const websocket = WebSocket.createWebSocket(sessionStorage.getItem("userid"), location.state.roomid);

    // 웹 소켓 연결이 열렸을 때 호출되는 이벤트 핸들러
    websocket.onopen = () => {
      console.log('웹 소켓 연결이 열렸습니다.');
      setSocket(websocket);
      // setConnected(true);
    };

    // 웹 소켓 메시지를 수신했을 때 호출되는 이벤트 핸들러
    websocket.onmessage = (event) => {
      const message = event.data;
      handleReceiveMessage(message);
    };

    // 컴포넌트가 언마운트될 때 웹 소켓 연결을 닫음
    return () => {
      if (websocket.readyState === 1) {
        websocket.close();
        setSocket(null);
        // setConnected(false);
      }
    };
  }, []);

  // chatData 값이 변경되었을 때 동작
  useEffect(() => {
    console.log("MonetChat - useEffect : ", chatData);
  }, [chatData]);

  const init = () => {
    console.log("MonetChat - init");

    // return new Promise(function(resolve, reject) {
      setUserid(sessionStorage.getItem("userid"));
      setUsername(sessionStorage.getItem("username"));
      setUsertype(sessionStorage.getItem("usertype"));
  }

  // 기존 채팅 데이터 검색
  const handleChatMessage = () => {
    console.log("MonetChat - handleChatMessage");

    let searchUserid = '';
    let searchUsername = '';

    if(userid === undefined || userid === '' || userid.length === 0) {
      console.log("MonetChat - handleChatMessage, userid empty");
      searchUserid = sessionStorage.getItem("userid");
    } else {
      searchUserid = userid;
    }

    if(username === undefined || username === '' || username.length === 0) {
      console.log("MonetChat - handleChatMessage, username empty");
      searchUsername = sessionStorage.getItem("username");
    } else {
      searchUsername = username;
    }

    axios({
      url: "http://localhost:8080/monetchat/chatmessage/",
      method: "POST",
      data: {
        userid: searchUserid,
        username: searchUsername,
        roomid: location.state.roomid,
      }
    }).then(res => {
      console.log("monetChat - handleChatMessage res.data : ", res.data);
        if(res.status === 200 && res.data.message === 'chatmessage search success') {

          const chatListData = res.data.result.map(item => ({
            senderid: item.senderid,
            sendername: item.sendername,
            message: item.chatmessage,
            createtime: item.createtime,
            readCount: item.accountCount - item.readCount
          }));

          setChatData(chatListData);
          
          // for(let i = 0; i < res.data.result.length; i++) { 
          //   // setChatData(prevChatData => [...prevChatData, { senderid: res.data.result[i].senderid, sendername: res.data.result[i].sendername,
          //   //   message: res.data.result[i].chatmessage, createtime: res.data.result[i].createtime, readCount: res.data.result[i].accountCount - res.data.result[i].readCount}]);
          //   setChatData([{senderid: res.data.result[i].senderid, sendername: res.data.result[i].sendername,
          //     message: res.data.result[i].chatmessage, createtime: res.data.result[i].createtime, readCount: res.data.result[i].accountCount - res.data.result[i].readCount}]);
          // }

          console.log("monetChat - handleChatMessage chatData : ", chatData);

          // handleConnect(roomid);

          // // setTouserid(userid + Math.floor(Math.random() * 10000));
          // // setTouserid('shin');

          // setRoomid(res.data.roomid);
          // setSocket(WebSocket.connect(userid, roomid));
          // setConnected(true);
        } else {
            alert("채팅창 데이터를 불러오지 못하였습니다.");
        }
    }).catch(err => {
      alert(err);
    });
  };

  // 메세지 전송
  const handleSendMessage = (createtime) => {

    console.log("monetChat - handleSendMessage, message : " + message);
    console.log("monetChat - handleSendMessage, socket : ", socket);

    if(message === undefined || message === '' || message.length === 0) {
      console.log("monetChat - handleSendMessage message empty");
      alert("전송할 메세지를 입력해주세요.");
      return;
    }

    let sendData = {
      userid: userid,
      username: username,
      roomid:location.state.roomid,
      message:message,
      createtime:createtime,
    };

    if (socket !== null && socket.readyState === 1) {
      socket.send(JSON.stringify(sendData));
      console.log("monetChat - handleSendMessage - socket online");
      
      // 메세지 초기화
      setMessage('');
      // WebSocket.sendMessage(socket, userid, roomid, message, createtime);
    } else {
      console.log("monetChat - handleSendMessage - socket offline");
    }
  };

  const handleExit = () => {
    console.log("monetChat - handleExit");

    navigate('/monetMain'); // '/monetRegister' 경로로 이동

    // 채팅방 웹 소켓 종료
    if (socket) {
      socket.close();
    }
  };

  const handleReceiveMessage = (message) => {
    const receivedMessage = JSON.parse(message);

    console.log("monetChat - handleReceiveMessage, message : ", message);

    // 최초 채팅방에 입장할 때 메세지를 조회하도록 함
    if(receivedMessage.message === '채팅방에 입장하였습니다.') {
      console.log("monetChat - handleReceiveMessage init, handleChatMessage START");
      setChatData([]);
      handleChatMessage();

    // 다른 사용자가 채팅방에 입장할 때 readCount를 업데이트 해야 함
    } else if(receivedMessage.message.endsWith("님이 채팅방에 입장하였습니다.")) {
      console.log("monetChat - handleReceiveMessage userEnter, handleChatMessage START");
      setChatData([]);
      handleChatMessage();
    } else {
      console.log("monetChat - handleReceiveMessage, userid : ", receivedMessage.userid + " username : " + receivedMessage.username);
      setChatData(prevRoomData => [...prevRoomData, { senderid: receivedMessage.userid, sendername : receivedMessage.username, message: receivedMessage.message, createtime: receivedMessage.createtime, readCount: receivedMessage.accountCount - receivedMessage.readCount}]);
    }
  };

  const handleInvite = (userid, username, roomid) => {
    console.log("monetChat - handleInvite, userid : " + userid + ", username : " + username + ", roomid : " + roomid);

    axios({
      url: "http://localhost:8080/monetchat/invite/",
      method: "POST",
      data: {
        userid: userid,
        username: username,
        roomid: roomid,
        title: title
      }
    }).then(res => {
      console.log("monetChat - handleInvite res.data : ", res.data);
        if(res.status === 200 && res.data.message === 'chatroom invite success') {

          alert(username + "님을 초대하였습니다.");

          // const chatListData = res.data.result.map(item => ({
          //   senderid: item.senderid,
          //   sendername: item.sendername,
          //   message: item.chatmessage,
          //   createtime: item.createtime,
          //   readCount: item.accountCount - item.readCount
          // }));

          // setChatData(chatListData);
          
          // for(let i = 0; i < res.data.result.length; i++) { 
          //   // setChatData(prevChatData => [...prevChatData, { senderid: res.data.result[i].senderid, sendername: res.data.result[i].sendername,
          //   //   message: res.data.result[i].chatmessage, createtime: res.data.result[i].createtime, readCount: res.data.result[i].accountCount - res.data.result[i].readCount}]);
          //   setChatData([{senderid: res.data.result[i].senderid, sendername: res.data.result[i].sendername,
          //     message: res.data.result[i].chatmessage, createtime: res.data.result[i].createtime, readCount: res.data.result[i].accountCount - res.data.result[i].readCount}]);
          // }

          // console.log("monetChat - handleChatMessage chatData : ", chatData);

          // handleConnect(roomid);

          // // setTouserid(userid + Math.floor(Math.random() * 10000));
          // // setTouserid('shin');

          // setRoomid(res.data.roomid);
          // setSocket(WebSocket.connect(userid, roomid));
          // setConnected(true);
        } else if(res.status === 200 && res.data.message.startsWith('chatroom invite fail')) {
          alert("이미 채팅방에 있는 사용자입니다.");
        } else {
          alert("사용자 초대를 실패하였습니다.");
        }
    }).catch(err => {
      alert(err);
    });
  };

  const handleOpenModal = () => {
    console.log("MonetMain - handleOpenModal");

    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    console.log("MonetMain - handleCloseModal");

    setIsModalOpen(false);
  };

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

  return (
    <div>
      <h2>채팅방화면</h2>
      <table>
        <thead>
          <tr>
            <th>작성자</th>
            <th>메세지</th>
          </tr>
        </thead>
        <tbody>
          {chatData.map((chat) => (
            <tr key={chat.senderid}>
              {(chat.message.endsWith("초대되었습니다.") || chat.message.endsWith("퇴장하였습니다.")) ? null : (
                <td>{chat.sendername}</td>
              )}
              <td>{chat.message}</td>
              {/* readCount가 0이면 사용자에게 보여줄 필요없음
              readCount는 이 채팅메세지를 안읽은 수를 뜻함 */}
              {(isNaN(parseInt(chat.readCount)) || parseInt(chat.readCount) === 0) || 
                (chat.message.endsWith("초대되었습니다.") || chat.message.endsWith("퇴장하였습니다.")) ? null : (
                <td>{chat.readCount}</td>
              )}
            </tr>
          ))}
        </tbody>
        </table>

        <Modal isOpen={isModalOpen} onRequestClose={handleCloseModal} contentLabel="채팅방 초대">
            <h2>채팅방 초대</h2>

            <table>
              <thead>
                <tr>
                  <th>사용자</th>
                </tr>
              </thead>
              <tbody> 
                {userData.map((user) => (
                  <tr key={user.userid}>
                    <td>{user.username}</td>
                    <button type="button" onClick={() => handleInvite(user.userid, user.username, roomid)}>초대</button>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" onClick={handleCloseModal}>닫기</button>
          </Modal>
      <form>  
        <div>     
          <label>Message:</label>
          <input type="text" value={message} onChange={(e) => setMessage(e.target.value)}/>
          <button type="button" onClick={() => handleSendMessage(dateFormat())}>메세지 전송</button>
          {/* <button type="button" onClick={handleSendMessage(dateFormat())}>메세지 전송</button> */}
          <button type="button" onClick={handleExit}>채팅방 나가기</button>
        </div>
        <div>
          <button type="button" onClick={handleOpenModal}>채팅방 초대</button>
        </div>
      </form>

      {/* <button type="button" onClick={init}>초기화</button> */}
      {/* <button type="button" onClick={handleConnect} disabled={connected}>웹 소켓 연결</button> */}
      {/* <button type="button" onClick={handleDisconnect} disabled={!connected}>웹 소켓 연결해제</button> */}
    </div>
  );
};

export default MonetChat;