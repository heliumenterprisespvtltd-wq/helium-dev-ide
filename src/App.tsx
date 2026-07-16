import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Terminal as TerminalIcon, Monitor, Maximize2, Layout, Send } from 'lucide-react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import './App.css';

type Tab = 'explorer' | 'remote' | 'settings' | 'git' | 'docker' | 'notes';
type Message = { role: 'system' | 'user' | 'assistant'; content: string };

function App() {
  const [code, setCode] = useState<string>('// Welcome to Helium Dev IDE\nconsole.log("Hello World");');
  const [activeTab, setActiveTab] = useState<Tab>('explorer');
  const [zenMode, setZenMode] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  
  // AI Settings State
  const [cloudKey, setCloudKey] = useState<string>('');
  const [localEndpoint, setLocalEndpoint] = useState<string>('http://localhost:11434');
  const [localModel, setLocalModel] = useState<string>('glm-5.2-latest');
  const [autoFallback, setAutoFallback] = useState<boolean>(true);
  
  // AI Chat State
  const [chatHistory, setChatHistory] = useState<Message[]>([
    { role: 'system', content: 'How can I help you code today?' }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!terminalRef.current) return;
    const term = new Terminal({
      theme: { background: '#18181b', foreground: '#e4e4e7' },
      fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
      fontSize: 13,
      cursorBlink: true,
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();
    
    term.writeln('\x1b[1;35m$\x1b[0m Welcome to Helium Dev IDE Terminal');
    term.write('\x1b[1;35m$\x1b[0m ');

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); term.dispose(); };
  }, [zenMode, showPreview]);

  // AI Logic
  const handleAiSubmit = async (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'key' in e && e.key !== 'Enter') return;
    if (!chatInput.trim() || isAiLoading) return;

    const userMsg: Message = { role: 'user', content: chatInput };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setChatInput('');
    setIsAiLoading(true);

    let useCloud = cloudKey.trim().length > 0;
    
    try {
      let response;
      if (useCloud) {
        // Attempt OpenRouter
        response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cloudKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3-8b-instruct:free', // Default free model for testing
            messages: newHistory.filter(m => m.role !== 'system')
          })
        });

        // Fallback Logic
        if (!response.ok && autoFallback) {
          console.warn("Cloud AI failed, falling back to Local GLM...");
          useCloud = false;
        }
      }

      if (!useCloud) {
        // Attempt Local API (Ollama standard format)
        response = await fetch(`${localEndpoint}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: localModel,
            messages: newHistory.filter(m => m.role !== 'system'),
            stream: false
          })
        });
      }

      if (!response || !response.ok) throw new Error("AI Request Failed");
      
      const data = await response.json();
      const assistantText = useCloud 
        ? data.choices[0].message.content 
        : data.message.content; // Ollama format

      setChatHistory(prev => [...prev, { role: 'assistant', content: assistantText }]);

    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { role: 'assistant', content: '❌ Connection failed. Check your API key or ensure your Local AI server is running.' }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className={`ide-container ${zenMode ? 'zen-mode' : ''}`}>
      <div className="title-bar">
        <div className="title-text">Helium Dev IDE {zenMode && '(Zen Mode)'}</div>
        <div className="title-actions">
          <button onClick={() => setShowPreview(!showPreview)} className="icon-btn" title="Toggle Web Preview"><Monitor size={14}/></button>
          <button onClick={() => setZenMode(!zenMode)} className="icon-btn" title="Toggle Zen Mode"><Maximize2 size={14}/></button>
        </div>
      </div>

      <div className="main-content">
        {!zenMode && (
          <div className="sidebar">
            <div className="sidebar-header">
              <span className={activeTab === 'explorer' ? 'active-tab' : ''} onClick={() => setActiveTab('explorer')}>FILES</span>
              <span className={activeTab === 'remote' ? 'active-tab' : ''} onClick={() => setActiveTab('remote')}>REMOTE</span>
              <span className={activeTab === 'git' ? 'active-tab' : ''} onClick={() => setActiveTab('git')}>GIT</span>
              <span className={activeTab === 'docker' ? 'active-tab' : ''} onClick={() => setActiveTab('docker')}>DOCKER</span>
              <span className={activeTab === 'notes' ? 'active-tab' : ''} onClick={() => setActiveTab('notes')}>NOTES</span>
              <span className={activeTab === 'settings' ? 'active-tab' : ''} onClick={() => setActiveTab('settings')}>⚙️</span>
            </div>
            
            {activeTab === 'explorer' && (
              <div className="sidebar-items">
                <div className="sidebar-item active">index.ts</div>
                <div className="sidebar-item">App.tsx</div>
                <div className="sidebar-item">styles.css</div>
              </div>
            )}

            {activeTab === 'remote' && (
              <div className="sidebar-items remote-panel">
                <div className="remote-title">VPS Connections</div>
                <div className="remote-form">
                  <input type="text" className="codex-input" placeholder="Host (e.g., 192.168.1.5)" />
                  <input type="text" className="codex-input" placeholder="Username" />
                  <input type="password" className="codex-input" placeholder="Password or Key" />
                  <button className="codex-btn">Connect SSH</button>
                </div>
              </div>
            )}

            {activeTab === 'git' && (
              <div className="sidebar-items remote-panel">
                <div className="remote-title">Source Control</div>
                <div className="sidebar-item" style={{color:'#ef4444'}}>M App.tsx</div>
                <div className="remote-form" style={{marginTop: 10}}>
                  <input type="text" className="codex-input" placeholder="Commit message" />
                  <button className="codex-btn">Commit & Push</button>
                </div>
              </div>
            )}

            {activeTab === 'docker' && (
              <div className="sidebar-items remote-panel">
                <div className="remote-title">Containers</div>
                <div className="sidebar-item"><span className="status-indicator online"></span> redis-db (Port 6379)</div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="sidebar-items remote-panel">
                <div className="remote-title">Scratchpad</div>
                <textarea className="codex-input" style={{height: '200px', resize: 'none'}} defaultValue="- Write API for auth\n- Check docker logs" />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="sidebar-items remote-panel">
                <div className="remote-title">AI Config</div>
                <div className="remote-form">
                  <label style={{ fontSize: '11px', color: '#888' }}>Cloud API Key (OpenRouter / OpenAI)</label>
                  <input type="password" value={cloudKey} onChange={e => setCloudKey(e.target.value)} className="codex-input" placeholder="sk-or-v1-..." />
                  
                  <label style={{ fontSize: '11px', color: '#888', marginTop: '10px' }}>Local Offline Model (GLM 5.2 / Ollama)</label>
                  <input type="text" value={localEndpoint} onChange={e => setLocalEndpoint(e.target.value)} className="codex-input" placeholder="Local Endpoint URL" />
                  <input type="text" value={localModel} onChange={e => setLocalModel(e.target.value)} className="codex-input" placeholder="Model Name" />
                  
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="checkbox" checked={autoFallback} onChange={e => setAutoFallback(e.target.checked)} />
                      Auto-fallback to Offline Model if no internet
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Editor Area */}
        <div className="editor-area">
          <div className="editor-container">
            <Editor
              height="100%"
              theme="vs-dark"
              defaultLanguage="typescript"
              value={code}
              onChange={(val) => setCode(val || '')}
              options={{ minimap: { enabled: false }, fontSize: 14, fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace", padding: { top: 16 } }}
            />
          </div>

          {!zenMode && (
            <div className="terminal-panel">
              <div className="panel-header">
                <TerminalIcon size={14} className="panel-icon" />
                <span>TERMINAL</span>
              </div>
              <div className="terminal-container" ref={terminalRef} style={{ padding: '8px' }}></div>
            </div>
          )}
        </div>

        {showPreview && !zenMode && (
          <div className="preview-panel">
            <div className="panel-header">
              <Layout size={14} className="panel-icon" />
              <span>LIVE PREVIEW</span>
            </div>
            <div className="preview-content">
              <div style={{display:'flex', height:'100%', alignItems:'center', justifyContent:'center', color:'#888'}}>
                Web Preview Loaded
              </div>
            </div>
          </div>
        )}

        {/* AI Sidebar */}
        {!zenMode && (
          <div className="ai-sidebar">
            <div className="ai-sidebar-header">ANTIGRAVITY AI</div>
            <div className="ai-chat-area">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`ai-message ${msg.role === 'user' ? 'user-msg' : 'system'}`} style={msg.role === 'user' ? {background: '#27272a', border: '1px solid #3f3f46'} : {}}>
                  {msg.content}
                </div>
              ))}
              {isAiLoading && (
                <div className="ai-message system" style={{opacity: 0.7}}>Thinking...</div>
              )}
            </div>
            <div className="ai-input-area" style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                className="ai-input" 
                placeholder="Ask AI to write code..." 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={handleAiSubmit}
                disabled={isAiLoading}
              />
              <button 
                onClick={handleAiSubmit}
                disabled={isAiLoading || !chatInput.trim()}
                className="icon-btn" 
                style={{ background: 'var(--codex-accent)', color: '#fff', padding: '0 12px', borderRadius: '20px' }}>
                <Send size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
