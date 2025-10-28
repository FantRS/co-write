use sqlx::prelude::FromRow;
use uuid::Uuid;

#[derive(Clone, FromRow)]
pub struct ChangeData {
    pub id: Uuid,
    pub update: Vec<u8>,
}

impl ChangeData {
    pub fn split_data(data: Vec<Self>) -> (Vec<Uuid>, Vec<Vec<u8>>) {
        let mut id = Vec::with_capacity(data.len());
        let mut update = Vec::with_capacity(data.len());

        for change in data {
            id.push(change.id);
            update.push(change.update);
        }

        (id, update)
    }
}
