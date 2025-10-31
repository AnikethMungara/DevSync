import * as fileService from '../services/fileService.js';
import { validateFilePath } from '../utils/validators.js';
import logger from '../utils/logger.js';

export async function getFileTree(req, res) {
  try {
    const { path = '' } = req.query;
    const tree = await fileService.getFileTree(path);
    res.json(tree);
  } catch (err) {
    logger.error('Get file tree error', { error: err.message, path: req.query.path });
    res.status(500).json({ error: err.message });
  }
}

export async function readFile(req, res) {
  try {
    const { path } = req.query;
    validateFilePath(path);

    const content = await fileService.readFile(path);
    res.json({ content, path });
  } catch (err) {
    logger.error('Read file error', { error: err.message, path: req.query.path });
    res.status(400).json({ error: err.message });
  }
}

export async function updateFile(req, res) {
  try {
    const { path, content } = req.body;
    validateFilePath(path);

    await fileService.updateFile(path, content);
    res.json({ success: true, path });
  } catch (err) {
    logger.error('Update file error', { error: err.message, path: req.body.path });
    res.status(400).json({ error: err.message });
  }
}

export async function createFile(req, res) {
  try {
    const { path, content = '', isDirectory = false } = req.body;
    validateFilePath(path);

    await fileService.createFile(path, content, isDirectory);
    res.json({ success: true, path });
  } catch (err) {
    logger.error('Create file error', { error: err.message, path: req.body.path });
    res.status(400).json({ error: err.message });
  }
}

export async function deleteFile(req, res) {
  try {
    const { path } = req.query;
    validateFilePath(path);

    await fileService.deleteFile(path);
    res.json({ success: true, path });
  } catch (err) {
    logger.error('Delete file error', { error: err.message, path: req.query.path });
    res.status(400).json({ error: err.message });
  }
}

export async function renameFile(req, res) {
  try {
    const { oldPath, newPath } = req.body;
    validateFilePath(oldPath);
    validateFilePath(newPath);

    await fileService.renameFile(oldPath, newPath);
    res.json({ success: true, oldPath, newPath });
  } catch (err) {
    logger.error('Rename file error', { error: err.message, oldPath: req.body.oldPath, newPath: req.body.newPath });
    res.status(400).json({ error: err.message });
  }
}
