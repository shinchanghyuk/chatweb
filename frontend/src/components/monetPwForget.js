import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// 부트스트랩
import 'bootstrap/dist/css/bootstrap.css';
import '../monetChat.css';

function MonetForget() {
  const [userid, setUserid] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [email, setEmail] = useState('');
  const [emailcode, setEmailcode] = useState('');
  
  const [selectedEmail, setSelectedEmail] = useState('');
  const [searchResult, setSearchResult] = useState(false);

  const [isEmailSend, setIsEmailSend] = useState(false);
  
  const emailOptions = [
    'gmail.com',
    'naver.com',
  ];

  const baseURL = process.env.REACT_APP_API_URL;

  // useNavigate을 사용하여 navigate 객체를 가져옴
  const navigate = useNavigate();

  // 로그인 화면이동 버튼클릭
  const handleLoginMove = () => {
      console.log("MonetRegister - handleLoginMove");

      navigate('/'); // '/monetLogin' 경로로 이동
  };

  // 인증번호 전송 버튼 클릭
  const handleEmailcodeSend = () => {
    console.log("MonetRegister - handleEmailcodeSend");

    axios({
        url: baseURL + "monet/emailAuthentication/",
        method: "POST",
        data: {
          userid: userid,
          email: email+'@'+selectedEmail,
          type:'find'
        }
    }).then(res => {
        if(res.data === "emailcode send success") {
          alert("이메일 인증번호가 전송되었습니다.");
          setIsEmailSend(true);
        } else if(res.data === "userData invaild") {
          alert("일치하는 사용자정보가 없습니다.");
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
        url: baseURL + "monet/emailVerify/",
        method: "POST",
        data: {
          userid: userid,
          email: email+'@'+selectedEmail,
          emailcode: emailcode
        }
    }).then(res => {
        if(res.data === "email verify success") {
          alert("이메일 인증에 성공하였습니다.");
          setSearchResult(true);
        } else {
          alert("이메일 인증에 실패하였습니다.");
        }
    }).catch(err => {
      alert(err);
    });
  };

  // 비밀번호 재설정
  const handlePwSetting = () => {
    console.log("MonetRegister - handlePwSetting");

    if(password === undefined || password === null || password === '') {
      alert("비밀번호를 입력해주세요.");
      return;
    }

    if(confirmPassword === undefined || confirmPassword === null || confirmPassword === '') {
      alert("확인 비밀번호를 입력해주세요.");
      return;
    }

    if(password !== confirmPassword) {
      alert("입력한 비밀번호가 다릅니다. 비밀번호를 확인하세요.");
      return;
    }

    axios({
      url: baseURL + "monet/signPwSetting/",
      method: "POST",
      data: {
        userid: userid,
        password: password,
      }
    }).then(res => {
      if(res.status === 200 && res.data.message === 'signPwSetting success') { 
        alert('비밀번호가 재설정 되었습니다. 재로그인 해주세요.');

        navigate('/');
        
      } else {
          alert("비밀번호 재설정에 실패하였습니다. 다시 시도해주세요.");
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
            <input className="input common-input register-input" type="text" placeholder="USERID" value={userid} onChange={(e) => setUserid(e.target.value)}/>
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

            <button type="button" className="button register-button register-email-button" disabled={ email.length === 0 } onClick={handleEmailcodeSend}>인증코드 전송</button>
          </div>

          <div className='register-input-container'>
            <input className="input common-input register-input" type="text" placeholder="EMAILCODE" value={emailcode} onChange={(e) => setEmailcode(e.target.value)}/>
            <button type="button" className="button register-button" disabled={ !isEmailSend } onClick={handleEmailcodeVerify}>인증코드 확인</button>
          </div>
        </form>
      )}

      {!searchResult ? null : (
        <div className='register-input-container white'>
            <input className="input common-input forget-input" type="password" placeholder="PASSWORD" value={password} onChange={(e) => setPassword(e.target.value)}/>         
            <input className="input common-input forget-input" type="password" placeholder="CONFIRM PASSWORD" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}/>

            <button type="button" className='button forget-top-button' onClick={handlePwSetting}>비밀번호 재설정</button>
        </div>
      )}

      <div clssName='register-input-container'>
        {/* <button type="button" className='button register-button' onClick={handlePwSetting}>비밀번호 재설정</button> */}
        <button type="button" className='button forget-bottom-button ' onClick={handleLoginMove}>뒤로가기</button>
      </div>
    </div>  
  </div>
  );
}

export default MonetForget;