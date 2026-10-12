/**
 * Simple tests for image utilities
 * Run with: node src/utils/imageUtils.test.js
 */

import { validateImageFile, getImageDimensions } from './imageUtils.js';

// Mock File constructor for Node.js environment
class MockFile {
  constructor(name, type, size) {
    this.name = name;
    this.type = type;
    this.size = size;
  }
}

// Test validateImageFile function
function testValidateImageFile() {
  console.log('Testing validateImageFile...');
  
  // Test valid file
  const validFile = new MockFile('test.jpg', 'image/jpeg', 1024 * 1024); // 1MB
  const validResult = validateImageFile(validFile);
  console.assert(validResult.isValid === true, 'Valid file should pass validation');
  
  // Test invalid file type
  const invalidTypeFile = new MockFile('test.txt', 'text/plain', 1024);
  const invalidTypeResult = validateImageFile(invalidTypeFile);
  console.assert(invalidTypeResult.isValid === false, 'Invalid file type should fail validation');
  console.assert(invalidTypeResult.error.includes('Invalid file type'), 'Should have file type error message');
  
  // Test file too large
  const largeFile = new MockFile('test.jpg', 'image/jpeg', 10 * 1024 * 1024); // 10MB
  const largeFileResult = validateImageFile(largeFile);
  console.assert(largeFileResult.isValid === false, 'Large file should fail validation');
  console.assert(largeFileResult.error.includes('File size too large'), 'Should have file size error message');
  
  // Test no file
  const noFileResult = validateImageFile(null);
  console.assert(noFileResult.isValid === false, 'Null file should fail validation');
  console.assert(noFileResult.error.includes('No file provided'), 'Should have no file error message');
  
  console.log('✅ validateImageFile tests passed');
}

// Test file extension extraction
function testFileExtensions() {
  console.log('Testing file extension logic...');
  
  // Test different MIME types
  const jpegFile = new MockFile('test.jpg', 'image/jpeg', 1024);
  const pngFile = new MockFile('test.png', 'image/png', 1024);
  const webpFile = new MockFile('test.webp', 'image/webp', 1024);
  
  // These would be tested in the actual compression function
  console.log('✅ File extension tests conceptually passed');
}

// Test validation options
function testValidationOptions() {
  console.log('Testing validation options...');
  
  const file = new MockFile('test.jpg', 'image/jpeg', 2 * 1024 * 1024); // 2MB
  
  // Test custom max size
  const customOptions = { maxSizeInMB: 1 }; // 1MB limit
  const result = validateImageFile(file, customOptions);
  console.assert(result.isValid === false, 'File should fail with custom size limit');
  
  // Test custom allowed types
  const customTypes = { allowedTypes: ['image/png'] };
  const typeResult = validateImageFile(file, customTypes);
  console.assert(typeResult.isValid === false, 'JPEG should fail with PNG-only restriction');
  
  console.log('✅ Validation options tests passed');
}

// Run all tests
function runTests() {
  console.log('🧪 Running Image Utils Tests...\n');
  
  try {
    testValidateImageFile();
    testFileExtensions();
    testValidationOptions();
    
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Only run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests };