import { z } from 'zod';
import path from 'path';

const filePathSchema = z.string().min(1).refine((val) => {
  return !val.includes('..') && !path.isAbsolute(val);
}, {
  message: 'Invalid file path: must be relative and not contain ..'
});

export function validateFilePath(filePath) {
  const result = filePathSchema.safeParse(filePath);

  if (!result.success) {
    throw new Error(result.error.errors[0].message);
  }

  return result.data;
}

export const createFileSchema = z.object({
  path: filePathSchema,
  content: z.string().optional(),
  isDirectory: z.boolean().optional()
});

export const updateFileSchema = z.object({
  path: filePathSchema,
  content: z.string()
});

export const searchSchema = z.object({
  projectId: z.string().min(1),
  q: z.string().min(1)
});

export const aiChatSchema = z.object({
  message: z.string().min(1).max(2000),
  context: z.object({
    path: z.string().optional(),
    content: z.string().optional()
  }).optional()
});
