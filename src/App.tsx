import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Terminal as TerminalIcon, Monitor, Maximize2, Layout } from 'lucide-react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import './App.css';

type Tab = 'explorer' | 'remote' | 'settings' | 'git' | 'docker' | 'notes';

function App() {
  const [code, setCode] = useState<string>('// Welcome to Helium Dev IDE\nconsole.log("Hello World");');
  const [activeTab, setActiveTab] = useState<Tab>('explorer');
  const [zenMode, setZenMode] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  
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
                <div className="remote-connections">
                  <div className="sidebar-item"><span className="status-indicator offline"></span> production-server</div>
                  <div className="sidebar-item active"><span className="status-indicator online"></span> dev-box (10.0.0.5)</div>
                </div>
              </div>
            )}

            {activeTab === 'git' && (
              <div className="sidebar-items remote-panel">
                <div className="remote-title">Source Control</div>
                <div className="sidebar-item" style={{color:'#ef4444'}}>M App.tsx</div>
                <div className="sidebar-item" style={{color:'#4ade80'}}>U utils.ts</div>
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
                <div className="sidebar-item"><span className="status-indicator online"></span> postgres-main (Port 5432)</div>
                <div className="sidebar-item"><span className="status-indicator offline"></span> web-frontend (Exited)</div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="sidebar-items remote-panel">
                <div className="remote-title">Scratchpad</div>
                <textarea className="codex-input" style={{height: '200px', resize: 'none'}} defaultValue="- Write API for auth\n- Check docker logs\n- Deploy to VPS" />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="sidebar-items remote-panel">
                <div className="remote-title">AI Config</div>
                <div className="remote-form">
                  <label style={{ fontSize: '11px', color: '#888' }}>Cloud API Key (OpenRouter / OpenAI)</label>
                  <input type="password" className="codex-input" placeholder="sk-or-v1-..." />
                  
                  <label style={{ fontSize: '11px', color: '#888', marginTop: '10px' }}>Local Offline Model (GLM 5.2)</label>
                  <input type="text" className="codex-input" defaultValue="http://localhost:11434" />
                  <input type="text" className="codex-input" defaultValue="glm-5.2-latest" />
                  
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="checkbox" defaultChecked />
                      Auto-fallback to Offline Model if no internet
                    </label>
                  </div>

                  <div className="remote-title" style={{ marginTop: '10px' }}>AI Permissions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="radio" name="ai-access" value="review" defaultChecked />
                      Review First (Ask before actions)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="radio" name="ai-access" value="decisions" />
                      AI Decisions (Auto-choose tools)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="radio" name="ai-access" value="full" />
                      Full Access (No limits, execute all)
                    </label>
                  </div>

                  <button className="codex-btn" style={{ marginTop: '10px' }}>Save Config</button>
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
                Web Preview Loaded (http://localhost:8080)
              </div>
            </div>
          </div>
        )}

        {/* AI Sidebar */}
        {!zenMode && (
          <div className="ai-sidebar">
            <div className="ai-sidebar-header">ANTIGRAVITY (GLM 5.2)</div>
            <div className="ai-chat-area">
              <div className="ai-message system">How can I help you code today?</div>
            </div>
            <div className="ai-input-area">
              <input type="text" className="ai-input" placeholder="Ask AI to write code..." />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
