import React, { useState, useEffect } from 'react';

import Modal from 'react-bootstrap/Modal';

// 부트스트랩
import 'bootstrap/dist/css/bootstrap.css';
import '../monetChat.css';


function MonetModal({ data, callback }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');

  useEffect(() => {
    console.log('monetModal - useEffect, data : ', data);

    if(data !== undefined && data !== '') {
      console.log('monetModal - useEffect, data.roomid !== ' , data.roomid !== ''); 
      console.log('monetModal - useEffect, (data.roomid !== undefined : ', data.roomid !== undefined);

        if(data.roomid !== undefined && data.roomid !== '') {
          setTitle('채팅방 나가기');
        } else {
          setTitle('채팅방 초대');
        }
        setIsOpen(true);
    }
  }, [data]);

  const handleInvite = (userid, username) => {
    console.log("moentModal - handleInvite");
    let message = 'chatroom invite success';

    const responseData = {
      userid: userid,
      username : username,
      message: message,
    }

    callback(responseData);
  };

  const handleExit = () => {
    console.log("moentModal - handleExit");
    callback('chatroom exit success');
  };

  const handleCloseModal = () => {
    console.log("moentModal - handleCloseModal");
    
    setIsOpen(false);
    callback('');
  };

  return (
    <div>
      <Modal show={isOpen} onHide={handleCloseModal} backdrop="static" centered>
          <Modal.Header>
              <Modal.Title>{title}</Modal.Title>
          </Modal.Header>
          <div className="modal-body">
            {data && data.roomid !== undefined && data.roomid !== '' ? (
            <div>
              <div className="mt-2">
                <div>{data.title} 의 채팅방을 나가시겠습니까?</div>
              </div>

              <div className="modal-custom-footer">
              <button type="button" className="btn btn-primary mr-2" onClick={handleCloseModal}>닫기</button>
              <button type="button" className="btn btn-primary" onClick={() => handleExit()}>나가기</button>
              </div>
            </div>
            ) : null }

            {data && Array.isArray(data) && data.length > 0 ? (
              <div>
                {data.map((user) => (
                  <div className="mt-2 ml-1" key={user.userid}>
                    <div>{user.username}</div>
                    <div>
                      <i className="fa fa-circle">{user.status === 1 ? "online" : "offline"}</i>
                      <button type="button" className="btn btn-primary ml-3" onClick={() => handleInvite(user.userid, user.username)}>초대</button>
                    </div>
                  </div>
                ))}
              
                <div className="modal-custom-footer">
                  <button type="button" className="btn btn-primary" onClick={handleCloseModal}>닫기</button>
                </div>
              </div>  
            ) : null }
          </div>
      </Modal>
    </div>
  );
}

export default MonetModal;