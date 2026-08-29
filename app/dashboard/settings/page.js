'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function NotificationSettings() {
  const [channels, setChannels] = useState([]);
  const [type, setType] = useState('discord');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchChannels = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch('/api/channels', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    if (res.ok) setChannels(data.channels || []);
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const handleAddChannel = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch('/api/channels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ type, destination }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Failed to add channel');
    } else {
      setDestination('');
      fetchChannels();
    }
  };

  const handleDeleteChannel = async (id) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`/api/channels/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.ok) fetchChannels();
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px' }}>
      <h2>Notification Channels</h2>
      
      <form onSubmit={handleAddChannel} style={{ marginBottom: '30px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>Type: </label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="discord">Discord Webhook</option>
            <option value="email">Email Address</option>
          </select>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Destination: </label>
          <input
            type="text"
            placeholder={type === 'discord' ? 'https://discord.com/api/webhooks/...' : 'user@example.com'}
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            required
          />
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" disabled={loading} style={{ padding: '8px 16px' }}>
          {loading ? 'Adding...' : 'Add Channel'}
        </button>
      </form>

      <h3>Configured Channels</h3>
      {channels.length === 0 ? (
        <p>No notification channels configured yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {channels.map((channel) => (
            <li
              key={channel.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px',
                borderBottom: '1px solid #ccc',
              }}
            >
              <span>
                <strong>{channel.type.toUpperCase()}:</strong> {channel.destination}
              </span>
              <button onClick={() => handleDeleteChannel(channel.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}