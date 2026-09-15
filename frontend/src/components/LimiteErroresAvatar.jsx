import { Component } from 'react';

// Si el avatar.glb no carga (falla de red, archivo faltante, WebGL no
// disponible en el dispositivo), React no maneja ese error solo — sin este
// límite, toda la aplicación se queda en blanco. Los límites de errores
// todavía requieren un componente de clase, React no tiene el equivalente
// con hooks.
export default class LimiteErroresAvatar extends Component {
  constructor(props) {
    super(props);
    this.state = { fallo: false };
  }

  static getDerivedStateFromError() {
    return { fallo: true };
  }

  componentDidCatch(error) {
    console.error('No se pudo cargar el avatar 3D:', error);
  }

  render() {
    if (this.state.fallo) {
      return (
        <div className="avatar-error" role="alert">
          No se pudo cargar el avatar 3D. Recarga la página; si el problema
          sigue, puede ser una falla de conexión o del navegador.
        </div>
      );
    }
    return this.props.children;
  }
}
