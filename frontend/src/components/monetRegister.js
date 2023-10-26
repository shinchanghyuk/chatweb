import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// 부트스트랩
import 'bootstrap/dist/css/bootstrap.css';
import '../monetChat.css';


function MonetRegister() {
  const [userid, setUserid] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [emailcode, setEmailcode] = useState('');

  const [selectedEmail, setSelectedEmail] = useState('');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isEmailSend, setIsEmailSend] = useState(false);
  const [isEmailVerify, setIsEmailVerify] = useState(false);
  const [isUseridCheck, setIsUseridCheck] = useState(false);

  const emailOptions = [
    'gmail.com',
    'naver.com',
  ];

  const baseURL = process.env.REACT_APP_API_URL;

  // useNavigate을 사용하여 navigate 객체를 가져옴
  const navigate = useNavigate();

  // 중복체크 버튼 클릭
  const handleUserCheck = () => {
    console.log("MonetRegister - handleUserCheck");

    axios({
        url: baseURL + "user/userCheck/",
        method: "POST",
        data: {
          userid: userid,
        }
    }).then(res => {
        if(res.data === "userCheck success") {
          alert("사용 가능한 아이디입니다.");
          setIsUseridCheck(true);
        } else {
          alert("사용할 수 없는 아이디입니다.");
        }
    }).catch(err => {
      alert(err);
    });
  };

  // 인증번호 전송 버튼 클릭
  const handleEmailcodeSend = () => {
    console.log("MonetRegister - handleEmailcodeSend");

    axios({
        url: baseURL + "user/emailAuthentication/",
        method: "POST",
        data: {
          userid: userid,
          email: email+'@'+selectedEmail,
          type:'register'
        }
    }).then(res => {
        if(res.data === "emailcode send success") {
          alert("이메일 인증번호가 전송되었습니다.");
          setIsEmailSend(true);
        } else {
          alert("이메일 인증번호가 전송되지 않았습니다.");
        }
    }).catch(err => {
      alert(err);
    });
  };

  // 인증번호 확인 버튼 클릭
  const handleEmailcodeVerify = () => {
    console.log("MonetRegister - handleEmailcodeVerify");

    axios({
        url: baseURL + "user/emailVerify/",
        method: "POST",
        data: {
          userid: userid,
          email: email+'@'+selectedEmail,
          emailcode: emailcode
        }
    }).then(res => {
        if(res.data === "email verify success") {
          alert("이메일 인증에 성공하였습니다.");
          setIsEmailVerify(true);
        } else {
          alert("이메일 인증에 실패하였습니다.");
        }
    }).catch(err => {
      alert(err);
    });
  };

  // 회원가입 버튼 클릭
  const handleRegister = () => {
    console.log("MonetRegister - handleRegister");

    axios({
        url: baseURL + "user/signUp/",
        method: "POST",
        data: {
          userid: userid,
          username: username,
          email: email+'@'+selectedEmail,
          password: password, 
        }
    }).then(res => {
        if(res.data === "signUp success") {
          alert("회원가입이 완료되었습니다. 재 로그인 해주세요.");
          navigate('/monetchat');
        } else {
          alert("로그인에 실패하였습니다.");
        }
    }).catch(err => {
      alert(err);
    });
  };

  // 뒤로가기 버튼 클릭
  const handleLoginMove = () => {
    console.log("MonetRegister - handleLoginMove");

    navigate('/monetchat'); // '/monetRegister' 경로로 이동
  };

  return (
    <div className='container login-container'>
      <div className="register-form">
        <span className="title">MonetChat REGISTER</span>
        <form>
          <div className='register-input-container'>
            <input className="input common-input register-input" type="text" placeholder="USERID" value={userid} onChange={(e) => setUserid(e.target.value)}/>
            <button type="button" className="button register-button" disabled={ userid.length === 0 } onClick={handleUserCheck}>중복체크</button>
          </div>

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
            
            <button type="button" className="button register-button register-email-button" disabled={ email.length === 0 || !isUseridCheck } onClick={handleEmailcodeSend}>인증코드 전송</button>
          </div>

          <div className='register-input-container'>
            <input className="input common-input register-input" type="text" placeholder="EMAILCODE" value={emailcode} onChange={(e) => setEmailcode(e.target.value)}/>
            <button type="button" className="button register-button" disabled={ !isEmailSend } onClick={handleEmailcodeVerify}>인증코드 확인</button>
          </div>

          <div className='register-input-container white'>
            <input className="input common-input register-input " type="password" placeholder="PASSWORD" value={password} onChange={(e) => setPassword(e.target.value)}/>         
            <input className="input common-input register-input select" type="password" placeholder="CONFIRM PASSWORD" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}/>
          </div>
        </form>
        
        <div clssName='register-input-container'>
          <button type="button" className='button register-button' disabled={ userid.length === 0 || emailcode.length === 0 || username.length === 0 || email.length === 0 || password.length === 0 ||
             confirmPassword.length === 0 || !isEmailVerify || !isUseridCheck || !password === confirmPassword } onClick={handleRegister}>회원가입</button>
          <button type="button" className='button register-button mr-2' onClick={handleLoginMove}>뒤로가기</button>
        </div>
      </div>  
    </div>
  );
}

export default MonetRegister;