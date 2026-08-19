import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import RootComponent from './components/RootComponent.tsx';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import DashboardComponent from './components/DashboardComponent.tsx';
import PegawaiComponent from './components/PegawaiComponent.tsx';
import DetailUserComponent from './components/DetailUserComponent.tsx';
import GroupUserComponent from './components/GroupUserComponent.tsx';
import TambahAnggota from './components/TambahAnggota.tsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootComponent />,
    children: [
      {
        path: "",
        element: <PegawaiComponent />,
      }
    ]
  },
  {
    path: "/dashboard",
    element: <RootComponent />,
    children: [
      {
        path: "",
        element: <DashboardComponent />,
      }
    ]
  },
  {
    path: "/detail-user/:id",
    element: <RootComponent />,
    children: [
      {
        path: "",
        element: <DetailUserComponent />,
      }
    ]
  },
  {
    path: "/bandingkan-akses",
    element: <RootComponent />,
    children: [
      {
        path: "",
        element: <PegawaiComponent />,
      }
    ]
  },
  {
    path: "/group-user",
    element: <RootComponent />,
    children: [
      {
        path: "",
        element: <GroupUserComponent />,
      },
      {
        path: ":id",
        element: <TambahAnggota />,
      }
    ]
  }
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
