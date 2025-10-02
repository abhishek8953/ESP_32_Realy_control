import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserContext from '../Context/UserContext';
import Loading from '../Loading';

const Protected = ({ children }) => {
  const navigate = useNavigate();
  const { user, loggedInUser } = useContext(UserContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        await loggedInUser();
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (!loading && (!user || !user.email)) {
      navigate('/signup');
    }
  }, [loading, user,navigate]);

  if (loading) return <Loading />;

  return (user && user.email) ? children : null;
};

export default Protected;
