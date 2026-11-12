use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct WorkspacePage {
    pub id: String,
    pub url: String,
    pub title: String,
    pub position: u32,
    pub saved_at: f64,
    pub pinned: Option<bool>,
    pub notes: Option<String>,
    pub fav_icon_url: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Workspace {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub icon: String,
    pub color: String,
    pub category: Option<String>,
    pub created_at: f64,
    pub updated_at: f64,
    pub last_opened_at: Option<f64>,
    pub is_pinned: Option<bool>,
    pub pages: Vec<WorkspacePage>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    pub workspace_id: String,
    pub workspace_name: String,
    pub page_id: Option<String>,
    pub page_title: Option<String>,
    pub page_url: Option<String>,
    pub score: u32,
}

#[wasm_bindgen]
pub struct WorkspaceManager {
    workspaces: Vec<Workspace>,
}

#[wasm_bindgen]
impl WorkspaceManager {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            workspaces: Vec::new(),
        }
    }

    /// Load workspaces from JSON string (e.g. from chrome.storage)
    #[wasm_bindgen(js_name = loadFromJson)]
    pub fn load_from_json(&mut self, json_str: &str) -> Result<(), JsValue> {
        let ws: Vec<Workspace> = serde_json::from_str(json_str)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse JSON: {}", e)))?;
        self.workspaces = ws;
        Ok(())
    }

    /// Export workspaces to JSON string
    #[wasm_bindgen(js_name = exportToJson)]
    pub fn export_to_json(&self) -> Result<String, JsValue> {
        serde_json::to_string(&self.workspaces)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize: {}", e)))
    }

    /// Fast local search across all workspaces and pages
    #[wasm_bindgen(js_name = search)]
    pub fn search(&self, query: &str) -> Result<JsValue, JsValue> {
        let q = query.trim().to_lowercase();
        if q.is_empty() {
            let empty: Vec<SearchResult> = Vec::new();
            return Ok(serde_wasm_bindgen::to_value(&empty)?);
        }

        let mut results: Vec<SearchResult> = Vec::new();

        for ws in &self.workspaces {
            let ws_name_lower = ws.name.to_lowercase();

            if ws_name_lower.contains(&q) {
                results.push(SearchResult {
                    workspace_id: ws.id.clone(),
                    workspace_name: ws.name.clone(),
                    page_id: None,
                    page_title: None,
                    page_url: None,
                    score: if ws_name_lower == q { 100 } else { 50 },
                });
            }

            for p in &ws.pages {
                let title_lower = p.title.to_lowercase();
                let url_lower = p.url.to_lowercase();

                if title_lower.contains(&q) || url_lower.contains(&q) {
                    let score = if title_lower.starts_with(&q) {
                        40
                    } else if title_lower.contains(&q) {
                        30
                    } else {
                        10
                    };

                    results.push(SearchResult {
                        workspace_id: ws.id.clone(),
                        workspace_name: ws.name.clone(),
                        page_id: Some(p.id.clone()),
                        page_title: Some(p.title.clone()),
                        page_url: Some(p.url.clone()),
                        score,
                    });
                }
            }
        }

        // Sort by score descending
        results.sort_by(|a, b| b.score.cmp(&a.score));

        serde_wasm_bindgen::to_value(&results)
            .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
    }

    /// Total count of all workspaces
    #[wasm_bindgen(js_name = getWorkspaceCount)]
    pub fn get_workspace_count(&self) -> usize {
        self.workspaces.len()
    }

    /// Total count of all unique tabs/pages across all workspaces
    #[wasm_bindgen(js_name = getTotalPagesCount)]
    pub fn get_total_pages_count(&self) -> usize {
        self.workspaces.iter().map(|w| w.pages.len()).sum()
    }
}

