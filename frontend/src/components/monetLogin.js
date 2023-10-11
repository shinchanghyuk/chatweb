import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


function MonetLogin() {
    const [userid, setUserid] = useState('');
    const [password, setPassword] = useState('');

    // useNavigate을 사용하여 navigate 객체를 가져옴
    const navigate = useNavigate();

    // 회원가입으로 이동 버튼 클릭
    const handleRegisterMove = () => {
        navigate('/monetRegister'); // '/monetRegister' 경로로 이동
    };

    // 로그인 버튼 클릭
    const handleLogin = () => {
        console.log("hadleLogin, userid : ", userid + "password : ", password);
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
        <div>
            <h2>로그인</h2>
            <form>
                <div>
                    <label>Userid:</label>
                    <input type="text" value={userid} onChange={(e) => setUserid(e.target.value)}/>
                </div>
                <div>
                    <label>Password:</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}/>
                </div>

                <button type="button" onClick={handleRegisterMove}>회원가입으로 이동</button>
                <button type="button" onClick={handleLogin}>로그인</button>
            </form>
      </div>  
    );
}

export default MonetLogin;