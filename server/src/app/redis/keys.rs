use std::fmt::{Display, Formatter, Result};
use uuid::Uuid;

pub enum RedisKey {
    /// Ключ Redis для збереження зліпка (snapshot) документа Automerge: `document:snapshot:<doc_id>`
    DocumentSnapshot(Uuid),
    
    /// Ключ Redis для каналу/потоку оновлень кімнати: `document:room:<doc_id>`
    DocumentRoom(Uuid),
}

impl Display for RedisKey {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result {
        match self {
            RedisKey::DocumentSnapshot(doc_id) => write!(f, "document:snapshot:{}", doc_id),
            RedisKey::DocumentRoom(doc_id) => write!(f, "document:room:{}", doc_id),
        }
    }
}
