import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


function MonetRegister() {
    const [userid, setUserid] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [emailcode, setEmailcode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    
    const [isEmailSend, setIsEmailSend] = useState(false);
    const [isEmailVerify, setIsEmailVerify] = useState(false);
    const [isUseridCheck, setIsUseridCheck] = useState(false);

    // useNavigate을 사용하여 navigate 객체를 가져옴
    const navigate = useNavigate();

    // 중복체크 버튼 클릭
    const handleUserCheck = () => {
      axios({
          url: "http://localhost:8080/userCheck/",
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
    axios({
        url: "http://localhost:8080/emailAuthentication/",
        method: "POST",
        data: {
          userid: userid,
          email: email,
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
    axios({
        url: "http://localhost:8080/emailVerify/",
        method: "POST",
        data: {
          userid: userid,
          email: email,
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
      axios({
          url: "http://localhost:8080/signUp/",
          method: "POST",
          data: {
            userid: userid,
            username: username,
            email: email,
            password: password, 
          }
      }).then(res => {
          if(res.data === "signUp success") {
            alert("회원가입이 완료되었습니다. 재 로그인 해주세요.");
            navigate('/');
          } else {
            alert("로그인에 실패하였습니다.");
          }
      }).catch(err => {
        alert(err);
      });
    };

    return (
        <div>
            <h2>회원가입</h2>
            <form>
                <div>
                  <label>Userid:</label>
                  <input type="text" value={userid} onChange={(e) => setUserid(e.target.value)}/>
                  <button type="button" disabled={ userid.length === 0 } onClick={handleUserCheck}>중복체크</button>
                </div>
                <div>
                  <label>Email:</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}/>
                  <button type="button" disabled={ email.length === 0 || !isUseridCheck } onClick={handleEmailcodeSend}>인증번호 전송</button>
                </div>
                <div>
                  <label>Emailcode:</label>
                  <input type="text" value={emailcode} onChange={(e) => setEmailcode(e.target.value)}/>
                  <button type="button" disabled={ !isEmailSend } onClick={handleEmailcodeVerify}>인증번호 확인</button>
                </div>
                <div>
                  <label>Username:</label>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}/>
                </div>
                <div>
                  <label>Password:</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}/>
                </div>
                <div>
                  <label>ConfirmPassword:</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}/>
                </div>

                <button type="button" disabled={!isEmailVerify || !isUseridCheck || !password === confirmPassword } onClick={handleRegister}>회원가입</button>
            </form>
      </div>  
    );
}

export default MonetRegister;