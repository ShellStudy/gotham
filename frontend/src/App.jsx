import { Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import Signup from '@/pages/Signup';
import Header from '@/components/Common/Header.jsx';
import Canvas from '@/pages/Canvas';
import Library from '@/pages/Library';
import StoryboardLibrary from '@/pages/StoryboardLibrary';
import StoryboardWorkspace from '@/pages/StoryboardWorkspace';

export default function App(){
  return (
    <>
      <Header/>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/signup" element={<Signup/>}/>
        <Route path="/canvas" element={<Canvas/>}/>
        <Route path="/library" element={<Library/>}/>
        <Route path="/storyboards" element={<StoryboardLibrary/>}/>
        <Route path="/storyboards/:id" element={<StoryboardWorkspace/>}/>
      </Routes>
    </>
  );
}
