import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Inicio from './pages/Inicio.jsx';
import Traducir from './pages/Traducir.jsx';
import Explorar from './pages/Explorar.jsx';
import Configuracion from './pages/Configuracion.jsx';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/traducir" element={<Traducir />} />
        <Route path="/explorar" element={<Explorar />} />
        <Route path="/configuracion" element={<Configuracion />} />
      </Route>
    </Routes>
  );
}

export default App;
