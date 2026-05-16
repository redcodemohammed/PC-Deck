import AsyncStorage from '@react-native-async-storage/async-storage';
export const save = (k:string,v:string)=>AsyncStorage.setItem(k,v); export const load = (k:string)=>AsyncStorage.getItem(k);
