import { create } from 'zustand'; import { Deck } from '../lib/types';
export const useDeckStore = create<{decks:Deck[];currentDeckId?:string}>((_set)=>({decks:[]}));
