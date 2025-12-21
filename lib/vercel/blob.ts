import { put, head, del } from '@vercel/blob'

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Date.now()}.${fileExt}`
  const filePath = `avatars/${fileName}`

  const blob = await put(filePath, file, {
    access: 'public',
    contentType: file.type,
  })

  return blob.url
}

export async function deleteAvatar(url: string): Promise<void> {
  try {
    await del(url)
  } catch (error) {
    console.error('Failed to delete avatar:', error)
  }
}

export async function checkBlobExists(url: string): Promise<boolean> {
  try {
    await head(url)
    return true
  } catch {
    return false
  }
}
