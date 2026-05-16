import { create } from 'zustand'; import { pair as pairApi } from '../lib/api';
type S={ip:string;token:string;status:string;pair:(ip:string,code:string)=>Promise<void>};
export const useConnectionStore=create<S>((set)=>({ip:'',token:'',status:'idle',pair:async(ip,code)=>{set({status:'pairing'});const r=await pairApi(ip,code);set({ip,token:r.token,status:'connected'});}}));
