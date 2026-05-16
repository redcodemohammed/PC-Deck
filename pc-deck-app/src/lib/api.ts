export const pair = async (ip:string, pairingCode:string, deviceName='Tablet') => {
  const res = await fetch(`http://${ip}:41730/pair`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({pairingCode, deviceName})});
  if(!res.ok) throw new Error('Pair failed');
  return res.json();
};
