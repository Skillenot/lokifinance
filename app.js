// Datos iniciales de la aplicación SOLO NUBE
const INITIAL_DATA = {
  usuarios: ["Santiago", "Juanita"],
  categoriasGastos: [
    "Recibos públicos", "Entretenimiento", "Comida", "Transporte",
    "Salud", "Educación", "Ropa", "Hogar", "Otros"
  ],
  categoriasIngresos: [
    "Salario", "Bonificaciones", "Ventas", "Inversiones", "Otros"
  ],
  datosNube: {
    Santiago: { salario: 0, transacciones: [] },
    Juanita: { salario: 0, transacciones: [] }
  }
};

// Utilidad para formatear moneda COP
const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);

// Utilidad para formatear fechas
const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

// Componente de notificación
const Notification = ({ message, type, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`notification ${type}`}>
      <i className={`fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
      <span style={{ marginLeft: '8px' }}>{message}</span>
    </div>
  );
};

// Componente principal SOLO NUBE
const FinanzasNube = () => {
  const [usuarioActivo, setUsuarioActivo] = React.useState('Santiago');
  const [datosUsuariosNube, setDatosUsuariosNube] = React.useState(() => {
    return JSON.parse(JSON.stringify(INITIAL_DATA.datosNube));
  });
  const [notification, setNotification] = React.useState(null);

  // Formulario nueva transacción
  const [formulario, setFormulario] = React.useState({
    descripcion: '',
    cantidad: '',
    categoria: '',
    tipo: 'gasto'
  });

  // Formulario de salario
  const [nuevoSalario, setNuevoSalario] = React.useState('');
  const [mostrarConfigSalario, setMostrarConfigSalario] = React.useState(false);

  // Obtener datos del usuario activo
  const datosUsuario = datosUsuariosNube[usuarioActivo] || { salario: 0, transacciones: [] };

  // Calcular resumen financiero
  const totalIngresos = datosUsuario.transacciones.filter(t => t.tipo === 'ingreso').reduce((sum, t) => sum + t.cantidad, 0);
  const totalGastos = datosUsuario.transacciones.filter(t => t.tipo === 'gasto').reduce((sum, t) => sum + t.cantidad, 0);
  const balance = totalIngresos - totalGastos;

  // Gastos por categoría (para gráfico)
  const getGastosPorCategoria = () => {
    const gastos = datosUsuario.transacciones.filter(t => t.tipo === 'gasto');
    const gastosPorCategoria = {};
    gastos.forEach(gasto => {
      gastosPorCategoria[gasto.categoria] = (gastosPorCategoria[gasto.categoria] || 0) + gasto.cantidad;
    });
    return gastosPorCategoria;
  };

  // Mostrar notificación
  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  // Cambiar usuario
  const handleUsuarioChange = (e) => {
    const nuevoUsuario = e.target.value;
    setUsuarioActivo(nuevoUsuario);
    setFormulario({ descripcion: '', cantidad: '', categoria: '', tipo: 'gasto' });
    showNotification(`Cambiado a usuario: ${nuevoUsuario}`, 'success');
  };

  // Añadir transacción
  const handleSubmitTransaccion = (e) => {
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
      id: Date.now(),
      descripcion: formulario.descripcion.trim(),
      cantidad: parseInt(formulario.cantidad),
      categoria: formulario.categoria,
      tipo: formulario.tipo,
      fecha: new Date().toISOString().split('T')[0],
      usuario: usuarioActivo
    };

    setDatosUsuariosNube(prev => {
      const nuevos = { ...prev };
      if (!nuevos[usuarioActivo]) {
        nuevos[usuarioActivo] = { salario: 0, transacciones: [] };
      }
      nuevos[usuarioActivo] = {
        ...nuevos[usuarioActivo],
        transacciones: [...(nuevos[usuarioActivo].transacciones || []), nuevaTransaccion]
      };
      return nuevos;
    });

    setFormulario({ descripcion: '', cantidad: '', categoria: '', tipo: 'gasto' });
    showNotification('Transacción agregada exitosamente', 'success');
  };

  // Actualizar salario
  const handleActualizarSalario = (e) => {
    e.preventDefault();
    if (!nuevoSalario || parseInt(nuevoSalario) <= 0) {
      showNotification('Por favor ingresa un salario válido', 'error');
      return;
    }
    setDatosUsuariosNube(prev => {
      const nuevos = { ...prev };
      if (!nuevos[usuarioActivo]) {
        nuevos[usuarioActivo] = { salario: 0, transacciones: [] };
      }
      nuevos[usuarioActivo] = {
        ...nuevos[usuarioActivo],
        salario: parseInt(nuevoSalario)
      };
      return nuevos;
    });
    setNuevoSalario('');
    setMostrarConfigSalario(false);
    showNotification('Salario actualizado exitosamente', 'success');
  };

  // Eliminar transacción
  const handleEliminarTransaccion = (id) => {
    setDatosUsuariosNube(prev => {
      const nuevos = { ...prev };
      if (nuevos[usuarioActivo]) {
        nuevos[usuarioActivo].transacciones = nuevos[usuarioActivo].transacciones.filter(t => t.id !== id);
      }
      return nuevos;
    });
    showNotification('Transacción eliminada', 'success');
  };

  // Gráfico de gastos (con Chart.js)
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
  }, [usuarioActivo, datosUsuariosNube]);

  // Categorías según tipo
  const categoriasDisponibles = formulario.tipo === 'gasto'
    ? INITIAL_DATA.categoriasGastos
    : INITIAL_DATA.categoriasIngresos;

  return (
    <div className="app">
      {/* Notificación */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <i className="fas fa-wallet"></i>
            <span>Finanzas en la Nube</span>
          </div>
          <div className="header-controls">
            <div className="select-wrapper">
              <select 
                className="select" 
                value={usuarioActivo}
                onChange={handleUsuarioChange}
              >
                {INITIAL_DATA.usuarios.map(usuario => (
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

      {/* Contenido principal */}
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
                {datosUsuario.transacciones && datosUsuario.transacciones.length > 0 ? (
                  datosUsuario.transacciones.slice()
                    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                    .map(transaccion => (
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
              <div className="salary-amount">{formatCurrency(datosUsuario.salario || 0)}</div>
              <p>Salario actual (Nube)</p>
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
              <form onSubmit={handleActualizarSalario}>
                <div className="form-group">
                  <label className="form-label">Nuevo salario</label>
                  <input
                    type="number"
                    className="form-input"
                    value={nuevoSalario}
                    onChange={(e) => setNuevoSalario(e.target.value)}
                    placeholder="Ingresa tu salario mensual"
                    min="1"
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    <i className="fas fa-save"></i>
                    Guardar
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setMostrarConfigSalario(false);
                      setNuevoSalario('');
                    }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </form>
            )}
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

// Renderizar la app
ReactDOM.render(<FinanzasNube />, document.getElementById('root'));
