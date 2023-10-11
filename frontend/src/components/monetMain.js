import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import axios from 'axios';

Modal.setAppElement('#root'); // 모달을 렌더링할 루트 요소 지정

function MonetMain() {
  const [userid, setUserid] = useState('');

  const [username, setUsername] = useState('');
  const [usertype, setUsertype] = useState('');

  const [userData, setUserData] = useState([]);
  const [roomData, setRoomData] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // 모달에 사용되는 변수
  const [deleteRoomid, setDeleteRoomid] = useState('');
  const [deleteRoomTitle, setDeleteRoomTitle] = useState('');

  // useNavigate을 사용하여 navigate 객체를 가져옴
  const navigate = useNavigate();

  useEffect(() => {
    init();
    handleChatroomSearch();
    handleUserSearch();

  }, [userid, username, usertype]); // userid, username, usertype 상태가 변경될 때만 실행

  const init = () => {
    console.log("MonetMain - init");

    setUserid(sessionStorage.getItem("userid"));
    setUsername(sessionStorage.getItem("username"));
    setUsertype(sessionStorage.getItem("usertype"));
  }

  const handleUserSearch = () => {
    console.log("MonetMain - handleUserSearch");

    if(userid === undefined || userid === '' || userid.length === 0) {
      console.log("MonetMain - handleUserSearch, userid empty");
      return;
    }

    axios({
      url: "http://localhost:8080/monetchat/",
      method: "POST",
      data: {
        userid: userid,
        searchType: 'user'
      }
    }).then(res => {
      console.log("MonetMain - handleUserSearch res.data : ", res.data.result);
      if(res.status === 200 && res.data.message === 'chatuser search success') {
        console.log("MonetMain - handleUserSearch res.data.result.length : ", res.data.result.length);
        for(let i = 0; i < res.data.result.length; i++) { 
          setUserData(prevRoomData => [...prevRoomData, { userid: res.data.result[i].userid, username: res.data.result[i].username }]);
        }
      } else {
          alert("사용자 데이터를 불러오지 못하였습니다.");
      }
    }).catch(err => {
      alert(err);
    });
  }

  const handleChatroomSearch = () => {
    console.log("MonetMain - handleChatroomSearch");

    if(userid === undefined || userid === '' || userid.length === 0) {
      console.log("MonetMain - handleChatroomSearch, userid empty");
      return;
    }

    axios({
      url: "http://localhost:8080/monetchat/",
      method: "POST",
      data: {
        userid: userid,
        searchType: 'room'
      }
    }).then(res => {
      console.log("MonetMain - handleChatroomSearch res.data : ", res.data.result);
      if(res.status === 200 && res.data.message === 'chatroom search success') {
        console.log("MonetMain - handleChatroomSearch res.data.result.length : ", res.data.result.length);
        for(let i = 0; i < res.data.result.length; i++) { 
          setRoomData(prevRoomData => [...prevRoomData, { roomid: res.data.result[i].roomid, title: res.data.result[i].title }]);
        }
      } else {
          alert("채팅창 데이터를 불러오지 못하였습니다.");
      }
    }).catch(err => {
      alert(err);
    });
  }

  const handleEnter = async (data, type) => {
    let touserid = '';
    let roomid = '';

    console.log("MonetMain - handleEnter");

    if(type === 'user') {
      touserid = data;
    } else if(type === 'room') {
      roomid = data;
    }

    await axios({
      url: "http://localhost:8080/monetchat/enter/",
      method: "POST",
      data: {
        userid: userid,
        touserid: touserid, // 사용자 클릭
        roomid: roomid, // 채팅방 클릭
      }
    })
    .then(async (res) => {
      console.log("MonetMain - handleEnter res.data : ", res.data);

        if(res.status === 200 && res.data.message === 'chatroom enter success') {      
          // setRoomData(prevRoomData => [...prevRoomData, { roomid: res.data.roomid, title: res.data.title }]);
          // console.log("handleEnter - res.status : setRoomData :", roomData);
          // navigate('/monetChat'); // '/monetRegister' 경로로 이동

          // userData는 채팅방에 들어가서 초대하는 기능으로 인하여 추가함
          navigate('/monetChat', { state: { roomid: res.data.roomid, title: res.data.title, userData: userData} });
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
        userid: userid,
        username:username,
        roomid: deleteRoomid,
      }
    })
    .then(async (res) => {
      console.log("MonetMain - handleExit res.data : ", res.data);

        if(res.status === 200 && res.data.message === 'chatroom exit success') {      
          // 모달종료
          handleCloseModal();

          // 나간 채팅방을 제욓고 RoomData를 다시 생성함
          setRoomData(prevRoomData => prevRoomData.filter(roomData => roomData.roomid !== deleteRoomid));
          console.log("MonetMain - handleExit setRoomData :", roomData);
          // navigate('/monetChat'); // '/monetRegister' 경로로 이동

        } else {
            alert("채팅방 나가기에 실패하였습니다.");
        }
    }).catch(err => {
      alert(err);
    });
  };

  const handleOpenModal = (roomid, title) => {
    console.log("MonetMain - handleOpenModal roomid : ", roomid + ", title : " + title);

    setIsModalOpen(true);
    setDeleteRoomid(roomid);
    setDeleteRoomTitle(title);
    
  };

  const handleCloseModal = () => {
    console.log("MonetMain - handleCloseModal");

    setIsModalOpen(false);
    setDeleteRoomid('');
    setDeleteRoomTitle('');
  };

  return (
    <div>
      <h2>메인화면</h2>
      <table>
        <thead>
          <tr>
            <th>사용자ID</th>
            <th>사용자이름</th>
          </tr>
        </thead>
        <tbody>
          {userData.map((user) => (
            <tr key={user.userid}>
              <td>{user.username}</td>
              <td>{user.title}</td>
              <button type="button" onClick={() => handleEnter(user.userid, 'user')}>채팅</button>
            </tr>
          ))}
        </tbody>
        </table>

        <table>
        <thead>
          <tr>
            <th>채팅방ID</th>
            <th>제목</th>
          </tr>
        </thead>
        <tbody>
          {roomData.map((room) => (
            <tr key={room.roomid}>
              <td>{room.roomid}</td>
              <td>{room.title}</td>
              <button type="button" onClick={() => handleEnter(room.roomid, 'room')}>채팅방 입장</button>
              <button type="button"  onClick={() => handleOpenModal(room.roomid, room.title)}>채팅방 나가기</button>
            </tr>
          ))}
        </tbody>
        </table>
          
        <Modal isOpen={isModalOpen} onRequestClose={handleCloseModal} contentLabel="채팅방 나가기">
          <h2>채팅방 나가기</h2>
          <p>{deleteRoomTitle}의 채팅방을 나가시겠습니까?</p>
          <button type="button" onClick={handleExit}>확인</button>
          <button type="button" onClick={handleCloseModal}>취소</button>
        </Modal>

        {/* <button type="button" onClick={() => handleCreate(room.roomid)}>채팅방 입장</button> */}
        {/* <button type="button" onClick={init}>초기화</button> */}
        
      {/* <form>  
        <div>
          <label>Message:</label>
          <input type="text" value={message} onChange={(e) => setMessage(e.target.value)}/>
          <button type="button" onClick={handleSendMessage}> 메세지 보내기</button>
        </div>

        <button type="button" onClick={init}>초기화</button>
      </form> */}
    </div>
  );
};

export default MonetMain; 