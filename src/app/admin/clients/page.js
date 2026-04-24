'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Users, Search, UserPlus, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function ManageClients() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');

  useEffect(() => {
    fetchClients();
  }, [profile]);

  async function fetchClients() {
    if (!profile || profile.role !== 'admin') return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          transactions (
            id, type, amount, units
          )
        `)
        .eq('role', 'client')
        .order('name');
        
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateClient = async (e) => {
    e.preventDefault();
    setCreating(true);
    setMessage({ text: '', type: '' });

    try {
      // Get current auth token to prove we are an admin to the secure API
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/admin/create-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          phone: newPhone,
          adminToken: session?.access_token
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create client');
      }

      setMessage({ text: 'Client created successfully! They can now log in.', type: 'success' });
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewPhone('');
      fetchClients();
      
      // Auto close after 2s on success
      setTimeout(() => {
        setIsModalOpen(false);
        setMessage({ text: '', type: '' });
      }, 2000);

    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center">
          <Users className="mr-3 text-indigo-400" />
          Client Management
        </h1>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Create New Client
        </button>
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-950/50">
                 <h2 className="text-lg font-semibold text-white flex items-center">
                   <UserPlus className="w-5 h-5 mr-2 text-indigo-400"/> Create Client Account
                 </h2>
                 <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                   <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="p-6">
                {message.text && (
                  <div className={`mb-6 p-4 rounded-lg flex items-start text-sm ${
                    message.type === 'success' ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800' : 'bg-red-900/40 text-red-300 border border-red-800'
                  }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />}
                    {message.text}
                  </div>
                )}

                <form onSubmit={handleCreateClient} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                    <input
                      type="text" required value={newName} onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                    <input
                      type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number (Optional)</label>
                     <input
                       type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)}
                       className="w-full px-4 py-2 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                     />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Assign Password</label>
                    <input
                      type="text" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6}
                      className="w-full px-4 py-2 bg-gray-950 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                      placeholder="Min 6 characters"
                    />
                    <p className="text-xs text-gray-500 mt-1">Provide this password securely to the client.</p>
                  </div>

                  <div className="pt-4 mt-6 border-t border-gray-800 flex justify-end space-x-3">
                     <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
                        Cancel
                     </button>
                     <button type="submit" disabled={creating} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center">
                        {creating ? 'Creating...' : 'Create Account'}
                     </button>
                  </div>
                </form>
              </div>
           </div>
        </div>
      )}

      {/* Search and List */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex items-center">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search clients by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-lg leading-5 bg-gray-950 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-gray-950/50 text-xs uppercase text-gray-500 font-semibold border-b border-gray-800">
              <tr>
                <th className="px-6 py-4">Client Name</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4 text-right">Transaction Count</th>
                <th className="px-6 py-4 text-right">Net Units Held (Approx)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredClients.map((client) => {
                // Approximate units logic for admin view
                let approxUnits = 0;
                client.transactions?.forEach(t => {
                  if(t.type === 'INVEST') approxUnits += Number(t.units);
                  if(t.type === 'WITHDRAW') approxUnits -= Number(t.units);
                });

                return (
                  <tr key={client.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-300 font-bold border border-indigo-700/50">
                           {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <p className="text-white font-medium">{client.name}</p>
                          <p className="text-gray-500 text-xs">ID: {client.id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-300">{client.email}</p>
                      <p className="text-gray-500 text-xs">{client.phone || 'No phone provided'}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {format(new Date(client.created_at), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {client.transactions?.length || 0}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-indigo-400">
                      {approxUnits.toLocaleString('en-IN', { maximumFractionDigits: 4 })}
                    </td>
                  </tr>
                );
              })}
              
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    {searchQuery ? 'No clients matching your search.' : 'No clients found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
