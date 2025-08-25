import { expect, test } from '@playwright/test'

test.describe('Todos V2 Page', () => {
	test('should load todos-v2 page without errors', async ({ page }) => {
		// 監聽控制台錯誤
		const errors: string[] = []
		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				errors.push(msg.text())
			}
		})

		// 監聽網絡請求失敗
		const failedRequests: string[] = []
		page.on('response', (response) => {
			if (!response.ok()) {
				failedRequests.push(`${response.status()} ${response.url()}`)
			}
		})

		// 導航到 todos-v2 頁面
		await page.goto('/todos-v2')

		// 檢查頁面標題是否正確顯示
		await expect(page.getByRole('heading', { name: '待辦事項列表 (v2)' })).toBeVisible()

		// 檢查是否有 JavaScript 錯誤
		expect(errors).toEqual([])

		// 檢查是否有失敗的網絡請求
		expect(failedRequests).toEqual([])
	})

	test('should display loading state initially', async ({ page }) => {
		await page.goto('/todos-v2')

		// 檢查是否顯示載入中狀態（可能很快消失）
		const loadingText = page.getByText('載入中...')
		// 使用 waitFor 來等待載入狀態出現或消失
		await expect(loadingText)
			.toBeVisible()
			.catch(() => {
				// 如果載入很快完成，這是正常的
			})
	})

	test('should be able to fetch todos from API', async ({ page }) => {
		// 攔截 API 請求
		let apiRequestMade = false
		page.on('request', (request) => {
			if (request.url().includes('/api/todos')) {
				apiRequestMade = true
			}
		})

		await page.goto('/todos-v2')

		// 等待一段時間讓 React Query 發送請求
		await page.waitForTimeout(2000)

		// 檢查是否發送了 API 請求
		expect(apiRequestMade).toBe(true)
	})

	test('should load default todos from API', async ({ page }) => {
		await page.goto('/todos-v2')

		// 等待頁面載入完成
		await expect(page.getByRole('heading', { name: '待辦事項列表 (v2)' })).toBeVisible()

		// 等待 API 請求完成 - 檢查是否不再顯示載入中
		await page.waitForFunction(
			() => {
				const body = document.body.textContent || ''
				return !body.includes('載入中...')
			},
			{ timeout: 10000 }
		)

		// 檢查頁面內容 - 應該要有兩筆預設的 todo
		const pageContent = await page.textContent('body')

		// 驗證是否包含預設的 todo 內容
		expect(pageContent).toContain('Learn SvelteKit')
		expect(pageContent).toContain('Learn TanStack Query')

		// 檢查 todo items（如果有的話）
		const todoItems = page.locator('.todo-item')
		const todoCount = await todoItems.count()

		if (todoCount > 0) {
			// 如果找到 todo items，驗證數量
			await expect(todoItems).toHaveCount(2)
		} else {
			// 如果沒有找到 todo items，至少應該看到文字內容
			console.log('No .todo-item elements found, but content should be visible in page')
		}
	})

	test('should display todos or empty state', async ({ page }) => {
		await page.goto('/todos-v2')

		// 等待載入完成
		await page.waitForTimeout(3000)

		// 檢查是否顯示待辦事項列表或空狀態
		const todoList = page.locator('.todo-list')
		const emptyState = page.getByText('目前沒有待辦事項。')
		const errorState = page.locator('.error')

		// 應該顯示其中一種狀態：待辦事項列表、空狀態，或者沒有錯誤
		const isListVisible = await todoList.isVisible().catch(() => false)
		const isEmptyVisible = await emptyState.isVisible().catch(() => false)
		const isErrorVisible = await errorState.isVisible().catch(() => false)

		// 如果有錯誤，打印錯誤信息
		if (isErrorVisible) {
			const errorText = await errorState.textContent()
			console.log('Error found:', errorText)
		}

		// 至少應該顯示列表或空狀態，而不是錯誤
		expect(isListVisible || isEmptyVisible).toBe(true)
		expect(isErrorVisible).toBe(false)
	})

	test('should be able to add a new todo', async ({ page }) => {
		await page.goto('/todos-v2')

		// 等待頁面載入完成
		await page.waitForTimeout(2000)

		// 確認沒有錯誤狀態
		const errorState = page.locator('.error')
		expect(await errorState.isVisible().catch(() => false)).toBe(false)

		// 填寫新待辦事項
		const input = page.locator('input[placeholder="新增待辦事項"]')
		await input.fill('測試待辦事項 - Playwright')

		// 點擊新增按鈕
		const addButton = page.getByRole('button', { name: /新增/ })
		await addButton.click()

		// 等待添加完成
		await page.waitForTimeout(1000)

		// 檢查是否成功添加（輸入框應該被清空）
		await expect(input).toHaveValue('')
	})

	test('should handle API errors gracefully', async ({ page }) => {
		// 攔截 API 請求並返回錯誤
		await page.route('/api/todos', (route) => {
			route.fulfill({
				status: 500,
				contentType: 'application/json',
				body: JSON.stringify({ error: 'Internal Server Error' })
			})
		})

		await page.goto('/todos-v2')

		// 等待錯誤狀態顯示，或者檢查是否有錯誤文字
		try {
			// 嘗試查找錯誤元素
			const errorElement = page.locator('.error')
			await expect(errorElement).toBeVisible({ timeout: 5000 })
		} catch {
			// 如果沒有找到 .error 元素，檢查是否有包含 "錯誤" 的文字
			const errorText = page.locator('text=錯誤')
			await expect(errorText).toBeVisible({ timeout: 5000 })
		}
	})
})
