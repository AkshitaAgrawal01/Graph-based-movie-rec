import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { RatingProvider } from './context/RatingContext.jsx';
import { WatchlistProvider } from './context/WatchlistContext.jsx';
import './styles/variables.css';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RatingProvider>
          <WatchlistProvider>
            <App />
          </WatchlistProvider>
        </RatingProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);