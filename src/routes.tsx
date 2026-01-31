import Feed from './pages/Feed';
import PostDetail from './pages/PostDetail';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'Feed',
    path: '/',
    element: <Feed />,
  },
  {
    name: 'Post Detail',
    path: '/post/:id',
    element: <PostDetail />,
  },
  {
    name: 'Login',
    path: '/login',
    element: <Login />,
  },
  {
    name: 'Not Found',
    path: '*',
    element: <NotFound />,
  },
];

export default routes;
