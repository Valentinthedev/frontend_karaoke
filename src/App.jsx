import React, { useState, useEffect } from 'react';
import { QrCode, CheckCircle, XCircle, Users, Ticket, BarChart3, Plus, Search, Printer, Download, RefreshCw } from 'lucide-react';

const BASE = process.env.VITE_API_URL 
const API_URL = BASE.endsWith('/api') ? BASE : `${BASE.replace(/\/$/, '')}/api`;

console.log('API_URL ->', API_URL); // debug : verifier en prod via la console navigateur
  

export default function ConcertTicketSystem() {
  const [view, setView] = useState('admin');
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    total_tickets: 0,
    scanned_tickets: 0,
    remaining_tickets: 0,
    vip_count: 0,
    gold_count: 0,
    standard_count: 0,
    attendance_rate: 0
  });
  const [searchId, setSearchId] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newTicket, setNewTicket] = useState({
    name: '',
    category: 'VIP',
    seat: ''
  });

  // Charger les données au démarrage
  useEffect(() => {
    loadTickets();
    loadStats();
  }, []);

  const loadTickets = async () => {
    try {
      const response = await fetch(`${API_URL}/tickets`);
      const data = await response.json();
      setTickets(data.tickets || []);
      console.log('Tickets chargés:', data.tickets?.length || 0);
    } catch (error) {
      console.error('Erreur chargement tickets:', error);
      alert('❌ Erreur de connexion au serveur. Vérifiez que le backend est démarré sur le port 5000.');
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_URL}/stats`);
      const data = await response.json();
      console.log('Stats reçues:', data.stats);
      setStats(data.stats || {
        total_tickets: 0,
        scanned_tickets: 0,
        remaining_tickets: 0,
        vip_count: 0,
        gold_count: 0,
        standard_count: 0,
        attendance_rate: 0
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const generateTicket = async () => {
    if (!newTicket.name || !newTicket.seat) {
      alert('⚠️ Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/tickets/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket)
      });

      const data = await response.json();

      if (data.success) {
        setSelectedTicket(data.ticket);
        setNewTicket({ name: '', category: 'VIP', seat: '' });
        await loadTickets();
        await loadStats();
        alert('✅ Ticket créé avec succès !');
      } else {
        alert('❌ Erreur: ' + (data.error || 'Erreur inconnue'));
      }
    } catch (error) {
      console.error('Erreur création ticket:', error);
      alert('❌ Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const scanTicket = async () => {
    setScanResult(null);
    setLoading(true);

    try {
      let ticketId = searchId;
      let key = null;

      try {
        const parsed = JSON.parse(searchId);
        ticketId = parsed.id;
        key = parsed.key;
      } catch (e) {
        // C'est juste un ID simple
      }

      const response = await fetch(`${API_URL}/tickets/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, key, scannedBy: 'Agent' })
      });

      const data = await response.json();
      setScanResult(data);
      
      if (data.valid) {
        await loadTickets();
        await loadStats();
      }
    } catch (error) {
      console.error('Erreur scan:', error);
      setScanResult({
        valid: false,
        message: '❌ Erreur de connexion au serveur'
      });
    } finally {
      setLoading(false);
    }
  };

  const printTicket = async (ticket) => {
    // Récupérer le ticket complet avec le QR code depuis la base de données
    let fullTicket = ticket;
    if (!ticket.qrCode || !ticket.qr_code) {
      try {
        const response = await fetch(`${API_URL}/tickets/${ticket.ticketId || ticket.ticket_id}`);
        const data = await response.json();
        fullTicket = data.ticket;
      } catch (error) {
        console.error('Erreur récupération ticket:', error);
        alert('❌ Impossible de récupérer le QR code');
        return;
      }
    }

    const ticketId = fullTicket.ticketId || fullTicket.ticket_id;
    const qrCode = fullTicket.qrCode || fullTicket.qr_code;

    if (!qrCode) {
      alert('❌ QR code non disponible pour ce ticket');
      return;
    }

    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket - ${ticketId}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .ticket { 
              border: 3px solid #6b21a8; 
              padding: 30px; 
              max-width: 600px;
              background: white;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            h1 { 
              color: #6b21a8; 
              text-align: center;
              margin-bottom: 20px;
            }
            .qr-container { 
              text-align: center; 
              margin: 20px 0;
              padding: 20px;
              background: #f3f4f6;
              border-radius: 8px;
            }
            .qr-container img {
              max-width: 100%;
              height: auto;
            }
            .info { 
              margin: 15px 0; 
              font-size: 18px;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 10px;
            }
            .label { 
              font-weight: bold; 
              color: #6b21a8;
              display: inline-block;
              width: 120px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <h1>🎵 TICKET CONCERT 🎵</h1>
            <div class="qr-container">
              <img src="${qrCode}" alt="QR Code" />
            </div>
            <div class="info"><span class="label">Nom:</span> ${fullTicket.name}</div>
            <div class="info"><span class="label">Catégorie:</span> ${fullTicket.category}</div>
            <div class="info"><span class="label">Siège:</span> ${fullTicket.seat}</div>
            <div class="info"><span class="label">ID:</span> ${ticketId}</div>
            <div class="footer">
              Scanner le QR code à l'entrée du concert<br/>
              Créé le: ${new Date(fullTicket.createdAt || fullTicket.created_at).toLocaleDateString('fr-FR')}
            </div>
          </div>
          <script>
            setTimeout(() => window.print(), 500);
          </script>
        </body>
      </html>
    `);
  };

  const downloadQRCode = async (ticket) => {
    // Récupérer le ticket complet avec le QR code depuis la base de données
    let fullTicket = ticket;
    if (!ticket.qrCode && !ticket.qr_code) {
      try {
        const response = await fetch(`${API_URL}/tickets/${ticket.ticketId || ticket.ticket_id}`);
        const data = await response.json();
        fullTicket = data.ticket;
      } catch (error) {
        console.error('Erreur récupération ticket:', error);
        alert('❌ Impossible de récupérer le QR code');
        return;
      }
    }

    const qrCode = fullTicket.qrCode || fullTicket.qr_code;
    const ticketId = fullTicket.ticketId || fullTicket.ticket_id;

    if (!qrCode) {
      alert('❌ QR code non disponible pour ce ticket');
      return;
    }

    // Vérifier que le QR code est valide (commence par data:image)
    if (!qrCode.startsWith('data:image')) {
      alert('❌ Format de QR code invalide');
      return;
    }

    // Créer un lien de téléchargement
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `QR-${ticketId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCSV = async () => {
    try {
      const response = await fetch(`${API_URL}/export/csv`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tickets-${Date.now()}.csv`;
      a.click();
      alert('✅ Export CSV réussi !');
    } catch (error) {
      alert('❌ Erreur lors de l\'export');
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await Promise.all([loadTickets(), loadStats()]);
      alert('✅ Données actualisées !');
    } catch (error) {
      alert('❌ Erreur lors de l\'actualisation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <QrCode className="w-10 h-10" />
            Système de vérification des Tickets Karaoké Gospel
          </h1>
          <p className="text-purple-200">Gestion sécurisée avec base de données MySQL</p>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-4 mb-6 justify-center">
          <button
            onClick={() => setView('admin')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              view === 'admin'
                ? 'bg-white text-purple-900'
                : 'bg-purple-800 text-white hover:bg-purple-700'
            }`}
          >
            <Plus className="inline w-5 h-5 mr-2" />
            Générer Tickets
          </button>
          <button
            onClick={() => setView('scan')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              view === 'scan'
                ? 'bg-white text-purple-900'
                : 'bg-purple-800 text-white hover:bg-purple-700'
            }`}
          >
            <Search className="inline w-5 h-5 mr-2" />
            Scanner
          </button>
          <button
            onClick={() => setView('stats')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              view === 'stats'
                ? 'bg-white text-purple-900'
                : 'bg-purple-800 text-white hover:bg-purple-700'
            }`}
          >
            <BarChart3 className="inline w-5 h-5 mr-2" />
            Statistiques
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-6 py-3 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`inline w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>

        {/* Admin View */}
        {view === 'admin' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-2xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Créer un ticket</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du participant
                  </label>
                  <input
                    type="text"
                    value={newTicket.name}
                    onChange={(e) => setNewTicket({...newTicket, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Jean Dupont"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="VIP">VIP</option>
                    <option value="Gold">Gold</option>
                    <option value="Standard">Standard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Siège
                  </label>
                  <input
                    type="text"
                    value={newTicket.seat}
                    onChange={(e) => setNewTicket({...newTicket, seat: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="A12"
                  />
                </div>
                <button
                  onClick={generateTicket}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50"
                >
                  {loading ? 'Création...' : 'Générer le ticket'}
                </button>
              </div>

              {selectedTicket && (
                <div className="mt-6 p-4 border-2 border-purple-300 rounded-lg bg-purple-50">
                  <h3 className="font-bold text-purple-900 mb-3 text-center">
                    Ticket généré avec succès ! 🎉
                  </h3>
                  <div className="bg-white p-4 rounded-lg">
                    <img src={selectedTicket.qrCode} alt="QR Code" className="mx-auto" />
                    <p className="text-center mt-2 text-sm text-gray-600 font-mono break-all">
                      {selectedTicket.ticketId}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => printTicket(selectedTicket)}
                      className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2"
                    >
                      <Printer className="w-5 h-5" />
                      Imprimer
                    </button>
                    <button
                      onClick={() => downloadQRCode(selectedTicket)}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Télécharger QR
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  Tickets ({tickets.length})
                </h2>
                <button
                  onClick={exportCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {tickets.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Aucun ticket créé</p>
                ) : (
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <div key={ticket.ticket_id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">{ticket.name}</p>
                            <p className="text-sm text-gray-600">
                              {ticket.category} - Siège {ticket.seat}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{ticket.ticket_id}</p>
                          </div>
                          <div className="flex gap-2 items-center">
                            {ticket.is_scanned && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                            <button
                              onClick={() => downloadQRCode(ticket)}
                              className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200 transition"
                              title="Télécharger QR"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => printTicket(ticket)}
                              className="p-2 bg-purple-100 text-purple-600 rounded hover:bg-purple-200 transition"
                              title="Imprimer"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Scan View */}
        {view === 'scan' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Scanner un ticket
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID du ticket ou données QR
                  </label>
                  <textarea
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder='TKT-... ou {"id":"TKT-...","key":"..."}'
                    rows="3"
                  />
                </div>
                
                <button
                  onClick={scanTicket}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50"
                >
                  {loading ? 'Vérification...' : 'Vérifier le ticket'}
                </button>
              </div>

              {scanResult && (
                <div className={`mt-6 p-6 rounded-lg ${
                  scanResult.valid 
                    ? 'bg-green-50 border-2 border-green-500' 
                    : 'bg-red-50 border-2 border-red-500'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    {scanResult.valid ? (
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    ) : (
                      <XCircle className="w-10 h-10 text-red-600" />
                    )}
                    <h3 className={`text-xl font-bold ${
                      scanResult.valid ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {scanResult.message}
                    </h3>
                  </div>
                  
                  {scanResult.ticket && (
                    <div className="bg-white rounded-lg p-4 space-y-2">
                      <p><span className="font-semibold">Nom:</span> {scanResult.ticket.name}</p>
                      <p><span className="font-semibold">Catégorie:</span> {scanResult.ticket.category}</p>
                      <p><span className="font-semibold">Siège:</span> {scanResult.ticket.seat}</p>
                      {scanResult.ticket.scannedAt && (
                        <p className="text-red-600 text-sm mt-2">
                          Scanné le: {new Date(scanResult.ticket.scannedAt).toLocaleString('fr-FR')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats View */}
        {view === 'stats' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Ticket className="w-8 h-8 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-700">Total Tickets</h3>
              </div>
              <p className="text-4xl font-bold text-purple-600">{stats.total_tickets || 0}</p>
            </div>

            <div className="bg-white rounded-xl shadow-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-700">Tickets Scannés</h3>
              </div>
              <p className="text-4xl font-bold text-green-600">{stats.scanned_tickets || 0}</p>
            </div>

            <div className="bg-white rounded-xl shadow-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-8 h-8 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-700">Restants</h3>
              </div>
              <p className="text-4xl font-bold text-blue-600">{stats.remaining_tickets || 0}</p>
            </div>

            <div className="bg-white rounded-xl shadow-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">VIP</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.vip_count || 0}</p>
            </div>

            <div className="bg-white rounded-xl shadow-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Gold</h3>
              <p className="text-3xl font-bold text-yellow-600">{stats.gold_count || 0}</p>
            </div>

            <div className="bg-white rounded-xl shadow-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Standard</h3>
              <p className="text-3xl font-bold text-gray-600">{stats.standard_count || 0}</p>
            </div>

            <div className="md:col-span-2 lg:col-span-3 bg-white rounded-xl shadow-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Taux de présence</h3>
              <div className="w-full bg-gray-200 rounded-full h-8">
                <div
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 h-8 rounded-full flex items-center justify-center text-white font-semibold transition-all duration-500"
                  style={{ width: `${stats.attendance_rate || 0}%` }}
                >
                  {stats.attendance_rate || 0}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}