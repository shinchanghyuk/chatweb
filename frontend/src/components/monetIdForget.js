import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// 부트스트랩
import 'bootstrap/dist/css/bootstrap.css';
import '../monetChat.css';

function MonetForget() {
  const [userid, setUserid] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  
  const [selectedEmail, setSelectedEmail] = useState('');
  const [searchResult, setSearchResult] = useState(false);
  
  const emailOptions = [
    'gmail.com',
    'naver.com',
  ];

  // useNavigate을 사용하여 navigate 객체를 가져옴
  const navigate = useNavigate();

  // 로그인 화면이동 버튼클릭
  const handleLoginMove = () => {
      console.log("MonetRegister - handleLoginMove");

      navigate('/'); // '/monetLogin' 경로로 이동
  };

  const handleIdFind = () => {
    console.log("MonetRegister - handleIdFind");

    let joinEmail = email+'@'+selectedEmail;

    if(username === undefined || username === null || username === '') {
      alert("사용자명을 입력해주세요.");
      return;
    }

    if(joinEmail === undefined || joinEmail === null || joinEmail === '') {
      alert("이메일 주소를 입력해주세요.");
      return;
    }

    axios({
      url: "http://localhost:8080/monet/signIdFind/",
      method: "POST",
      data: {
        username: username,
        email: email+'@'+selectedEmail,
      }
    }).then(res => {
      if(res.status === 200 && res.data.message === 'signIdFind success') { 
        setUserid(res.data.userid);
        setSearchResult(true);

      } else {
          alert("일치하는 정보가 없습니다.");
          setUsername('');
          setEmail('');
          setSelectedEmail('');
      }
    }).catch(err => {
      alert(err);
    });
  };

  return (
    <div className='container'>
      <div className="register-form">
        {searchResult ? null : (
          <form>
            <div className='register-input-container'>
              <input className="input common-input register-input" type="text" placeholder="USERNAME" value={username} onChange={(e) => setUsername(e.target.value)}/>
            </div>

            <div className='register-input-container white'>
              <input className="input common-input forget-input" type="email" placeholder="EMAIL" value={email} onChange={(e) => setEmail(e.target.value)}/>
              <span className=''>@</span>
              <select className='input common-input forget-input select' value={selectedEmail} onChange={(e) => setSelectedEmail(e.target.value)}>
                <option value="">이메일 주소선택</option>
                {emailOptions.map((option, index) => (
                  <option key={index} value={option}>{option}</option>
                ))}
              </select>
            </div>        
          </form>
        )}

        {!searchResult ? null : (
          <div className='login-input-container forget-input-container'>
            <span className='forget-span'>회원가입 시 사용한 아이디는 {userid} 입니다.</span>
          </div>
        )}

        <div clssName='register-input-container'>
          <button type="button" className={`button register-button ml-2 ${searchResult ? 'hidden' : '' }`} onClick={handleIdFind}>아이디 찾기</button>
          <button type="button" className={`button ${searchResult ? 'forget-bottom-button' : 'register-button' }`} onClick={handleLoginMove}>뒤로가기</button>
        </div>
      </div>
    </div>
  );
}

export default MonetForget;