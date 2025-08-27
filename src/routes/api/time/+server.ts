import { json } from '@sveltejs/kit'

/**
 * @description 這是一個簡單的 API 端點，用於獲取當前的伺服器時間。
 */
export const GET = () => {
	const currentTime = new Date().toISOString()
	return json({ time: currentTime })
}
