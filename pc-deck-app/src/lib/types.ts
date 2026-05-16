export type ActionType = 'hotkey'|'launch_app'|'open_url'|'shell_command'|'macro';
export type ActionDefinition = { id:string; type:ActionType; name:string; config:Record<string, unknown> };
export type DeckButton = { id:string; row:number; column:number; label:string; icon:string; color?:string; action?:ActionDefinition };
export type Deck = { id:string; name:string; rows:number; columns:number; buttons:DeckButton[]; createdAt:string; updatedAt:string };
