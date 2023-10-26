import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// 부트스트랩
import 'bootstrap/dist/css/bootstrap.css';
import '../monetChat.css'; 

function MonetLogin() {
    const [userid, setUserid] = useState('');
    const [password, setPassword] = useState('');

    // useNavigate을 사용하여 navigate 객체를 가져옴
    const navigate = useNavigate();

    const baseURL = process.env.REACT_APP_API_URL;

    // Register 버튼 클릭
    const handleRegisterMove = () => {
        console.log("MonetLogin - handleRegisterMove");
        
        navigate('/monetchat/monetRegister'); // '/monetRegister' 경로로 이동
    };

    // Forget 버튼 클릭
    const handleForgetMove = () => {
        console.log("MonetLogin - handleForgetMove");
        
        navigate('/monetchat/monetForget'); // '/monetForget' 경로로 이동
    };
    
    // 로그인 버튼 클릭
    const handleLogin = () => {
        console.log("MonetLogin - handleLogin, userid : ", userid + ", password : ", password);

        if (userid === undefined || userid === '' || userid.length === 0) {
            alert('아이디를 입력해주세요.');
            return;
        }

        if (password === undefined || password === '' || password.length === 0) {
            alert('비밀번호를 입력해주세요.');
            return;
        }

        axios({
            url: baseURL + "user/signIn/",
            method: "POST",
            data: {
              userid: userid,
              password: password,
            }
        }).then(res => {
            if(res.status === 200 && res.data.message.startsWith('signIn success')) {
                if(res.data.message.endsWith('(abnormal)')) { // 이미 웹 소켓이 접속 있을 경우
                    alert("기존 로그인 세션은 로그아웃됩니다.");
                } else if(res.data.message.endsWith('(normal)')) {
                    alert("로그인에 성공하였습니다.");
                }
            
                sessionStorage.setItem("userid", userid);
                sessionStorage.setItem("username", res.data.username);
                sessionStorage.setItem("usertype", res.data.usertype);
                
                navigate('/monetchat/monetMain'); // '/monetRegister' 경로로 이동
            } else {
                alert("로그인에 실패하였습니다.");
            }
        }).catch(err => {
          alert(err);
        });
    };

    return (
        <div className='container login-container'>
            <div className="login-form">
                <span className="title login-title">MonetChat LOGIN</span>
                <form>
                    <div className='login-input-container'>
                        <input className="input login-input" type="text" placeholder="USERID" value={userid} onChange={(e) => setUserid(e.target.value)}/>
                    </div>
                    <div className='login-input-container'>
                        <input className="input login-input" type="password" placeholder="PASSWORD" value={password} onChange={(e) => setPassword(e.target.value)}/>
                    </div>

                    <div className='login-a-container'>
                        <a className='register' onClick={handleForgetMove}>FORGET</a>
                        <a className='register' onClick={handleRegisterMove}>REGISTER</a>
                    </div>

                    <div className='login-input-container'>
                        <button className="button login-button" type="button" onClick={handleLogin}>LOGIN</button>
                    </div>
                </form>
            </div>  
      </div>
    );
}

export default MonetLogin;