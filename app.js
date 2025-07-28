const { createClient } = window.supabase;
const supabase = createClient(
  'https://wccaximtbrrfpynhildy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjY2F4aW10YnJyZnB5bmhpbGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODA4ODksImV4cCI6MjA2OTA1Njg4OX0.a7yKKu6RhY116krsm9OuKueXF5VGbk6fbQcKsNQVcUw'
);

// Usuarios disponibles (puedes ampliar la lista si quieres)
const USUARIOS = ["Santiago", "Juanita"];

// Categorías
const CATEGORIAS_GASTOS = [
  "Recibos públicos", "Entretenimiento", "Comida", "Transporte",
  "Salud", "Educación", "Ropa", "Hogar", "Otros"
];
const CATEGORIAS_INGRESOS = [
  "Salario", "Bonificaciones", "Ventas", "Inversiones", "Otros"
];

// Utilidades para formato
const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });

// Notificación
const Notification = ({ message, type, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className={`notification ${type}`}>
      <i className={`fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
      <span style={{ marginLeft: '8px' }}>{message}</span>
    </div>
  );
};

const FinanzasNube = () => {
  const [usuarioActivo, setUsuarioActivo] = React.useState('Santiago');
  const [transacciones, setTransacciones] = React.useState([]); // Solo transacciones de Supabase
  const [notification, setNotification] = React.useState(null);

  // Formulario de nueva transacción
  const [formulario, setFormulario] = React.useState({
    descripcion: '',
    cantidad: '',
    categoria: '',
    tipo: 'gasto'
  });

  // Salario manual (NO guardado en Supabase todavía)
  const [salario, setSalario] = React.useState('');
  const [mostrarConfigSalario, setMostrarConfigSalario] = React.useState(false);

  // Cargar transacciones del usuario desde Supabase
  async function cargarTransacciones(usuario) {
    const { data, error } = await supabase
      .from('transacciones')
      .select('*')
      .eq('usuario', usuario)
      .order('fecha', { ascending: false });

    if (error) {
      setNotification({ message: 'Error cargando datos de la nube', type: 'error' });
      setTransacciones([]);
    } else {
      setTransacciones(data || []);
    }
  }

  // Al cambiar usuario, recargar datos
  React.useEffect(() => {
    cargarTransacciones(usuarioActivo);
    setSalario('');
  }, [usuarioActivo]);

  // Resumen
  const totalIngresos = transacciones.filter(t => t.tipo === 'ingreso').reduce((sum, t) => sum + t.cantidad, 0);
  const totalGastos = transacciones.filter(t => t.tipo === 'gasto').reduce((sum, t) => sum + t.cantidad, 0);
  const balance = totalIngresos - totalGastos;

  // Gastos por categoría
  const getGastosPorCategoria = () => {
    const gastos = transacciones.filter(t => t.tipo === 'gasto');
    const gastosPorCategoria = {};
    gastos.forEach(gasto => {
      gastosPorCategoria[gasto.categoria] = (gastosPorCategoria[gasto.categoria] || 0) + gasto.cantidad;
    });
    return gastosPorCategoria;
  };

  const showNotification = (message, type) => setNotification({ message, type });

  // Cambiar usuario
  const handleUsuarioChange = (e) => {
    setUsuarioActivo(e.target.value);
    setFormulario({ descripcion: '', cantidad: '', categoria: '', tipo: 'gasto' });
  };

  // Añadir transacción a la nube
  async function handleSubmitTransaccion(e) {
    e.preventDefault();

    if (!formulario.descripcion.trim()) {
      showNotification('Por favor ingresa una descripción', 'error');
      return;
    }
    if (!formulario.cantidad || parseInt(formulario.cantidad) <= 0) {
      showNotification('Por favor ingresa una cantidad válida mayor a 0', 'error');
      return;
    }
    if (!formulario.categoria) {
      showNotification('Por favor selecciona una categoría', 'error');
      return;
    }

    const nuevaTransaccion = {
      usuario: usuarioActivo,
      descripcion: formulario.descripcion.trim(),
      cantidad: parseInt(formulario.cantidad),
      categoria: formulario.categoria,
      tipo: formulario.tipo,
      fecha: new Date().toISOString().split('T')[0]
    };

    const { error } = await supabase
      .from('transacciones')
      .insert([nuevaTransaccion]);
    if (error) {
      showNotification('Error al guardar en la nube', 'error');
      return;
    }
    showNotification('Transacción guardada en la nube', 'success');
    cargarTransacciones(usuarioActivo);
    setFormulario({ descripcion: '', cantidad: '', categoria: '', tipo: 'gasto' });
  }

  // Eliminar transacción de la nube
  async function handleEliminarTransaccion(id) {
    const { error } = await supabase
      .from('transacciones')
      .delete()
      .eq('id', id);
    if (error) {
      showNotification('Error al eliminar', 'error');
      return;
    }
    showNotification('Transacción eliminada', 'success');
    cargarTransacciones(usuarioActivo);
  }

  // Chart.js - Gastos por categoría
  React.useEffect(() => {
    const ctx = document.getElementById('gastosChart');
    if (!ctx) return;

    const existingChart = window.gastosChartInstance;
    if (existingChart) {
      existingChart.destroy();
    }

    const gastosPorCategoria = getGastosPorCategoria();
    const labels = Object.keys(gastosPorCategoria);
    const data = Object.values(gastosPorCategoria);

    if (labels.length === 0) {
      window.gastosChartInstance = null;
      return;
    }

    const colores = [
      '#8B5CF6', '#A855F7', '#9333EA', '#7C3AED', '#6D28D9',
      '#5B21B6', '#4C1D95', '#EF4444', '#F59E0B', '#10B981'
    ];

    window.gastosChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colores.slice(0, labels.length),
          borderColor: '#1a1a1a',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#ffffff',
              font: { size: 12 },
              padding: 15
            }
          }
        }
      }
    });
  }, [usuarioActivo, transacciones]);

  // Categorías disponibles
  const categoriasDisponibles = formulario.tipo === 'gasto'
    ? CATEGORIAS_GASTOS
    : CATEGORIAS_INGRESOS;

  return (
    <div className="app">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <header className="header">
        <div className="header-content">
          <div className="logo">
            <i class="fa-solid fa-cat"></i>
            <span>LokiFinance</span>
          </div>
          <div className="header-controls">
            <div className="select-wrapper">
              <select 
                className="select" 
                value={usuarioActivo}
                onChange={handleUsuarioChange}
              >
                {USUARIOS.map(usuario => (
                  <option key={usuario} value={usuario}>{usuario}</option>
                ))}
              </select>
            </div>
            <div className="nube-box">
              <i className="fas fa-cloud"></i>
              <span style={{marginLeft:'8px'}}>Estás en la nube</span>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Dashboard */}
        <div className="dashboard">
          {/* Resumen */}
          <div className="summary-cards">
            <div className="summary-card balance">
              <div className="card-header">
                <span className="card-title">Balance Total</span>
                <div className="card-icon balance">
                  <i className="fas fa-balance-scale"></i>
                </div>
              </div>
              <div className="card-amount">{formatCurrency(balance)}</div>
            </div>

            <div className="summary-card income">
              <div className="card-header">
                <span className="card-title">Ingresos del Mes</span>
                <div className="card-icon income">
                  <i className="fas fa-arrow-up"></i>
                </div>
              </div>
              <div className="card-amount">{formatCurrency(totalIngresos)}</div>
            </div>

            <div className="summary-card expense">
              <div className="card-header">
                <span className="card-title">Gastos del Mes</span>
                <div className="card-icon expense">
                  <i className="fas fa-arrow-down"></i>
                </div>
              </div>
              <div className="card-amount">{formatCurrency(totalGastos)}</div>
            </div>
          </div>

          {/* Gráfico */}
          <div className="chart-section">
            <h3 className="section-title">
              <i className="fas fa-chart-pie"></i>
              Gastos por Categoría - {usuarioActivo}
            </h3>
            <div className="chart-container">
              {Object.keys(getGastosPorCategoria()).length > 0 ? (
                <canvas id="gastosChart"></canvas>
              ) : (
                <div className="empty-state">
                  <i className="fas fa-chart-pie"></i>
                  <p>No hay gastos para mostrar</p>
                </div>
              )}
            </div>
          </div>

          {/* Lista de transacciones */}
          <div className="transactions-section">
            <h3 className="section-title">
              <i className="fas fa-list"></i>
              Transacciones Recientes - {usuarioActivo}
            </h3>
            <div className="transactions-list">
              {transacciones && transacciones.length > 0 ? (
                transacciones.map(transaccion => (
                  <div key={transaccion.id} className="transaction-item">
                    <div className="transaction-info">
                      <div className={`transaction-icon ${transaccion.tipo}`}>
                        <i className={`fas ${transaccion.tipo === 'ingreso' ? 'fa-plus' : 'fa-minus'}`}></i>
                      </div>
                      <div className="transaction-details">
                        <h4>{transaccion.descripcion}</h4>
                        <p>{transaccion.categoria} • {formatDate(transaccion.fecha)}</p>
                      </div>
                    </div>
                    <div className="transaction-actions">
                      <div className={`transaction-amount ${transaccion.tipo}`}>
                        {transaccion.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(transaccion.cantidad)}
                      </div>
                      <button className="delete-btn" onClick={() => handleEliminarTransaccion(transaccion.id)}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <i className="fas fa-receipt"></i>
                  <p>No hay transacciones registradas</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar con formularios */}
        <aside className="sidebar">
          {/* Configuración de salario */}
          <div className="salary-config">
            <h3 className="section-title">
              <i className="fas fa-money-bill-wave"></i>
              Salario Mensual - {usuarioActivo}
            </h3>
            <div className="current-salary">
              <div className="salary-amount">{salario ? formatCurrency(Number(salario)) : <span style={{color:'#a78bfa'}}>No configurado</span>}</div>
              <p>Salario manual (solo visible localmente)</p>
            </div>
            {!mostrarConfigSalario ? (
              <button 
                className="btn btn-secondary btn-full"
                onClick={() => setMostrarConfigSalario(true)}
              >
                <i className="fas fa-edit"></i>
                Actualizar Salario
              </button>
            ) : (
              <form onSubmit={e => {
                e.preventDefault();
                setMostrarConfigSalario(false);
              }}>
                <div className="form-group">
                  <label className="form-label">Nuevo salario</label>
                  <input
                    type="number"
                    className="form-input"
                    value={salario}
                    onChange={(e) => setSalario(e.target.value)}
                    placeholder="Ingresa tu salario mensual"
                    min="1"
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    <i className="fas fa-save"></i>
                    Guardar (solo local)
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setMostrarConfigSalario(false);
                      setSalario('');
                    }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </form>
            )}
            <p style={{ fontSize: '0.85rem', color: '#8b8b8b', textAlign: 'center', marginTop:8 }}>
              <i className="fas fa-info-circle"></i> Próximamente podrás guardar el salario real en la nube.
            </p>
          </div>

          {/* Formulario para nueva transacción */}
          <div className="form-section">
            <h3 className="section-title">
              <i className="fas fa-plus-circle"></i>
              Nueva Transacción
            </h3>
            <form onSubmit={handleSubmitTransaccion}>
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select
                  className="form-select"
                  value={formulario.tipo}
                  onChange={(e) => setFormulario({...formulario, tipo: e.target.value, categoria: ''})}
                >
                  <option value="gasto">Gasto</option>
                  <option value="ingreso">Ingreso</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <input
                  type="text"
                  className="form-input"
                  value={formulario.descripcion}
                  onChange={(e) => setFormulario({...formulario, descripcion: e.target.value})}
                  placeholder="Ej: Compra de supermercado"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cantidad (COP)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formulario.cantidad}
                  onChange={(e) => setFormulario({...formulario, cantidad: e.target.value})}
                  placeholder="0"
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select
                  className="form-select"
                  value={formulario.categoria}
                  onChange={(e) => setFormulario({...formulario, categoria: e.target.value})}
                  required
                >
                  <option value="">Selecciona una categoría</option>
                  {categoriasDisponibles.map(categoria => (
                    <option key={categoria} value={categoria}>{categoria}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary btn-full">
                <i className="fas fa-plus"></i>
                Agregar Transacción
              </button>
            </form>
          </div>
        </aside>
      </main>
    </div>
  );
};

// Renderizar la app (esto debe estar en tu index.html o main)
ReactDOM.render(<FinanzasNube />, document.getElementById('root'));
