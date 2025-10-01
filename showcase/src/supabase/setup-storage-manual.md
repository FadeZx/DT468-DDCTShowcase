# Storage Bucket Setup Instructions

## Option 1: Using SQL Editor (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/nqsficckdtddlriuokjd
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `create-storage-buckets.sql`
4. Click **Run** to execute the SQL

## Option 2: Using Supabase Dashboard UI

### Create Bucket:
1. Go to **Storage** in your Supabase Dashboard
2. Click **New bucket**
3. Set the following:
   - **Name**: `project-files`
   - **Public bucket**: ✅ Enabled
   - **File size limit**: 50 MB
   - **Allowed MIME types**: 
     - image/jpeg
     - image/png
     - image/gif
     - image/webp
     - application/zip
     - application/x-zip-compressed
     - application/pdf
     - text/plain
     - application/json
     - video/mp4
     - video/webm
     - audio/mpeg
     - audio/wav

### Create Policies:
1. Go to **Storage** → **Policies**
2. Click **New policy** for the `project-files` bucket
3. Create these policies:

**Policy 1: Upload Access**
- **Policy name**: Allow authenticated users to upload
- **Allowed operation**: INSERT
- **Target roles**: authenticated
- **USING expression**: `bucket_id = 'project-files'`

**Policy 2: Public Read Access**
- **Policy name**: Allow public read access
- **Allowed operation**: SELECT
- **Target roles**: public
- **USING expression**: `bucket_id = 'project-files'`

**Policy 3: Update Own Files**
- **Policy name**: Allow users to update own files
- **Allowed operation**: UPDATE
- **Target roles**: authenticated
- **USING expression**: `bucket_id = 'project-files'`

**Policy 4: Delete Own Files**
- **Policy name**: Allow users to delete own files
- **Allowed operation**: DELETE
- **Target roles**: authenticated
- **USING expression**: `bucket_id = 'project-files'`

## Verification

After setting up the bucket, you can test it by:
1. Going to **Storage** → **project-files** bucket
2. Try uploading a test file manually
3. Check that the file appears and is accessible

## Troubleshooting

If you still get "Bucket not found" errors:
1. Make sure the bucket name is exactly `project-files`
2. Verify the bucket is marked as public
3. Check that the policies are created and enabled
4. Try refreshing your browser and testing again