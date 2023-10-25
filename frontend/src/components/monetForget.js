import React, { useState } from 'react';

import MonetIdForget from './monetIdForget';
import MonetPwForget from './monetPwForget';

// 부트스트랩
import 'bootstrap/dist/css/bootstrap.css';
import '../monetChat.css';

function MonetForget() { 
  // 처음 페이지에 진입할 때는 아이디 찾기를 먼저띄움 
  const [searchType, setSearchType] = useState('id');

  // 아이디 찾기 버튼클릭
  const handleIdSearchMove = () => {
    console.log("MonetRegister - handleIdSearchMove");

    setSearchType('id');
  };

  // 비밀번호 찾기 버튼클릭
  const handlePwSearchMove = () => {
    console.log("MonetRegister - handlePwSearchMove");
    
    setSearchType('password');
  };

  return (
    <div className='container login-container'>
      <div className="register-form">
        <span className="title">MonetChat FORGET</span>
      
        <div className='forget-top-container'>
          <button type="button" disabled={searchType === 'id'} className='button forget-top-button mr-2' onClick={handleIdSearchMove}>아이디 찾기</button>
          <button type="button" disabled={searchType === 'password'} className='button forget-top-button mr-2' onClick={handlePwSearchMove}>비밀번호 재설정</button>
        </div>

        {/* 아이디 찾기 컴포넌트  data={data} callback={handleDataFromMonetIdForget}  */}
        {searchType !== 'id' ? null : (
          <MonetIdForget />
        )}

        {searchType !== 'password' ? null : (
          <MonetPwForget />
        )}

        {/* 비밀번호 컴포넌트 callback={handleDataFromMonetPwForget}  */}
        {/* <div>
        <button type="button" className='button register-button mr-2' onClick={handleLoginMove}>비밀번호 찾기</button>
        </div> */}
      </div>  
    </div>
  );
}

export default MonetForget;