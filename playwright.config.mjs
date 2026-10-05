import {defineConfig,devices} from '@playwright/test';
export default defineConfig({testDir:'./e2e',timeout:30_000,use:{baseURL:process.env.TEST_URL??'http://localhost:3001',trace:'retain-on-failure'},projects:[{name:'desktop',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:1000}}},{name:'mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}}]});
