import React, { useState, useEffect } from 'react';
import WebSocket from '../utils/webSocket';

// import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

// 부트스트랩
import 'bootstrap/dist/css/bootstrap.css';
import '../monetChat.css';

// 모달
import MoentModal from './monetModal';

function MonetChat({ data, callback }) {
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
  const [isTitleModify, setIsTitleModify] = useState(false);

  const maxCharacters = 30;

  // useNavigate을 사용하여 navigate 객체를 가져옴
  // 만약 monetMain와 monetChat 컴포넌트를 따로 쓸거면 이를 통해서 데이터 전달을 해야함
  // const navigate = useNavigate();
  // const location = useLocation();

  useEffect(() => {
    console.log('monetChat - useEffect, data : ', data);
  
    init();
        
    // 이미 웹 소켓이 접속되어있는 경우 이전의 웹 소켓을 끊음
    if (socket) {
      console.log('monetChat - useEffect, already webSocket, close');
      socket.close();
      setSocket(null);
    }

    // data가 빈 값인 경우는 채팅방을 나갔을 때임
    if(data === undefined || data === '' || data.length === 0) {
      console.log('monetChat - useEffect data empty, return');
      return; 
    } else {
      setRoomid(data.state.roomid);
      setTitle(data.state.title);
      setUserData(data.state.userData)    
    }
  
    // WebSocket 연결 생성
    const webSocket = WebSocket.createWebSocket(sessionStorage.getItem("userid"), data.state.roomid);

    // 웹 소켓 연결이 열렸을 때 호출되는 이벤트 핸들러
    webSocket.onopen = () => {
      console.log('채팅방 웹 소켓 연결이 열렸습니다.');
      setSocket(webSocket);
    };

    // 웹 소켓 메시지를 수신했을 때 호출되는 이벤트 핸들러
    webSocket.onmessage = (event) => {
      const message = event.data;
      handleReceiveMessage(message);
    };

    // 컴포넌트가 언마운트될 때 웹 소켓 연결을 닫음
    return () => {
      if (webSocket.readyState === 1) {
        webSocket.close();
        setSocket(null);
      }
    };
  }, [data]);

  // chatData 값이 변경되었을 때 동작
  useEffect(() => {
    console.log("MonetChat - chatData useEffect : ", chatData);
  }, [chatData]);

  const init = () => {
    console.log("MonetChat - init");

    // return new Promise(function(resolve, reject) {
      setUserid(sessionStorage.getItem("userid"));
      setUsername(sessionStorage.getItem("username"));
      setUsertype(sessionStorage.getItem("usertype"));
  }

  const dateFormatModify = (createtime) => {

    if(createtime !== undefined && createtime !== '' && createtime.length > 0) {
      var year = createtime.substring(0, 4);   
      var month = createtime.substring(4, 6); 
      var day = createtime.substring(6, 8);
      var hour = createtime.substring(8, 10);
      var minute = createtime.substring(10, 12);
      var second = createtime.substring(12, 14);

      const formattedDate = `${year}-${month}-${day}`;
      const formattedTime = `${hour}:${minute}:${second}`;
    
      return `${formattedDate} ${formattedTime}`;
    }
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
        roomid: data.state.roomid,
      }
    }).then(res => {
      console.log("monetChat - handleChatMessage res.data : ", res.data);
        if(res.status === 200 && res.data.message === 'chatmessage search success') {

          const chatListData = res.data.result.map(item => ({
            senderid: item.senderid,
            sendername: item.sendername,
            message: insertLineBreaks(item.chatmessage, maxCharacters),
            createtime: item.createtime,
            readCount: item.accountCount - item.readCount
          }));

          setChatData(chatListData);
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
   
    if(message === undefined || message === '' || message.length === 0) {
      console.log("monetChat - handleSendMessage message empty");
      alert("전송할 메세지를 입력해주세요.");
      return;
    }

    let sendData = {
      userid: userid,
      username: username,
      roomid:data.state.roomid,
      title:data.state.title,
      message:message,
      createtime:createtime,
    };

    if (socket !== null && socket.readyState === 1) {
      socket.send(JSON.stringify(sendData));
      console.log("monetChat - handleSendMessage - webSocket online");
      
      // 메세지 초기화
      setMessage('');
      // WebSocket.sendMessage(socket, userid, roomid, message, createtime);
    } else {
      console.log("monetChat - handleSendMessage - webSocket offline");
    }
  };

  const handleExit = () => {
    console.log("monetChat - handleExit");

    // navigate('/monetMain'); // '/monetRegister' 경로로 이동
    const responseData = {
      message: 'chatroom exit success'
    }
    
    callback(JSON.stringify(responseData));

    // 채팅방 웹 소켓 종료
    if (socket) {
      console.log("monetChat - handleExit, websocket close");
      socket.close();
      setSocket(null);
    }
  };

  // 채팅방 이름 변경 버튼 클릭
  const handleChatTitleModify = (title) => {
    console.log("monetChat - handleChatTitleModify");
    setIsTitleModify(false);

    axios({
      url: "http://localhost:8080/monetchat/titleModify/",
      method: "POST",
      data: {
        userid: sessionStorage.getItem("userid"),
        roomid: data.state.roomid,
        title: title
      }
    }).then(res => {
      console.log("monetChat - handleChatTitleModify res.data : ", res.data);
        if(res.status === 200 && res.data.message === 'chatroom title Modify success') {
          setTitle(title);
          data.state.title = title;
          
          const callbackMessage = {
            roomid: res.data.roomid,
            title: res.data.title,
            message: 'chatroom title Modify success'
          }

          console.log("monetChat - handleChatTitleModify data.state.title : ", data.state.title);
          callback(JSON.stringify(callbackMessage));

          setIsTitleModify(false);
        } else {
            alert("채팅방 제목을 변경하지 못하였습니다.");
        }
    }).catch(err => {
      alert(err);
    });
  };

  // 채팅방 이름 변경 UI로 변경
  const handleOpenChatTitleModify = () => {
    console.log("monetChat - handleOpenChatTitleModify");
    setIsTitleModify(true);
  };
  

  const handleReceiveMessage = (message) => {
    const receivedMessage = JSON.parse(message);

    console.log("monetChat - handleReceiveMessage, message : ", message);

    // 최초 채팅방에 입장할 때 메세지를 조회하도록 함
    if(receivedMessage.message === "채팅방에 입장하였습니다.") {
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
      setChatData(prevRoomData => [...prevRoomData, { senderid: receivedMessage.userid, sendername : receivedMessage.username, message: insertLineBreaks(receivedMessage.message, maxCharacters), createtime: receivedMessage.createtime, readCount: receivedMessage.accountCount - receivedMessage.readCount}]);
    }
  };

  const handleOpenModal = () => {
    console.log("monetChat - handleOpenModal");

    setIsModalOpen(true);
  };

  const handleDataFromMonetModal = (message) => {
    console.log("monetChat - handleDataFromMonetModal, message : ", message);

    if(message !== undefined && message !== '' && message.message === 'chatroom invite success') {
      handleInvite(message.userid, message.username, roomid);
    }

    setIsModalOpen(false);
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
        } else if(res.status === 200 && res.data.message.startsWith('chatroom invite fail')) {
          alert("이미 채팅방에 있는 사용자입니다.");
        } else {
          alert("사용자 초대를 실패하였습니다.");
        }
    }).catch(err => {
      alert(err);
    });
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

  function insertLineBreaks(message, maxCharacters) {
    if (message.length <= maxCharacters) {
      return message; // 30자 미만이면 그대로 반환
    }

    const messageParts = [];
    for (let i = 0; i < message.length; i += maxCharacters) {
      messageParts.push(message.substr(i, maxCharacters));
    }

    return messageParts.join('\n'); // 줄바꿈 문자를 사용하여 합침
  }


  return (
    <div className='container'>
      <div className="chat">
        {/* <div className="chat-button">
          <button type="button" className='btn btn-primary mr-sm-2' onClick={handleOpenChatTitleModify}>채팅방 이름 변경</button>
          <button type="button" className='btn btn-primary mr-sm-2' onClick={() => handleOpenModal()}>채팅방 초대</button>
          <button type="button" className='btn btn-primary mr-sm-4' onClick={() => handleExit()}>채팅방 나가기</button>
        </div> */}
        <div className="chat-header clearfix">
          <div className="chat-row">
            <div className="chat-about mb-2">
              {data.state && (
                <div>
                  {isTitleModify ? null : (
                    // <h6 className="m-b-0">{data.state.title}</h6>
                    <h6 className="m-b-0">{title}</h6>
                  )}

                  {!isTitleModify ? null : (
                    <div className='chat-input'>
                      <input type="text" placeholder="변경할 채팅방 이름" value={title} onChange={(e) => setTitle(e.target.value)}/>
                      <button type="button" class="btn btn-primary ml-2 chat-input-button" onClick={() => handleChatTitleModify(title)}>변경</button>              
                    </div>
                  )}
                </div>
              )}

              <div className="chat-button">
                <button type="button" className='btn btn-primary mr-sm-2' onClick={handleOpenChatTitleModify}>채팅방 이름 변경</button>
                <button type="button" className='btn btn-primary mr-sm-2' onClick={() => handleOpenModal()}>채팅방 초대</button>
                <button type="button" className='btn btn-primary mr-sm-4' onClick={() => handleExit()}>채팅방 나가기</button>
              </div>
            </div>
          </div>
          <div className="chat-history">
            {chatData.map((chat) => (
                <div className={`mt-2 ${chat.message.endsWith("초대되었습니다.") || chat.message.endsWith("퇴장하였습니다.") ? 'text-center' : (chat.senderid === userid ? 'text-left' : 'mr-3 text-right')}`}>
                  {dateFormatModify(chat.createtime)}
                  <div className={`mt-2 ${chat.message.endsWith("초대되었습니다.") || chat.message.endsWith("퇴장하였습니다.") ? 'text-center' : (chat.senderid === userid ? 'chat-message-left pb-4' : 'chat-message-right mb-4')}`}>
                    <div>
                      <div className={`text-muted small text-nowrap mt-4 ${chat.message.endsWith("초대되었습니다.") || chat.message.endsWith("퇴장하였습니다.")  || chat.readCount === 0 || chat.senderid === userid ? 'hidden' : '' }`}>{chat.readCount}</div>
                    </div>

                    <div className={`flex-shrink-1 bg-light rounded py-2 px-3 chat-message ${chat.message.endsWith("초대되었습니다.") || chat.message.endsWith("퇴장하였습니다.") ? '' : (chat.senderid === userid ? 'ml-3' : 'mr-3')}`}>
                      <div className={`font-weight-bold mb-1 ${chat.message.endsWith("초대되었습니다.") || chat.message.endsWith("퇴장하였습니다.") ? 'hidden' : ''}`}>{chat.sendername}</div>
                      <div>{chat.message}</div>
                    </div>
                    <div>
                      <div className={`text-muted small text-nowrap mt-4 ml-3 ${chat.message.endsWith("초대되었습니다.") || chat.message.endsWith("퇴장하였습니다.")  || chat.readCount === 0 || chat.senderid !== userid ? 'hidden' : '' }`}>{chat.readCount}</div>
                    </div>
                  </div>  
                </div>                 
            ))}
          </div>
  
          <div class="flex-grow-0 py-3 border-top">
            <div class="input-group">
              <textarea className="form-control" value={message} onChange={(e) => setMessage(e.target.value)}></textarea>
              <button type="button" class="btn btn-primary ml-3" onClick={() => handleSendMessage(dateFormat())}>메세지 전송</button>              
            </div>
          </div>

          {!isModalOpen ? null : (
            <MoentModal data={userData} callback={handleDataFromMonetModal} />
          )}
        </div>
      </div>
    </div>
  );
};

export default MonetChat;