
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import UserRoleManager from '@/components/admin/UserRoleManager';
import Layout from '@/components/layout/Layout';

const Admin = () => {
  const { isAuthenticated, loading, isTeacher } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      // Redirect if not authenticated
      if (!isAuthenticated) {
        navigate('/login');
      } 
      // Optionally, redirect if not a teacher/admin
      else if (!isTeacher) {
        navigate('/');
      }
    }
  }, [isAuthenticated, isTeacher, loading, navigate]);

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
        
        <div className="mb-8">
          <UserRoleManager />
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
