"use client";

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import './page.css';

type User = { id: string; username: string };
type Channel = { id: string; name: string; serverId: string };
type Server = { id: string; name: string; channels: Channel[] };
type Message = { id: string; content: string; user: { id: string, username: string }; channelId: string; createdAt: number };

let socket: Socket;

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [usernameInput, setUsernameInput] = useState('');

  const [servers, setServers] = useState<Server[]>([]);
  const [activeServer, setActiveServer] = useState<Server | null>(null);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');

  const [showCreateServer, setShowCreateServer] = useState(false);
  const [newServerName, setNewServerName] = useState('');

  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize socket and fetch servers when user logs in
  useEffect(() => {
    if (!user) return;
    socket = io('http://localhost:4000');

    fetch(`http://localhost:4000/api/users/${user.id}/servers`)
      .then(res => res.json())
      .then(data => {
        setServers(data);
        if (data.length > 0) {
          setActiveServer(data[0]);
          if (data[0].channels.length > 0) {
            setActiveChannel(data[0].channels[0]);
          }
        }
      });

    socket.on('server_created', (newServer: Server) => {
      setServers(prev => [...prev.filter(s => s.id !== newServer.id), newServer]);
    });

    socket.on('channel_created', (newChannel: Channel) => {
      setServers(prev => prev.map(s => {
        if (s.id === newChannel.serverId) {
          return { ...s, channels: [...s.channels, newChannel] };
        }
        return s;
      }));
      if (activeServer?.id === newChannel.serverId) {
        setActiveServer(prev => prev ? { ...prev, channels: [...prev.channels, newChannel] } : prev);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Handle active channel change
  useEffect(() => {
    if (!activeChannel || !socket) return;
    socket.emit('join_channel', activeChannel.id);
    fetch(`http://localhost:4000/api/channels/${activeChannel.id}/messages`)
      .then(res => res.json())
      .then(data => setMessages(data));

    const handleNewMessage = (msg: Message) => {
      if (msg.channelId === activeChannel.id) {
        setMessages(prev => [...prev, msg]);
      }
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [activeChannel]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput) return;
    const res = await fetch('http://localhost:4000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput })
    });
    const loggedInUser = await res.json();
    setUser(loggedInUser);
  };

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServerName || !user) return;
    await fetch('http://localhost:4000/api/servers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newServerName, userId: user.id })
    });
    setNewServerName('');
    setShowCreateServer(false);
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName || !activeServer) return;
    await fetch(`http://localhost:4000/api/servers/${activeServer.id}/channels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newChannelName })
    });
    setNewChannelName('');
    setShowCreateChannel(false);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChannel || !user) return;
    socket.emit('send_message', { content: messageInput, userId: user.id, channelId: activeChannel.id });
    setMessageInput('');
  };

  if (!user) {
    return (
      <div className="login-container">
        <form className="login-box animate-slide-in" onSubmit={handleLogin}>
          <h2>Welcome to Eris</h2>
          <p>Please enter a username to continue.</p>
          <input
            type="text"
            value={usernameInput}
            onChange={e => setUsernameInput(e.target.value)}
            placeholder="Username"
            autoFocus
          />
          <button type="submit">Join</button>
        </form>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Servers Sidebar */}
      <nav className="servers-sidebar">
        {servers.map(server => (
          <div
            key={server.id}
            className={`server-icon ${activeServer?.id === server.id ? 'active' : ''}`}
            onClick={() => {
              setActiveServer(server);
              setActiveChannel(server.channels[0] || null);
            }}
            title={server.name}
          >
            {server.name.charAt(0).toUpperCase()}
          </div>
        ))}
        <div className="server-icon add-server" onClick={() => setShowCreateServer(true)}>+</div>
      </nav>

      {/* Channels Sidebar */}
      <aside className="channels-sidebar">
        <header className="channels-header">
          <h2>{activeServer?.name || 'No Server'}</h2>
        </header>
        <div className="channels-list">
          {activeServer?.channels.map(channel => (
            <div
              key={channel.id}
              className={`channel-item ${activeChannel?.id === channel.id ? 'active' : ''}`}
              onClick={() => setActiveChannel(channel)}
            >
              # {channel.name}
            </div>
          ))}
          {activeServer && (
            <div className="channel-item add-channel" onClick={() => setShowCreateChannel(true)}>
              + Add Channel
            </div>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-area">
        <header className="chat-header">
          <h3>{activeChannel ? `# ${activeChannel.name}` : 'No channel selected'}</h3>
        </header>

        <div className="messages-container">
          {messages.map((msg, idx) => (
            <div key={msg.id} className={`message ${idx === messages.length - 1 ? 'animate-slide-in' : ''}`}>
              <div className="message-avatar">
                {msg.user.username.charAt(0).toUpperCase()}
              </div>
              <div className="message-content">
                <h4>
                  {msg.user.username}
                  <span className="timestamp">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </h4>
                <p>{msg.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {activeChannel && (
          <form className="chat-input-wrapper" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="chat-input"
              placeholder={`Message #${activeChannel.name}`}
              value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
            />
          </form>
        )}
      </main>

      {/* Modals */}
      {showCreateServer && (
        <div className="modal-overlay" onClick={() => setShowCreateServer(false)}>
          <div className="modal animate-slide-in" onClick={e => e.stopPropagation()}>
            <h3>Create a Server</h3>
            <form onSubmit={handleCreateServer}>
              <input
                type="text"
                placeholder="Server Name"
                value={newServerName}
                onChange={e => setNewServerName(e.target.value)}
                autoFocus
              />
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateServer(false)}>Cancel</button>
                <button type="submit" className="primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateChannel && (
        <div className="modal-overlay" onClick={() => setShowCreateChannel(false)}>
          <div className="modal animate-slide-in" onClick={e => e.stopPropagation()}>
            <h3>Create a Channel</h3>
            <form onSubmit={handleCreateChannel}>
              <input
                type="text"
                placeholder="Channel Name"
                value={newChannelName}
                onChange={e => setNewChannelName(e.target.value)}
                autoFocus
              />
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateChannel(false)}>Cancel</button>
                <button type="submit" className="primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
