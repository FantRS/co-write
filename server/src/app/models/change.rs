use sqlx::prelude::FromRow;
use uuid::Uuid;

#[derive(Clone, FromRow)]
pub struct ChangeData {
    pub id: Uuid,
    pub update: Vec<u8>,
}

impl ChangeData {
    pub fn split_data(data: Vec<Self>) -> (Vec<Uuid>, Vec<Vec<u8>>) {
        data.into_iter().map(|c| (c.id, c.update)).unzip()
    }
}
