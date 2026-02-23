# Articles/Blog Feature - Test Plan & Acceptance Criteria

## Overview
This document outlines the comprehensive test plan for the Articles/Blog feature implementation, including Top Headers integration and full PDF support.

## Test Categories

### 1. Header Integration Tests

#### Header Sync Test
- **Test Case**: Open `/#/articles` page
- **Expected**: Top Headers are visible in the top section, Articles is marked as active (gold accent + underline)
- **Acceptance**: ✅ Headers display correctly with proper active state

#### Header Navigation Test
- **Test Case**: Click "Properties" in Top Headers from `/#/articles`
- **Expected**: Navigate to `/#/properties` page (or open properties filter if implemented)
- **Acceptance**: ✅ Navigation works consistently with site behavior

#### Header Active State Test
- **Test Case**: Navigate between different sections using Top Headers
- **Expected**: Active header shows gold accent and underline, inactive headers are normal
- **Acceptance**: ✅ Active state updates correctly across navigation

#### Mobile Header Test
- **Test Case**: View `/#/articles` on mobile device
- **Expected**: Top Headers collapse to hamburger menu, active state preserved in dropdown
- **Acceptance**: ✅ Mobile responsive design works

### 2. PDF Upload & Management Tests

#### Valid PDF Upload Test
- **Test Case**: Upload a valid PDF < 20MB as admin in article editor
- **Expected**: File uploads successfully, `article_files` record created, file appears in storage
- **Acceptance**: ✅ Upload succeeds with proper metadata storage

#### Invalid File Type Test
- **Test Case**: Attempt to upload `.exe` file as PDF
- **Expected**: Upload rejected with error message "Only PDF files are allowed"
- **Acceptance**: ✅ File type validation works

#### File Size Limit Test
- **Test Case**: Attempt to upload PDF > 20MB
- **Expected**: Upload rejected with error message "File must be less than 20MB"
- **Acceptance**: ✅ File size validation works

#### Primary File Toggle Test
- **Test Case**: Upload multiple PDFs, click "Set Primary" on secondary file
- **Expected**: Primary badge moves to selected file, database updated
- **Acceptance**: ✅ Primary file management works

### 3. PDF Preview & Download Tests

#### PDF Preview Test (Public)
- **Test Case**: Publish article with PDF, view as anonymous user, click "Preview"
- **Expected**: PDF opens in modal with iframe viewer or signed URL
- **Acceptance**: ✅ Preview functionality works for public access

#### PDF Download Test (Public)
- **Test Case**: Click "Download" on PDF attachment
- **Expected**: File downloads successfully via direct link or signed URL
- **Acceptance**: ✅ Download functionality works

#### PDF Access Control Test (Private Bucket)
- **Test Case**: As anonymous user, attempt direct access to PDF via known path
- **Expected**: Access denied (403/404), signed URL required
- **Acceptance**: ✅ Private bucket security works

### 4. Search Functionality Tests

#### Basic Search Test
- **Test Case**: Search for term that appears in article title
- **Expected**: Article appears in results with proper ranking
- **Acceptance**: ✅ Basic search returns relevant results

#### PDF Content Search Test (Advanced Mode)
- **Test Case**: Upload PDF with unique term, search for that term
- **Expected**: Article with PDF appears in search results
- **Acceptance**: ✅ PDF text search works (if advanced mode implemented)

### 5. Security & Permissions Tests

#### Admin Upload Permission Test
- **Test Case**: Non-admin user attempts PDF upload
- **Expected**: Upload fails with permission denied error
- **Acceptance**: ✅ RLS prevents unauthorized uploads

#### File Access RLS Test
- **Test Case**: Non-admin attempts to query `article_files` table
- **Expected**: Query returns only public metadata, no sensitive paths
- **Acceptance**: ✅ RLS policies protect file metadata

#### Signed URL Expiration Test
- **Test Case**: Generate signed URL, wait for expiration (5+ minutes)
- **Expected**: URL becomes invalid, access denied
- **Acceptance**: ✅ Signed URLs expire correctly

### 6. UI/UX Tests

#### Article Creation Flow Test
- **Test Case**: Complete article creation with PDF upload
- **Expected**: Article saves, PDFs associated, preview works
- **Acceptance**: ✅ Full creation workflow works

#### Article Display Test
- **Test Case**: View published article with PDF attachments
- **Expected**: PDFs display in "Documents & Attachments" section
- **Acceptance**: ✅ Article display includes PDF section

#### Responsive Design Test
- **Test Case**: Test article pages on mobile/tablet/desktop
- **Expected**: All elements display properly on all screen sizes
- **Acceptance**: ✅ Responsive design works

### 7. Performance Tests

#### Large PDF Upload Test
- **Test Case**: Upload 15MB PDF file
- **Expected**: Upload completes within reasonable time, no timeouts
- **Acceptance**: ✅ Large file handling works

#### Multiple File Upload Test
- **Test Case**: Upload 5 PDFs to single article
- **Expected**: All files upload successfully, UI handles multiple files
- **Acceptance**: ✅ Multiple file management works

## Test Execution Checklist

### Pre-Deployment Tests
- [ ] Database migrations applied successfully
- [ ] Storage buckets created with correct policies
- [ ] RLS policies active and tested
- [ ] Admin user has `is_admin = true`

### Functional Tests
- [ ] Header integration works across all pages
- [ ] PDF upload validation (type, size)
- [ ] PDF preview/download functionality
- [ ] Search functionality (basic + advanced)
- [ ] Security permissions (RLS, signed URLs)

### UI/UX Tests
- [ ] Responsive design on all devices
- [ ] Loading states and error handling
- [ ] Accessibility (ARIA labels, keyboard navigation)

### Performance Tests
- [ ] File upload speeds acceptable
- [ ] Page load times reasonable
- [ ] Search response times good

## Acceptance Criteria Summary

### ✅ **MUST PASS** (Critical)
- Top Headers display and navigate correctly
- PDF upload works with proper validation
- PDF preview/download functions for public users
- Security permissions prevent unauthorized access
- RLS policies protect sensitive data

### ✅ **SHOULD PASS** (Important)
- Advanced PDF text search works
- Mobile responsive design perfect
- Performance acceptable for large files
- Error handling user-friendly

### ✅ **NICE TO HAVE** (Optional)
- PDF text extraction and indexing
- Batch file operations
- Drag-and-drop reordering

## Test Results Documentation

After running tests, document results in this format:

```
Test Category: [Category Name]
Test Case: [Specific Test]
Result: ✅ PASS / ❌ FAIL / ⚠️ PARTIAL
Notes: [Any observations or issues]
Evidence: [Screenshots, logs, or test data]
```

## Rollback Plan

If critical issues found:
1. Revert PDF-related database migrations
2. Remove PDF storage bucket
3. Keep article/blog functionality without PDF support
4. Document issues for future implementation

## Sign-off Requirements

- [ ] All critical tests pass
- [ ] Security review completed
- [ ] Performance benchmarks met
- [ ] Cross-browser testing done
- [ ] Mobile testing completed

**Test Lead**: [Your Name]
**Date**: [Date]
**Environment**: [Development/Staging/Production]