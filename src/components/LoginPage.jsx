import { useEffect, useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

function LoginPage({ onLogin }) {
  const [config, setConfig] = useState({ entraConfigured: false, devLoginEnabled: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const returnTo = location.state?.returnTo || '/dashboard';

  useEffect(() => {
    let active = true;
    fetch('/api/auth/config')
      .then(async (response) => {
        if (!response.ok) throw new Error('No se pudo consultar la configuración de autenticación.');
        return response.json();
      })
      .then((result) => {
        if (active) setConfig(result);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleDemoLogin() {
    setError('');
    try {
      const response = await fetch('/auth/dev-login', { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo iniciar la sesión demo.');
      onLogin(result.user);
      navigate(returnTo, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="brand-mark">RC</div>
        <span className="eyebrow">Acceso seguro</span>
        <h1 id="login-title">Bienvenido a RioClaro AI Hub</h1>
        <p>Inicia sesión con la cuenta de tu organización para acceder a las herramientas y datos autorizados para tu rol.</p>
        <div className="login-security-note">
          <ShieldCheck size={19} />
          <span>Autenticación empresarial protegida con Microsoft Entra ID.</span>
        </div>
        {error && <p className="login-error" role="alert">{error}</p>}
        {!loading && config.entraConfigured && (
          <a className="primary-button login-button" href={`/auth/login?returnTo=${encodeURIComponent(returnTo)}`}>
            Iniciar sesión con Microsoft <ArrowRight size={17} />
          </a>
        )}
        {!loading && config.devLoginEnabled && (
          <button className="secondary-button login-button" type="button" onClick={handleDemoLogin}>
            Entrar como usuario demo
          </button>
        )}
        {!loading && !config.entraConfigured && !config.devLoginEnabled && (
          <p className="login-error">El inicio de sesión no está configurado. Solicita a un administrador que configure Entra ID.</p>
        )}
      </section>
    </main>
  );
}

export default LoginPage;
