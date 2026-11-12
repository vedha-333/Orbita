# Rust WebAssembly Core for My Task Browser

This directory contains the high-performance Rust WebAssembly core engine for the browser extension.

## Responsibilities
- **Type-safe data modeling** for Workspaces and Pages.
- **Fast in-memory indexing and fuzzy search** across thousands of tabs.
- **Binary & JSON serialization** for lightweight storage.

## Requirements
- Rust toolchain: `winget install Rustlang.Rustup`
- wasm-pack: `cargo install wasm-pack`

## Building
From the project root:
```bash
npm run build:wasm
```
This compiles the Rust crate to WebAssembly (`.wasm`) and outputs the JavaScript glue into `src/wasm/`.

