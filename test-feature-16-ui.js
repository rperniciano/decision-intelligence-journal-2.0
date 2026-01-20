/**
 * Feature #16: Password Reset Flow - UI Test
 *
 * Tests the complete password reset flow through the UI:
 * 1. Navigate to login page
 * 2. Click 'Forgot password' link
 * 3. Enter valid email address
 * 4. Submit form
 * 5. Verify success message shown
 * 6. Check console for API response
 */

const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTestUser() {
  const timestamp = Date.now();
  const testEmail = `f16-ui-test-${timestamp}@testmail.com`;
  const testPassword = 'testpass123';

  // Create test user
  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (error && !error.message.includes('already registered')) {
    console.log('⚠️  Error creating test user:', error.message);
  }

  return { email: testEmail, password: testPassword };
}

async function testPasswordResetUI() {
  console.log('🌐 Feature #16: Password Reset Flow - UI Test\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Monitor console and network
  const consoleMessages = [];
  const apiRequests = [];

  page.on('console', msg => {
    consoleMessages.push(msg.text());
  });

  page.on('request', request => {
    const url = request.url();
    if (url.includes('/auth/v1/recover')) {
      apiRequests.push({
        method: request.method(),
        url: url,
        headers: request.headers(),
      });
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/auth/v1/recover')) {
      const responseBody = await response.text();
      apiRequests.push({
        url: url,
        status: response.status(),
        body: responseBody,
      });
    }
  });

  try {
    // Setup test user
    console.log('📧 Setting up test user...');
    const { email } = await setupTestUser();
    console.log('✅ Test user created:', email);

    // Step 1: Navigate to login page
    console.log('\n📍 Step 1: Navigate to login page...');
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    console.log('✅ Navigated to login page');

    // Take screenshot
    await page.screenshot({ path: 'verification/feature-16-01-login-page.png' });
    console.log('📸 Screenshot: feature-16-01-login-page.png');

    // Step 2: Click 'Forgot password' link
    console.log('\n🔗 Step 2: Click "Forgot password" link...');
    const forgotPasswordLink = page.locator('text=Forgot password?');
    await forgotPasswordLink.click();
    await page.waitForLoadState('networkidle');

    // Verify URL changed to /forgot-password
    const currentUrl = page.url();
    if (currentUrl.includes('/forgot-password')) {
      console.log('✅ Navigated to forgot password page');
    } else {
      console.log('❌ Failed to navigate to forgot password page');
      await browser.close();
      return false;
    }

    // Take screenshot
    await page.screenshot({ path: 'verification/feature-16-02-forgot-password-page.png' });
    console.log('📸 Screenshot: feature-16-02-forgot-password-page.png');

    // Step 3: Enter email address
    console.log('\n📝 Step 3: Enter email address...');
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill(email);
    console.log('✅ Email entered:', email);

    // Step 4: Submit form
    console.log('\n🚀 Step 4: Submit form...');
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait for success message or error
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: 'verification/feature-16-03-success-message.png' });
    console.log('📸 Screenshot: feature-16-03-success-message.png');

    // Step 5: Verify success message
    console.log('\n✅ Step 5: Verify success message...');
    const successMessage = page.locator('text=Check your email');
    const emailMention = page.locator(`text=${email}`);

    if (await successMessage.isVisible()) {
      console.log('✅ Success message shown: "Check your email"');
    } else {
      console.log('❌ Success message not found');
      await browser.close();
      return false;
    }

    if (await emailMention.isVisible()) {
      console.log('✅ Email address shown in success message');
    } else {
      console.log('⚠️  Email address not visible in success message');
    }

    // Step 6: Check API requests
    console.log('\n🔍 Step 6: Verify API request...');
    if (apiRequests.length > 0) {
      console.log('✅ API request made to password reset endpoint');
      apiRequests.forEach(req => {
        if (req.status) {
          console.log(`   Status: ${req.status}`);
          if (req.status === 200) {
            console.log('   ✅ API request successful');
          } else {
            console.log('   ⚠️  API request status:', req.status);
          }
        }
      });
    } else {
      console.log('⚠️  No API requests detected');
    }

    // Step 7: Verify no console errors
    console.log('\n🐛 Step 7: Check console for errors...');
    const errors = consoleMessages.filter(msg =>
      msg.toLowerCase().includes('error') ||
      msg.toLowerCase().includes('failed')
    );

    if (errors.length === 0) {
      console.log('✅ No console errors detected');
    } else {
      console.log('⚠️  Console messages found:', errors);
    }

    // Step 8: Verify "Back to Login" link
    console.log('\n🔙 Step 8: Verify "Back to Login" link...');
    const backToLoginLink = page.locator('text=Back to Login');
    if (await backToLoginLink.isVisible()) {
      console.log('✅ "Back to Login" link is visible');

      // Click it to verify it works
      await backToLoginLink.click();
      await page.waitForLoadState('networkidle');

      if (page.url().includes('/login')) {
        console.log('✅ "Back to Login" link navigates correctly');
      } else {
        console.log('⚠️  "Back to Login" link did not navigate to /login');
      }
    } else {
      console.log('⚠️  "Back to Login" link not found');
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ ALL UI TESTS PASSED');
    console.log('='.repeat(50));

    await browser.close();
    return true;

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    await browser.close();
    return false;
  }
}

async function main() {
  try {
    const success = await testPasswordResetUI();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
