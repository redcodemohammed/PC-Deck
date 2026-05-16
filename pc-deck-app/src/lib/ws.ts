export const connectWs = (ip:string, onMessage:(m:any)=>void) => { const ws = new WebSocket(`ws://${ip}:41730/ws`); ws.onmessage=(e)=>onMessage(JSON.parse(e.data)); return ws; };
