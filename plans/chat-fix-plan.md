# Chat Fix Plan - Estate Connect AI

## Problem Summary

The chat button exists in PropertyCard but passes incorrect broker data to ChatModal:
- `brokerId={property.owner_id || ''}` - should be `seller_id`
- `brokerName={property.seller_type || 'Broker'}` - seller_type is NOT a name (it's like "owner" or "agency")

Additionally, the broker name needs to be fetched from the profiles table, as the properties table only has seller_id (not broker_name).

## Issues Identified

1. **PropertyCard.tsx** (lines 288-289):
   - Uses `property.owner_id` but should use `property.seller_id`
   - Uses `property.seller_type` as broker name (incorrect - this isn't a name)

2. **Property interface** in src/lib/supabase.ts:
   - Has `owner_id` but should have `seller_id`

3. **AgentPanel**:
   - Doesn't show chat/conversations for brokers

4. **Database migration**:
   - May not have been run in Supabase

## Fix Plan

### Step 1: Fix PropertyCard broker data binding
- Change `property.owner_id` to `property.seller_id`
- Add function to fetch broker name from profiles table
- Pass correct brokerId and brokerName to ChatModal

### Step 2: Update Property interface
- Add `seller_id` field
- Keep `owner_id` for backward compat or remove it

### Step 3: Add broker profile lookup
- Create or extend function to get broker name from seller_id

### Step 4: Add chat to AgentPanel
- Add section showing brokers' conversations
- Allow brokers to respond to leads

### Step 5: Run database migration
- Ensure chat tables exist in Supabase

### Step 6: Test and push to git

## Technical Details

### Current PropertyCard code (wrong):
```tsx
<ChatModal
  propertyId={property.id}
  propertyTitle={property.title}
  propertyRef={property.ref || ''}
  brokerId={property.owner_id || ''}
  brokerName={property.seller_type || 'Broker'}
/>
```

### Should be:
```tsx
<ChatModal
  propertyId={property.id}
  propertyTitle={property.title}
  propertyRef={property.ref || ''}
  brokerId={property.seller_id || ''}
  brokerName={property.broker_name || 'Broker'}
/>
```

Or fetch broker name dynamically when opening modal.