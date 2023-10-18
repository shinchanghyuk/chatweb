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

    // 회원가입으로 이동 버튼 클릭
    const handleRegisterMove = () => {
        console.log("MonetLogin - handleRegisterMove");
        
        navigate('/monetRegister'); // '/monetRegister' 경로로 이동
    };

    // 로그인 버튼 클릭
    const handleLogin = () => {
        console.log("MonetLogin - hadleLogin, userid : ", userid + "password : ", password);

        if (userid === undefined || userid === '' || userid.length === 0) {
            alert('아이디를 입력해주세요.');
            return;
        }

        if (password === undefined || password === '' || password.length === 0) {
            alert('비밀번호를 입력해주세요.');
            return;
        }

        axios({
            url: "http://localhost:8080/signIn/",
            method: "POST",
            data: {
              userid: userid,
              password: password,
            }
        }).then(res => {
            if(res.status === 200 && res.data.message === "signIn success") {
                alert("로그인에 성공하였습니다.");

                sessionStorage.setItem("userid", userid);
                sessionStorage.setItem("username", res.data.username);
                sessionStorage.setItem("usertype", res.data.usertype);
                
                navigate('/monetMain'); // '/monetRegister' 경로로 이동
            } else {
                alert("로그인에 실패하였습니다.");
            }
        }).catch(err => {
          alert(err);
        });
    };

    return (
        <div className='login-container'>
            <div className="login-form">
                <span className="title login-title">MonetChat LOGIN</span>
                <form>
                    <div className='login-input-container'>
                        <input className="input login-input" type="text" placeholder="USERID" value={userid} onChange={(e) => setUserid(e.target.value)}/>
                    </div>
                    <div className='login-input-container'>
                        <input className="input login-input" type="password" placeholder="PASSWORD" value={password} onChange={(e) => setPassword(e.target.value)}/>
                    </div>

                    <div className='register-container'>
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