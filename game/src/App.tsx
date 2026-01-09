import { BrowserRouter, Route, Routes } from 'react-router-dom'
//import HomePage from "./components/HomePage";
import NotFound from './components/NotFound';
import Game from './components/Game/Game';
import LandingPage from './components/LandPage';
import './App.css'

function App() {
 return(
  <div>
    <BrowserRouter>
    <Routes>
      <Route path='/' element={<Game />}/>
      <Route path='/LandPage' element={<LandingPage />}/>
      <Route path='*' element={<NotFound />} />
    </Routes>
    </BrowserRouter>
  </div>
 )
}

export default App
