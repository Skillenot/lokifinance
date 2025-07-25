// Datos iniciales de la aplicación
const INITIAL_DATA = {
  usuarios: ["Santiago", "Juanita"],
  modos: ["Local", "Nube"],
  categoriasGastos: [
    "Recibos públicos",
    "Entretenimiento", 
    "Comida",
    "Transporte",
    "Salud",
    "Educación",
    "Ropa",
    "Hogar",
    "Otros"
  ],
  categoriasIngresos: [
    "Salario",
    "Bonificaciones",
    "Ventas", 
    "Inversiones",
    "Otros"
  ],
  datosEjemplo: {
    Santiago: {
      salario: 3500000,
      transacciones: [
        {
          id: 1,
          descripcion: "Salario mensual",
          cantidad: 3500000,
          categoria: "Salario",
          tipo: "ingreso",
          fecha: "2025-01-01",
          usuario: "Santiago"
        },
        {
          id: 2,
          descripcion: "Factura de luz",
          cantidad: 150000,
          categoria: "Recibos públicos",
          tipo: "gasto",
          fecha: "2025-01-05", 
          usuario: "Santiago"
        },
        {
          id: 3,
          descripcion: "Supermercado",
          cantidad: 400000,
          categoria: "Comida",
          tipo: "gasto",
          fecha: "2025-01-08",
          usuario: "Santiago"
        }
      ]
    },
    Juanita: {
      salario: 2800000,
      transacciones: [
        {
          id: 4,
          descripcion: "Salario mensual",
          cantidad: 2800000,
          categoria: "Salario", 
          tipo: "ingreso",
          fecha: "2025-01-01",
          usuario: "Juanita"
        },
        {
          id: 5,
          descripcion: "Netflix",
          cantidad: 45000,
          categoria: "Entretenimiento",
          tipo: "gasto",
          fecha: "2025-01-10",
          usuario: "Juanita"
        }
      ]
    }
  }
};

// Utilidades para formatear números como moneda colombiana
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
};

// Utilidades para formatear fechas
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

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

// Componente principal de la aplicación
const FinanzasPersonales = () => {
  // Estados principales de la aplicación
  const [usuarioActivo, setUsuarioActivo] = React.useState('Santiago');
  const [modoActivo, setModoActivo] = React.useState('Local');
  const [datosUsuarios, setDatosUsuarios] = React.useState(() => {
    // Hacer una copia profunda de los datos iniciales para evitar mutaciones
    return JSON.parse(JSON.stringify(INITIAL_DATA.datosEjemplo));
  });
  const [notification, setNotification] = React.useState(null);
  
  // Estados para el formulario de nueva transacción
  const [formulario, setFormulario] = React.useState({
    descripcion: '',
    cantidad: '',
    categoria: '',
    tipo: 'gasto'
  });

  // Estados para configuración de salario
  const [nuevoSalario, setNuevoSalario] = React.useState('');
  const [mostrarConfigSalario, setMostrarConfigSalario] = React.useState(false);

  // Obtener datos del usuario activo según el modo
  const getDatosUsuario = () => {
    if (modoActivo === 'Local') {
      // En modo local, usamos los datos del estado
      return datosUsuarios[usuarioActivo] || { salario: 0, transacciones: [] };
    } else {
      // En modo nube, simulamos datos diferentes (podrían venir de una API)
      const datosNube = {
        Santiago: {
          salario: 3800000,
          transacciones: [
            {
              id: 101,
              descripcion: "Salario mensual (Nube)",
              cantidad: 3800000,
              categoria: "Salario",
              tipo: "ingreso",
              fecha: "2025-01-01",
              usuario: "Santiago"
            },
            {
              id: 102,
              descripcion: "Factura agua (Nube)",
              cantidad: 85000,
              categoria: "Recibos públicos",
              tipo: "gasto",
              fecha: "2025-01-03",
              usuario: "Santiago"
            }
          ]
        },
        Juanita: {
          salario: 3200000,
          transacciones: [
            {
              id: 103,
              descripcion: "Salario mensual (Nube)",
              cantidad: 3200000,
              categoria: "Salario",
              tipo: "ingreso",
              fecha: "2025-01-01",
              usuario: "Juanita"
            }
          ]
        }
      };
      return datosNube[usuarioActivo] || { salario: 0, transacciones: [] };
    }
  };

  // Calcular resumen financiero del usuario
  const calcularResumen = () => {
    const datosUsuario = getDatosUsuario();
    const transacciones = datosUsuario.transacciones || [];
    
    const totalIngresos = transacciones
      .filter(t => t.tipo === 'ingreso')
      .reduce((sum, t) => sum + t.cantidad, 0);
    
    const totalGastos = transacciones
      .filter(t => t.tipo === 'gasto')
      .reduce((sum, t) => sum + t.cantidad, 0);
    
    const balance = totalIngresos - totalGastos;
    
    return { totalIngresos, totalGastos, balance };
  };

  // Obtener gastos por categoría para el gráfico
  const getGastosPorCategoria = () => {
    const datosUsuario = getDatosUsuario();
    const gastos = datosUsuario.transacciones?.filter(t => t.tipo === 'gasto') || [];
    
    const gastosPorCategoria = {};
    gastos.forEach(gasto => {
      gastosPorCategoria[gasto.categoria] = 
        (gastosPorCategoria[gasto.categoria] || 0) + gasto.cantidad;
    });
    
    return gastosPorCategoria;
  };

  // Mostrar notificación
  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  // Manejar cambio de usuario
  const handleUsuarioChange = (e) => {
    const nuevoUsuario = e.target.value;
    setUsuarioActivo(nuevoUsuario);
    // Limpiar formulario al cambiar usuario
    setFormulario({
      descripcion: '',
      cantidad: '',
      categoria: '',
      tipo: 'gasto'
    });
    showNotification(`Cambiado a usuario: ${nuevoUsuario}`, 'success');
  };

  // Manejar cambio de modo
  const handleModoChange = (nuevoModo) => {
    setModoActivo(nuevoModo);
    // Limpiar formulario al cambiar modo
    setFormulario({
      descripcion: '',
      cantidad: '',
      categoria: '',
      tipo: 'gasto'
    });
    showNotification(`Modo cambiado a: ${nuevoModo}`, 'success');
  };

  // Manejar envío del formulario de nueva transacción
  const handleSubmitTransaccion = (e) => {
    e.preventDefault();
    
    // Validar formulario
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

    // Solo permitir agregar transacciones en modo local
    if (modoActivo !== 'Local') {
      showNotification('Solo puedes agregar transacciones en modo Local', 'error');
      return;
    }

    // Crear nueva transacción
    const nuevaTransaccion = {
      id: Date.now(), // ID único basado en timestamp
      descripcion: formulario.descripcion.trim(),
      cantidad: parseInt(formulario.cantidad),
      categoria: formulario.categoria,
      tipo: formulario.tipo,
      fecha: new Date().toISOString().split('T')[0],
      usuario: usuarioActivo
    };

    // Actualizar datos del usuario
    setDatosUsuarios(prev => {
      const nuevosDatos = { ...prev };
      if (!nuevosDatos[usuarioActivo]) {
        nuevosDatos[usuarioActivo] = { salario: 0, transacciones: [] };
      }
      nuevosDatos[usuarioActivo] = {
        ...nuevosDatos[usuarioActivo],
        transacciones: [...(nuevosDatos[usuarioActivo].transacciones || []), nuevaTransaccion]
      };
      return nuevosDatos;
    });

    // Limpiar formulario
    setFormulario({
      descripcion: '',
      cantidad: '',
      categoria: '',
      tipo: 'gasto'
    });

    showNotification('Transacción agregada exitosamente', 'success');
  };

  // Manejar actualización de salario
  const handleActualizarSalario = (e) => {
    e.preventDefault();
    
    if (!nuevoSalario || parseInt(nuevoSalario) <= 0) {
      showNotification('Por favor ingresa un salario válido', 'error');
      return;
    }

    if (modoActivo !== 'Local') {
      showNotification('Solo puedes actualizar el salario en modo Local', 'error');
      return;
    }

    setDatosUsuarios(prev => {
      const nuevosDatos = { ...prev };
      if (!nuevosDatos[usuarioActivo]) {
        nuevosDatos[usuarioActivo] = { salario: 0, transacciones: [] };
      }
      nuevosDatos[usuarioActivo] = {
        ...nuevosDatos[usuarioActivo],
        salario: parseInt(nuevoSalario)
      };
      return nuevosDatos;
    });

    setNuevoSalario('');
    setMostrarConfigSalario(false);
    showNotification('Salario actualizado exitosamente', 'success');
  };

  // Crear/actualizar gráfico de gastos
  React.useEffect(() => {
    const ctx = document.getElementById('gastosChart');
    if (!ctx) return;

    // Limpiar gráfico anterior
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
      existingChart.destroy();
    }

    const gastosPorCategoria = getGastosPorCategoria();
    const labels = Object.keys(gastosPorCategoria);
    const data = Object.values(gastosPorCategoria);

    if (labels.length === 0) {
      return;
    }

    const colores = [
      '#8B5CF6', '#A855F7', '#9333EA', '#7C3AED', '#6D28D9',
      '#5B21B6', '#4C1D95', '#EF4444', '#F59E0B', '#10B981'
    ];

    new Chart(ctx, {
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
              font: {
                size: 12
              },
              padding: 15
            }
          }
        }
      }
    });
  }, [usuarioActivo, modoActivo, datosUsuarios]);

  // Obtener datos computados
  const resumen = calcularResumen();
  const datosUsuario = getDatosUsuario();
  const categoriasDisponibles = formulario.tipo === 'gasto' ? INITIAL_DATA.categoriasGastos : INITIAL_DATA.categoriasIngresos;

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

      {/* Header principal */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <i className="fas fa-wallet"></i>
            <span>Finanzas - Odiamos a Yuanira</span>
          </div>
          
          <div className="header-controls">
            {/* Selector de usuario */}
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

            {/* Toggle modo local/nube */}
            <div className="mode-toggle">
              {INITIAL_DATA.modos.map(modo => (
                <div
                  key={modo}
                  className={`mode-option ${modoActivo === modo ? 'active' : ''}`}
                  onClick={() => handleModoChange(modo)}
                >
                  <i className={`fas ${modo === 'Local' ? 'fa-hdd' : 'fa-cloud'}`}></i>
                  {modo}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="main-content">
        {/* Dashboard principal */}
        <div className="dashboard">
          {/* Tarjetas de resumen financiero */}
          <div className="summary-cards">
            <div className="summary-card balance">
              <div className="card-header">
                <span className="card-title">Balance Total</span>
                <div className="card-icon balance">
                  <i className="fas fa-balance-scale"></i>
                </div>
              </div>
              <div className="card-amount">{formatCurrency(resumen.balance)}</div>
            </div>

            <div className="summary-card income">
              <div className="card-header">
                <span className="card-title">Ingresos del Mes</span>
                <div className="card-icon income">
                  <i className="fas fa-arrow-up"></i>
                </div>
              </div>
              <div className="card-amount">{formatCurrency(resumen.totalIngresos)}</div>
            </div>

            <div className="summary-card expense">
              <div className="card-header">
                <span className="card-title">Gastos del Mes</span>
                <div className="card-icon expense">
                  <i className="fas fa-arrow-down"></i>
                </div>
              </div>
              <div className="card-amount">{formatCurrency(resumen.totalGastos)}</div>
            </div>
          </div>

          {/* Gráfico de gastos por categoría */}
          <div className="chart-section">
            <h3 className="section-title">
              <i className="fas fa-chart-pie"></i>
              Gastos por Categoría - {usuarioActivo} ({modoActivo})
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
              Transacciones Recientes - {usuarioActivo} ({modoActivo})
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
                      <div className={`transaction-amount ${transaccion.tipo}`}>
                        {transaccion.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(transaccion.cantidad)}
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
              <p>Salario actual ({modoActivo})</p>
            </div>

            {modoActivo === 'Local' && (
              <>
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
              </>
            )}

            {modoActivo === 'Nube' && (
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                Los datos en la nube son de solo lectura
              </p>
            )}
          </div>

          {/* Formulario para nueva transacción */}
          <div className="form-section">
            <h3 className="section-title">
              <i className="fas fa-plus-circle"></i>
              Nueva Transacción
            </h3>

            {modoActivo === 'Local' ? (
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
            ) : (
              <div className="empty-state">
                <i className="fas fa-lock"></i>
                <p>Solo puedes agregar transacciones en modo Local</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleModoChange('Local')}
                  style={{ marginTop: '16px' }}
                >
                  Cambiar a Modo Local
                </button>
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
};

// Renderizar la aplicación
ReactDOM.render(<FinanzasPersonales />, document.getElementById('root'));
