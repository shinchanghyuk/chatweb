
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import MonetLogin from './components/monetLogin';
import MonetRegister from './components/monetRegister';
import MonetMain from './components/monetMain';
import MonetChat from './components/monetChat';

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

root.render(
  <Router>
    <Routes>
      <Route path="/" element={<MonetLogin />} />
      <Route path="/monetRegister" element={<MonetRegister />} />
      <Route path="/monetMain" element={<MonetMain />} />
      <Route path="/monetChat" element={<MonetChat />} />
    </Routes>
  </Router>
);