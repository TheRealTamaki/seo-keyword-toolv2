import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Pages (to be implemented)
// import Dashboard from './pages/Dashboard';
// import Projects from './pages/Projects';
// import Keywords from './pages/Keywords';
// import RankTracking from './pages/RankTracking';
// import CompetitorAnalysis from './pages/CompetitorAnalysis';
// import Login from './pages/Login';
// import Register from './pages/Register';

const App: React.FC = () => {
  return (
    <Router>
      <div className="app">
        <Routes>
          {/* <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<Keywords />} />
          <Route path="/rank-tracking" element={<RankTracking />} />
          <Route path="/competitor-analysis" element={<CompetitorAnalysis />} /> */}
          <Route
            path="/"
            element={<div style={{ padding: '20px' }}>Welcome to SEO Keyword Tool</div>}
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
