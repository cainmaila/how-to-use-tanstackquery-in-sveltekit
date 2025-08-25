# 7. 封裝 TanStack Query（重點精簡版）

本節說明如何將 TanStack Query 的查詢與變異行為封裝到 Svelte 5 runes 狀態中，讓 UI 組件只專注於渲染與互動。

## 為什麼要封裝？

- 關注點分離：資料邏輯與 UI 分離。
- 程式碼重用：多組件可共用資料操作。
- 易於測試與維護。
- UI 更簡潔。

## 實作重點

1. **建立 todoStore.ts**
   - 封裝所有 TanStack Query 相關邏輯。
   - 只需暴露簡單 API（如 todos, isLoading, addTodo, updateTodo, deleteTodo 等）。
   - 詳細程式碼可參考 `src/lib/stores/todoStore.ts`。

2. **UI 組件使用方式**
   - 只需解構 store 取得狀態與方法。
   - 互動邏輯簡單明瞭。
   - 參考 `src/routes/todos-v2/+page.svelte`。

   ```svelte
   <script lang="ts">
   	import { createTodoStore } from '$lib/stores/todoStore'
   	const todoStore = createTodoStore()
   	const { todos, isLoadingTodos, addTodo, updateTodo, deleteTodo } = todoStore
   	// ...互動邏輯略...
   </script>
   ```

## 封裝模式優點

- UI 組件不需直接操作 TanStack Query，只用 store 提供的屬性與方法。
- 未來可輕鬆更換底層狀態管理或 API 實作。
- 程式碼更模組化、可讀性高。

## 進階說明

- 轉接層（Adapter Layer）可用 Svelte 的 derived store 進一步簡化資料結構。
- 所有狀態皆可用 `$` 前綴訂閱。
- 操作方法（add, update, remove）直接呼叫即可。

---

如需完整程式碼，請參考原始檔案：

- `src/lib/stores/todoStore.ts`
- `src/routes/todos-v2/+page.svelte`

### 總結

封裝 TanStack Query 可大幅簡化 SvelteKit 應用的資料管理，提升可維護性與重用性。
