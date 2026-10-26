import {test,expect} from '@playwright/test';
test('navigation works at every supported breakpoint',async({page,viewport})=>{
 await page.goto('/');const zoom=await page.evaluate(()=>Number(getComputedStyle(document.documentElement).zoom));if(viewport.width/zoom<=900){await page.locator('.menu-button').click();await expect(page.locator('header nav')).toBeVisible({timeout:1000});await expect(page.locator('.menu-button')).toHaveAttribute('aria-expanded','true');await page.keyboard.press('Escape');await expect(page.locator('header nav')).toBeHidden();}else await expect(page.locator('header nav')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
});
test('reduced motion disables the ticker',async({page})=>{await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');expect(await page.locator('.ticker div').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');});

test('filters, labelled case dialog and focus return work',async({page})=>{
 await page.goto('/');await page.locator('[data-filter=brand]').click();await expect(page.locator('.project:not(.hidden)')).toHaveCount(1);await expect(page.locator('[data-filter=brand]')).toHaveAttribute('aria-pressed','true');const link=page.locator('.project:not(.hidden) a');await link.focus();await page.keyboard.press('Enter');await expect(page.getByRole('dialog',{name:'Flora Lab'})).toBeVisible();await page.keyboard.press('Escape');await expect(link).toBeFocused();
 for(const img of await page.locator('.project:not(.hidden) img').all()){await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate(x=>x.complete&&x.naturalWidth>0)).toBe(true);}
});
test('contact validation retains invalid data and never sends requests',async({page})=>{
 const posts=[];page.on('request',r=>{if(r.method()==='POST')posts.push(r.url())});await page.goto('/');await page.locator('[name=name]').fill('  ');await page.locator('[name=email]').fill('fixture@example.test');await page.locator('[name=message]').fill('A valid description');await page.locator('#contact-form button').click();await expect(page.locator('.form-status')).toContainText('Введите');await expect(page.locator('[name=email]')).toHaveValue('fixture@example.test');await page.locator('[name=name]').fill('<b>Оля</b>');await page.locator('#contact-form button').click();await expect(page.locator('.form-status')).toContainText('данные не отправлены');expect(await page.locator('.form-status b').count()).toBe(0);expect(posts).toEqual([]);
});
