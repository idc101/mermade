import { test, expect } from '@playwright/test';

test.describe('Mermade App', () => {
  test('should load the app and display the editor', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    await expect(page).toHaveTitle(/Mermade/);
    
    // Check for editor
    const editor = page.locator('textarea');
    await expect(editor).toBeVisible();
    
    // Check for React Flow canvas
    const canvas = page.locator('.react-flow__renderer');
    await expect(canvas).toBeVisible();
  });

  test('should update canvas when mermaid text is edited', async ({ page }) => {
    await page.goto('/');
    
    const editor = page.locator('textarea');
    
    // Clear and type new mermaid text
    // We use fill because it's faster and more reliable than type for large blocks
    await editor.fill('graph TD\n  ALPHA --> BETA');
    
    // Verify nodes are rendered in React Flow
    // React Flow nodes usually have the class .react-flow__node
    const nodes = page.locator('.react-flow__node');
    
    // Wait for nodes to appear and have the correct text
    await expect(page.locator('.react-flow__node:has-text("ALPHA")')).toBeVisible();
    await expect(page.locator('.react-flow__node:has-text("BETA")')).toBeVisible();
    
    // Verify edge is rendered
    const edges = page.locator('.react-flow__edge');
    await expect(edges).toHaveCount(1);
  });

  test('should add a new node via toolbar', async ({ page }) => {
    await page.goto('/');
    
    const addButton = page.getByText('+ Node');
    await addButton.click();
    
    // Check if "New Service" node appears (default label in useDiagramState.ts)
    await expect(page.locator('.react-flow__node:has-text("New Service")')).toBeVisible();
  });
});
