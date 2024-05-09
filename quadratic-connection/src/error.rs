//! Error Handling
//!
//! Create a generic Result type to reduce boilerplate.
//! Define errors used in the application.
//! Convert third party crate errors to application errors.
//! Convert errors to responses.

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};
use quadratic_rust_shared::SharedError;
use serde::{Deserialize, Serialize};
use thiserror::Error;

pub(crate) type Result<T> = std::result::Result<T, ConnectionError>;

#[derive(Error, Debug, Serialize, Deserialize, PartialEq, Clone)]
pub enum ConnectionError {
    #[error("Authentication error: {0}")]
    Authentication(String),

    #[error("Internal server error: {0}")]
    Config(String),

    #[error("Internal server error: {0}")]
    InternalServer(String),

    #[error("Internal token: {0}")]
    InvalidToken(String),

    #[error("Error requesting data: {0}")]
    Request(String),

    #[error("Error serializing or deserializing: {0}")]
    Serialization(String),

    #[error("unknown error: {0}")]
    Unknown(String),
}

impl From<SharedError> for ConnectionError {
    fn from(error: SharedError) -> Self {
        #[allow(clippy::match_single_binding)]
        match error {
            _ => ConnectionError::Unknown(format!("Unknown Quadratic API error: {error}")),
        }
    }
}

impl From<serde_json::Error> for ConnectionError {
    fn from(error: serde_json::Error) -> Self {
        ConnectionError::Serialization(error.to_string())
    }
}

impl From<uuid::Error> for ConnectionError {
    fn from(error: uuid::Error) -> Self {
        ConnectionError::Unknown(error.to_string())
    }
}

impl From<reqwest::Error> for ConnectionError {
    fn from(error: reqwest::Error) -> Self {
        ConnectionError::Request(error.to_string())
    }
}

impl From<jsonwebtoken::errors::Error> for ConnectionError {
    fn from(error: jsonwebtoken::errors::Error) -> Self {
        ConnectionError::Authentication(error.to_string())
    }
}

// convert ConnectionErrors into readable responses with appropriate status codes
impl IntoResponse for ConnectionError {
    fn into_response(self) -> Response {
        tracing::error!("Error: {:?}", self);
        let (status, error) = match self {
            ConnectionError::InternalServer(error) => (StatusCode::INTERNAL_SERVER_ERROR, error),
            ConnectionError::Authentication(error) => (StatusCode::UNAUTHORIZED, error),
            _ => (StatusCode::INTERNAL_SERVER_ERROR, "Unknown".into()),
        };

        (status, error).into_response()
    }
}
