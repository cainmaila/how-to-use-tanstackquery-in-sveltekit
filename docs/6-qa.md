# 6. 常見問題 (FAQ)

### Q: 為什麼 `QueryClientProvider` 在根佈局 (`src/routes/+layout.svelte`) 和子路由佈局 (`src/routes/todos/+layout.svelte`) 中同時存在卻不會衝突？

**A:** `QueryClientProvider` 在 SvelteKit 的巢狀佈局中同時存在**不會造成衝突**，這是一種常見且設計良好的模式。

這是因為 SvelteKit 支援巢狀佈局。當您導航到 `/todos` 路由時，SvelteKit 會按照以下順序渲染組件：

1.  **`src/routes/+layout.svelte` (根佈局)**：這是應用程式的頂層佈局，它會提供一個 `QueryClientProvider` 給整個應用程式。
2.  **`src/routes/todos/+layout.svelte` (todos 佈局)**：這個佈局會渲染在根佈局的 `{@render children?.()}` 插槽內部。它也會提供一個 `QueryClientProvider`。

**為什麼不會衝突？**

每個 `QueryClientProvider` 都會建立一個新的 `QueryClient` 上下文。當 `src/routes/todos/+layout.svelte` 渲染時，它會建立一個**新的** `QueryClientProvider`，並為 `/todos` 路由及其子路由提供一個**專屬的** `QueryClient` 實例。

這意味著：

- 在 `/todos` 路由或其子組件中，任何 `useQueryClient()` 的呼叫都會取得由 `src/routes/todos/+layout.svelte` 提供的 `QueryClient`。
- 在 `/todos` 路由之外（例如，在根佈局的其他部分），`useQueryClient()` 仍然會取得由 `src/routes/+layout.svelte` 提供的 `QueryClient`。

這是一種**分層作用域**的機制。巢狀佈局中的 `QueryClientProvider` 會有效地為該應用程式分支提供一個更具體的 `QueryClient`，而不會與上層的 `QueryClientProvider` 產生衝突。這也是管理不同路由或應用程式部分資料狀態的常見且推薦的做法。
