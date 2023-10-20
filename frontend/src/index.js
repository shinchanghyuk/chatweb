
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

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
      <Route path="/" element={<MonetLogin />} />
      <Route path="/monetRegister" element={<MonetRegister />} />
      <Route path="/monetMain" element={<MonetMain />} />
      <Route path="/monetForget" element={<MonetForget />} />
      {/* <Route path="*" element={<MonetError />} /> */}
    </Routes>
  </Router>
);