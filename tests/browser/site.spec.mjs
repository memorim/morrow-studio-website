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
test('contact validates input and confirms a persisted inquiry once',async({page,request})=>{
 await page.goto('/');
 await page.locator('[name=name]').fill('  ');
 await page.locator('[name=email]').fill('fixture@example.test');
 await page.locator('[name=message]').fill('A valid description');
 await page.locator('#contact-form button').click();
 await expect(page.locator('.form-status')).toContainText('Введите');
 await page.locator('[name=name]').fill('<b>Оля</b>');
 const received = page.waitForResponse(r=>r.url().endsWith('/api/inquiries') && r.request().method()==='POST');
 await page.locator('#contact-form button').click();
 const response = await received;
 expect(response.status()).toBe(201);
 await expect(page.locator('.form-status')).toContainText('Заявка принята');
 expect(await page.locator('.form-status b').count()).toBe(0);
 const data=response.request().postDataJSON();
 expect((await request.post('/api/inquiries',{data})).status()).toBe(201);
 expect((await request.post('/api/inquiries',{data:{...data,message:'Different request'}})).status()).toBe(409);
 expect((await request.post('/api/inquiries',{data:{...data,email:'invalid'}})).status()).toBe(400);
 expect((await request.get('/api/inquiries')).status()).toBe(404);
});

test('a shared category URL filters the server response',async({request})=>{
 const html = await (await request.get('/?category=brand')).text();
 expect(html).toContain('class="project" data-category="brand"');
 expect(html).toContain('class="project project-wide hidden" data-category="product"');
 expect(html).toContain('class="project hidden" data-category="web"');
});
