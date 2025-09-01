import { Routes, Route } from 'react-router-dom';
import Header from '@/components/Header';
import Home from '@/pages/Home';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';

export default function App(){
  return (
    <>
      <Header/>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/signup" element={<Signup/>}/>
      </Routes>
    </>
  );
}
