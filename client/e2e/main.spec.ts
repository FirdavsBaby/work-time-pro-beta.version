import { test, expect } from '@playwright/test';

test.describe('WorkTime Pro E2E Flow', () => {
  test('Полный цикл: создание сотрудника, запуск и остановка таймера, просмотр отчёта', async ({ page }) => {
    // 1. Главная страница
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Дашборд');

    // 2. Страница сотрудников
    await page.click('a:has-text("Сотрудники")');
    await expect(page.locator('h1')).toContainText('Сотрудники');

    // Создаём уникального сотрудника
    const uniqueName = `E2E Тест ${Date.now()}`;
    await page.click('button:has-text("Добавить сотрудника")');
    await page.fill('input[id="name"]', uniqueName);
    await page.fill('input[id="position"]', 'QA Инженер');
    await page.click('button:has-text("Создать")');

    // Проверяем появление в таблице
    await expect(page.locator('table')).toContainText(uniqueName);

    // 3. Запуск таймера
    await page.click('a:has-text("Учёт времени")');
    await page.click('button:has-text("Запустить таймер")');

    // Выбираем созданного сотрудника
    await page.click('button:has-text("Выберите сотрудника")');
    await page.click(`text=${uniqueName}`);
    await page.fill('input[id="taskTitle"]', 'E2E Проверка функции');
    await page.click('button:has-text("Начать работу")');

    // Проверяем, что таймер активен
    await expect(page.locator('table')).toContainText('E2E Проверка функции');
    await expect(page.locator('table')).toContainText('в работе…');

    // Остановка таймера
    await page.click('button:has-text("Остановить")');
    await expect(page.locator('table')).toContainText('Завершён');

    // 4. Отчёты
    await page.click('a:has-text("Отчёты")');
    await expect(page.locator('h1')).toContainText('Отчёты и аналитика');
    await expect(page.locator('body')).toContainText(uniqueName);
  });
});
