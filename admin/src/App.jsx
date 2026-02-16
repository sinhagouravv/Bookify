import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import BookManagement from './pages/BookManagement';
import UserManagement from './pages/UserManagement';
import Reviews from './pages/Reviews';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Business from './pages/Business';
import Messages from './pages/Messages';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="books" element={<BookManagement />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="business" element={<Business />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="messages" element={<Messages />} />
          <Route path="settings" element={<Settings />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
