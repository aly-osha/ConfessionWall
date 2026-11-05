import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import PostDetail from './pages/PostDetail';
import AdminDashboard from './pages/AdminDashboard';
import useAuthStore from './store/authStore';
import GlobalDialogs from './components/GlobalDialogs';

function App() {
  const { user } = useAuthStore();

  return (
    <Router>
      <GlobalDialogs />
      <Routes>
        <Route
          path="/"
          element={user ? <Feed /> : <Navigate to="/login" />}
        />
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/" />}
        />
        <Route path="/profile/:username" element={user ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/post/:id" element={user ? <PostDetail /> : <Navigate to="/login" />} />
        <Route path="/admin" element={user && (user.role === 'admin' || user.role === 'moderator') ? <AdminDashboard /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
