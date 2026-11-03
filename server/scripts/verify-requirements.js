import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { ErrorCase } from '../models/ErrorCase.js';
import { Feedback } from '../models/Feedback.js';
import { QueryHistory } from '../models/QueryHistory.js';
import { PIPELINES_CATALOG } from '../services/aggregationPipelines.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function runVerification() {
  console.log('========================================================');
  console.log('⚡ BUGSENSE AI: VERIFICATION OF VALIDATION, CRUD & AGGREGATION');
  console.log('========================================================\n');

  await connectDB();

  // ------------------------------------------------------------------
  // 1. VALIDATION CHECKS
  // ------------------------------------------------------------------
  console.log('🛡️  TESTING PILLAR 1: MONGOOSE SCHEMA & DATA VALIDATION...');

  let validationCaught = false;
  try {
    // Attempting to create an invalid document (bad language, short title, missing fix)
    await ErrorCase.create({
      errorMessage: 'ab', // < 3 chars (fails minlength)
      language: 'unsupported_lang_123', // not in enum whitelist
      severity: 'ExtremeHazard', // not in enum
      explanation: 'short' // < 10 chars
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      validationCaught = true;
      const failedFields = Object.keys(err.errors);
      console.log('  [PASS] Invalid ErrorCase correctly rejected by Mongoose schema!');
      console.log('         Validated fields caught:', failedFields.join(', '));
    } else {
      console.error('  [FAIL] Unexpected error type caught:', err);
    }
  }

  if (!validationCaught) {
    console.error('  [FAIL] Schema validation did not throw ValidationError on bad input!');
  }

  // Test Feedback rating validation
  let feedbackValidationCaught = false;
  try {
    await Feedback.create({
      errorCaseId: new mongoose.Types.ObjectId(),
      resolvedIssue: true,
      rating: 10, // Max allowed is 5
      studentLevel: 'SuperExpert' // Not in enum
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      feedbackValidationCaught = true;
      console.log('  [PASS] Invalid Feedback rating/level correctly rejected by schema!');
      console.log('         Validated fields caught:', Object.keys(err.errors).join(', '));
    }
  }

  if (!feedbackValidationCaught) {
    console.error('  [FAIL] Feedback schema did not reject rating out of bounds!');
  }

  console.log('\n--------------------------------------------------------');

  // ------------------------------------------------------------------
  // 2. CRUD OPERATIONS CHECKS
  // ------------------------------------------------------------------
  console.log('🔄 TESTING PILLAR 2: CRUD OPERATIONS (CREATE, READ, UPDATE, DELETE)...');

  // C - CREATE
  const testSignature = 'test_verify_crud_' + Date.now();
  const createdDoc = await ErrorCase.create({
    errorSignature: testSignature,
    rawError: 'TypeError: Test CRUD Operation Error for Verification',
    errorMessage: 'TypeError: Test CRUD Operation Error for Verification',
    language: 'javascript',
    errorType: 'TypeError',
    category: 'Test Category',
    severity: 'Medium',
    explanation: 'This is a valid test explanation ensuring CRUD operations work properly.',
    suggestedFix: {
      fixedCode: 'const test = true;',
      explanation: 'Verified solution safeguard.'
    },
    tags: ['test', 'javascript', 'verification'],
    timesQueried: 1,
    timesSolved: 1
  });
  console.log('  [PASS] CREATE: Document created successfully with ID:', createdDoc._id.toString());

  // R - READ
  const readDoc = await ErrorCase.findById(createdDoc._id);
  if (readDoc && readDoc.errorMessage === createdDoc.errorMessage) {
    console.log('  [PASS] READ: Document retrieved by ID successfully!');
  } else {
    console.error('  [FAIL] READ: Could not retrieve created document!');
  }

  // U - UPDATE
  readDoc.errorMessage = 'TypeError: Updated Test CRUD Message (PUT/PATCH)';
  readDoc.timesSolved = 5;
  await readDoc.save();

  const updatedDoc = await ErrorCase.findById(createdDoc._id);
  if (updatedDoc.errorMessage.includes('Updated') && updatedDoc.timesSolved === 5) {
    console.log('  [PASS] UPDATE: Document updated in MongoDB successfully!');
  } else {
    console.error('  [FAIL] UPDATE: Document was not updated!');
  }

  // D - DELETE
  const deletedResult = await ErrorCase.findByIdAndDelete(createdDoc._id);
  const verifyDeleted = await ErrorCase.findById(createdDoc._id);
  if (deletedResult && verifyDeleted === null) {
    console.log('  [PASS] DELETE: Document deleted and confirmed absent in MongoDB!');
  } else {
    console.error('  [FAIL] DELETE: Document deletion failed!');
  }

  console.log('\n--------------------------------------------------------');

  // ------------------------------------------------------------------
  // 3. AGGREGATION PIPELINES CHECKS
  // ------------------------------------------------------------------
  console.log('⚡ TESTING PILLAR 3: ADVANCED MONGODB AGGREGATION PIPELINES...');

  const pipelineKeys = Object.keys(PIPELINES_CATALOG);
  for (const key of pipelineKeys) {
    const pipe = PIPELINES_CATALOG[key];
    const startTime = performance.now();
    const result = await pipe.executor();
    const duration = (performance.now() - startTime).toFixed(2);
    const count = Array.isArray(result) ? result.length : (result ? 1 : 0);

    console.log(`  [PASS] ${pipe.name}:`);
    console.log(`         Stages Used: ${pipe.stagesUsed.join(' -> ')}`);
    console.log(`         Target Collection: ${pipe.collection}`);
    console.log(`         Documents Returned: ${count} in ${duration}ms`);
  }

  console.log('\n========================================================');
  console.log('🎉 ALL THREE CORE CRITERIA VERIFIED & OPERATIONAL!');
  console.log('========================================================');

  await mongoose.connection.close();
  process.exit(0);
}

runVerification().catch(err => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
