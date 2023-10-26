
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Navigate, BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import MonetLogin from './components/monetLogin';
import MonetRegister from './components/monetRegister';
import MonetForget from './components/monetForget';
import MonetMain from './components/monetMain';
// import MonetError from './components/monetError';

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

root.render(
  <Router>
    <Routes>
      <Route path="/" element={<Navigate to="/monetchat" />} />
      <Route path="/monetchat" element={<MonetLogin />} />
      <Route path="/monetchat/monetRegister" element={<MonetRegister />} />
      <Route path="/monetchat/monetMain" element={<MonetMain />} />
      <Route path="/monetchat/monetForget" element={<MonetForget />} />
      {/* <Route path="*" element={<MonetError />} /> */}
    </Routes>
  </Router>
);