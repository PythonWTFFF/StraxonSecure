use axum::{
    routing::{get, post},
    Router, Json, response::IntoResponse, http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;

#[derive(Deserialize)]
struct RenderRequest {
    invoice_id: String,
    amount: f64,
    client_name: String,
}

#[derive(Serialize)]
struct RenderResponse {
    status: String,
    pdf_url: String, // Mocking S3 upload for now
}

async fn render_pdf(Json(payload): Json<RenderRequest>) -> impl IntoResponse {
    tracing::info!("Rendering PDF for invoice {} (Client: {})", payload.invoice_id, payload.client_name);
    
    // In a real implementation, we would use headless-chrome or typst here to generate the PDF buffer
    // and upload to S3/R2.
    // For this demonstration of polyglot architecture, we return a mock URL
    
    let mock_url = format!("https://storage.straxon.com/invoices/{}.pdf", payload.invoice_id);

    let response = RenderResponse {
        status: "success".to_string(),
        pdf_url: mock_url,
    };

    (StatusCode::OK, Json(response))
}

async fn health() -> &'static str {
    "OK"
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    tracing::info!("Straxon Render Service starting on :8082");

    let app = Router::new()
        .route("/health", get(health))
        .route("/render/pdf", post(render_pdf));

    let addr = SocketAddr::from(([0, 0, 0, 0], 8082));
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
