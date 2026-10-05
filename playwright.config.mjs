import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
  testDir:'./e2e',
  timeout:30_000,
  use:{baseURL:process.env.TEST_URL??'http://localhost:3001',trace:'retain-on-failure'},
  projects:[
    {name:'desktop',testIgnore:'hand-alignment.spec.mjs',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:1000}}},
    {name:'mobile',testIgnore:'hand-alignment.spec.mjs',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}},
    ...['chromium','firefox','webkit'].map(browserName=>({
      name:`hands-${browserName}`,
      testMatch:'hand-alignment.spec.mjs',
      use:{browserName,viewport:{width:1920,height:1080}},
    })),
  ],
});
