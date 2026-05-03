import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { Play, Terminal, CheckCircle2, XCircle, Loader2, Server, Database, Globe, Shield, RefreshCw, Trash2, StopCircle } from 'lucide-react';
import { useSocket } from '../shared/SocketContext';
const INITIAL_STEPS = [
    { id: 'kill', name: 'Cleanup Ports', description: 'Kill processes on 3000, 8000, 5432, 6379, 8080', status: 'idle', icon: _jsx(StopCircle, { size: 18 }) },
    { id: 'fix', name: 'Fix Dependencies', description: 'Create compatible package.json for frontend', status: 'idle', icon: _jsx(RefreshCw, { size: 18 }) },
    { id: 'build', name: 'Build React App', description: 'Install deps and run npm build', status: 'idle', icon: _jsx(Globe, { size: 18 }) },
    { id: 'docker', name: 'Docker Config', description: 'Generate docker-compose.yml and Dockerfiles', status: 'idle', icon: _jsx(Database, { size: 18 }) },
    { id: 'containers', name: 'Start Containers', description: 'Run docker-compose up -d', status: 'idle', icon: _jsx(Server, { size: 18 }) },
    { id: 'wait', name: 'Wait for Services', description: 'Check health endpoints for backend and frontend', status: 'idle', icon: _jsx(Shield, { size: 18 }) },
];
const DeploymentDashboard = () => {
    const { socket, sendCommand } = useSocket();
    const [steps, setSteps] = useState(INITIAL_STEPS);
    const [logs, setLogs] = useState([]);
    const [isDeploying, setIsDeploying] = useState(false);
    const scrollRef = useRef(null);
    useEffect(() => {
        if (!socket)
            return;
        const handleOutput = (data) => {
            if (data.type === 'exit') {
                setIsDeploying(false);
                setLogs(prev => [...prev, { type: 'system', text: `Deployment finished with code ${data.code}`, timestamp: new Date().toLocaleTimeString() }]);
                return;
            }
            if (data.data) {
                setLogs(prev => [...prev, { type: data.type, text: data.data, timestamp: new Date().toLocaleTimeString() }]);
                // Update step status based on output
                const output = data.data.toLowerCase();
                if (output.includes('cleaning up ports'))
                    updateStepStatus('kill', 'running');
                if (output.includes('fixing react dependencies'))
                    updateStepStatus('fix', 'running');
                if (output.includes('building react typescript application'))
                    updateStepStatus('build', 'running');
                if (output.includes('creating docker configuration'))
                    updateStepStatus('docker', 'running');
                if (output.includes('starting docker containers'))
                    updateStepStatus('containers', 'running');
                if (output.includes('waiting for services'))
                    updateStepStatus('wait', 'running');
                if (output.includes('created compatible package.json'))
                    updateStepStatus('fix', 'success');
                if (output.includes('react app built successfully'))
                    updateStepStatus('build', 'success');
                if (output.includes('docker configuration created'))
                    updateStepStatus('docker', 'success');
                if (output.includes('containers started successfully'))
                    updateStepStatus('containers', 'success');
                if (output.includes('backend is ready'))
                    updateStepStatus('wait', 'success');
            }
        };
        socket.on('deploy_output', handleOutput);
        return () => {
            socket.off('deploy_output', handleOutput);
        };
    }, [socket]);
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);
    const updateStepStatus = (id, status) => {
        setSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    };
    const handleDeploy = (command = '') => {
        if (!socket)
            return;
        setIsDeploying(true);
        setLogs([{ type: 'system', text: `Starting deployment: ${command || 'full'}`, timestamp: new Date().toLocaleTimeString() }]);
        setSteps(INITIAL_STEPS.map(s => ({ ...s, status: 'idle' })));
        sendCommand('system', 'deploy', { args: command ? [command] : [] });
    };
    const clearLogs = () => setLogs([]);
    return (_jsxs("div", { className: "flex flex-col h-full bg-[#F4F4F4] text-gray-600 font-sans", children: [_jsxs("div", { className: "p-6 border-b border-gray-200 flex items-center justify-between bg-white shadow-sm", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20", children: _jsx(Server, { className: "text-red-500", size: 24 }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-xl font-black text-gray-900 tracking-tight uppercase", children: "OS Simulator" }), _jsx("p", { className: "text-xs text-gray-500 font-mono", children: "DEPLOYMENT_DASHBOARD_V1.0.4" })] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsxs("button", { onClick: () => handleDeploy('rebuild'), disabled: isDeploying, className: "flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-bold text-sm transition-all disabled:opacity-50 border border-gray-200", children: [_jsx(RefreshCw, { size: 16, className: isDeploying ? "animate-spin" : "" }), "Rebuild"] }), _jsxs("button", { onClick: () => handleDeploy(), disabled: isDeploying, className: "flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-black text-sm transition-all shadow-lg shadow-red-600/20 disabled:opacity-50", children: [_jsx(Play, { size: 16, fill: "currentColor" }), "RUN DEPLOY"] })] })] }), _jsxs("div", { className: "flex-1 flex flex-col lg:flex-row overflow-hidden", children: [_jsxs("div", { className: "w-full lg:w-80 border-r border-gray-200 bg-white p-6 overflow-y-auto no-scrollbar", children: [_jsx("h2", { className: "text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6", children: "Pipeline Steps" }), _jsx("div", { className: "space-y-4", children: steps.map((step, i) => (_jsxs("div", { className: "relative", children: [i < steps.length - 1 && (_jsx("div", { className: "absolute left-[19px] top-10 bottom-[-16px] w-[2px] bg-gray-100" })), _jsxs("div", { className: "flex gap-4", children: [_jsx("div", { className: `w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-500 ${step.status === 'success' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' :
                                                        step.status === 'running' ? 'bg-blue-500/10 border-blue-500 text-blue-500 animate-pulse' :
                                                            step.status === 'error' ? 'bg-red-500/10 border-red-500 text-red-500' :
                                                                'bg-gray-50 border-gray-200 text-gray-400'}`, children: step.status === 'running' ? _jsx(Loader2, { size: 20, className: "animate-spin" }) : step.icon }), _jsxs("div", { className: "flex-1 pt-1", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("span", { className: `text-sm font-bold ${step.status === 'idle' ? 'text-gray-400' : 'text-gray-900'}`, children: step.name }), step.status === 'success' && _jsx(CheckCircle2, { size: 14, className: "text-emerald-500" }), step.status === 'error' && _jsx(XCircle, { size: 14, className: "text-red-500" })] }), _jsx("p", { className: "text-[11px] text-gray-500 leading-relaxed", children: step.description })] })] })] }, step.id))) }), _jsxs("div", { className: "mt-12 p-4 rounded-xl bg-gray-50 border border-gray-100", children: [_jsx("h3", { className: "text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3", children: "System Status" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between text-[11px]", children: [_jsx("span", { className: "text-gray-500", children: "Uptime" }), _jsx("span", { className: "text-gray-900 font-mono", children: "12:43:02" })] }), _jsxs("div", { className: "flex justify-between text-[11px]", children: [_jsx("span", { className: "text-gray-500", children: "Memory" }), _jsx("span", { className: "text-gray-900 font-mono", children: "42%" })] }), _jsxs("div", { className: "flex justify-between text-[11px]", children: [_jsx("span", { className: "text-gray-500", children: "CPU" }), _jsx("span", { className: "text-gray-900 font-mono", children: "12%" })] })] })] })] }), _jsxs("div", { className: "flex-1 flex flex-col bg-white overflow-hidden relative", children: [_jsxs("div", { className: "p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Terminal, { size: 16, className: "text-gray-400" }), _jsx("span", { className: "text-[10px] font-black text-gray-400 uppercase tracking-widest", children: "Deployment Logs" })] }), _jsx("button", { onClick: clearLogs, className: "p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors", title: "Clear Logs", children: _jsx(Trash2, { size: 16 }) })] }), _jsx("div", { ref: scrollRef, className: "flex-1 overflow-y-auto p-6 font-mono text-[12px] leading-relaxed no-scrollbar bg-gray-950", children: logs.length === 0 ? (_jsxs("div", { className: "h-full flex flex-col items-center justify-center text-gray-700 opacity-50", children: [_jsx(Terminal, { size: 48, strokeWidth: 1, className: "mb-4" }), _jsx("p", { className: "text-sm", children: "No logs to display. Start a deployment to see output." })] })) : (_jsxs("div", { className: "space-y-1", children: [logs.map((log, i) => (_jsxs("div", { className: "flex gap-4 group", children: [_jsxs("span", { className: "text-gray-600 shrink-0 select-none opacity-50 group-hover:opacity-100 transition-opacity", children: ["[", log.timestamp, "]"] }), _jsx("span", { className: `${log.type === 'stderr' ? 'text-red-400' :
                                                        log.type === 'system' ? 'text-blue-400 font-bold' :
                                                            'text-gray-400'} whitespace-pre-wrap break-all`, children: log.text })] }, i))), isDeploying && (_jsxs("div", { className: "flex gap-4 animate-pulse", children: [_jsxs("span", { className: "text-gray-600 shrink-0", children: ["[", new Date().toLocaleTimeString(), "]"] }), _jsx("span", { className: "text-gray-500", children: "_" })] }))] })) }), _jsx("div", { className: "absolute bottom-6 right-6 flex gap-2", children: _jsxs("div", { className: "px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-full border border-gray-200 text-[10px] font-bold text-gray-500 flex items-center gap-2 shadow-sm", children: [_jsx("div", { className: `w-2 h-2 rounded-full ${isDeploying ? 'bg-blue-500 animate-ping' : 'bg-gray-300'}` }), isDeploying ? 'DEPLOYING...' : 'IDLE'] }) })] })] })] }));
};
export default DeploymentDashboard;
