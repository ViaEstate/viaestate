# ViaEstate - Complete Real Estate Platform

## 🏡 Platform Overview

ViaEstate is a comprehensive role-based real estate platform with three distinct user types:

- **Admin**: Full system control and moderation
- **Broker**: Property management and customer relations
- **Customer**: Property submissions and inquiries (no login required)

## 🔐 Role-Based Access System

### Admin Access (info@viaestate.eu)
**Full Authority - Cannot be overridden**

**Capabilities:**
- Create, edit, publish/unpublish, and delete ANY property
- Manage Broker accounts (create/edit/remove)
- Moderate all forums (delete/add/close threads)
- View all customer inquiries
- Impersonate Broker accounts for testing
- Password reset via email

**How to Access:**
1. Go to `/login`
2. Sign in with admin credentials
3. Automatically redirected to `/admin` panel

### Broker Access
**Property Management & Customer Relations**

**Capabilities:**
- Add/edit/delete their own property listings
- Claim open property submissions from customers (first come, first served)
- Reply to customer inquiries and forum posts
- Password reset via email
- Cannot see or edit properties owned by other brokers

**How to Access:**
1. Go to `/login`
2. Sign up as "Real Estate Broker" or sign in with existing account
3. Account requires admin approval before activation
4. Once approved, automatically redirected to `/agent-panel`

### Customer Access (No Login Required)
**Property Submissions & Inquiries**

**Capabilities:**
- Submit property requests via `/submit-property`
- Send inquiries directly to brokers
- Post questions in property forums (name + email required)
- Get notified when their property is claimed by a broker
- Cannot publish properties directly - only through Admin approval or Broker claim

**How to Access:**
- No account needed
- Direct access to submission forms and property inquiries
- Use contact forms with name + email for interactions

## 🏠 Property System

### Property Cards & Popups
- All property cards are clickable
- Click opens full-screen popup with:
  - Image gallery
  - Title, description, price, country
  - Assigned Broker info (or "Available for claim" if unclaimed)
  - "Send Inquiry" and "Join Discussion" buttons
  - Forum tab for property-specific discussions
  - Clear close/back button

### Property Marketplace Flow
1. **Customer Submission**: Customer submits property via form (no login)
2. **Open Request Pool**: Submission appears in agent panel as "open request"
3. **Broker Claims**: First broker to claim gets the property exclusively
4. **Customer Notification**: Customer gets notified when property is claimed
5. **Property Management**: Broker can now edit and manage the property

### XML Property Import (Admin Panel)
**For Admins Only**: Import multiple properties from XML files hosted at URLs.

**Features:**
- Bulk import multiple properties from XML URLs
- Server-side XML processing with automatic media download
- Comprehensive validation and error reporting
- Maintains existing property creation workflow
- Access via Admin Panel → "XML Import" tab

**XML Schema:**
```xml
<properties>
  <property>
    <title>Luxury Villa with Sea View</title>
    <description>A beautiful luxury villa...</description>
    <country>Spain</country>
    <city>Barcelona</city>
    <price>850000</price>
    <property_type>villa</property_type>
    <bedrooms>4</bedrooms>
    <bathrooms>3</bathrooms>
    <area>250</area>
    <plot_area>1000</plot_area>
    <images>
      <image>https://example.com/image1.jpg</image>
    </images>
  </property>
</properties>
```

**How to Use:**
1. Host your XML file at a publicly accessible URL
2. Login as admin and go to `/admin` panel
3. Click "XML Import" tab
4. Enter the XML file URL
5. Click "Import Properties from XML"
6. Review results showing success/failure counts and property IDs

## 💬 Forum System

### Property Forums
- Each property has its own discussion thread
- Forums start empty by default
- Customers can ask questions without login (name + email required)
- Brokers and admins can reply
- Admin has full moderation power

### Forum Moderation (Admin Only)
- Delete any post
- Close forum threads
- Add posts on behalf of system
- Approve/reject pending posts

## 🛡️ Security & Access Control

### Server-Side Security
- Role-based permissions enforced via Supabase RLS policies
- Admin > Broker > Customer hierarchy
- No unauthorized cross-role access
- Admin always has override authority

### Authentication Features
- Email/password authentication
- Password reset via email
- Google OAuth integration
- Automatic role-based redirects after login

## 📋 Setup Instructions

### Automatic Setup (Preferred)
The platform is pre-configured with:
- Database schema with RLS policies
- Authentication flows
- Role-based routing
- Admin panel with full controls

### Manual Configuration (If Needed)

#### 1. Admin Setup
```
First User Becomes Admin Automatically:
1. Go to /login
2. Sign up with info@viaestate.eu
3. First registered user automatically gets admin role
4. Admin status: approved (no waiting for approval)
```

#### 2. Broker Setup
```
Creating Broker Accounts:
1. Brokers sign up via /login as "Real Estate Broker"
2. Account status: pending (awaits admin approval)
3. Admin approves via /admin panel
4. Approved brokers access /agent-panel

Testing Broker Claims:
1. Submit test property via /submit-property (as customer)
2. Login as broker, go to /agent-panel
3. Claim the property from "Available Requests" tab
4. Property moves to "My Claimed Requests"
```

#### 3. Customer Flow Testing
```
Customer Property Submissions:
1. Go to /submit-property (no login required)
2. Fill form with contact info + property details
3. Submit - appears in broker "Available Requests"

Customer Forum Participation:
1. Click any property card to open popup
2. Go to "Discussion" tab
3. Post question with name + email (no login)
4. Post status: pending (admin approval required)

Customer Inquiries:
1. Click "Send Inquiry" button on property popup
2. Fill contact form (no login required)
3. Inquiry sent directly to property owner/broker
```

## 🔧 Technical Architecture

### Frontend Stack
- React + TypeScript
- Tailwind CSS with custom design system
- React Router for navigation
- Supabase client for backend integration

### Backend (Supabase)
- PostgreSQL database with RLS policies
- Authentication with JWT tokens
- Real-time subscriptions for notifications
- File storage for property images

### Database Tables
- `profiles` - User accounts and roles
- `properties` - Property listings
- `property_requests` - Customer submissions
- `forum_posts` - Property discussions
- `notifications` - System notifications
- `leads` - Customer inquiries

## 🚀 Getting Started

1. **Access the Platform**: Visit the deployed URL
2. **Create Admin Account**: First signup becomes admin automatically
3. **Test Customer Flow**: Submit a property without logging in
4. **Create Broker Account**: Sign up as broker and get admin approval
5. **Test Marketplace**: Have broker claim the customer submission

## 📞 Support & Testing

### Test Accounts Setup
```
Admin: info@viaestate.eu (auto-created on first signup)
Broker: broker@example.com (requires admin approval)
Customer: No account needed (form-based interactions)
```

### Verification Checklist
- ✅ Admin can log in and control everything
- ✅ Broker can manage own listings and claim submissions
- ✅ Customers can submit properties and join forums without login
- ✅ Property cards open full popups with details
- ✅ Forums linked to each property
- ✅ Password reset works for Admin and Broker
- ✅ Role-based routing prevents unauthorized access

### Social Media Integration
Footer includes official ViaEstate social media links:
- Facebook: https://www.facebook.com/profile.php?id=61579269959759
- Instagram: https://www.instagram.com/viaestate_/

---

**Platform Status**: ✅ Fully Implemented
**Last Updated**: Today
**Support**: All features operational with proper role separation and security
