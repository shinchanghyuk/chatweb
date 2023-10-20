import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import MonetChat from './monetChat';
import MonetModal from './monetModal';
import WebSocket from '../utils/webSocket';

// 부트스트랩
import 'bootstrap/dist/css/bootstrap.css';
import '../monetChat.css'; 

function MonetMain() {
  const [userid, setUserid] = useState('');
  const [socket, setSocket] = useState(null);

  const [username, setUsername] = useState('');
  const [usertype, setUsertype] = useState('');

  const [userData, setUserData] = useState([]);
  const [roomData, setRoomData] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // 모달에 사용되는 변수
  const [deleteRoomData, setDeleteRoomData] = useState([]);

  // const [lastSelectedRoomid, setLastSelectedRoomid] = useState('');
  
  const [chatStatus, setChatStatus] = useState(false);
  const [data, setData] = useState('');

  let webSocket;

  // useNavigate을 사용하여 navigate 객체를 가져옴
  // 만약 monetMain와 monetChat 컴포넌트를 따로 쓸거면 이를 통해서 데이터 전달을 해야함
  const navigate = useNavigate();

  useEffect(() => {
    console.log("MonetMain - userid useEffect");
    init();

  }, [userid, username, usertype]); // userid, username, usertype 상태가 변경될 때만 실행

  useEffect(() => {
    console.log("MonetMain - chatStatus useEffect");

    // data가 빈값인 경우는 채팅방을 나갔을 때임
    if (data === undefined || data === '') {
      setChatStatus(false);

      handleChatroomSearch();
      handleUserSearch();
    } else {
      setChatStatus(true);
    }
  }, [data]);

  const init = () => {
    console.log("MonetMain - init");

    setUserid(sessionStorage.getItem("userid"));
    setUsername(sessionStorage.getItem("username"));
    setUsertype(sessionStorage.getItem("usertype"));

    console.log("MonetMain - init, userid : " + userid + ", username : " + username + ", usertype : " + usertype);

    // userid
    if(userid !== undefined && userid !== '' && userid !== null) {
      notificationPermission();

      // if (socket) {
      //   console.log('MonetMain - useEffect, already socket, close');
      //   socket.close();
      //   setSocket(null);
      // }

      if(webSocket) {
        console.log('MonetMain - useEffect, already webSocket, close');
        webSocket.close();
        setSocket(null);
      }

      userWebSocket();
    } else if(sessionStorage.getItem("userid") === undefined || sessionStorage.getItem("userid") === null || sessionStorage.getItem("userid") === '') {
      console.log('MonetMain - useEffect, userid is null');
      alert('유효하지 않는 접근입니다.');
      navigate('/');
    }
  }

  const userWebSocket = () => {
      // WebSocket 연결 생성
      webSocket = WebSocket.createWebSocket(sessionStorage.getItem("userid"), '');

      // 웹 소켓 연결이 열렸을 때 호출되는 이벤트 핸들러
      webSocket.onopen = () => {
        console.log('사용자 웹 소켓 연결이 열렸습니다.');
        setSocket(webSocket);
      };
  
      // 웹 소켓 메시지를 수신했을 때 호출되는 이벤트 핸들러
      // 초대 되었거나, 방에 있지 않을 때 메세지가 도착하면 알림
      webSocket.onmessage = (event) => {
        const message = event.data;
        handleReceiveMessage(message);
      };
  }

  const notificationPermission = async () => {
    console.log("MonetMain - notificationPermission");

    Notification.requestPermission().then(function (permission) {
      if (permission === 'granted') {
        console.log("MonetMain - notificationPermission, permission grated");
      } else {
        console.log('MonetMain - notificationPermission, permission denied');
      }
    });
  }

  const handleReceiveMessage = (message) => {
    const receivedMessage = JSON.parse(message);

    console.log("MonetMain - handleReceiveMessage, message : ", receivedMessage);

    if(receivedMessage.message.endsWith("에 초대되었습니다.")) {
      if(roomData.length > 0) { // 기존 열려있는 채팅방이 있을경우
        setRoomData(prevRoomData => [...prevRoomData, { roomid: receivedMessage.roomid, title: receivedMessage.title, count: receivedMessage.userCount}]);
      } else { // 없을경우
        const roomData = {
          roomid: receivedMessage.roomid,
          title: receivedMessage.title,
          count: receivedMessage.userCount
        }

        setRoomData(roomData);
      }
    } else if(receivedMessage.message === "새로운 메세지가 도착하였습니다.") {
      // 노티를 사용하여 사용자에게 알림 줄 예정
      handleNotificationShow(receivedMessage);
    } else if(receivedMessage.message.endsWith("님이 로그인 하였습니다.") || receivedMessage.message.endsWith("님이 로그아웃 하였습니다.")) {
      // handleUserSearch();
 
      setUserData(prevUserData => {
        return prevUserData.map(user => {
          if (user.userid === receivedMessage.userid) {
            console.log('MonetMain - handleReceiveMessage, user.userid : ' + user.userid + ', receivedMessage.userid : ' +  receivedMessage.userid);
            if(receivedMessage.message.endsWith("님이 로그인 하였습니다.")) {
              return { ...user, status: 1 };
            } else {
              return { ...user, status: 0 };
            }
          }

          return user;
        });
      });
    } else if(receivedMessage.message === '중복 로그인 되었습니다.') {
      if (webSocket) {
        console.log('MonetMain - handleReceiveMessage new user Login, webSocket close');
        webSocket.close();
        setSocket(null);
      } else { 
        console.log('MonetMain - handleReceiveMessage new user Login, socket is null');
      }
    
      navigate('/');
    }
  };

  const handleNotificationShow = (message) => {
    console.log("MonetMain - handleNotificationShow");

    if ('Notification' in window) {
      if (Notification.permission === 'granted') { // 이미 노티 권한이 허용된 경우
        showNotification(message);
      } else if (Notification.permission !== 'denied') { // 노티 권한이 없는 경우 권한 요청
        Notification.requestPermission().then(function (permission) {
          if (permission === 'granted') {
            showNotification(message);
          }
        });
      }
    }
  }
    
  function showNotification(message) {
    console.log("MonetMain - showNotification, message : ", message);

    const notification = new Notification(message.title, {
      body: message.message
    });
  
    notification.onclick = function () { // 노티 클릭
      console.log("MonetMain - showNotification, onclick");
      monetChatTabMove(message);
      // 노티 클릭하면 채팅방으로 갈 수 있도록 수정
    };
  }

  function monetChatTabMove(message) { // monetChat 탭으로 이동
    const existingTab = Array.from(window.top.frames).find((frame) => frame.location.href === 'localhost:8080/monetMain');
  
    // console.log("MonetChat Array Tab : ", Array.from(window.top.frames));

    if (existingTab) {
      existingTab.focus(); // 이미 열려 있는 탭으로 이동

      setData({ state : { roomid: message.roomid, title: message.title, userData: userData}});
    } else {
      // // 탭이 열려 있지 않으면 새로운 탭을 열고 해당 URL로 이동
      // window.open(url, '_blank');
    }
  }

  const handleUserSearch = () => {
    let searchUserid = '';
    console.log("MonetMain - handleUserSearch");
    
    if(userid === undefined || userid === '') {
      console.log("MonetMain - handleUserSearch, userid empty");
      searchUserid = sessionStorage.getItem("userid");
    } else { 
      searchUserid = userid;
    }

    axios({
      url: "http://localhost:8080/monetchat/",
      method: "POST",
      data: {
        userid: searchUserid,
        searchType: 'user'
      }
    }).then(res => {
      console.log("MonetMain - handleUserSearch res.data : ", res.data.result);
      if(res.status === 200 && res.data.message === 'chatuser search success') {
        console.log("MonetMain - handleUserSearch res.data.result.length : ", res.data.result.length);

        const userListData = res.data.result.map(item => ({
          userid: item.userid,
          username: item.username,
          status: item.status
        }));

        setUserData(userListData);
      } else {
          alert("사용자 데이터를 불러오지 못하였습니다.");
      }
    }).catch(err => {
      alert(err);
    });
  }

  const handleChatroomSearch = () => {
    let searchUserid = '';
    console.log("MonetMain - handleChatroomSearch");

    if(userid === undefined || userid === '') {
      console.log("MonetMain - handleChatroomSearch, userid empty");
      searchUserid = sessionStorage.getItem("userid");
    } else { 
      searchUserid = userid;
    }

    axios({
      url: "http://localhost:8080/monetchat/",
      method: "POST",
      data: {
        userid: searchUserid,
        searchType: 'room'
      }
    }).then(res => {
      console.log("MonetMain - handleChatroomSearch res.data : ", res.data.result);
      
      if(res.status === 200 && res.data.message === 'chatroom search success') {
        console.log("MonetMain - handleChatroomSearch res.data.result.length : ", res.data.result.length);

        const roomListData = res.data.result.map(item => ({
          roomid: item.roomid,
          title: item.title,
          count: item.userCount
        }));

        setRoomData(roomListData);

      } else {
          alert("채팅창 데이터를 불러오지 못하였습니다.");
      }
    }).catch(err => {
      alert(err);
    });
  }

  // 채팅방 또는 사용자에 대한 채팅버튼을 눌렀을 때
  const handleEnter = async (param, type) => {
    let touserid = '';
    let roomid = '';

    console.log("MonetMain - handleEnter, userid : " + userid + ", username : " + username + ", usertype : " + usertype);
    
    if(type === 'user') {
      touserid = param;
    } else if(type === 'room') {
      roomid = param;
    }

    await axios({
      url: "http://localhost:8080/monetchat/enter/",
      method: "POST",
      data: {
        userid: sessionStorage.getItem("userid"),
        touserid: touserid, // 사용자 클릭
        roomid: roomid, // 채팅방 클릭
      }
    })
    .then(async (res) => {
      console.log("MonetMain - handleEnter res.data : ", res.data);

        if(res.status === 200 && res.data.message.endsWith('chatroom enter success')) {
          // setLastSelectedRoomid(roomid);
          
          // 신규 채팅방일 경우 기존 roomdata에 추가로 넣음
          // 기존 채팅방일 경우 이미 roomdata에 들어있기 때문에 추가안함
          if(res.data.message === 'new chatroom enter success') {
            setRoomData(prevRoomData => [...prevRoomData, { roomid: res.data.roomid, title: res.data.title, count:res.data.userCount }]);
          } 

          // 현재 들어가 있는 채팅방 roomid와 사용자가 들어가려는 채팅방 roomid가 같을 때 return 시킴
          if(data === undefined || data === '' || data.length === 0) {
            console.log("MonetMain - handleEnter data empty");
          } else {
            if(res.data.roomid === data.state.roomid) {
              console.log("MonetMain - handleEnter already current roomid open");
              return; 
            } 
          }

          setData({ state : { roomid: res.data.roomid, title: res.data.title, userData: userData}});
          
          // console.log("handleEnter - res.status : setRoomData :", roomData);
          // navigate('/monetChat'); // '/monetRegister' 경로로 이동
          
          // userData는 채팅방에 들어가서 초대하는 기능으로 인하여 추가함
          // data가 변경되면 monetChat useEffect가 실행됨
           // navigate('/monetChat', { state: { roomid: res.data.roomid, title: res.data.title, userData: userData} });
        } else {
            alert("채팅창 들어가기에 실패하였습니다.");
        }
    }).catch(err => {
      alert(err);
    });
  };

  const handleExit = () => {
    console.log("MonetMain - handleExit");

    axios({
      url: "http://localhost:8080/monetchat/exit/",
      method: "POST",
      data: {
        userid: sessionStorage.getItem("userid"),
        username:username,
        roomid: deleteRoomData.roomid,
      }
    })
    .then(async (res) => {
      console.log("MonetMain - handleExit res.data : ", res.data);

        if(res.status === 200 && res.data.message === 'chatroom exit success') {      
          handleCloseModal(); // 모달종료

          console.log("MonetMain - handleExit roomData length : ", roomData.length);

          // 나간 채팅방을 제외하고 RoomData를 다시 생성함
          // 채팅방이 복수 개 있을 경우 여기탐
          if(roomData.length > 1) {
            setRoomData(prevRoomData => prevRoomData.filter(roomData => roomData.roomid !== deleteRoomData.roomid));
          } else { // 채팅방이 없으니까 빈 값으로 넣음
            setRoomData([]);
          }

          // 현재 들어가 있는 채팅방 roomid와 사용자가 들어가려는 채팅방 roomid가 같을 때 return 시킴
          if(data === undefined || data === '' || data.length === 0) {
            console.log("MonetMain - handleExit data already empty");
          } else {
            if(deleteRoomData.roomid === data.state.roomid) {
              console.log("MonetMain - handleExit data : ", data.state);
              setData('');
            } 
          }
        } else {
            alert("채팅방 나가기에 실패하였습니다.");
        }
    }).catch(err => {
      alert(err);
    });
  };

  const handleOpenModal = (roomid, title) => {
    console.log("MonetMain - handleOpenModal roomid : ", roomid + ", title : " + title);

    const deleteRoomInfo = {
      roomid:roomid,
      title:title
    }

    setDeleteRoomData(deleteRoomInfo)
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    console.log("MonetMain - handleCloseModal");

    setIsModalOpen(false);
    setDeleteRoomData([]);
  };

  // monetChat 컴포넌트가 전달한 메세지
  // 채팅방안의 채팅방 나가기 버튼 눌렀을 때 사용함
  const handleDataFromMonetChat = (message) => {
    const receivedMessage = JSON.parse(message);

    console.log("MonetMain - handleDataFromMonetChat, receivedMessage : ", receivedMessage);

    if(receivedMessage !== undefined && receivedMessage !== null && receivedMessage !== '') {
      if(receivedMessage.message === "chatroom exit success") {
        setData('');
      } else if(receivedMessage.message === "chatroom title Modify success") {
        // roomData의 title 변경

        const updatedRoomData = roomData.map(room => {
          if (room.roomid === receivedMessage.roomid) {
            return { ...room, title: receivedMessage.title };
          }
          return room;
        });

        setRoomData(updatedRoomData);
      }
    }
  };

  // monetModal 컴포넌트가 전달한 메세지
  // 나가기 버튼 눌렀을 때 사용함
  const handleDataFromMonetModal = (message) => {
    console.log("MonetMain - handleDataFromMonetModal, message : ", message);

    if(message !== '' && message === 'chatroom exit success') {
      handleExit();
    }
  };

  const handleLogout = () => {
    console.log("MonetMain - handleLogout");

    if(window.confirm("로그아웃 하시겠습니까?")) {
      sessionStorage.setItem("userid", '');
      sessionStorage.setItem("username", '');
      sessionStorage.setItem("usertype ", '');

      // 로그아웃 시 해당 사용자 웹 소켓 종료
      // setData('')를 통해서 채팅방 웹 소켓도 종료
      if (webSocket) {
        console.log('MonetMain - handleLogout, webSocket close');
        webSocket.close();
        setSocket(null);
      }
      
      navigate('/'); // 로그인 페이지로 이동
    }
  };

  return (
    <div className="container main-container">
      <div>
        <div className="main-nav">
          <span className="main-title">MonetChat</span>
          <button type="button" className={'btn btn-primary mb-2'} onClick={handleLogout}>로그아웃</button>
        </div>
        <div className="row clearfix">
          <div className="col-lg-12">
            <div className="card chat-app">
              <div id="plist" className="people-list">
                <ul className="list-unstyled chat-list mt-2 mb-0" id="user-list">
                  {userData.map((user) => (
                      <li className="clearfix" key={user.userid} onClick={() => handleEnter(user.userid, 'user')}>
                        <div className="about">
                            <div className="name">{user.username}</div>
                            <div className="status">
                              <i className="fa fa-circle">{user.status === 1 ? "online" : "offline"}</i>
                            </div>
                        </div>
                      </li>
                    ))}
                </ul>

                <ul className="list-unstyled chat-list mt-2 mb-0" id="room-list">
                  {roomData.map((room) => (
                    <li className="clearfix" key={room.roomid} onClick={() => handleEnter(room.roomid, 'room')}>
                      <div className="about">
                        <div className="name">{room.title}</div>
                        <div className="status">
                          <i className="fa fa-circle">채팅방 인원 : {room.count}명</i>
                          <button type="button" className={'btn btn-primary mx-3'} onClick={(e) => {e.stopPropagation(); handleOpenModal(room.roomid, room.title); }}>나가기</button>
                          
                          {/* onClick={() => handleOpenModal(room.roomid, room.title)}>나가기</button> */}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              
              {isModalOpen && deleteRoomData ? <MonetModal data={deleteRoomData} callback={handleDataFromMonetModal} /> : ( 
                null 
              )}
          
              {/* 채팅방 컴포넌트 - 채팅방 입장 눌렀을 때 chatStatus 값은 true가 됨 */}
              {!chatStatus ? null : (
                <MonetChat data={data} callback={handleDataFromMonetChat} />
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonetMain; 


// 할일
// 비밀번호 잊었을 때 관련 페이지 생성(이메일로 인증하도록)


// 토요일
// 후 포트폴리오 작성
// 후 AWS 서버 생성


// 사용자가 마지막에 채팅 메세지 띄우기?
// 없는 URL로 왔을 때 유효하지 않은 페이지? 메세지 후 로그인 화면 이동
