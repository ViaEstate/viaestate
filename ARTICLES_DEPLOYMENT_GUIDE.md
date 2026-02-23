# Articles/Blog Feature - Deployment Guide

## Overview
This guide covers the deployment of the complete Articles/Blog feature with Top Headers integration and full PDF support.

## Prerequisites

### Database Requirements
- Supabase project with authentication enabled
- Existing `profiles` table with user data
- PostgreSQL with full-text search capabilities

### Environment Variables
Ensure these are set in your deployment environment:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Permissions
- Deployment user must have admin access to Supabase project
- Service role key required for database migrations

## Deployment Steps

### Step 1: Database Migration

#### Run Articles Migration
```sql
-- Execute the complete articles migration
-- File: supabase/migrations/20251129155200_add_articles_blog_feature.sql
```

#### Run PDF Support Migration
```sql
-- Execute the PDF support migration
-- File: supabase/migrations/20251129162300_add_pdf_support.sql
```

#### Verify Migrations
```sql
-- Check that all tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('articles', 'tags', 'article_tags', 'article_files');

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies WHERE schemaname = 'public';
```

### Step 2: Storage Setup

#### Create Storage Buckets
```sql
-- These are created by the migration, but verify:
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('article-files', 'article-files', false)
ON CONFLICT (id) DO NOTHING;
```

#### Verify Bucket Policies
- `article-images`: Public bucket for article cover images
- `article-files`: Private bucket for PDF documents

### Step 3: Update Admin Permissions

#### Set Admin Users
```sql
-- Update existing admin users
UPDATE profiles SET is_admin = true WHERE role = 'admin';

-- Verify admin users
SELECT id, email, role, is_admin FROM profiles WHERE role = 'admin';
```

### Step 4: Frontend Deployment

#### Build and Deploy
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Deploy to your hosting platform (Vercel, Netlify, etc.)
# Follow your standard deployment process
```

#### Environment Configuration
Ensure frontend environment includes:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Step 5: Post-Deployment Verification

#### Test Basic Functionality
1. **Admin Access**: Login as admin, verify `/admin` access
2. **Article Creation**: Create a test article via `/admin/articles/new`
3. **Public Access**: View articles on `/#/articles` as anonymous user
4. **Search**: Test search functionality

#### Test PDF Features
1. **PDF Upload**: Upload a PDF in article editor
2. **PDF Preview**: Test preview functionality
3. **PDF Download**: Test download functionality
4. **Access Control**: Verify private bucket restrictions

#### Test Top Headers
1. **Header Display**: Verify headers show on `/articles`
2. **Active State**: Confirm "Articles" is marked active
3. **Navigation**: Test clicking other headers

## Monitoring & Maintenance

### Database Monitoring
```sql
-- Monitor article creation
SELECT COUNT(*) as total_articles FROM articles;
SELECT status, COUNT(*) FROM articles GROUP BY status;

-- Monitor file uploads
SELECT COUNT(*) as total_files FROM article_files;
SELECT content_type, COUNT(*) FROM article_files GROUP BY content_type;
```

### Storage Monitoring
- Monitor bucket usage in Supabase dashboard
- Set up alerts for storage quota approaching limits
- Regular cleanup of unused files

### Performance Monitoring
- Monitor search query performance
- Track PDF upload/download times
- Monitor signed URL generation

## Backup Strategy

### Database Backups
```sql
-- Export articles data
pg_dump -h your_host -U your_user -d your_db -t articles -t tags -t article_tags -t article_files > articles_backup.sql
```

### File Backups
- Use Supabase storage backup features
- Consider external backup of important PDF files
- Document retention policies

## Security Checklist

### Pre-Launch
- [ ] RLS policies active and tested
- [ ] Storage bucket policies correct
- [ ] Admin permissions verified
- [ ] File upload validation working
- [ ] Signed URL generation secure

### Post-Launch
- [ ] Monitor for unauthorized access attempts
- [ ] Regular security scans of uploaded files
- [ ] Audit log reviews
- [ ] Permission updates as needed

## Troubleshooting

### Common Issues

#### Articles Not Loading
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'articles';

-- Test anonymous access
SELECT COUNT(*) FROM articles WHERE status = 'published';
```

#### PDF Upload Failing
```sql
-- Check storage bucket
SELECT * FROM storage.buckets WHERE id = 'article-files';

-- Check user permissions
SELECT is_admin FROM profiles WHERE id = 'user_id';
```

#### Search Not Working
```sql
-- Check search function
SELECT search_articles('test', 10, 0);

-- Check tsv column
SELECT title, tsv FROM articles LIMIT 5;
```

### Rollback Procedures

#### Complete Rollback
```sql
-- Remove PDF functionality
DROP TABLE IF EXISTS article_files;
DELETE FROM storage.buckets WHERE id = 'article-files';

-- Remove articles functionality
DROP TABLE IF EXISTS article_tags;
DROP TABLE IF EXISTS articles;
DROP TABLE IF EXISTS tags;
DELETE FROM storage.buckets WHERE id = 'article-images';

-- Remove admin column
ALTER TABLE profiles DROP COLUMN IF EXISTS is_admin;
```

#### Partial Rollback (Keep Articles, Remove PDF)
```sql
DROP TABLE IF EXISTS article_files;
DELETE FROM storage.buckets WHERE id = 'article-files';
```

## Performance Optimization

### Database Indexes
```sql
-- Ensure these indexes exist
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_tsv ON articles USING gin(tsv);
```

### Query Optimization
- Use pagination for article listings
- Implement caching for frequently accessed articles
- Monitor slow queries and optimize

### File Storage Optimization
- Compress PDFs on upload (if possible)
- Implement CDN for public files
- Set appropriate cache headers

## Support & Documentation

### User Documentation
- Create admin guide for article management
- Document PDF upload procedures
- Provide user guide for article reading

### Developer Documentation
- API documentation for custom integrations
- Webhook documentation if needed
- Extension points for future features

## Success Metrics

### Key Performance Indicators
- Article creation rate
- PDF upload success rate
- Search usage and satisfaction
- Page load times
- User engagement with articles

### Monitoring Dashboard
Set up monitoring for:
- Daily article publications
- PDF upload/download statistics
- Search query analytics
- Error rates and user feedback

---

## Deployment Sign-off

**Deployment Lead**: [Your Name]
**Date**: [Date]
**Environment**: [Development/Staging/Production]

### Pre-deployment Checklist
- [ ] Database migrations tested in staging
- [ ] Storage buckets configured
- [ ] Admin permissions set
- [ ] Frontend build successful
- [ ] Environment variables configured

### Post-deployment Checklist
- [ ] Basic functionality verified
- [ ] PDF features tested
- [ ] Top Headers working
- [ ] Search functionality confirmed
- [ ] Security checks passed
- [ ] Performance benchmarks met

### Rollback Plan
- [ ] Rollback procedures documented
- [ ] Backup files available
- [ ] Previous version deployable

**Status**: ✅ Ready for Production / ⚠️ Issues Found / ❌ Blocked

**Notes**: [Any additional observations or concerns]