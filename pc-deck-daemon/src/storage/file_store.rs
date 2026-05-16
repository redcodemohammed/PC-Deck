use std::{fs, path::PathBuf, sync::Mutex};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::{config::base_dir, error::AppError, models::{now, Deck, DeviceRecord}};

#[derive(Default, Serialize, Deserialize)] struct DeckDb { decks: Vec<Deck> }
#[derive(Default, Serialize, Deserialize)] struct DeviceDb { devices: Vec<DeviceRecord> }

pub struct FileStore { root: PathBuf, lock: Mutex<()> }
impl FileStore {
 pub fn new()->Result<Self,AppError>{let root=base_dir().map_err(|e|AppError::Internal(e.to_string()))?;fs::create_dir_all(&root).map_err(|e|AppError::Internal(e.to_string()))?;let s=Self{root,lock:Mutex::new(())};s.seed_default_deck()?;Ok(s)}
 fn decks_path(&self)->PathBuf{self.root.join("decks.json")} fn devices_path(&self)->PathBuf{self.root.join("devices.json")}
 fn read_decks(&self)->Result<DeckDb,AppError>{if !self.decks_path().exists(){return Ok(DeckDb::default())} Ok(serde_json::from_str(&fs::read_to_string(self.decks_path()).map_err(|e|AppError::Internal(e.to_string()))?).map_err(|e|AppError::Internal(e.to_string()))?)}
 fn write_decks(&self,db:&DeckDb)->Result<(),AppError>{fs::write(self.decks_path(),serde_json::to_string_pretty(db).unwrap()).map_err(|e|AppError::Internal(e.to_string()))}
 pub fn list_decks(&self)->Result<Vec<Deck>,AppError>{Ok(self.read_decks()?.decks)}
 pub fn upsert_deck(&self,mut deck:Deck)->Result<Deck,AppError>{let _g=self.lock.lock().unwrap(); let mut db=self.read_decks()?; deck.updated_at=now(); if let Some(i)=db.decks.iter().position(|d|d.id==deck.id){db.decks[i]=deck.clone()}else{db.decks.push(deck.clone())}; self.write_decks(&db)?; Ok(deck)}
 pub fn delete_deck(&self,id:&str)->Result<(),AppError>{let _g=self.lock.lock().unwrap();let mut db=self.read_decks()?;db.decks.retain(|d|d.id!=id);self.write_decks(&db)}
 pub fn add_device(&self,name:String,token:String)->Result<(),AppError>{let mut db:DeviceDb=if self.devices_path().exists(){serde_json::from_str(&fs::read_to_string(self.devices_path()).map_err(|e|AppError::Internal(e.to_string()))?).unwrap_or_default()}else{DeviceDb::default()}; db.devices.push(DeviceRecord{name,token,paired_at:now()}); fs::write(self.devices_path(),serde_json::to_string_pretty(&db).unwrap()).map_err(|e|AppError::Internal(e.to_string()))}
 pub fn is_valid_token(&self,token:&str)->Result<bool,AppError>{if !self.devices_path().exists(){return Ok(false)}; let db:DeviceDb=serde_json::from_str(&fs::read_to_string(self.devices_path()).map_err(|e|AppError::Internal(e.to_string()))?).unwrap_or_default(); Ok(db.devices.iter().any(|d|d.token==token))}
 fn seed_default_deck(&self)->Result<(),AppError>{if self.decks_path().exists(){return Ok(())}; let now=now(); let d=Deck{id:Uuid::new_v4().to_string(),name:"Default Deck".into(),rows:4,columns:8,buttons:vec![],created_at:now.clone(),updated_at:now}; self.write_decks(&DeckDb{decks:vec![d]}) }
}
